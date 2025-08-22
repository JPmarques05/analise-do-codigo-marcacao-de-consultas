// EditProfileScreen.tsx
// -----------------------------------------------------------------------------
// Tela de edição de perfil do usuário autenticado.
// Responsabilidades:
// 1) Exibir formulário com campos do perfil (nome, e-mail e, se médico, especialidade).
// 2) Validar campos obrigatórios (nome e e-mail) e persistir alterações.
// 3) Atualizar o contexto de autenticação (useAuth.updateUser) e o AsyncStorage.
// 4) Oferecer feedback ao usuário via Alert e permitir cancelar/voltar.
//
// Observações de implementação:
// - `updateUser` no AuthContext já persiste o usuário no AsyncStorage;
//   aqui também há um `setItem` redundante (mantido para compatibilidade).
// - A tela pressupõe usuário autenticado; há uso de `user!` no merge do objeto.
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import styled from 'styled-components/native';
import { ScrollView, ViewStyle, Alert } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import theme from '../styles/theme';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipagem da prop de navegação para esta tela (rota EditProfile)
type EditProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

const EditProfileScreen: React.FC = () => {
  // Estado global de auth: `user` atual e ação para atualizar seus dados.
  const { user, updateUser } = useAuth();

  // Navegação tipada para retornar após salvar/cancelar.
  const navigation = useNavigation<EditProfileScreenProps['navigation']>();
  
  // ---------------------------------------------------------------------------
  // Estados controlados do formulário:
  // - Iniciam com valores atuais do usuário (fallback para string vazia).
  // - `specialty` só é relevante quando user.role === 'doctor'.
  // ---------------------------------------------------------------------------
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [specialty, setSpecialty] = useState(user?.specialty || '');
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // handleSaveProfile:
  // - Valida campos obrigatórios (nome/e-mail).
  // - Monta um novo objeto de usuário a partir do atual + alterações.
  // - Atualiza no contexto (updateUser) e persiste no AsyncStorage.
  // - Exibe Alerts para sucesso/erro e navega de volta no OK.
  //
  // Notas:
  // - `finally` garante que `loading` volte a `false` mesmo com `return`/erro.
  // - `user!` assume que a tela só é acessível logado; caso contrário, proteja rota.
  // - Poderia-se adicionar validação de e-mail mais rígida (regex) se necessário.
  // ---------------------------------------------------------------------------
  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      // Validação mínima de obrigatórios
      if (!name.trim() || !email.trim()) {
        Alert.alert('Erro', 'Nome e email são obrigatórios');
        return; // `finally` ainda executa
      }

      // Novo snapshot do usuário (mantém campos existentes e atualiza os editados)
      const updatedUser = {
        ...user!, // pressupõe que `user` não é nulo nesta tela
        name: name.trim(),
        email: email.trim(),
        // Atualiza especialidade apenas para médicos
        ...(user?.role === 'doctor' && { specialty: specialty.trim() }),
      };

      // 1) Atualiza no Context (também persiste no AsyncStorage dentro do AuthContext)
      await updateUser(updatedUser);

      // 2) (Opcional/Redundante) Salva no AsyncStorage novamente aqui
      // Mantido para não alterar comportamento atual do app
      await AsyncStorage.setItem('@MedicalApp:user', JSON.stringify(updatedUser));

      // Feedback de sucesso + navega de volta
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      // Feedback de erro genérico (log para diagnóstico)
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {/* Header com saudação do usuário e sino de notificações */}
      <Header />

      {/* Conteúdo rolável para caber em telas menores */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Editar Perfil</Title>

        {/* Card do perfil com avatar e campos editáveis */}
        <ProfileCard>
          {/* Avatar do usuário (fallback para placeholder) */}
          <Avatar source={{ uri: user?.image || 'https://via.placeholder.com/150' }} />
          
          {/* Campo: Nome */}
          <Input
            label="Nome"
            value={name}
            onChangeText={setName}
            containerStyle={styles.input}
            placeholder="Digite seu nome"
          />

          {/* Campo: Email */}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            containerStyle={styles.input}
            placeholder="Digite seu email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Campo: Especialidade (apenas para médicos) */}
          {user?.role === 'doctor' && (
            <Input
              label="Especialidade"
              value={specialty}
              onChangeText={setSpecialty}
              containerStyle={styles.input}
              placeholder="Digite sua especialidade"
            />
          )}

          {/* Badge informando o papel do usuário (admin/médico/paciente) */}
          <RoleBadge role={user?.role || ''}>
            <RoleText>
              {user?.role === 'admin'
                ? 'Administrador'
                : user?.role === 'doctor'
                ? 'Médico'
                : 'Paciente'}
            </RoleText>
          </RoleBadge>
        </ProfileCard>

        {/* CTA: Salvar alterações */}
        <Button
          title="Salvar Alterações"
          onPress={handleSaveProfile}
          loading={loading}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.saveButton}
        />

        {/* Ação secundária: Cancelar/voltar sem salvar */}
        <Button
          title="Cancelar"
          onPress={() => navigation.goBack()}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.cancelButton}
        />
      </ScrollView>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos (objetos JS para componentes de terceiros + styled-components)
// -----------------------------------------------------------------------------
const styles = {
  scrollContent: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginBottom: 15,
    width: '100%',
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
  },
};

// Layout base da tela
const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
`;

// Título da tela
const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 20px;
  text-align: center;
`;

// Card visual para agrupar avatar e campos
const ProfileCard = styled.View`
  background-color: ${theme.colors.white};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  align-items: center;
  border-width: 1px;
  border-color: ${theme.colors.border};
`;

// Imagem do avatar (circular)
const Avatar = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  margin-bottom: 16px;
`;

// Badge de papel do usuário
const RoleBadge = styled.View<{ role: string }>`
  background-color: ${(props: { role: string }) => {
    switch (props.role) {
      case 'admin':
        return theme.colors.primary + '20';   // levemente translúcido
      case 'doctor':
        return theme.colors.success + '20';
      default:
        return theme.colors.secondary + '20';
    }
  }};
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 10px;
`;

// Texto do badge
const RoleText = styled.Text`
  color: ${theme.colors.text};
  font-size: 14px;
  font-weight: 500;
`;

export default EditProfileScreen;
