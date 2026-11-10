import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen, authStyles } from '@/features/auth/AuthScreen';
import { useScrollFocusedFieldIntoView } from '@/features/common/KeyboardAwareScreen';
import { toAppError } from '@/services/errors';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const scrollIntoView = useScrollFocusedFieldIntoView();
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
        Continue de onde você parou.
      </Text>
      <View style={authStyles.form}>
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
          placeholder="Sua senha"
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
        <Button label="Entrar" onPress={submit} loading={loading} disabled={!canSubmit} />
        <Button
          label="Criar conta"
          variant="outline"
          onPress={() => router.replace('/sign-up')}
          disabled={loading}
        />
      </View>
    </AuthScreen>
  );
}
