# Sistema de Agendamento de Consultas Médicas

[![React Native](https://img.shields.io/badge/React%20Native-0.76.7-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-52.0.39-000020.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-0BSD-green.svg)](LICENSE)

Um aplicativo mobile completo para agendamento de consultas médicas, desenvolvido com React Native, TypeScript e Expo.

## Sobre o Projeto

Este é um aplicativo mobile desenvolvido em React Native para agendamento de consultas médicas. O sistema permite que pacientes visualizem médicos disponíveis, agendem consultas e gerenciem seus compromissos médicos de forma simples e intuitiva.

### Funcionalidades Principais

#### 🏥 Sistema de Agendamento
- Visualização de médicos disponíveis por especialidade
- Agendamento de consultas com seleção de data e horário
- Gerenciamento completo de consultas (visualizar, confirmar, cancelar)
- Validação de disponibilidade de horários
- Interface intuitiva para seleção de médicos e horários

#### 👤 Gerenciamento de Usuários
- Sistema de autenticação com três tipos de usuário (Admin, Médico, Paciente)
- Edição de perfil com atualização de dados em tempo real
- Perfis personalizados por tipo de usuário
- Avatars e informações detalhadas

#### 📊 Dashboard com Estatísticas
- Estatísticas detalhadas para administradores (consultas totais, especialidades mais procuradas)
- Dashboard personalizado para médicos (pacientes atendidos, consultas confirmadas)
- Visão geral para pacientes (histórico de consultas, médicos consultados)
- Gráficos e métricas em tempo real

#### 🔔 Sistema de Notificações
- Notificações push para confirmação/cancelamento de consultas
- Lembretes automáticos de consultas
- Centro de notificações com histórico completo
- Contador de notificações não lidas
- Notificações categorizadas por tipo

#### ⚙️ Configurações Avançadas
- Configurações personalizáveis do aplicativo
- Sistema de backup e restore de dados
- Gerenciamento de cache para melhor performance
- Limpeza de dados e configurações de privacidade

#### 🎨 Interface e Experiência do Usuário
- Design moderno e responsivo com Material Design
- Tema consistente com paleta de cores profissional
- Navegação fluida entre telas
- Componentes reutilizáveis e modulares
- Feedback visual para todas as ações

#### 💾 Armazenamento Inteligente
- Sistema de cache em memória para melhor performance
- Persistência local com AsyncStorage
- Validação de dados e integridade
- Backup e sincronização de dados

## Tecnologias Utilizadas

### 📱 Core
- [React Native](https://reactnative.dev/) 0.76.7 - Framework para desenvolvimento mobile
- [TypeScript](https://www.typescriptlang.org/) 5.3.3 - Superset JavaScript com tipagem estática
- [Expo](https://expo.dev/) 52.0.39 - Plataforma para desenvolvimento React Native

### 🎨 Interface e Navegação
- [Styled Components](https://styled-components.com/) 6.1.16 - Estilização com CSS-in-JS
- [React Navigation](https://reactnavigation.org/) 6.1.9 - Navegação entre telas
- [React Native Elements](https://reactnativeelements.com/) 3.4.3 - Biblioteca de componentes UI
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons) - Ícones vetoriais

### 💾 Armazenamento e Dados
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) 2.1.2 - Armazenamento local
- [Axios](https://axios-http.com/) 1.8.4 - Cliente HTTP
- [JWT Decode](https://github.com/auth0/jwt-decode) 4.0.0 - Decodificação de tokens JWT

### 🛠️ Ferramentas de Desenvolvimento
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) 2.24.0 - Gestos nativos
- [React Native Screens](https://github.com/software-mansion/react-native-screens) 4.9.2 - Otimização de telas
- [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context) 5.3.0 - Área segura

## Pré-requisitos

Antes de começar, você precisa ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (recomendado)
- [React Native CLI](https://reactnative.dev/docs/environment-setup) (opcional)
- [Android Studio](https://developer.android.com/studio) (para desenvolvimento Android)
- [Xcode](https://developer.apple.com/xcode/) (para desenvolvimento iOS, apenas em macOS)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/marcacaoDeConsultasMedicas.git
cd marcacaoDeConsultasMedicas
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Instale as dependências do iOS (apenas em macOS):
```bash
cd ios
pod install
cd ..
```

4. Inicie o aplicativo:
```bash
# Método recomendado (Expo)
npm start
# ou
yarn start

# Para Android
npm run android
# ou
yarn android

# Para iOS (apenas em macOS)
npm run ios
# ou
yarn ios

# Para Web (desenvolvimento)
npm run web
# ou
yarn web
```

## Estrutura do Projeto

```
marcacaoDeConsultasMedicas/
├── App.tsx                 # Componente principal da aplicação
├── index.ts               # Ponto de entrada
├── app.json              # Configuração do Expo
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração TypeScript
│
├── assets/               # Recursos estáticos
│   ├── icon.png         # Ícone do aplicativo
│   ├── splash-icon.png  # Ícone da splash screen
│   └── ...
│
└── src/                  # Código fonte principal
    ├── components/       # Componentes reutilizáveis
    │   ├── AppointmentActionModal.tsx    # Modal de ações da consulta
    │   ├── AppointmentCard.tsx           # Card de consulta
    │   ├── AppointmentForm.tsx           # Formulário de agendamento
    │   ├── Button.tsx                    # Botão customizado
    │   ├── DoctorList.tsx               # Lista de médicos
    │   ├── Header.tsx                   # Cabeçalho com notificações
    │   ├── Input.tsx                    # Input customizado
    │   ├── NotificationBell.tsx         # Sino de notificações
    │   ├── StatisticsCard.tsx           # Card de estatísticas
    │   └── TimeSlotList.tsx             # Lista de horários
    │
    ├── contexts/         # Contextos React
    │   └── AuthContext.tsx              # Contexto de autenticação
    │
    ├── navigation/       # Configuração de navegação
    │   └── AppNavigator.tsx             # Navegador principal
    │
    ├── screens/          # Telas da aplicação
    │   ├── AdminDashboardScreen.tsx     # Dashboard do administrador
    │   ├── CreateAppointmentScreen.tsx  # Agendamento de consultas
    │   ├── DoctorDashboardScreen.tsx    # Dashboard do médico
    │   ├── EditProfileScreen.tsx        # Edição de perfil
    │   ├── HomeScreen.tsx               # Tela inicial
    │   ├── LoginScreen.tsx              # Tela de login
    │   ├── NotificationsScreen.tsx      # Central de notificações
    │   ├── PatientDashboardScreen.tsx   # Dashboard do paciente
    │   ├── ProfileScreen.tsx            # Perfil do usuário
    │   ├── RegisterScreen.tsx           # Registro de usuário
    │   ├── SettingsScreen.tsx           # Configurações
    │   └── UserManagementScreen.tsx     # Gerenciamento de usuários
    │
    ├── services/         # Serviços e APIs
    │   ├── appointments.ts              # Serviços de consultas
    │   ├── auth.ts                      # Serviços de autenticação
    │   ├── notifications.ts             # Serviços de notificações
    │   ├── statistics.ts                # Serviços de estatísticas
    │   └── storage.ts                   # Serviços de armazenamento
    │
    ├── styles/           # Estilos e temas
    │   ├── globalStyles.ts              # Estilos globais
    │   └── theme.ts                     # Configurações de tema
    │
    └── types/            # Definições TypeScript
        ├── appointments.ts              # Tipos de consultas
        ├── auth.ts                      # Tipos de autenticação
        ├── doctors.ts                   # Tipos de médicos
        └── navigation.ts                # Tipos de navegação
```

## Funcionalidades Detalhadas

### 🏥 Sistema de Agendamento Avançado
- **Seleção Inteligente de Médicos**: Filtro por especialidade com informações detalhadas
- **Calendário de Disponibilidade**: Interface visual para seleção de datas e horários
- **Validação em Tempo Real**: Verificação automática de conflitos de horários
- **Agendamento Rápido**: Processo simplificado em poucos passos
- **Confirmação Visual**: Feedback imediato após agendamento

### 👨‍⚕️ Dashboard para Médicos
- **Gestão de Consultas**: Visualização e gerenciamento de todas as consultas
- **Estatísticas Personalizadas**: Métricas de pacientes atendidos e consultas por período
- **Ações Rápidas**: Confirmação e cancelamento com modal informativo
- **Histórico Detalhado**: Acesso ao histórico completo de atendimentos

### 👤 Dashboard para Pacientes
- **Histórico de Consultas**: Visualização completa de consultas passadas e futuras
- **Estatísticas Pessoais**: Acompanhamento de especialidades consultadas
- **Agendamento Rápido**: Acesso direto para nova consulta
- **Notificações Integradas**: Alertas sobre status das consultas

### 🏢 Painel Administrativo
- **Visão Geral Completa**: Estatísticas gerais do sistema
- **Especialidades em Destaque**: Ranking das especialidades mais procuradas
- **Métricas Avançadas**: Análise de performance e utilização
- **Gerenciamento Total**: Controle de todas as consultas e usuários

### 🔔 Sistema de Notificações Inteligente
- **Notificações Contextuais**: Diferentes tipos baseados na ação (confirmação, cancelamento, lembrete)
- **Centro de Notificações**: Interface dedicada para gerenciar todas as notificações
- **Indicadores Visuais**: Contador de notificações não lidas no header
- **Persistência**: Histórico completo de notificações

### ⚙️ Configurações e Backup
- **Configurações Personalizáveis**: Controle de notificações e preferências
- **Sistema de Backup**: Criação e compartilhamento de backups completos
- **Gerenciamento de Cache**: Otimização de performance com controle manual
- **Informações do Sistema**: Monitoramento de uso de armazenamento

### 🎨 Design System Profissional
- **Componentes Modulares**: Biblioteca de componentes reutilizáveis
- **Tema Consistente**: Paleta de cores e tipografia padronizada
- **Responsividade**: Design adaptativo para diferentes tamanhos de tela
- **Acessibilidade**: Implementação de boas práticas de usabilidade

## Últimas Implementações (Aula de Hoje)

### ✅ Funcionalidades Implementadas:

#### 1. 📝 Edição de Perfil Dinâmica
- Tela dedicada para edição de informações do usuário
- Validação em tempo real dos dados inseridos
- Atualização automática em todos os contextos da aplicação
- Campos específicos por tipo de usuário (especialidade para médicos)

**Arquivos criados/modificados:**
- `src/screens/EditProfileScreen.tsx` - Nova tela de edição
- `src/contexts/AuthContext.tsx` - Adicionada função `updateUser`
- `src/types/auth.ts` - Atualização da interface do contexto

#### 2. 📊 Sistema de Estatísticas Avançado
- Cards interativos com métricas em tempo real
- Estatísticas personalizadas por tipo de usuário
- Ranking de especialidades mais procuradas
- Percentuais de status das consultas

**Arquivos criados/modificados:**
- `src/components/StatisticsCard.tsx` - Componente de card de estatísticas
- `src/services/statistics.ts` - Serviço completo de cálculo de estatísticas
- `src/screens/AdminDashboardScreen.tsx` - Integração das estatísticas
- `src/screens/DoctorDashboardScreen.tsx` - Dashboard do médico com métricas

#### 3. 🔔 Sistema de Notificações Completo
- Notificações push para eventos importantes
- Centro de notificações com histórico
- Contador visual de notificações não lidas
- Categorização por tipo de evento

**Arquivos criados/modificados:**
- `src/services/notifications.ts` - Serviço completo de notificações
- `src/screens/NotificationsScreen.tsx` - Central de notificações
- `src/components/NotificationBell.tsx` - Sino de notificações no header
- `src/components/Header.tsx` - Integração do sino

#### 4. ✅ Sistema de Confirmação/Cancelamento Aprimorado
- Modal informativo para ações de consulta
- Campo opcional para motivo do cancelamento
- Feedback visual detalhado
- Notificações automáticas para pacientes

**Arquivos criados/modificados:**
- `src/components/AppointmentActionModal.tsx` - Modal de ações
- `src/screens/DoctorDashboardScreen.tsx` - Integração do novo modal

#### 5. 💾 Sistema de Armazenamento Inteligente
- Cache em memória para melhor performance
- Validação automática de dados
- Sistema de backup e restore
- Monitoramento de uso de armazenamento

**Arquivos criados/modificados:**
- `src/services/storage.ts` - Serviço centralizado de armazenamento
- `src/screens/SettingsScreen.tsx` - Tela de configurações avançadas

#### 6. 🧭 Navegação e Acessibilidade Refinadas
- Rotas atualizadas para todas as novas telas
- Navegação fluida entre funcionalidades
- Acesso fácil às configurações

**Arquivos modificados:**
- `src/types/navigation.ts` - Novas rotas adicionadas
- `src/navigation/AppNavigator.tsx` - Configuração das novas telas
- Dashboards atualizados com novos botões de acesso

### 🎯 Benefícios das Implementações:

1. **Experiência do Usuário Aprimorada**: Interface mais intuitiva e informativa
2. **Performance Otimizada**: Sistema de cache reduz tempo de carregamento
3. **Transparência**: Estatísticas em tempo real para todos os usuários
4. **Comunicação Eficiente**: Sistema de notificações mantém usuários informados
5. **Flexibilidade**: Configurações personalizáveis para cada usuário
6. **Segurança**: Sistema de backup garante integridade dos dados

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autores

- **Professor Hete Caetano** - [hete.caetano@fiap.com.br](mailto:hete.caetano@fiap.com.br)

## Agradecimentos

- [React Native Community](https://reactnative.dev/help)
- [React Navigation](https://reactnavigation.org/)
- [Styled Components](https://styled-components.com/)
- Todos os contribuidores do projeto

## Suporte

Se você encontrar algum problema ou tiver sugestões, por favor abra uma issue no GitHub.

---

Desenvolvido por Professor Hete Caetano e compartilhado com alunos de TDS 