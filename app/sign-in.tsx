import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen, authStyles } from '@/features/auth/AuthScreen';
import { toAppError } from '@/services/errors';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = async () => {
    setError(undefined);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // O portão de auth redireciona quando a sessão chega.
    } catch (e) {
      setError(toAppError(e).message);
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <Text variant="display" accessibilityRole="header">
        Entrar
      </Text>
      <Text variant="bodyM" color="textSecondary">
        Continue de onde parou.
      </Text>
      <View style={authStyles.form}>
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
          onSubmitEditing={canSubmit ? submit : undefined}
        />
        <Button label="Entrar" onPress={submit} loading={loading} disabled={!canSubmit} />
      </View>
      <Link
        href="/sign-up"
        style={authStyles.link}
        accessibilityRole="link"
        accessibilityLabel="Criar conta"
      >
        <Text variant="label" color="brandPrimaryLight">
          Criar conta
        </Text>
      </Link>
    </AuthScreen>
  );
}
