// HomeScreen.tsx
// -----------------------------------------------------------------------------
// Tela inicial que lista as consultas do usuário com pull-to-refresh e atalho
// para agendar uma nova consulta.
// Responsabilidades:
// 1) Carregar consultas do AsyncStorage e exibir em uma FlatList.
// 2) Exibir dados do médico relacionado (nome, especialidade, avatar) a partir
//    de uma lista local `doctors` (mock).
// 3) Permitir atualizar a lista via gesto de "puxar para atualizar" (RefreshControl).
// 4) Navegar para a tela de criação de consulta.
//
// Observações de fluxo:
// - Os ícones de editar/excluir ainda são apenas visuais (sem handlers).
// - A data é parseada com `new Date(item.date)` (ver notas no final sobre formato).
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import styled from 'styled-components/native';
import { FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { FontAwesome } from '@expo/vector-icons';
import { HeaderContainer, HeaderTitle } from '../components/Header'; // NOTE: ver observação sobre este import
import theme from '../styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '../types/appointments';
import { Doctor } from '../types/doctors';
import { RootStackParamList } from '../types/navigation';
import { useFocusEffect } from '@react-navigation/native';

// Tipagem da prop de navegação para esta tela
type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

// ----------------------------------------------------------------------------
// Mock de médicos para enriquecer o cartão da consulta.
// Em produção, estes dados viriam de uma API e seriam relacionados por `doctorId`.
// ----------------------------------------------------------------------------
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
  // Lista de consultas carregadas do armazenamento local
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Flag para o feedback de atualização (pull-to-refresh)
  const [refreshing, setRefreshing] = useState(false);

  // ----------------------------------------------------------------------------
  // Carrega as consultas do AsyncStorage.
  // IMPORTANTE: ver nota sobre a chave usada no storage ao final.
  // ----------------------------------------------------------------------------
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

  // Recarrega sempre que a tela volta ao foco (útil ao retornar de "Agendar")
  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  // Handler do gesto de pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  // Busca informações do médico a partir do id salvo na consulta
  const getDoctorInfo = (doctorId: string): Doctor | undefined => {
    return doctors.find(doctor => doctor.id === doctorId);
  };

  // ----------------------------------------------------------------------------
  // Render de cada item da FlatList (um cartão por consulta).
  // - Mostra avatar/nome/especialidade do médico.
  // - Mostra data, hora, descrição e status (visual).
  // - Ícones de editar/excluir ainda não possuem ação.
  // ----------------------------------------------------------------------------
  const renderAppointment = ({ item }: { item: Appointment }) => {
    const doctor = getDoctorInfo(item.doctorId);
    
    return (
      <AppointmentCard>
        <DoctorImage source={{ uri: doctor?.image || 'https://via.placeholder.com/100' }} />
        <InfoContainer>
          <DoctorName>{doctor?.name || 'Médico não encontrado'}</DoctorName>
          <DoctorSpecialty>{doctor?.specialty || 'Especialidade não encontrada'}</DoctorSpecialty>

          {/* A data é convertida para string local. Ver nota sobre formato/parse ao final. */}
          <DateTime>
            {new Date(item.date).toLocaleDateString()} - {item.time}
          </DateTime>

          {/* Descrição da consulta (texto livre) */}
          <Description>{item.description}</Description>

          {/* Status visual simples (pendente = vermelho; outros = verde) */}
          <Status status={item.status}>
            {item.status === 'pending' ? 'Pendente' : 'Confirmado'}
          </Status>

          {/* Ações (sem handlers por enquanto) */}
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
      {/* Header simples com título. 
         OBS: este Header usa { HeaderContainer, HeaderTitle } do componente Header — ver nota. */}
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

        {/* Lista de consultas com pull-to-refresh */}
        <AppointmentList
          data={appointments}
          keyExtractor={(item: Appointment) => item.id}
          renderItem={renderAppointment}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyText>Nenhuma consulta agendada</EmptyText>
          }
        />
      </Content>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilização (styled-components) e wrappers da FlatList
// OBS: ao usar styled(FlatList) em TypeScript, você pode querer preservar os
// generics: styled(FlatList as new () => FlatList<Appointment>) para melhor tipo.
// -----------------------------------------------------------------------------
const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Content = styled.View`
  flex: 1;
  padding: ${theme.spacing.medium}px;
`;

// Wrapper da FlatList para ocupar o restante do espaço
const AppointmentList = styled(FlatList)`
  flex: 1;
`;

// Cartão visual de cada consulta
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

// Badge de status (apenas 2 estados visuais: pendente=erro; demais=sucesso)
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
