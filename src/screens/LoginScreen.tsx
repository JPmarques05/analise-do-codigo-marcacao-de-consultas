// LoginScreen.tsx
// -----------------------------------------------------------------------------
// Tela de autenticação do aplicativo.
// Responsabilidades:
// 1) Coletar email e senha do usuário.
// 2) Chamar `signIn` do AuthContext e lidar com estados de loading/erro.
// 3) Navegar para tela de cadastro quando solicitado.
// 4) Exibir credenciais de exemplo para facilitar testes em sala.
//
// Observações de fluxo:
// - `signIn` é assíncrono; usamos try/catch para capturar falhas (credenciais inválidas).
// - `loading` desabilita feedback visual no botão (prop `loading` do RNE).
// - A navegação para "Register" usa o stack tipado (RootStackParamList).
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import styled from 'styled-components/native';
import { Input, Button, Text } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';
import { ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Tipagem de navegação para esta tela (rota 'Login' no root stack)
type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC = () => {
  // Ação de login vinda do contexto de autenticação
  const { signIn } = useAuth();

  // Hook de navegação tipado para ir até Register
  const navigation = useNavigation<LoginScreenProps['navigation']>();

  // Estados controlados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de UI para feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -----------------------------------------------------------------------------
  // Handler do botão "Entrar":
  // - Limpa erro anterior e liga `loading`.
  // - Tenta autenticar; em caso de falha, mostra mensagem genérica.
  // - Garante desligar `loading` em `finally`.
  //
  // Observações:
  // - Poderíamos normalizar email (trim/lowercase) para evitar erros de digitação.
  // - Mensagens mais específicas dependem do que `authService.signIn` retorna.
  // -----------------------------------------------------------------------------
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // (Opcional) Validação mínima antes de chamar signIn:
      // if (!email.trim() || !password) { setError('Preencha email e senha'); return; }

      await signIn({ email, password });
      // Se não lançar erro, a navegação pós-login é tratada pelo AppNavigator (condicional por `user`)
    } catch (err) {
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {/* Título da tela */}
      <Title>App Marcação de Consultas</Title>
      
      {/* Campo de email (sem autocapitalização e com teclado apropriado) */}
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        containerStyle={styles.input}
        // (Opcional) textContentType="emailAddress" melhora autofill no iOS
      />

      {/* Campo de senha (oculta caracteres) */}
      <Input
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        containerStyle={styles.input}
        // (Opcional) textContentType="password"
      />

      {/* Feedback de erro (quando credenciais falham) */}
      {error ? <ErrorText>{error}</ErrorText> : null}

      {/* CTA principal: tenta autenticar o usuário */}
      <Button
        title="Entrar"
        onPress={handleLogin}
        loading={loading}                          // spinner enquanto autentica
        containerStyle={styles.button as ViewStyle}
        buttonStyle={styles.buttonStyle}
        // (Opcional) disabled={!email || !password}
      />

      {/* Link para cadastro de novo paciente */}
      <Button
        title="Cadastrar Novo Paciente"
        onPress={() => navigation.navigate('Register')}
        containerStyle={styles.registerButton as ViewStyle}
        buttonStyle={styles.registerButtonStyle}
      />

      {/* Dica com credenciais mock para facilitar testes */}
      <Text style={styles.hint}>
        Use as credenciais de exemplo:
      </Text>
      <Text style={styles.credentials}>
        Admin: admin@example.com / 123456{'\n'}
        Médicos: joao@example.com, maria@example.com, pedro@example.com / 123456
      </Text>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos em objeto JS (para props do react-native-elements) e styled-components
// -----------------------------------------------------------------------------
const styles = {
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  buttonStyle: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
  },
  registerButton: {
    marginTop: 10,
    width: '100%',
  },
  registerButtonStyle: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
  },
  hint: {
    marginTop: 20,
    textAlign: 'center' as const,
    color: theme.colors.text,
  },
  credentials: {
    marginTop: 10,
    textAlign: 'center' as const,
    color: theme.colors.text,
    fontSize: 12,
  },
};

const Container = styled.View`
  flex: 1;
  padding: 20px;
  justify-content: center;
  background-color: ${theme.colors.background};
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  color: ${theme.colors.text};
`;

const ErrorText = styled.Text`
  color: ${theme.colors.error};
  text-align: center;
  margin-bottom: 10px;
`;

export default LoginScreen;
