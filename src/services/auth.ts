// services/auth.ts
// -----------------------------------------------------------------------------
// Serviço de autenticação e gerenciamento básico de usuários (mock).
// Responsabilidades:
// 1) Autenticar usuários (admin, médicos mockados e pacientes registrados).
// 2) Registrar novos pacientes e persistir em AsyncStorage.
// 3) Expor utilitários para listar usuários e carregar pacientes registrados
//    na inicialização do app.
//
// Observações de arquitetura:
// - Este serviço é "stateless" quanto ao usuário logado (quem persiste USER/TOKEN
//   é o AuthContext). Aqui apenas retornamos o user/token.
// - Pacientes registrados são mantidos em um array in-memory (`registeredUsers`)
//   e reidratados a partir do AsyncStorage via `loadRegisteredUsers()`.
// - Há duas chaves distintas para usuários no projeto: `@MedicalApp:registeredUsers`
//   (usada aqui) e `@MedicalApp:users` (usada em algumas telas de admin).
//   Veja notas ao final sobre alinhar essas fontes de verdade.
// - Segurança: senhas de pacientes são salvas em plaintext (apenas para fins
//   didáticos). Em produção, NUNCA fazer isso. Ver recomendações ao final.
// -----------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

// -----------------------------------------------------------------------------
// Chaves centralizadas de armazenamento neste serviço.
// USER/TOKEN são usadas pelo AuthContext; REGISTERED_USERS é própria deste serviço.
// -----------------------------------------------------------------------------
const STORAGE_KEYS = {
  USER: '@MedicalApp:user',
  TOKEN: '@MedicalApp:token',
  REGISTERED_USERS: '@MedicalApp:registeredUsers',
};

// -----------------------------------------------------------------------------
// Base mock de médicos: permitem login com senha fixa "123456".
// Cada item inclui specialty e image para enriquecer UI.
// -----------------------------------------------------------------------------
const mockDoctors = [
  {
    id: '1',
    name: 'Dr. João Silva',
    email: 'joao@example.com',
    role: 'doctor' as const,
    specialty: 'Cardiologia',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    email: 'maria@example.com',
    role: 'doctor' as const,
    specialty: 'Pediatria',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: '3',
    name: 'Dr. Pedro Oliveira',
    email: 'pedro@example.com',
    role: 'doctor' as const,
    specialty: 'Ortopedia',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
];

// -----------------------------------------------------------------------------
// Admin mockado: também autentica com senha fixa "123456".
// -----------------------------------------------------------------------------
const mockAdmin = {
  id: 'admin',
  name: 'Administrador',
  email: 'admin@example.com',
  role: 'admin' as const,
  image: 'https://randomuser.me/api/portraits/men/3.jpg',
};

// -----------------------------------------------------------------------------
// Fonte de verdade in-memory de pacientes registrados. É reidratada na inicialização
// pelo método `loadRegisteredUsers()` e persistida em REGISTERED_USERS.
// OBS: mantém `password` para fins didáticos (ver notas de segurança).
// -----------------------------------------------------------------------------
let registeredUsers: (User & { password: string })[] = [];

// -----------------------------------------------------------------------------
// authService: operações de autenticação/registro e utilitários de listagem.
// -----------------------------------------------------------------------------
export const authService = {
  // Autentica admin, médico mockado ou paciente registrado.
  // - Admin: email fixo + senha "123456" → retorna user/token.
  // - Doctor: email presente em mockDoctors + senha "123456" → retorna user/token.
  // - Patient: busca em `registeredUsers`; compara senha salva; retorna user/token.
  // - Em qualquer falha: lança erro "Email ou senha inválidos".
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    // 1) Verifica admin (credenciais fixas)
    if (credentials.email === mockAdmin.email && credentials.password === '123456') {
      return {
        user: mockAdmin,
        token: 'admin-token',
      };
    }

    // 2) Verifica médicos mockados (senha fixa)
    const doctor = mockDoctors.find(
      (d) => d.email === credentials.email && credentials.password === '123456'
    );
    if (doctor) {
      return {
        user: doctor,
        token: `doctor-token-${doctor.id}`,
      };
    }

    // 3) Verifica paciente registrado (senha específica do paciente)
    const patient = registeredUsers.find(
      (p) => p.email === credentials.email
    );
    if (patient) {
      // Compara senha informada com a persistida (plaintext neste mock)
      if (credentials.password === patient.password) {
        // Remove a senha do objeto antes de devolver
        const { password, ...patientWithoutPassword } = patient;
        return {
          user: patientWithoutPassword,
          token: `patient-token-${patient.id}`,
        };
      }
    }

    // 4) Se nenhuma das opções acima autenticou, dispara erro
    throw new Error('Email ou senha inválidos');
  },

  // Registra um novo paciente (não permite colidir com admin/médicos/pacientes existentes).
  // - Gera id simples "patient-N".
  // - Define avatar com base no índice (alternando men/women).
  // - Persiste em REGISTERED_USERS e retorna user/token sem a senha.
  async register(data: RegisterData): Promise<AuthResponse> {
    // 1) Evita e-mails duplicados entre admin, médicos e pacientes já registrados
    if (
      mockDoctors.some((d) => d.email === data.email) ||
      mockAdmin.email === data.email ||
      registeredUsers.some((u) => u.email === data.email)
    ) {
      throw new Error('Email já está em uso');
    }

    // 2) Cria o paciente (mantém `password` somente neste exemplo didático)
    const newPatient: User & { password: string } = {
      id: `patient-${registeredUsers.length + 1}`,
      name: data.name,
      email: data.email,
      role: 'patient' as const,
      image: `https://randomuser.me/api/portraits/${registeredUsers.length % 2 === 0 ? 'men' : 'women'}/${
        registeredUsers.length + 1
      }.jpg`,
      password: data.password,
    };

    // 3) Atualiza fonte in-memory e persiste no AsyncStorage
    registeredUsers.push(newPatient);
    await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));

    // 4) Retorna user/token (sem a senha)
    const { password, ...patientWithoutPassword } = newPatient;
    return {
      user: patientWithoutPassword,
      token: `patient-token-${newPatient.id}`,
    };
  },

  // "Logout" no escopo do serviço: remove USER e TOKEN do storage.
  // Observação: o AuthContext também executa essa limpeza; aqui é redundante,
  // mas útil se este serviço for usado isoladamente.
  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  // Recupera o usuário armazenado pelo AuthContext (ou null se não houver).
  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter usuário armazenado:', error);
      return null;
    }
  },

  // ------------------------- Utilitários (admin) -----------------------------

  // Retorna médicos mockados + pacientes registrados ( fonte agregada ).
  // Importante: depende de `registeredUsers` já ter sido reidratado.
  async getAllUsers(): Promise<User[]> {
    return [...mockDoctors, ...registeredUsers];
  },

  // Apenas médicos mockados
  async getAllDoctors(): Promise<User[]> {
    return mockDoctors;
  },

  // Apenas pacientes registrados
  async getPatients(): Promise<User[]> {
    return registeredUsers;
  },

  // Carrega pacientes registrados persistidos no AsyncStorage
  // para a fonte in-memory (`registeredUsers`). Deve ser chamado
  // na inicialização do app (o AuthProvider já faz isso).
  async loadRegisteredUsers(): Promise<void> {
    try {
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      if (usersJson) {
        registeredUsers = JSON.parse(usersJson);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários registrados:', error);
    }
  },
};
