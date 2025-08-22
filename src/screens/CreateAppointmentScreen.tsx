// CreateAppointmentScreen.tsx
// -----------------------------------------------------------------------------
// Tela para criação (agendamento) de uma nova consulta.
// Responsabilidades:
// 1) Coletar data, horário (slot de 30min) e médico selecionado.
// 2) Construir o objeto de consulta e persistir no AsyncStorage (mock).
// 3) Notificar o médico via notificationService.
// 4) Exibir feedback de carregamento/erro e navegar de volta ao concluir.
//
// Observações de implementação:
// - A validação de data é simples (string livre "DD/MM/AAAA"); recomenda-se
//   reutilizar a lógica/máscara do AppointmentForm ou adicionar validação aqui.
// - Conflitos de agenda (mesmo médico + data + hora) não são verificados.
//   Há uma oportunidade de melhoria para checar isso antes de salvar.
// - IDs de consulta usam Date.now().toString(); suficiente para demo, mas um UUID
//   daria mais robustez (evita colisões e facilita debugging).
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import styled from 'styled-components/native';
import { ScrollView, ViewStyle } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import theme from '../styles/theme';
import Header from '../components/Header';
import DoctorList from '../components/DoctorList';
import TimeSlotList from '../components/TimeSlotList';
import { notificationService } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipagem de navegação para esta tela.
type CreateAppointmentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateAppointment'>;
};

// Modelos locais (se existirem tipos globais, pode-se importá-los).
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;   // formato esperado: "DD/MM/AAAA"
  time: string;   // "HH:MM"
  specialty: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

// -----------------------------------------------------------------------------
// Lista mock de médicos disponíveis (substituir por API quando houver).
// -----------------------------------------------------------------------------
const availableDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. João Silva',
    specialty: 'Cardiologia',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    specialty: 'Pediatria',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: '3',
    name: 'Dr. Pedro Oliveira',
    specialty: 'Ortopedia',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    id: '4',
    name: 'Dra. Ana Costa',
    specialty: 'Dermatologia',
    image: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: '5',
    name: 'Dr. Carlos Mendes',
    specialty: 'Oftalmologia',
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
];

const CreateAppointmentScreen: React.FC = () => {
  // Usuário autenticado (paciente atual) para preencher patientId/patientName.
  const { user } = useAuth();

  // Navegação tipada para voltar ao fluxo anterior após salvar.
  const navigation = useNavigation<CreateAppointmentScreenProps['navigation']>();

  // Estados controlados do formulário (data, hora, médico).
  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Estados de feedback de UI.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -----------------------------------------------------------------------------
  // handleCreateAppointment:
  // - Valida campos obrigatórios.
  // - Lê consultas existentes do AsyncStorage.
  // - Monta a nova consulta com status "pending" e persiste.
  // - Dispara notificação ao médico e navega de volta.
  // - Usa try/finally para garantir que `loading` seja desligado mesmo com erro.
  // -----------------------------------------------------------------------------
  const handleCreateAppointment = async () => {
    try {
      setLoading(true);
      setError('');

      // Validação mínima de presença de dados.
      if (!date || !selectedTime || !selectedDoctor) {
        setError('Por favor, preencha a data e selecione um médico e horário');
        return; // `finally` ainda será executado (garante setLoading(false))
      }

      // Recupera consultas existentes (se houver).
      const storedAppointments = await AsyncStorage.getItem('@MedicalApp:appointments');
      const appointments: Appointment[] = storedAppointments ? JSON.parse(storedAppointments) : [];

      // Monta nova consulta (ID simples via timestamp; considerar UUID em produção).
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        patientId: user?.id || '',
        patientName: user?.name || '',
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        date,
        time: selectedTime,
        specialty: selectedDoctor.specialty,
        status: 'pending',
      };

      // (Opcional futuro) Verificação de conflito:
      // const hasConflict = appointments.some(a =>
      //   a.doctorId === newAppointment.doctorId &&
      //   a.date === newAppointment.date &&
      //   a.time === newAppointment.time &&
      //   a.status !== 'cancelled'
      // );
      // if (hasConflict) { setError('Horário indisponível para este médico.'); return; }

      // Adiciona nova consulta à lista…
      appointments.push(newAppointment);

      // …e persiste a lista atualizada.
      await AsyncStorage.setItem('@MedicalApp:appointments', JSON.stringify(appointments));

      // Notifica o médico sobre a nova consulta (simulado via service).
      await notificationService.notifyNewAppointment(selectedDoctor.id, newAppointment);

      // Feedback rápido (em RN real, prefira Alert.alert para consistência visual).
      alert('Consulta agendada com sucesso!');
      navigation.goBack();
    } catch (err) {
      setError('Erro ao agendar consulta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      {/* Header com saudação/usuário e sino de notificações */}
      <Header />

      {/* Conteúdo scrollável da tela de agendamento */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Agendar Consulta</Title>

        {/* Entrada livre de data (recomenda-se máscara/validação DD/MM/AAAA) */}
        <Input
          placeholder="Data (DD/MM/AAAA)"
          value={date}
          onChangeText={setDate}
          containerStyle={styles.input}
          keyboardType="numeric"
        />

        {/* Seleção de horário por grade (slots de 30min) */}
        <SectionTitle>Selecione um Horário</SectionTitle>
        <TimeSlotList
          onSelectTime={setSelectedTime}
          selectedTime={selectedTime}
        />

        {/* Seleção de médico em lista (mostra nome/especialidade/avatar) */}
        <SectionTitle>Selecione um Médico</SectionTitle>
        <DoctorList
          doctors={availableDoctors}
          onSelectDoctor={setSelectedDoctor}
          selectedDoctorId={selectedDoctor?.id}
        />

        {/* Mensagem de erro (se houver) */}
        {error ? <ErrorText>{error}</ErrorText> : null}

        {/* CTA principal: grava consulta e retorna */}
        <Button
          title="Agendar"
          onPress={handleCreateAppointment}
          loading={loading}
          containerStyle={styles.button as ViewStyle}
          buttonStyle={styles.buttonStyle}
        />

        {/* Botão secundário: volta sem salvar */}
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
// Estilos (objetos JS para react-native-elements + styled-components)
// -----------------------------------------------------------------------------
const styles = {
  scrollContent: {
    padding: 20,
  },
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
  cancelButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
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
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text};
  margin-bottom: 10px;
  margin-top: 10px;
`;

const ErrorText = styled.Text`
  color: ${theme.colors.error};
  text-align: center;
  margin-bottom: 10px;
`;

export default CreateAppointmentScreen;
