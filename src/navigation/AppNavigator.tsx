// AppNavigator.tsx
// -----------------------------------------------------------------------------
// Configuração de navegação principal usando React Navigation (stack nativo).
// Responsabilidades:
// 1) Decidir entre rotas públicas (Login/Register) e rotas protegidas (app) com base
//    no estado de autenticação vindo do AuthContext.
// 2) Dentro das rotas protegidas, habilitar telas específicas por papel (role):
//    - admin  -> AdminDashboard
//    - doctor -> DoctorDashboard
//    - patient-> PatientDashboard
// 3) Expor as telas comuns a todos os usuários autenticados (Home, Profile, etc.).
//
// Observações de fluxo:
// - Enquanto `loading` do AuthContext for true, não renderizamos nada (poderia ser
//   um splash/loader visual).
// - O header padrão do stack está oculto (headerShown: false); cada tela pode
//   optar por mostrar seu próprio cabeçalho se necessário.
// - Tipagem do stack via RootStackParamList para navegação segura (TypeScript).
// -----------------------------------------------------------------------------

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

// -----------------------------------------------------------------------------
// Import das telas registradas no stack.
// -----------------------------------------------------------------------------
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateAppointmentScreen from '../screens/CreateAppointmentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import DoctorDashboardScreen from '../screens/DoctorDashboardScreen';
import PatientDashboardScreen from '../screens/PatientDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Criação do stack tipado com o RootStackParamList (rotas e params)
const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  // Vem do AuthContext: `user` (null se deslogado) e `loading` (restauração da sessão).
  const { user, loading } = useAuth();

  // Enquanto restaura sessão do storage, evita flicker de rotas.
  // (Opcional: retornar um componente de splash/loader).
  if (loading) {
    return null; // TODO (opcional): <SplashScreen /> ou <FullScreenLoader />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // header padrão off; telas podem usar seus próprios headers
        }}
        // NOTE (opcional): você pode definir um initialRouteName aqui se desejar
        // comportamento específico ao entrar autenticado.
      >
        {!user ? (
          // -------------------------------------------------------------------
          // ROTAS PÚBLICAS (sem autenticação)
          // -------------------------------------------------------------------
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // -------------------------------------------------------------------
          // ROTAS PROTEGIDAS (usuário autenticado)
          // - Mostra o dashboard correspondente ao `user.role`.
          // - Também registra telas comuns (Home, Profile, etc.).
          // -------------------------------------------------------------------
          <>
            {user.role === 'admin' && (
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboardScreen}
                options={{ title: 'Painel Administrativo' }} // título usado se headerShown for true em alguma tela
              />
            )}
            
            {user.role === 'doctor' && (
              <Stack.Screen 
                name="DoctorDashboard" 
                component={DoctorDashboardScreen}
                options={{ title: 'Painel do Médico' }}
              />
            )}
            
            {user.role === 'patient' && (
              <Stack.Screen 
                name="PatientDashboard" 
                component={PatientDashboardScreen}
                options={{ title: 'Painel do Paciente' }}
              />
            )}

            {/* Rotas comuns para todos os usuários autenticados */}
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Início' }}
            />
            <Stack.Screen 
              name="CreateAppointment" 
              component={CreateAppointmentScreen}
              options={{ title: 'Agendar Consulta' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Perfil' }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ title: 'Editar Perfil' }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ title: 'Notificações' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Configurações' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};