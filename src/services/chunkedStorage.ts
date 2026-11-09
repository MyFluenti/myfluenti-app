// Armazenamento em pedaços, com troca atômica entre dois "slots" (1 e 2) e fila por chave.
// Lógica pura (sem expo/react-native) para poder ser testada em node.

export type RawStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
};

export type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const CHUNK_BYTES = 1800;
/** Teto de pedaços por geração (~36 KB). Também limita a varredura de limpeza. */
const MAX_CHUNKS = 20;

function utf8Length(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/** Divide sem cortar um caractere ao meio. */
export function splitIntoChunks(value: string, maxBytes: number = CHUNK_BYTES): string[] {
  const chunks: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of value) {
    const size = utf8Length(char.codePointAt(0) ?? 0);
    if (bytes + size > maxBytes) {
      chunks.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  if (current.length > 0 || chunks.length === 0) chunks.push(current);
  return chunks;
}

/** gen = slot ativo (1 ou 2). A gravação sempre vai para o outro slot. */
type Slot = 1 | 2;
type Meta = { gen: Slot; count: number };

const metaKey = (key: string) => `${key}.meta`;
const chunkKey = (key: string, slot: Slot, i: number) => `${key}.g${slot}.${i}`;
// Formato antigo (sem slot): `<chave>.<i>` e `<chave>.count`.
const legacyCountKey = (key: string) => `${key}.count`;
const legacyChunkKey = (key: string, i: number) => `${key}.${i}`;
// Obs.: sobras de gerações numéricas > 2 (versão anterior desta branch, sem usuários
// reais) não são varridas; um meta com gen > 2 é tratado como ausente.

export function createChunkedStorage(store: RawStore): StorageAdapter {
  // Fila por chave: serializa getItem/setItem/removeItem. O supabase-js não usa lock
  // por padrão, então chamadas concorrentes poderiam gravar no mesmo slot.
  const queues = new Map<string, Promise<unknown>>();

  function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = queues.get(key) ?? Promise.resolve();
    const run = previous.then(fn); // previous nunca rejeita (ver tail)
    const tail = run.then(
      () => undefined,
      () => undefined, // a rejeição vai só para quem chamou; a fila segue
    );
    queues.set(key, tail);
    void tail.then(() => {
      if (queues.get(key) === tail) queues.delete(key);
    });
    return run;
  }

  async function readMeta(key: string): Promise<Meta | null> {
    const raw = await store.get(metaKey(key));
    if (raw === null) return null;
    try {
      const m = JSON.parse(raw) as Partial<Meta>;
      if (
        (m.gen === 1 || m.gen === 2) &&
        Number.isInteger(m.count) &&
        (m.count as number) >= 1 &&
        (m.count as number) <= MAX_CHUNKS
      ) {
        return { gen: m.gen, count: m.count as number };
      }
    } catch {
      // meta corrompido: tratado como ausente
    }
    return null;
  }

  /**
   * Apaga os pedaços de um slot a partir de `from`. Por padrão para no primeiro ausente
   * (barato, caminho normal do set); `exhaustive` varre até o teto, mesmo com buracos
   * (usado no logout, para não deixar órfãos).
   */
  async function sweepSlot(key: string, slot: Slot, from = 0, exhaustive = false): Promise<void> {
    for (let i = from; i < MAX_CHUNKS; i += 1) {
      const k = chunkKey(key, slot, i);
      if ((await store.get(k)) === null) {
        if (exhaustive) continue;
        return;
      }
      await store.del(k);
    }
  }

  async function removeLegacy(key: string): Promise<void> {
    const raw = await store.get(legacyCountKey(key));
    if (raw === null) return;
    const n = Math.min(Number.parseInt(raw, 10) || 0, MAX_CHUNKS);
    for (let i = 0; i < n; i += 1) await store.del(legacyChunkKey(key, i));
    await store.del(legacyCountKey(key));
  }

  async function readLegacy(key: string): Promise<string | null> {
    const raw = await store.get(legacyCountKey(key));
    const n = raw === null ? 0 : Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1 || n > MAX_CHUNKS) return null;
    let value = '';
    for (let i = 0; i < n; i += 1) {
      const part = await store.get(legacyChunkKey(key, i));
      if (part === null) return null;
      value += part;
    }
    return value;
  }

  async function doSet(key: string, value: string): Promise<void> {
    const chunks = splitIntoChunks(value);
    if (chunks.length > MAX_CHUNKS) throw new Error('Valor grande demais para o armazenamento seguro.');

    const old = await readMeta(key);
    const target: Slot = old?.gen === 1 ? 2 : 1;
    const other: Slot = target === 1 ? 2 : 1;

    // 1) pedaços no slot inativo (o valor atual segue intacto)
    for (let i = 0; i < chunks.length; i += 1) {
      await store.set(chunkKey(key, target, i), chunks[i]);
    }
    // 2) troca do ponteiro: ponto de confirmação
    await store.set(metaKey(key), JSON.stringify({ gen: target, count: chunks.length } satisfies Meta));

    // 3) limpeza best-effort: falha aqui não invalida a gravação (o removeItem varre os dois slots por inteiro)
    try {
      await sweepSlot(key, other);
      await sweepSlot(key, target, chunks.length); // sobra de tentativa anterior
      await removeLegacy(key);
    } catch {
      // ignorado de propósito
    }
  }

  async function doGet(key: string): Promise<string | null> {
    const meta = await readMeta(key);
    if (meta) {
      let value = '';
      for (let i = 0; i < meta.count; i += 1) {
        const part = await store.get(chunkKey(key, meta.gen, i));
        if (part === null) return null; // pedaço perdido: sem sessão
        value += part;
      }
      return value;
    }
    // Migração: formato antigo lido uma vez e regravado no novo.
    const legacy = await readLegacy(key);
    if (legacy === null) return null;
    try {
      await doSet(key, legacy);
      await removeLegacy(key);
    } catch {
      // se falhar, o formato antigo continua legível na próxima vez
    }
    return legacy;
  }

  async function doRemove(key: string): Promise<void> {
    let failure: unknown = null;
    const attempt = async (fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (e) {
        failure = e;
      }
    };

    // Ponteiro primeiro: a sessão deixa de existir mesmo se a limpeza falhar.
    await attempt(() => store.del(metaKey(key)));
    await attempt(() => sweepSlot(key, 1, 0, true));
    await attempt(() => sweepSlot(key, 2, 0, true));
    await attempt(() => removeLegacy(key));

    if (failure !== null) throw failure;
  }

  return {
    getItem: (key) => serialize(key, () => doGet(key)),
    setItem: (key, value) => serialize(key, () => doSet(key, value)),
    removeItem: (key) => serialize(key, () => doRemove(key)),
  };
}
