import { useCallback, useEffect, useRef, useState } from 'react';

import { toAppError, type AppError } from '@/services/errors';

export type AsyncState<T> = {
  data: T | null;
  error: AppError | null;
  /** Primeira carga (sem dados ainda). */
  loading: boolean;
  /** Recarga manual (pull-to-refresh). */
  refreshing: boolean;
  /** Tenta de novo mostrando o estado de loading. */
  reload: () => void;
  /** Recarrega mantendo o conteúdo na tela. */
  refresh: () => void;
};

/** Executa `fn` ao montar e quando `fn` mudar (use useCallback). Ignora respostas antigas. */
export function useAsync<T>(fn: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const seq = useRef(0);

  // Só atualiza estado depois do await (seguro para chamar dentro de effect).
  const execute = useCallback(async () => {
    const id = ++seq.current;
    try {
      const result = await fn();
      if (id !== seq.current) return;
      setData(result);
      setError(null);
    } catch (e) {
      if (id !== seq.current) return;
      setError(toAppError(e));
    } finally {
      if (id === seq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fn]);

  useEffect(() => {
    // Busca ao montar: o estado só muda depois do await (falso positivo da regra).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void execute();
    return () => {
      seq.current += 1; // invalida resposta pendente ao desmontar
    };
  }, [execute]);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    void execute();
  }, [execute]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void execute();
  }, [execute]);

  return { data, error, loading, refreshing, reload, refresh };
}
