// RegisterScreen.tsx
// -----------------------------------------------------------------------------
// Tela de cadastro de novo paciente.
// Responsabilidades:
// 1) Coletar nome, e-mail e senha do usuário.
// 2) Validar presença mínima dos campos antes de chamar `register` do AuthContext.
// 3) Exibir feedback de loading e erro no fluxo de cadastro.
// 4) Após sucesso, navegar para a tela de Login (comportamento atual).
//
// Observações importantes:
// - No seu AuthContext, `register` define `user` e persiste no AsyncStorage.
//   Isso significa que, após registrar, o usuário já está autenticado. Navegar
//   para "Login" pode ser redundante/contraintuitivo, pois o AppNavigator deve
//   alternar para as rotas protegidas automaticamente. Mantemos o comportamento
//   original aqui (ir para Login), mas vale considerar um ajuste (ver notas).
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

// Tipagem de navegação para a rota 'Register'
type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

const RegisterScreen: React.FC = () => {
  // Ação de registro a partir do contexto de autenticação
  const { register } = useAuth();

  // Navegação tipada para voltar/ir a outras telas
  const navigation = useNavigation<RegisterScreenProps['navigation']>();

  // Estados controlados do formulário de cadastro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de UI (feedback de carregamento e mensagens de erro)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -----------------------------------------------------------------------------
  // handleRegister:
  // - Validação mínima: todos os campos obrigatórios preenchidos.
  // - Chama `register({ name, email, password })` e trata erros com try/catch.
  // - Em caso de sucesso, navega para "Login" (como está hoje no projeto).
  //
  // Observações:
  // - Poderia normalizar o e-mail (trim/lowercase) e o nome (trim).
  // - Possível adicionar política mínima de senha (tamanho/complexidade).
  // - Se optar por manter o usuário logado após registrar (conforme AuthContext),
  //   pode-se redirecionar direto para o dashboard do paciente ou simplesmente
  //   não navegar (AppNavigator fará o switch automaticamente).
  // -----------------------------------------------------------------------------
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');

      // Validação mínima (somente presença)
      if (!name || !email || !password) {
        setError('Por favor, preencha todos os campos');
        return; // `finally` ainda rodará para desligar loading
      }

      // Execução do cadastro via contexto (persiste e, no seu AuthContext, já define `user`)
      await register({
        name,
        email,
        password,
      });

      // Comportamento atual: após registro, volta para tela de Login
      navigation.navigate('Login');
    } catch (err) {
      // Mensagem genérica; pode ser refinada de acordo com os erros do serviço
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {/* Título da tela de cadastro */}
      <Title>Cadastro de Paciente</Title>
      
      {/* Campo: Nome completo (autoCapitalize para melhorar UX) */}
      <Input
        placeholder="Nome completo"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        containerStyle={styles.input}
      />

      {/* Campo: Email (teclado e sem autocapitalização) */}
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        containerStyle={styles.input}
      />

      {/* Campo: Senha (entrada oculta) */}
      <Input
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        containerStyle={styles.input}
      />

      {/* Mensagem de erro (quando houver) */}
      {error ? <ErrorText>{error}</ErrorText> : null}

      {/* CTA principal: efetiva o cadastro */}
      <Button
        title="Cadastrar"
        onPress={handleRegister}
        loading={loading}
        containerStyle={styles.button as ViewStyle}
        buttonStyle={styles.buttonStyle}
      />

      {/* Ação secundária: voltar para a tela de Login */}
      <Button
        title="Voltar para Login"
        onPress={() => navigation.navigate('Login')}
        containerStyle={styles.backButton as ViewStyle}
        buttonStyle={styles.backButtonStyle}
      />
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos em objeto JS (usados nas props dos componentes do RNE)
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
  backButton: {
    marginTop: 10,
    width: '100%',
  },
  backButtonStyle: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
  },
};

// -----------------------------------------------------------------------------
// Estilos via styled-components (layout da tela e tipografia)
// -----------------------------------------------------------------------------
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

export default RegisterScreen;
