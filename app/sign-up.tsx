import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen, authStyles } from '@/features/auth/AuthScreen';
import { useScrollFocusedFieldIntoView } from '@/features/common/KeyboardAwareScreen';
import { toAppError } from '@/services/errors';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const scrollIntoView = useScrollFocusedFieldIntoView();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = async () => {
    setError(undefined);
    setNotice(undefined);
    setLoading(true);
    try {
      const hasSession = await signUp(email.trim(), password, name.trim() || undefined);
      if (!hasSession) {
        setNotice('Enviamos uma mensagem para confirmar seu e-mail. Depois de confirmar, entre.');
      }
      // Com sessão imediata, o portão de auth redireciona.
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <Text variant="display" accessibilityRole="header">
        Criar conta
      </Text>
      <Text variant="bodyM" color="textSecondary">
        Salve seu progresso e estude em qualquer aparelho.
      </Text>
      <View style={authStyles.form}>
        <Input
          label="Nome"
          placeholder="Como devemos te chamar"
          value={name}
          onChangeText={setName}
          editable={!loading}
          onFocus={scrollIntoView}
        />
        <Input
          label="E-mail"
          placeholder="voce@email.com"
          type="email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          onFocus={scrollIntoView}
        />
        <Input
          label="Senha"
          placeholder="Crie uma senha"
          type="password"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          onFocus={scrollIntoView}
          error={error}
          returnKeyType="go"
          onSubmitEditing={() => {
            if (canSubmit && !loading) void submit();
          }}
        />
        {notice ? (
          <Text variant="bodyM" color="statusSuccess" accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}
        <Button label="Criar conta" onPress={submit} loading={loading} disabled={!canSubmit} />
        <Button
          label="Já tenho conta"
          variant="outline"
          onPress={() => router.replace('/sign-in')}
          disabled={loading}
        />
      </View>
      <Text variant="caption" color="textSecondary" style={authStyles.footnote}>
        Você pode excluir sua conta quando quiser, nas Configurações.
      </Text>
    </AuthScreen>
  );
}
