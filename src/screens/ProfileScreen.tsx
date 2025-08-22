// ProfileScreen.tsx
// -----------------------------------------------------------------------------
// Tela de perfil do usuário autenticado.
// Responsabilidades:
// 1) Exibir dados básicos do usuário (nome, e-mail, papel/role e avatar).
// 2) Exibir especialidade quando o usuário é médico.
// 3) Oferecer ações: editar perfil, voltar e sair (logout).
//
// Observações de fluxo:
// - Os dados vêm do AuthContext (`useAuth()`).
// - A navegação usa o stack tipado (`RootStackParamList`).
// - O <Header /> exibe saudação e sino de notificações (retorna null se `user` não existir).
// -----------------------------------------------------------------------------

import React from 'react';
import styled from 'styled-components/native';
import { Button, ListItem } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import theme from '../styles/theme';
import Header from '../components/Header';
import { ViewStyle } from 'react-native';

// Tipagem da prop de navegação para esta tela (rota 'Profile')
type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

const ProfileScreen: React.FC = () => {
  // Estado global: usuário autenticado e ação para sair
  const { user, signOut } = useAuth();

  // Navegação tipada para ir/voltar entre telas
  const navigation = useNavigation<ProfileScreenProps['navigation']>();

  // ---------------------------------------------------------------------------
  // Helper para traduzir o `role` técnico em um rótulo amigável.
  // Mantém a conversão em um único lugar para consistência.
  // ---------------------------------------------------------------------------
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'doctor':
        return 'Médico';
      case 'patient':
        return 'Paciente';
      default:
        return role; // fallback genérico, caso venha um papel desconhecido
    }
  };

  return (
    <Container>
      {/* Header com saudação/usuário e sino (não mostra nada se user for null) */}
      <Header />

      {/* Conteúdo rolável (facilita em telas menores e com teclado aberto) */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Meu Perfil</Title>

        {/* Card de perfil: avatar + dados principais + badge de role */}
        <ProfileCard>
          {/* Avatar com fallback para placeholder simples */}
          <Avatar source={{ uri: user?.image || 'https://via.placeholder.com/150' }} />

          {/* Nome/E-mail (sem edição aqui; o botão abaixo leva para EditProfile) */}
          <Name>{user?.name}</Name>
          <Email>{user?.email}</Email>

          {/* Badge que indica o papel do usuário (admin/médico/paciente) */}
          <RoleBadge role={user?.role || ''}>
            <RoleText>{getRoleText(user?.role || '')}</RoleText>
          </RoleBadge>
          
          {/* Campo extra exibido apenas para médicos */}
          {user?.role === 'doctor' && (
            <SpecialtyText>Especialidade: {user?.specialty}</SpecialtyText>
          )}
        </ProfileCard>

        {/* Ação: ir para edição de perfil */}
        <Button
          title="Editar Perfil"
          onPress={() => navigation.navigate('EditProfile' as any)}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.editButton}
        />

        {/* Ação: voltar para a tela anterior */}
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.buttonStyle}
        />

        {/* Ação: encerrar sessão (logout) */}
        <Button
          title="Sair"
          onPress={signOut}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.logoutButton}
        />
      </ScrollView>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos em objeto JS (para componentes de terceiros) + styled-components
// -----------------------------------------------------------------------------
const styles = {
  scrollContent: {
    padding: 20,
  },
  button: {
    marginBottom: 20,
    width: '100%',
  },
  buttonStyle: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
  },
  editButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 12,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 12,
  },
};

// Layout base da tela
const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
`;

// Wrapper do conteúdo rolável
const ScrollView = styled.ScrollView`
  flex: 1;
`;

// Título da tela
const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 20px;
  text-align: center;
`;

// Card de informações do usuário
const ProfileCard = styled.View`
  background-color: ${theme.colors.background};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  align-items: center;
  border-width: 1px;
  border-color: ${theme.colors.border};
`;

// Imagem do avatar
const Avatar = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  margin-bottom: 16px;
`;

// Nome e e-mail
const Name = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 8px;
`;

const Email = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text};
  margin-bottom: 8px;
`;

// Badge de papel com cor semântica por role
const RoleBadge = styled.View<{ role: string }>`
  background-color: ${(props: { role: string }) => {
    switch (props.role) {
      case 'admin':
        return theme.colors.primary + '20';
      case 'doctor':
        return theme.colors.success + '20';
      default:
        return theme.colors.secondary + '20';
    }
  }};
  padding: 4px 12px;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const RoleText = styled.Text`
  color: ${theme.colors.text};
  font-size: 14px;
  font-weight: 500;
`;

// Especialidade (só para médicos)
const SpecialtyText = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text};
  margin-top: 8px;
`;

export default ProfileScreen;
