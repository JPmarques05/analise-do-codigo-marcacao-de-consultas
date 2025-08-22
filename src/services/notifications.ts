// services/notifications.ts
// -----------------------------------------------------------------------------
// Serviço de notificações baseado em AsyncStorage.
// Responsabilidades:
// 1) Persistir e recuperar notificações por usuário (filtro por userId).
// 2) Marcar notificações como lidas (uma ou todas) e excluir notificações.
// 3) Fornecer contagem de não lidas.
// 4) Gerar notificações específicas de eventos do app (consulta confirmada,
//    cancelada, novo agendamento, lembrete).
//
// Decisões e observações importantes:
// - Armazenamento único (todas as notificações de todos os usuários) na chave
//   '@MedicalApp:notifications'. O filtro por usuário é feito em memória.
// - As datas são armazenadas em ISO string (new Date().toISOString()), e o
//   sort desc usa new Date(createdAt).getTime() — estável e previsível.
// - O método `getUnreadCount` reutiliza `getNotifications(userId)` (que já
//   retorna ordenado desc); a contagem é um simples filtro de `read === false`.
// - Os métodos usam `this` dentro do objeto literal. Isso funciona se forem
//   chamados como `notificationService.metodo()`. Evite desestruturar os métodos
//   (ex.: `const { getNotifications } = notificationService`) pois quebraria
//   o `this` implícito.
// - `appointmentDetails` está tipado como `any` nos helpers; mantido para não
//   alterar contrato, mas recomenda-se criar uma interface (ver notas).
// -----------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';

// Modelo de uma notificação persistida
export interface Notification {
  id: string;          // Identificador único (aqui: Date.now().toString())
  userId: string;      // Dono da notificação (usado para filtrar por usuário)
  title: string;       // Título curto
  message: string;     // Corpo/descrição
  type: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 'general';
  read: boolean;       // Flag de leitura
  createdAt: string;   // ISO string (new Date().toISOString())
  appointmentId?: string; // Opcional: vincula a uma consulta
}

// Chave única no AsyncStorage para todas as notificações
const STORAGE_KEY = '@MedicalApp:notifications';

export const notificationService = {
  /**
   * Retorna as notificações do usuário ordenadas da mais recente para a mais antiga.
   * - Lê todas as notificações salvas em STORAGE_KEY.
   * - Filtra por userId.
   * - Ordena por createdAt desc (conversão para Date em cada item).
   * - Em erro, loga e retorna array vazio (fail-safe).
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
      return allNotifications
        .filter(n => n.userId === userId)
        .sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      return [];
    }
  },

  /**
   * Cria uma nova notificação para um usuário.
   * - Recebe um objeto sem `id`, `createdAt` e `read` (preenchidos aqui).
   * - Lê lista atual, "push" da nova notificação, e persiste tudo novamente.
   * - Em erro, apenas loga (não lança).
   *
   * Observação: `id` é criado via Date.now().toString() (suficiente para o mock).
   * Em produção, prefira UUID.
   */
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
      
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      allNotifications.push(newNotification);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  },

  /**
   * Marca uma notificação específica como lida.
   * - Faz um map na lista e altera `read` quando o `id` bate.
   * - Persiste a lista atualizada.
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
      
      const updatedNotifications = allNotifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  },

  /**
   * Marca todas as notificações de um usuário como lidas.
   * - Percorre toda a lista e altera `read` onde `userId` coincide.
   * - Persiste a lista atualizada.
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
      
      const updatedNotifications = allNotifications.map(n => 
        n.userId === userId ? { ...n, read: true } : n
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    }
  },

  /**
   * Exclui uma notificação pelo id.
   * - Filtra fora o item e persiste o restante.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
      
      const filteredNotifications = allNotifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  },

  /**
   * Retorna a contagem de notificações não lidas para um usuário.
   * - Reutiliza getNotifications(userId) e filtra por `!read`.
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  },

  // ------------------ Helpers de domínio (eventos do app) --------------------

  /**
   * Cria uma notificação de "consulta confirmada" para o paciente.
   * - `appointmentDetails`: objeto livre contendo `doctorName`, `date`, `time` e `id`.
   *   Mantido como `any` para não quebrar chamadas existentes; ver notas para tipagem.
   */
  async notifyAppointmentConfirmed(patientId: string, appointmentDetails: any): Promise<void> {
    await this.createNotification({
      userId: patientId,
      type: 'appointment_confirmed',
      title: 'Consulta Confirmada',
      message: `Sua consulta com ${appointmentDetails.doctorName} foi confirmada para ${appointmentDetails.date} às ${appointmentDetails.time}.`,
      appointmentId: appointmentDetails.id,
    });
  },

  /**
   * Cria uma notificação de "consulta cancelada" para o paciente.
   * - `reason` opcional é concatenada ao final da mensagem.
   */
  async notifyAppointmentCancelled(patientId: string, appointmentDetails: any, reason?: string): Promise<void> {
    await this.createNotification({
      userId: patientId,
      type: 'appointment_cancelled',
      title: 'Consulta Cancelada',
      message: `Sua consulta com ${appointmentDetails.doctorName} foi cancelada.${reason ? ` Motivo: ${reason}` : ''}`,
      appointmentId: appointmentDetails.id,
    });
  },

  /**
   * Cria uma notificação "Nova Consulta Agendada" para o médico.
   * - Usa `patientName`, `date`, `time` e `id` do agendamento.
   */
  async notifyNewAppointment(doctorId: string, appointmentDetails: any): Promise<void> {
    await this.createNotification({
      userId: doctorId,
      type: 'general',
      title: 'Nova Consulta Agendada',
      message: `${appointmentDetails.patientName} agendou uma consulta para ${appointmentDetails.date} às ${appointmentDetails.time}.`,
      appointmentId: appointmentDetails.id,
    });
  },

  /**
   * Cria uma notificação de "lembrete de consulta" para o usuário (paciente ou médico).
   * - Mensagem usa `time` e `doctorName` OU `patientName` (fallback).
   * - A regra de "amanhã" é textual; não há cálculo de data/hora aqui.
   */
  async notifyAppointmentReminder(userId: string, appointmentDetails: any): Promise<void> {
    await this.createNotification({
      userId: userId,
      type: 'appointment_reminder',
      title: 'Lembrete de Consulta',
      message: `Você tem uma consulta agendada para amanhã às ${appointmentDetails.time} com ${appointmentDetails.doctorName || appointmentDetails.patientName}.`,
      appointmentId: appointmentDetails.id,
    });
  },
};
