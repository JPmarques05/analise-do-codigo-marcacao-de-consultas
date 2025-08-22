// routes/index.tsx (ou navigation/index.tsx)
// -----------------------------------------------------------------------------
// Stack de navegação “essencial” do app (Home, CreateAppointment, Profile).
// Responsabilidades:
// 1) Registrar e organizar as telas principais do fluxo base.
// 2) Aplicar opções globais do stack (header oculto, transição de slide).
//
// Observações:
// - Este stack não está tipado com RootStackParamList; funciona, mas perde
//   checagem de tipos em navegações. (Ver notas ao final.)
// - Caso exista um AppNavigator mais completo (com auth/roles), garanta que
//   apenas um dos navegadores é utilizado na árvore principal para evitar
//   rotas duplicadas/ambíguas.
// -----------------------------------------------------------------------------

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CreateAppointmentScreen from '../screens/CreateAppointmentScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Cria o stack nativo (sem tipagem explícita de rotas aqui).
// Em apps TypeScript, é recomendável parametrizar com RootStackParamList.
const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  return (
    <Stack.Navigator
      // Opções padrão aplicadas a todas as telas do stack.
      // - headerShown: esconde o header nativo; cada tela pode renderizar seu próprio header.
// - animation: transição horizontal ao navegar para a próxima tela.
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Tela inicial do fluxo base. 
          Dica: se quiser forçar esta como inicial em qualquer contexto, use initialRouteName no Navigator. */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* Tela para criação de nova consulta (formulário de agendamento). */}
      <Stack.Screen name="CreateAppointment" component={CreateAppointmentScreen} />

      {/* Tela de perfil do usuário logado (visualização/edição básica). */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}