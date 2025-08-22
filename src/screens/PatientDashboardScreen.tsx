// PatientDashboardScreen.tsx
// -----------------------------------------------------------------------------
// Painel do Paciente.
// Responsabilidades:
// 1) Carregar e exibir apenas as consultas do paciente autenticado.
// 2) Mostrar dados relevantes (médico, especialidade, data/hora, status).
// 3) Oferecer atalhos de navegação (Agendar, Perfil, Configurações) e Logout.
// 4) Atualizar a lista sempre que a tela voltar ao foco.
//
// Decisões/observações:
// - Persistência local via AsyncStorage na chave '@MedicalApp:appointments'.
// - Filtro por `appointment.patientId === user?.id` garante isolamento dos dados.
// - `useFocusEffect` recarrega a lista ao focar (útil após criar/editar).
// - Cores/textos de status centralizados em helpers (getStatusColor/getStatusText).
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

// Tipagem de navegação para esta tela (rota 'PatientDashboard')
type PatientDashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PatientDashboard'>;
};

// Modelo local simplificado de consulta.
// (Se existir um tipo global para Appointment, prefira importá-lo)
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;    // formato salvo em outras telas: 'DD/MM/AAAA'
  time: string;    // 'HH:MM'
  specialty: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Props de estilo usadas para colorir badge/texto conforme o status.
interface StyledProps {
  status: string; // SUGESTÃO: restringir para 'pending' | 'confirmed' | 'cancelled'
}

// -----------------------------------------------------------------------------
// Helpers semânticos de status → cor/texto.
// Centralizam a lógica para manter consistência visual.
// -----------------------------------------------------------------------------
const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return theme.colors.success;
    case 'cancelled':
      return theme.colors.error;
    default:
      return theme.colors.warning;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Pendente';
  }
};

const PatientDashboardScreen: React.FC = () => {
  // Auth: dados do usuário (paciente) e ação de sair.
  const { user, signOut } = useAuth();

  // Navegação tipada para chamar rotas do stack.
  const navigation = useNavigation<PatientDashboardScreenProps['navigation']>();

  // Estado local da tela: lista de consultas do paciente e indicador de loading.
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // loadAppointments:
  // - Lê todas as consultas do AsyncStorage.
  // - Filtra apenas as do paciente autenticado (patientId === user?.id).
  // - Atualiza estados e encerra `loading` no finally.
  // ---------------------------------------------------------------------------
  const loadAppointments = async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem('@MedicalApp:appointments');
      if (storedAppointments) {
        const allAppointments: Appointment[] = JSON.parse(storedAppointments);
        const userAppointments = allAppointments.filter(
          (appointment) => appointment.patientId === user?.id
        );
        setAppointments(userAppointments);
      }
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Recarrega ao focar a tela (ex.: ao voltar de "Agendar Consulta").
  // Sem dependências para garantir recarga em todo foco.
  // ---------------------------------------------------------------------------
  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  return (
    <Container>
      {/* Header com saudação e sino de notificações */}
      <Header />

      {/* Conteúdo rolável (permite caber em telas pequenas) */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Minhas Consultas</Title>

        {/* Ações principais: agendar, perfil e configurações */}
        <Button
          title="Agendar Nova Consulta"
          onPress={() => navigation.navigate('CreateAppointment')}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.buttonStyle}
        />

        <Button
          title="Meu Perfil"
          onPress={() => navigation.navigate('Profile')}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.buttonStyle}
        />

        <Button
          title="Configurações"
          onPress={() => navigation.navigate('Settings')}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.settingsButton}
        />

        {/* Lista/bodies: loading → vazio → mapeamento de consultas */}
        {loading ? (
          <LoadingText>Carregando consultas...</LoadingText>
        ) : appointments.length === 0 ? (
          <EmptyText>Nenhuma consulta agendada</EmptyText>
        ) : (
          appointments.map((appointment) => (
            <AppointmentCard key={appointment.id}>
              <ListItem.Content>
                {/* Identificação (opcional mostrar paciente; aqui mantém o padrão das outras telas) */}
                <ListItem.Title style={styles.patientName as TextStyle}>
                  Paciente: {appointment.patientName}
                </ListItem.Title>

                {/* Data/hora no formato salvo (evita parse de Date) */}
                <ListItem.Subtitle style={styles.dateTime as TextStyle}>
                  {appointment.date} às {appointment.time}
                </ListItem.Subtitle>

                {/* Médico + especialidade */}
                <Text style={styles.doctorName as TextStyle}>
                  {appointment.doctorName}
                </Text>
                <Text style={styles.specialty as TextStyle}>
                  {appointment.specialty}
                </Text>

                {/* Badge de status com cor e label amigável */}
                <StatusBadge status={appointment.status}>
                  <StatusText status={appointment.status}>
                    {getStatusText(appointment.status)}
                  </StatusText>
                </StatusBadge>
              </ListItem.Content>
            </AppointmentCard>
          ))
        )}

        {/* Logout */}
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
// Estilos (objetos JS para props de terceiros + styled-components para layout)
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
  logoutButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 12,
  },
  settingsButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  specialty: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  dateTime: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
};

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

// Cartão (usa ListItem para uniformizar o layout interno)
const AppointmentCard = styled(ListItem)`
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

// Badge de status com fundo translúcido e texto colorido
const StatusBadge = styled.View<StyledProps>`
  background-color: ${(props: StyledProps) => getStatusColor(props.status) + '20'};
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: 8px;
`;

const StatusText = styled.Text<StyledProps>`
  color: ${(props: StyledProps) => getStatusColor(props.status)};
  font-size: 12px;
  font-weight: 500;
`;

export default PatientDashboardScreen;
