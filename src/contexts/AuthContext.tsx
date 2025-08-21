// AuthContext.tsx
// -----------------------------------------------------------------------------
// Contexto de autenticação da aplicação.
// Responsabilidades:
// 1) Manter o estado global do usuário autenticado (`user`) e o estado de carregamento (`loading`).
// 2) Fornecer operações de autenticação: `signIn`, `register`, `signOut`, `updateUser`.
// 3) Persistir user/token no AsyncStorage para manter sessão entre aberturas do app.
// 4) Carregar usuário previamente armazenado ao inicializar o app.
//
// Observações de implementação:
// - `authService` abstrai as chamadas de login/registro/storage (SIMULA backend).
// - `AsyncStorage` armazena `user` e `token` em chaves separadas (const STORAGE_KEYS).
// - `loading` inicia `true` e só é definido `false` após `loadStoredUser()` finalizar.
// -----------------------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';
import { User, LoginCredentials, RegisterData, AuthContextData } from '../types/auth';

// -----------------------------------------------------------------------------
// Chaves usadas no AsyncStorage (nomes com prefixo para evitar colisão).
// -----------------------------------------------------------------------------
const STORAGE_KEYS = {
  USER: '@MedicalApp:user',
  TOKEN: '@MedicalApp:token',
};

// -----------------------------------------------------------------------------
// Criação do contexto de autenticação.
// ATENÇÃO: o valor default é um objeto "vazio" castado para AuthContextData.
// Isso faz com que o check `if (!context)` em `useAuth` nunca dispare, já que
// `{}` é truthy em JS. (Ver nota ao final.)
// -----------------------------------------------------------------------------
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// -----------------------------------------------------------------------------
// Provider que envolve a árvore do app e disponibiliza o contexto.
// - Controla `user` e `loading`.
// - Na montagem, tenta recuperar sessão pré-existente e carregar usuários de exemplo.
// -----------------------------------------------------------------------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // `user`: objeto do usuário autenticado (ou null se deslogado).
  const [user, setUser] = useState<User | null>(null);

  // `loading`: indica que o provider está iniciando (ex.: restaurando sessão).
  const [loading, setLoading] = useState(true);

  // Efeito de inicialização:
  // - `loadStoredUser()`: restaura usuário/token do storage (se houver).
  // - `loadRegisteredUsers()`: carrega base de usuários de exemplo (mock).
  useEffect(() => {
    loadStoredUser();
    loadRegisteredUsers();
  }, []);

  // ---------------------------------------------------------------------------
  // Tenta obter o usuário previamente armazenado via authService.
  // - Em caso de sucesso, popula `user`.
  // - `loading` é finalizado no `finally`, garantindo desbloqueio da UI.
  // ---------------------------------------------------------------------------
  const loadStoredUser = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Carrega a lista de usuários “registrados” (mock), se aplicável ao seu fluxo.
  // Útil para telas de login de demonstração/seed local.
  // ---------------------------------------------------------------------------
  const loadRegisteredUsers = async () => {
    try {
      await authService.loadRegisteredUsers();
    } catch (error) {
      console.error('Erro ao carregar usuários registrados:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // signIn:
  // - Envia credenciais ao `authService`.
  // - Atualiza `user` e persiste `user`/`token` no AsyncStorage.
  // - Repassa o erro para o chamador (UI decide mensagem/feedback).
  // ---------------------------------------------------------------------------
  const signIn = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.signIn(credentials);
      setUser(response.user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    } catch (error) {
      throw error;
    }
  };

  // ---------------------------------------------------------------------------
  // register:
  // - Cria um novo usuário via `authService`.
  // - Mantém a mesma estratégia de persistência do signIn.
  // - Repassa erros para handling na camada de UI.
  // ---------------------------------------------------------------------------
  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    } catch (error) {
      throw error;
    }
  };

  // ---------------------------------------------------------------------------
  // signOut:
  // - Solicita logout ao `authService` (se houver limpeza adicional).
  // - Zera `user` em memória e remove `user`/`token` do AsyncStorage.
  // - Em caso de falha no storage, loga erro mas evita travar a UI.
  // ---------------------------------------------------------------------------
  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.er
