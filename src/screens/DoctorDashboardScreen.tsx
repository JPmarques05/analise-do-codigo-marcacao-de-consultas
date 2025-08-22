// DoctorDashboardScreen.tsx
// -----------------------------------------------------------------------------
// Painel do Médico.
// Responsabilidades:
// 1) Carregar consultas do médico autenticado e estatísticas pessoais.
// 2) Exibir métricas (StatisticsCard) e lista de consultas com status.
// 3) Permitir confirmar/cancelar consultas via modal (AppointmentActionModal).
// 4) Notificar o paciente quando a consulta for confirmada/cancelada.
//
// Observações de fluxo:
// - Consultas são lidas/escritas no AsyncStorage (persistência local simulada).
// - Estatísticas são fornecidas por statisticsService (agregações simuladas).
// - useFocusEffect recarrega dados sempre que a tela volta ao foco.
// - A ação de confirmar/cancelar dispara o modal para coletar motivo (no cancelamento).
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
import StatisticsCard from '../components/StatisticsCard';
import AppointmentActionModal from '../components/AppointmentActionModal';
import { statisticsService, Statistics } from '../services/statistics';
import { notificationService } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipagem de navegação para esta tela (stack do app).
type DoctorDashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DoctorDashboard'>;
};

// Modelo local de consulta (mantido simples para esta tela).
// NOTE: se o cancelamento guarda um "reason", considere adicionar `cancelReason?: string` aqui
// para alinhar com o que é salvo no armazenamento (ver handleConfirmAction).
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  specialty: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Props de estilo (status usado para colorir badge/texto)
interface StyledProps {
  status: string; // Sugestão: restringir para 'pending' | 'confirmed' | 'cancelled' por segurança.
}

// -----------------------------------------------------------------------------
// Mapeamentos de status -> cor e texto (centralizam semântica).
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

const DoctorDashboardScreen: React.FC = () => {
  // Auth: usado para recuperar ID do médico e para efetuar logout.
  const { user, signOut } = useAuth();

  // Navegação tipada para abrir outras telas (Perfil/Configurações).
  const navigation = useNavigation<DoctorDashboardScreenProps['navigation']>();

  // Estados de dados e UI.
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statistics, setStatistics] = useState<Partial<Statistics> | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados do modal (ação sobre uma consulta).
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel'>('confirm');

  // -----------------------------------------------------------------------------
  // loadAppointments:
  // - Busca todas as consultas do storage e filtra pelas do médico logado.
  // - Carrega estatísticas do médico (se houver user.id).
  // - Controla `loading` para feedback.
  // -----------------------------------------------------------------------------
  const loadAppointments = async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem('@MedicalApp:appointments');
      if (storedAppointments) {
        const allAppointments: Appointment[] = JSON.parse(storedAppointments);
        const doctorAppointments = allAppointments.filter(
          (appointment) => appointment.doctorId === user?.id
        );
        setAppointments(doctorAppointments);
      }

      // Carrega estatísticas pessoais do médico
      if (user?.id) {
        const stats = await statisticsService.getDoctorStatistics(user.id);
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------------
  // handleOpenModal:
  // - Define consulta selecionada e tipo de ação, e exibe o modal.
  // -----------------------------------------------------------------------------
  const handleOpenModal = (appointment: Appointment, action: 'confirm' | 'cancel') => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setModalVisible(true);
  };

  // Fecha o modal e limpa a consulta selecionada
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAppointment(null);
  };

  // -----------------------------------------------------------------------------
  // handleConfirmAction:
  // - Recebe (opcionalmente) um motivo (quando ação for cancelamento).
  // - Atualiza status da consulta no AsyncStorage.
  // - Notifica o paciente conforme a ação.
  // - Recarrega a lista ao final.
  //
  // Observação: AppointmentActionModal já chama `onClose()` após `onConfirm()`,
  // então o modal fecha automaticamente depois da confirmação/cancelamento.
  // -----------------------------------------------------------------------------
  const handleConfirmAction = async (reason?: string) => {
    if (!selectedAppointment) return;

    try {
      const storedAppointments = await AsyncStorage.getItem('@MedicalApp:appointments');
      if (storedAppointments) {
        const allAppointments: Appointment[] = JSON.parse(storedAppointments);

        const updatedAppointments = allAppointments.map(appointment => {
          if (appointment.id === selectedAppointment.id) {
            return { 
              ...appointment, 
              status: actionType === 'confirm' ? 'confirmed' : 'cancelled',
              // Armazena razão de cancelamento quando fornecida (não quebra se não existir no tipo)
              ...(reason && { cancelReason: reason })
            };
          }
          return appointment;
        });

        await AsyncStorage.setItem('@MedicalApp:appointments', JSON.stringify(updatedAppointments));

        // Envia notificação para o paciente (fluxo simulado)
        if (actionType === 'confirm') {
          await notificationService.notifyAppointmentConfirmed(
            selectedAppointment.patientId,
            selectedAppointment
          );
        } else {
          await notificationService.notifyAppointmentCancelled(
            selectedAppointment.patientId,
            selectedAppointment,
            reason
          );
        }

        loadAppointments(); // Recarrega para refletir mudanças e métricas
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // -----------------------------------------------------------------------------
  // Recarrega as consultas/estatísticas sempre que a tela volta ao foco.
  // -----------------------------------------------------------------------------
  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  return (
    <Container>
      {/* Header com saudação e sino de notificações */}
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Minhas Consultas</Title>

        {/* Atalhos de navegação do médico */}
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

        {/* Métricas do médico (se disponíveis) */}
        <SectionTitle>Minhas Estatísticas</SectionTitle>
        {statistics && (
          <StatisticsGrid>
            <StatisticsCard
              title="Total de Consultas"
              value={statistics.totalAppointments || 0}
              color={theme.colors.primary}
              subtitle="Todas as consultas"
            />
            <StatisticsCard
              title="Consultas Confirmadas"
              value={statistics.confirmedAppointments || 0}
              color={theme.colors.success}
              subtitle={`${(statistics.statusPercentages?.confirmed || 0).toFixed(1)}% do total`}
            />
            <StatisticsCard
              title="Pacientes Atendidos"
              value={statistics.totalPatients || 0}
              color={theme.colors.secondary}
              subtitle="Pacientes únicos"
            />
            <StatisticsCard
              title="Pendentes"
              value={statistics.pendingAppointments || 0}
              color={theme.colors.warning}
              subtitle="Aguardando confirmação"
            />
          </StatisticsGrid>
        )}

        {/* Lista de consultas do médico */}
        <SectionTitle>Minhas Consultas</SectionTitle>
        {loading ? (
          <LoadingText>Carregando consultas...</LoadingText>
        ) : appointments.length === 0 ? (
          <EmptyText>Nenhuma consulta agendada</EmptyText>
        ) : (
          appointments.map((appointment) => (
            <AppointmentCard key={appointment.id}>
              <ListItem.Content>
                <ListItem.Title style={styles.patientName as TextStyle}>
                  Paciente: {appointment.patientName || 'Nome não disponível'}
                </ListItem.Title>
                <ListItem.Subtitle style={styles.dateTime as TextStyle}>
                  {appointment.date} às {appointment.time}
                </ListItem.Subtitle>
                <Text style={styles.specialty as TextStyle}>
                  {appointment.specialty}
                </Text>

                {/* Badge de status (cor e texto conforme semântica) */}
                <StatusBadge status={appointment.status}>
                  <StatusText status={appointment.status}>
                    {getStatusText(appointment.status)}
                  </StatusText>
                </StatusBadge>

                {/* Ações somente quando pendente: abre modal para confirmar/cancelar */}
                {appointment.status === 'pending' && (
                  <ButtonContainer>
                    <Button
                      title="Confirmar"
                      onPress={() => handleOpenModal(appointment, 'confirm')}
                      containerStyle={styles.actionButton as ViewStyle}
                      buttonStyle={styles.confirmButton}
                    />
                    <Button
                      title="Cancelar"
                      onPress={() => handleOpenModal(appointment, 'cancel')}
                      containerStyle={styles.actionButton as ViewStyle}
                      buttonStyle={styles.cancelButton}
                    />
                  </ButtonContainer>
                )}
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

        {/* Modal de ação (confirmar/cancelar) — controlado pelo estado local */}
        {selectedAppointment && (
          <AppointmentActionModal
            visible={modalVisible}
            onClose={handleCloseModal}
            onConfirm={handleConfirmAction}
            actionType={actionType}
            appointmentDetails={{
              patientName: selectedAppointment.patientName,
              doctorName: selectedAppointment.doctorName,
              date: selectedAppointment.date,
              time: selectedAppointment.time,
              specialty: selectedAppointment.specialty,
            }}
          />
        )}
      </ScrollView>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos (objetos JS para RNE + styled-components para layout e tipografia)
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
  actionButton: {
    marginTop: 8,
    width: '48%',
  },
  confirmButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 8,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 8,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  specialty: {
    fontSize: 14,
    fontWeight: '500',
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

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 15px;
  margin-top: 10px;
`;

// Card de consulta (usa ListItem para estrutura interna)
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

// Badge com leve transparência no fundo
const StatusBadge = styled.View<StyledProps>`
  background-color: ${(props: StyledProps) => getStatusColor(props.status) + '20'};
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: 8px;
`;

// Texto colorido conforme status
const StatusText = styled.Text<StyledProps>`
  color: ${(props: StyledProps) => getStatusColor(props.status)};
  font-size: 12px;
  font-weight: 500;
`;

// Ações lado a lado
const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 8px;
`;

// Grid de cards de estatística
const StatisticsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export default DoctorDashboardScreen;
