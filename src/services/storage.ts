// services/storage.ts
// -----------------------------------------------------------------------------
// Camada de acesso a dados baseada em AsyncStorage com cache em memória.
// Responsabilidades principais:
// 1) Fornecer operações genéricas get/set/remove/clear com cache local e expiração.
// 2) Padronizar chaves de armazenamento via STORAGE_KEYS (fonte única da verdade).
// 3) Expor utilitários de domínio (appointments, users, notifications).
// 4) Suportar backup/restore e relatórios básicos do estado de armazenamento.
//
// Decisões de design:
// - Cache em memória (Map) acelera leituras repetidas e aceita expiração opcional.
// - getItem() primeiro tenta o cache válido; se não houver, busca no AsyncStorage,
//   popula o cache e retorna. Em erro, retorna defaultValue ou null (fail soft).
// - Os helpers de domínio (ex.: addAppointment) seguem padrão ler→mutar→persistir.
//   Em cenários concorrentes podem ocorrer condições de corrida (ver notas).
// -----------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';

// --------------------------- Tipos utilitários -------------------------------

// Armazena estrutura arbitrária (útil para backup/export). Mantido amplo de propósito.
export interface StorageData {
  [key: string]: any;
}

// Item de cache com carimbo temporal e expiração opcional
interface CacheItem<T> {
  data: T;         // valor armazenado
  timestamp: number; // momento em ms desde epoch
  expiry?: number;   // instante (ms epoch) no qual o item expira (se definido)
}

// ------------------------ Cache em memória (global) --------------------------
// Observação: não há política de "eviction" (LRU, TTL global, etc). O cache
// cresce até clearCache()/clearAll() ou remoções específicas via set/remove.
const cache = new Map<string, CacheItem<any>>();

// ---------------- Chaves de armazenamento centralizadas ---------------------
// Use sempre STORAGE_KEYS para evitar divergências de strings repetidas.
export const STORAGE_KEYS = {
  USER: '@MedicalApp:user',
  TOKEN: '@MedicalApp:token',
  APPOINTMENTS: '@MedicalApp:appointments',
  NOTIFICATIONS: '@MedicalApp:notifications',
  REGISTERED_USERS: '@MedicalApp:registeredUsers',
  APP_SETTINGS: '@MedicalApp:settings',
  STATISTICS_CACHE: '@MedicalApp:statisticsCache',
} as const;

// ------------------------------ API do serviço ------------------------------
export const storageService = {
  // ==========================================================================
  // BASICS (GENÉRICOS) COM CACHE
  // ==========================================================================

  /**
   * Persiste um valor (serializado em JSON) e atualiza o cache em memória.
   * @param key chave do AsyncStorage
   * @param value objeto/valor a ser salvo
   * @param expiryMinutes (opcional) minutos até expirar no cache em memória
   */
  async setItem<T>(key: string, value: T, expiryMinutes?: number): Promise<void> {
    try {
      // Serializa para JSON (assume que "value" é serializável)
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
      
      // Atualiza a entrada de cache com timestamp atual e expiração opcional
      const cacheItem: CacheItem<T> = {
        data: value,
        timestamp: Date.now(),
        expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : undefined,
      };
      cache.set(key, cacheItem);
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
      // Propaga o erro para o chamador tratar se necessário
      throw error;
    }
  },

  /**
   * Recupera um valor. Ordem: cache válido → AsyncStorage → defaultValue/null.
   * - Se existir no cache e não estiver expirado, retorna imediatamente.
   * - Se vier do AsyncStorage, popula o cache (sem expiração).
   * - Em erro de parse/IO, retorna defaultValue ou null (fail soft).
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      // 1) Verifica cache em memória
      const cached = cache.get(key);
      if (cached) {
        // Sem expiração definida OU ainda não expirado → retorna do cache
        if (!cached.expiry || cached.expiry > Date.now()) {
          return cached.data as T;
        } else {
          // Expirado: remove do cache e segue para leitura do storage
          cache.delete(key);
        }
      }

      // 2) Lê do AsyncStorage (string JSON)
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        // Reconstroi o valor original por JSON.parse
        const parsed = JSON.parse(stored) as T;
        
        // 3) Adiciona ao cache (sem expiração, pois não foi fornecida aqui)
        cache.set(key, {
          data: parsed,
          timestamp: Date.now(),
        });
        
        return parsed;
      }
      
      // 4) Não encontrou: retorna defaultValue se fornecido; caso contrário, null
      return defaultValue || null;
    } catch (error) {
      console.error(`Erro ao carregar ${key}:`, error);
      // Em caso de erro, opte por devolver defaultValue/null em vez de lançar
      return defaultValue || null;
    }
  },

  /**
   * Remove um item tanto do AsyncStorage quanto do cache em memória.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      cache.delete(key);
    } catch (error) {
      console.error(`Erro ao remover ${key}:`, error);
      throw error;
    }
  },

  /**
   * Limpa todo o AsyncStorage e o cache em memória.
   * Cuidado: apaga TUDO, não apenas as chaves do app.
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      cache.clear();
    } catch (error) {
      console.error('Erro ao limpar armazenamento:', error);
      throw error;
    }
  },

  // ==========================================================================
  // APPOINTMENTS (helpers de domínio)
  // ==========================================================================

  /**
   * Recupera a lista de consultas. Se não existir, retorna [].
   * Observação: tipagem é any[] para manter compatibilidade com chamadores atuais.
   */
  async getAppointments(): Promise<any[]> {
    return await this.getItem(STORAGE_KEYS.APPOINTMENTS, []);
  },

  /**
   * Sobrescreve a lista completa de consultas.
   */
  async saveAppointments(appointments: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.APPOINTMENTS, appointments);
  },

  /**
   * Adiciona uma consulta ao final da lista (read→push→save).
   * Em concorrência, duas operações simultâneas podem se sobrescrever.
   */
  async addAppointment(appointment: any): Promise<void> {
    const appointments = await this.getAppointments();
    appointments.push(appointment);
    await this.saveAppointments(appointments);
  },

  /**
   * Atualiza parcialmente uma consulta (match por id).
   */
  async updateAppointment(appointmentId: string, updates: Partial<any>): Promise<void> {
    const appointments = await this.getAppointments();
    const updatedAppointments = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, ...updates } : apt
    );
    await this.saveAppointments(updatedAppointments);
  },

  /**
   * Exclui consulta pelo id.
   */
  async deleteAppointment(appointmentId: string): Promise<void> {
    const appointments = await this.getAppointments();
    const filteredAppointments = appointments.filter(apt => apt.id !== appointmentId);
    await this.saveAppointments(filteredAppointments);
  },

  // ==========================================================================
  // USERS (pacientes registrados neste app)
  // ==========================================================================

  /**
   * Retorna usuários registrados (pacientes). Se não houver, [].
   */
  async getRegisteredUsers(): Promise<any[]> {
    return await this.getItem(STORAGE_KEYS.REGISTERED_USERS, []);
  },

  /**
   * Sobrescreve a lista de usuários registrados.
   */
  async saveRegisteredUsers(users: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.REGISTERED_USERS, users);
  },

  /**
   * Adiciona um usuário à lista registrada (read→push→save).
   */
  async addUser(user: any): Promise<void> {
    const users = await this.getRegisteredUsers();
    users.push(user);
    await this.saveRegisteredUsers(users);
  },

  // ==========================================================================
  // NOTIFICATIONS
  // ==========================================================================

  /**
   * Retorna todas as notificações (para todos os usuários). Se não houver, [].
   * Observação: o service de notificações geralmente filtra por userId após ler.
   */
  async getNotifications(): Promise<any[]> {
    return await this.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  /**
   * Sobrescreve a lista completa de notificações.
   */
  async saveNotifications(notifications: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  /**
   * Adiciona uma notificação (read→push→save).
   */
  async addNotification(notification: any): Promise<void> {
    const notifications = await this.getNotifications();
    notifications.push(notification);
    await this.saveNotifications(notifications);
  },

  // ==========================================================================
  // BACKUP & RESTORE
  // ==========================================================================

  /**
   * Gera um JSON contendo um snapshot dos principais dados do app.
   * Retorna string JSON (pronta para share/export).
   */
  async createBackup(): Promise<string> {
    try {
      const backup = {
        timestamp: new Date().toISOString(), // para auditoria/histórico
        data: {
          // Cada getItem já faz cache e tolera inexistência
          appointments: await this.getItem(STORAGE_KEYS.APPOINTMENTS, []),
          notifications: await this.getItem(STORAGE_KEYS.NOTIFICATIONS, []),
          registeredUsers: await this.getItem(STORAGE_KEYS.REGISTERED_USERS, []),
          settings: await this.getItem(STORAGE_KEYS.APP_SETTINGS, {}),
        },
      };
      return JSON.stringify(backup);
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    }
  },

  /**
   * Restaura o estado a partir de uma string JSON (mesmo formato de createBackup()).
   * - Sobrescreve listas/chaves-alvo, sem merge profundo.
   * - Não toca em USER/TOKEN por segurança (login permanece sob controle do Auth).
   */
  async restoreFromBackup(backupString: string): Promise<void> {
    try {
      const backup = JSON.parse(backupString);
      
      if (backup.data) {
        await this.setItem(STORAGE_KEYS.APPOINTMENTS,      backup.data.appointments   || []);
        await this.setItem(STORAGE_KEYS.NOTIFICATIONS,     backup.data.notifications  || []);
        await this.setItem(STORAGE_KEYS.REGISTERED_USERS,  backup.data.registeredUsers|| []);
        await this.setItem(STORAGE_KEYS.APP_SETTINGS,      backup.data.settings       || {});
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  },

  // ==========================================================================
  // VALIDAÇÃO DE DADOS (sanity checks simples)
  // ==========================================================================

  /**
   * Valida forma mínima de um appointment (sem validar coerência de data/hora).
   * Retorna booleano; não lança.
   */
  validateAppointment(appointment: any): boolean {
    return (
      appointment &&
      typeof appointment.id === 'string' &&
      typeof appointment.patientId === 'string' &&
      typeof appointment.doctorId === 'string' &&
      typeof appointment.date === 'string' &&
      typeof appointment.time === 'string' &&
      ['pending', 'confirmed', 'cancelled'].includes(appointment.status)
    );
  },

  /**
   * Valida forma mínima de um usuário registrado.
   */
  validateUser(user: any): boolean {
    return (
      user &&
      typeof user.id === 'string' &&
      typeof user.name === 'string' &&
      typeof user.email === 'string' &&
      ['admin', 'doctor', 'patient'].includes(user.role)
    );
  },

  // ==========================================================================
  // CACHE CONTROLS & INFO
  // ==========================================================================

  /**
   * Limpa apenas o cache em memória (não apaga AsyncStorage).
   * Útil quando deseja forçar leitura "fresh" no próximo getItem().
   */
  clearCache(): void {
    cache.clear();
  },

  /**
   * Retorna informações diagnósticas do armazenamento:
   * - cacheSize: quantos itens estão no cache em memória
   * - totalKeys: quantas chaves existem no AsyncStorage
   * - lastAccess: timestamps (ms) de quando cada chave foi populada no cache
   */
  async getStorageInfo(): Promise<{
    cacheSize: number;
    totalKeys: number;
    lastAccess: { [key: string]: number };
  }> {
    const allKeys = await AsyncStorage.getAllKeys(); // todas as chaves do app (e possivelmente de outros)
    const lastAccess: { [key: string]: number } = {};
    
    // Constrói mapa de "último acesso" a partir do cache in-memory
    cache.forEach((value, key) => {
      lastAccess[key] = value.timestamp;
    });

    return {
      cacheSize: cache.size,
      totalKeys: allKeys.length,
      lastAccess,
    };
  },

  // ==========================================================================
  // APP SETTINGS
  // ==========================================================================

  /**
   * Recupera as configurações do app. Se não existirem, retorna defaults.
   */
  async getAppSettings(): Promise<any> {
    return await this.getItem(STORAGE_KEYS.APP_SETTINGS, {
      theme: 'light',
      notifications: true,
      language: 'pt-BR',
      autoBackup: true,
    });
  },

  /**
   * Atualiza configurações parcialmente (merge raso).
   * - Lê settings atuais, faz merge com `settings` e persiste.
   */
  async updateAppSettings(settings: Partial<any>): Promise<void> {
    const currentSettings = await this.getAppSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await this.setItem(STORAGE_KEYS.APP_SETTINGS, updatedSettings);
  },
};
