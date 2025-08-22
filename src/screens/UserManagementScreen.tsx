// UserManagementScreen.tsx
// -----------------------------------------------------------------------------
// Tela de gerenciamento de usuários (destinada ao admin).
// Responsabilidades:
// 1) Carregar do AsyncStorage a lista de usuários cadastrados e exibir em uma lista.
// 2) Filtrar o usuário autenticado (admin) para não aparecer na própria lista.
// 3) Oferecer ações de "Editar" (placeholder) e "Excluir" (remove do storage).
// 4) Recarregar a lista sempre que a tela ganhar foco (useFocusEffect).
//
// Observações importantes:
// - Persistência local: utiliza a chave '@MedicalApp:users' no AsyncStorage.
// - As ações "Adicionar Novo Usuário" e "Editar" ainda não possuem implementação.
// - Não há confirmação antes de excluir (ação é imediata). Em produção, recomenda-se Alert.
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import styled from 'styled-components/native';
import { ScrollView, ViewStyle, TextStyle } from 'react-native';
import { Button, ListItem, Text } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import theme from '../styles/theme';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipagem da navegação para a rota 'UserManagement'
type UserManagementScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserManagement'>;
};

// Modelo simplificado de usuário (espelha o esperado em '@MedicalApp:users')
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
}

// Props para estilização condicional por role
interface StyledProps {
  role: string; // sugestão: restringir para 'admin' | 'doctor' | 'patient'
}

const UserManagementScreen: React.FC = () => {
  // Estado global de autenticação (usado para ocultar o próprio admin da lista)
  const { user } = useAuth();

  // Navegação tipada
  const navigation = useNavigation<UserManagementScreenProps['navigation']>();

  // Estados locais: lista de usuários e flag de carregamento
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------------------------
  // loadUsers:
  // - Lê a lista gravada em '@MedicalApp:users'.
  // - Remove o usuário autenticado da listagem (evita auto-gestão).
  // - Atualiza estados e encerra loading.
  // -----------------------------------------------------------------------------
  const loadUsers = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('@MedicalApp:users');
      if (storedUsers) {
        const allUsers: User[] = JSON.parse(storedUsers);
        // Filtra o usuário atual da lista (se houver)
        const filteredUsers = allUsers.filter(u => u.id !== user?.id);
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------------
  // handleDeleteUser:
  // - Remove o usuário indicado do array e persiste o novo array no storage.
  // - Em seguida, recarrega a lista (mantém a fonte da verdade no storage).
  // - Observação: não há confirmação aqui; ação é direta (ver notas ao final).
  // -----------------------------------------------------------------------------
  const handleDeleteUser = async (userId: string) => {
    try {
      const storedUsers = await AsyncStorage.getItem('@MedicalApp:users');
      if (storedUsers) {
        const allUsers: User[] = JSON.parse(storedUsers);
        const updatedUsers = allUsers.filter(u => u.id !== userId);
        await AsyncStorage.setItem('@MedicalApp:users', JSON.stringify(updatedUsers));
        loadUsers(); // Recarrega a lista para refletir a exclusão
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  // -----------------------------------------------------------------------------
  // Recarrega usuários quando a tela entra em foco.
  // `[]` como dependência garante execução a cada foco (e não apenas no mount).
  // -----------------------------------------------------------------------------
  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [])
  );

  // -----------------------------------------------------------------------------
  // getRoleText:
  // - Converte a role técnica em rótulo amigável para exibição.
  // -----------------------------------------------------------------------------
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'doctor':
        return 'Médico';
      case 'patient':
        return 'Paciente';
      default:
        return role;
    }
  };

  return (
    <Container>
      {/* Header com saudação/sino (some se não houver usuário logado) */}
      <Header />

      {/* Conteúdo rolável da tela */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Gerenciar Usuários</Title>

        {/* CTA para adicionar novo usuário (ainda sem implementação) */}
        <Button
          title="Adicionar Novo Usuário"
          onPress={() => {}}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.buttonStyle}
        />

        {/* Corpo: loading → vazio → lista */}
        {loading ? (
          <LoadingText>Carregando usuários...</LoadingText>
        ) : users.length === 0 ? (
          <EmptyText>Nenhum usuário cadastrado</EmptyText>
        ) : (
          // Mapeia usuários para cartões; cada cartão usa ListItem como contêiner
          users.map((user) => (
            <UserCard key={user.id}>
              <ListItem.Content>
                {/* Nome e e-mail */}
                <ListItem.Title style={styles.userName as TextStyle}>
                  {user.name}
                </ListItem.Title>
                <ListItem.Subtitle style={styles.userEmail as TextStyle}>
                  {user.email}
                </ListItem.Subtitle>

                {/* Badge com cor por role */}
                <RoleBadge role={user.role}>
                  <RoleText role={user.role}>
                    {getRoleText(user.role)}
                  </RoleText>
                </RoleBadge>

                {/* Ações por usuário (editar/excluir) */}
                <ButtonContainer>
                  <Button
                    title="Editar"
                    onPress={() => {}} // placeholder
                    containerStyle={styles.actionButton as ViewStyle}
                    buttonStyle={styles.editButton}
                  />
                  <Button
                    title="Excluir"
                    onPress={() => handleDeleteUser(user.id)}
                    containerStyle={styles.actionButton as ViewStyle}
                    buttonStyle={styles.deleteButton}
                  />
                </ButtonContainer>
              </ListItem.Content>
            </UserCard>
          ))
        )}

        {/* Voltar para a tela anterior */}
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.backButton}
        />
      </ScrollView>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos (objetos JS para props de componentes de terceiros)
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
  backButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
  },
  actionButton: {
    marginTop: 8,
    width: '48%',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
};

// -----------------------------------------------------------------------------
// Estilos via styled-components (layout e visuais)
// -----------------------------------------------------------------------------
const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 20px;
  text-align: center;
`;

// Cartão de usuário (usa ListItem como Wrapper para uniformizar espaçamentos)
const UserCard = styled(ListItem)`
  background-color: ${theme.colors.background};
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 15px;
  border-width: 1px;
  border-color: ${theme.colors.border};
`;

const LoadingText = styled.Text`
  text-align: center;
  color: ${theme.colors.text};
  font-size: 16px;
  margin-top: 20px;
`;

const EmptyText = styled.Text`
  text-align: center;
  color: ${theme.colors.text};
  font-size: 16px;
  margin-top: 20px;
`;

// Badge de role com cor de fundo conforme o papel do usuário
const RoleBadge = styled.View<StyledProps>`
  background-color: ${(props: StyledProps) => {
    switch (props.role) {
      case 'admin':
        return theme.colors.primary + '20';
      case 'doctor':
        return theme.colors.success + '20';
      default:
        return theme.colors.secondary + '20';
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: 8px;
`;

// Texto do badge com cor de fonte alinhada ao papel
const RoleText = styled.Text<StyledProps>`
  color: ${(props: StyledProps) => {
    switch (props.role) {
      case 'admin':
        return theme.colors.primary;
      case 'doctor':
        return theme.colors.success;
      default:
        return theme.colors.secondary;
    }
  }};
  font-size: 12px;
  font-weight: 500;
`;

// Container dos botões de ação do cartão
const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 8px;
`;

export default UserManagementScreen;