import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen, authStyles } from '@/features/auth/AuthScreen';
import { toAppError } from '@/services/errors';

export default function SignUpScreen() {
  const { signUp } = useAuth();
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
        Entenda como o inglês funciona.
      </Text>
      <View style={authStyles.form}>
        <Input label="Nome (opcional)" value={name} onChangeText={setName} editable={!loading} />
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <Input
          label="Senha"
          type="password"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          error={error}
        />
        {notice ? (
          <Text variant="bodyM" color="statusSuccess" accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}
        <Button label="Criar conta" onPress={submit} loading={loading} disabled={!canSubmit} />
      </View>
      <Link
        href="/sign-in"
        style={authStyles.link}
        accessibilityRole="link"
        accessibilityLabel="Já tenho conta, entrar"
      >
        <Text variant="label" color="brandPrimaryLight">
          Já tenho conta
        </Text>
      </Link>
    </AuthScreen>
  );
}
