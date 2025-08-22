// NotificationsScreen.tsx
// -----------------------------------------------------------------------------
// Tela de Notificações.
// Responsabilidades:
// 1) Buscar e exibir as notificações do usuário autenticado.
// 2) Indicar quantas estão não lidas (badge), permitir marcar como lidas
//    (individual e em massa) e excluir via long press.
// 3) Recarregar notificações quando a tela entra em foco.
//
// Decisões de implementação:
// - Usa notificationService (camada de serviço) para CRUD nas notificações.
// - useFocusEffect garante atualização ao voltar para a tela.
// - UI com ListItem do react-native-elements; badge de não lidas e formatação de data.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import styled from 'styled-components/native';
import { FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { FontAwesome } from '@expo/vector-icons';
import { HeaderContainer, HeaderTitle } from '../components/Header';
import theme from '../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '../types/appointments';
import { Doctor } from '../types/doctors';
import { RootStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const doctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. João Silva',
    specialty: 'Cardiologista',
    image: 'https://mighty.tools/mockmind-api/content/human/91.jpg',
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    specialty: 'Dermatologista',
    image: 'https://mighty.tools/mockmind-api/content/human/97.jpg',
  },
  {
    id: '3',
    name: 'Dr. Pedro Oliveira',
    specialty: 'Oftalmologista',
    image: 'https://mighty.tools/mockmind-api/content/human/79.jpg',
  },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // Estado com a lista de consultas carregadas do storage.
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Indicador do refresh (pull-to-refresh).
  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------------------------------------------------------
  // Carrega as consultas persistidas.
  // OBS IMPORTANTE: a chave usada aqui é 'appointments' (sem prefixo). Em outras
  // telas do projeto, a chave utilizada é '@MedicalApp:appointments'. Se não
  // alinhar, a Home não verá as consultas criadas em CreateAppointment, por ex.
  // -----------------------------------------------------------------------------
  const loadAppointments = async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem('appointments');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      }
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    }
  };

  // Recarrega toda vez que a tela volta ao foco (útil após criar/editar consulta).
  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  // Pull-to-refresh: feedback visual + recarga.
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  // Recupera metadados do médico a partir do id salvo na consulta (mock local).
  const getDoctorInfo = (doctorId: string): Doctor | undefined => {
    return doctors.find(doctor => doctor.id === doctorId);
  };

  // Render de cada item (cartão de consulta).
  const renderAppointment = ({ item }: { item: Appointment }) => {
    const doctor = getDoctorInfo(item.doctorId);
    
    return (
      <AppointmentCard>
        {/* Avatar do médico (fallback para placeholder se não encontrado) */}
        <DoctorImage source={{ uri: doctor?.image || 'https://via.placeholder.com/100' }} />
        <InfoContainer>
          {/* Nome/especialidade do médico (ou mensagens de fallback) */}
          <DoctorName>{doctor?.name || 'Médico não encontrado'}</DoctorName>
          <DoctorSpecialty>{doctor?.specialty || 'Especialidade não encontrada'}</DoctorSpecialty>

          {/* Data/hora: aqui está sendo feito `new Date(item.date)`, que pode falhar
             se `item.date` estiver no formato "DD/MM/AAAA". Ver notas ao final. */}
          <DateTime>{new Date(item.date).toLocaleDateString()} - {item.time}</DateTime>

          {/* Descrição livre da consulta */}
          <Description>{item.description}</Description>

          {/* Status visual simplificado: qualquer coisa diferente de 'pending' vira "Confirmado".
             (Se existir 'cancelled' no projeto, isto exibirá 'Confirmado' incorretamente.) */}
          <Status status={item.status}>
            {item.status === 'pending' ? 'Pendente' : 'Confirmado'}
          </Status>

          {/* Botões de ação (sem handlers implementados ainda) */}
          <ActionButtons>
            <ActionButton>
              <Icon name="edit" type="material" size={20} color={theme.colors.primary} />
            </ActionButton>
            <ActionButton>
              <Icon name="delete" type="material" size={20} color={theme.colors.error} />
            </ActionButton>
          </ActionButtons>
        </InfoContainer>
      </AppointmentCard>
    );
  };

  return (
    <Container>
      {/* Cabeçalho simples com título.
         OBS: este projeto possui também um <Header /> completo; aqui estamos
         usando HeaderContainer/HeaderTitle (ver notas ao final). */}
      <HeaderContainer>
        <HeaderTitle>Minhas Consultas</HeaderTitle>
      </HeaderContainer>

      <Content>
        {/* CTA para abrir o fluxo de agendamento */}
        <Button
          title="Agendar Nova Consulta"
          icon={
            <FontAwesome
              name="calendar-plus-o"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
          }
          buttonStyle={{
            backgroundColor: theme.colors.primary,
            borderRadius: 8,
            padding: 12,
            marginBottom: theme.spacing.medium
          }}
          onPress={() => navigation.navigate('CreateAppointment')}
        />

        {/* Lista com refresh nativo */}
        <AppointmentList
          data={appointments}
          keyExtractor={(item: Appointment) => item.id}
          renderItem={renderAppointment}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<EmptyText>Nenhuma consulta agendada</EmptyText>}
        />
      </Content>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos (styled-components)
// -----------------------------------------------------------------------------
const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Content = styled.View`
  flex: 1;
  padding: ${theme.spacing.medium}px;
`;

const AppointmentList = styled(FlatList)`
  flex: 1;
`;

const AppointmentCard = styled.View`
  background-color: ${theme.colors.white};
  border-radius: 8px;
  padding: ${theme.spacing.medium}px;
  margin-bottom: ${theme.spacing.medium}px;
  flex-direction: row;
  align-items: center;
  elevation: 2;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  shadow-offset: 0px 2px;
`;

const DoctorImage = styled.Image`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  margin-right: ${theme.spacing.medium}px;
`;

const InfoContainer = styled.View`
  flex: 1;
`;

const DoctorName = styled.Text`
  font-size: ${theme.typography.subtitle.fontSize}px;
  font-weight: ${theme.typography.subtitle.fontWeight};
  color: ${theme.colors.text};
`;

const DoctorSpecialty = styled.Text`
  font-size: ${theme.typography.body.fontSize}px;
  color: ${theme.colors.text};
  opacity: 0.8;
  margin-bottom: 4px;
`;

const DateTime = styled.Text`
  font-size: ${theme.typography.body.fontSize}px;
  color: ${theme.colors.primary};
  margin-top: 4px;
`;

const Description = styled.Text`
  font-size: ${theme.typography.body.fontSize}px;
  color: ${theme.colors.text};
  opacity: 0.8;
  margin-top: 4px;
`;

const Status = styled.Text<{ status: string }>`
  font-size: ${theme.typography.body.fontSize}px;
  color: ${(props: { status: string }) =>
    props.status === 'pending' ? theme.colors.error : theme.colors.success};
  margin-top: 4px;
  font-weight: bold;
`;

const ActionButtons = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: ${theme.spacing.small}px;
`;

const ActionButton = styled(TouchableOpacity)`
  padding: ${theme.spacing.small}px;
  margin-left: ${theme.spacing.small}px;
`;

const EmptyText = styled.Text`
  text-align: center;
  color: ${theme.colors.text};
  opacity: 0.6;
  margin-top: ${theme.spacing.large}px;
`;

export default HomeScreen;
