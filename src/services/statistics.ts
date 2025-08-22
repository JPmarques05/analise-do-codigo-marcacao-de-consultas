// services/statistics.ts
// -----------------------------------------------------------------------------
// Serviço responsável por calcular estatísticas a partir das consultas salvas
// no AsyncStorage. Entrega panoramas gerais, por médico e por paciente.
//
// Fontes de dados:
// - @MedicalApp:appointments  → array de Appointment (consultas)
// - @MedicalApp:registeredUsers → (opcional) pacientes cadastrados (não usado
//   diretamente nos cálculos atuais, ver observações ao final)
//
// Observações de modelagem:
// - Datas de consulta chegam como string no formato "DD/MM/AAAA" (ex.: "21/08/2025").
//   Para "consultas por mês", o serviço extrai "MM/AAAA" diretamente por split.
// - Percentuais por status são calculados sobre o total do conjunto filtrado.
// - Em caso de erro, o método lança (para quem chamou tratar).
// -----------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';

// ----------------------------- Tipos de apoio -------------------------------

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // esperado "DD/MM/AAAA"
  time: string; // ex.: "14:30"
  specialty: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Estrutura completa usada em getGeneralStatistics.
// Nos métodos por médico/paciente, retornamos Partial<Statistics> com apenas
// os campos pertinentes ao recorte.
export interface Statistics {
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  specialties: { [key: string]: number };       // contagem por especialidade
  appointmentsByMonth: { [key: string]: number }; // "MM/AAAA" → quantidade
  statusPercentages: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
}

// --------------------------- Implementação do serviço -----------------------

export const statisticsService = {
  /**
   * Calcula estatísticas gerais do sistema a partir de todas as consultas.
   * - Carrega @MedicalApp:appointments e agrega:
   *   • totais por status (confirmed/pending/cancelled)
   *   • pacientes e médicos únicos
   *   • contagem por especialidade
   *   • contagem por mês ("MM/AAAA")
   *   • percentuais por status
   * - Observação: lê também @MedicalApp:registeredUsers, mas o valor não é
   *   utilizado nos cálculos atuais (mantido para possível expansão futura).
   */
  async getGeneralStatistics(): Promise<Statistics> {
    try {
      // Lê todas as consultas persistidas
      const appointmentsData = await AsyncStorage.getItem('@MedicalApp:appointments');
      const appointments: Appointment[] = appointmentsData ? JSON.parse(appointmentsData) : [];
      
      // (Não usado nos cálculos atuais — pode ser removido ou integrado)
      const registeredUsersData = await AsyncStorage.getItem('@MedicalApp:registeredUsers');
      const registeredUsers = registeredUsersData ? JSON.parse(registeredUsersData) : [];

      // ------------------------ Métricas básicas ------------------------
      const totalAppointments = appointments.length;
      const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
      const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

      // Pacientes únicos (com base nas consultas)
      const uniquePatients = new Set(appointments.map(a => a.patientId));
      const totalPatients = uniquePatients.size;

      // Médicos únicos (com base nas consultas)
      const uniqueDoctors = new Set(appointments.map(a => a.doctorId));
      const totalDoctors = uniqueDoctors.size;

      // ------------------- Contagem por especialidade -------------------
      const specialties: { [key: string]: number } = {};
      appointments.forEach(appointment => {
        if (specialties[appointment.specialty]) {
          specialties[appointment.specialty]++;
        } else {
          specialties[appointment.specialty] = 1;
        }
      });

      // -------------------- Contagem por mês (MM/AAAA) ------------------
      const appointmentsByMonth: { [key: string]: number } = {};
      appointments.forEach(appointment => {
        try {
          // Espera "DD/MM/AAAA"; extrai mês/ano sem criar Date (evita fuso)
          const [day, month, year] = appointment.date.split('/');
          const monthKey = `${month}/${year}`; // exemplo: "08/2025"
          if (appointmentsByMonth[monthKey]) {
            appointmentsByMonth[monthKey]++;
          } else {
            appointmentsByMonth[monthKey] = 1;
          }
        } catch (error) {
          // Se alguma data vier fora do formato, apenas avisa e segue
          console.warn('Data inválida encontrada:', appointment.date);
        }
      });

      // --------------------- Percentuais por status ---------------------
      const statusPercentages = {
        confirmed: totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0,
        pending:   totalAppointments > 0 ? (pendingAppointments   / totalAppointments) * 100 : 0,
        cancelled: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      };

      // Retorna o snapshot agregado
      return {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalPatients,
        totalDoctors,
        specialties,
        appointmentsByMonth,
        statusPercentages,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      // Propaga para a tela chamar fallback/alerta
      throw error;
    }
  },

  /**
   * Calcula estatísticas restritas a um médico específico.
   * - Filtra consultas por doctorId e reaplica os agregados locais.
   * - Retorna apenas campos relevantes (Partial<Statistics>).
   */
  async getDoctorStatistics(doctorId: string): Promise<Partial<Statistics>> {
    try {
      const appointmentsData = await AsyncStorage.getItem('@MedicalApp:appointments');
      const allAppointments: Appointment[] = appointmentsData ? JSON.parse(appointmentsData) : [];
      
      // Recorte: apenas consultas do médico
      const doctorAppointments = allAppointments.filter(a => a.doctorId === doctorId);

      const totalAppointments = doctorAppointments.length;
      const confirmedAppointments = doctorAppointments.filter(a => a.status === 'confirmed').length;
      const pendingAppointments = doctorAppointments.filter(a => a.status === 'pending').length;
      const cancelledAppointments = doctorAppointments.filter(a => a.status === 'cancelled').length;

      // Pacientes únicos atendidos por este médico
      const uniquePatients = new Set(doctorAppointments.map(a => a.patientId));
      const totalPatients = uniquePatients.size;

      // Percentuais dentro do universo do médico
      const statusPercentages = {
        confirmed: totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0,
        pending:   totalAppointments > 0 ? (pendingAppointments   / totalAppointments) * 100 : 0,
        cancelled: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      };

      return {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalPatients,
        statusPercentages,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do médico:', error);
      throw error;
    }
  },

  /**
   * Calcula estatísticas restritas a um paciente específico.
   * - Filtra consultas por patientId e agrega especialidades consultadas,
   *   quantidade de médicos diferentes, totais e percentuais por status.
   */
  async getPatientStatistics(patientId: string): Promise<Partial<Statistics>> {
    try {
      const appointmentsData = await AsyncStorage.getItem('@MedicalApp:appointments');
      const allAppointments: Appointment[] = appointmentsData ? JSON.parse(appointmentsData) : [];
      
      // Recorte: apenas consultas deste paciente
      const patientAppointments = allAppointments.filter(a => a.patientId === patientId);

      const totalAppointments = patientAppointments.length;
      const confirmedAppointments = patientAppointments.filter(a => a.status === 'confirmed').length;
      const pendingAppointments = patientAppointments.filter(a => a.status === 'pending').length;
      const cancelledAppointments = patientAppointments.filter(a => a.status === 'cancelled').length;

      // Contagem por especialidade consumida pelo paciente
      const specialties: { [key: string]: number } = {};
      patientAppointments.forEach(appointment => {
        if (specialties[appointment.specialty]) {
          specialties[appointment.specialty]++;
        } else {
          specialties[appointment.specialty] = 1;
        }
      });

      // Médicos diferentes consultados por este paciente
      const uniqueDoctors = new Set(patientAppointments.map(a => a.doctorId));
      const totalDoctors = uniqueDoctors.size;

      // Percentuais dentro do universo do paciente
      const statusPercentages = {
        confirmed: totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0,
        pending:   totalAppointments > 0 ? (pendingAppointments   / totalAppointments) * 100 : 0,
        cancelled: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      };

      return {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalDoctors,
        specialties,
        statusPercentages,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do paciente:', error);
      throw error;
    }
  },
};
