// NotificationBell.tsx
// -----------------------------------------------------------------------------
// Sino de notificações exibido no Header.
// Responsabilidades:
// 1) Buscar e exibir a contagem de notificações não lidas do usuário logado.
// 2) Atualizar a contagem periodicamente (polling a cada 30s) e ao focar a tela.
// 3) Navegar para a tela "Notifications" ao toque.
//
// Decisões de implementação:
// - Usa AuthContext para obter o usuário atual (user.id).
// - Usa serviço notificationService.getUnreadCount(userId) para consultar backend.
// - Atualiza via setInterval (polling leve) + listener de foco do React Navigation.
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { TouchableOpacity } from 'react-native';
import { Badge } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../services/notifications';
import theme from '../styles/theme';

const NotificationBell: React.FC = () => {
  // Puxa o usuário autenticado; espera-se user?.id para consultas
  const { user } = useAuth();

  // Hook de navegação (tipagem simplificada aqui; em apps maiores tipar rotas ajuda)
  const navigation = useNavigation();

  // Estado local: quantidade de notificações não lidas a ser exibida no badge
  const [unreadCount, setUnreadCount] = useState(0);

  // -----------------------------------------------------------------------------
  // Função assíncrona que consulta o backend e atualiza o contador.
  // - Early return se não houver user.id (ex.: sessão não pronta).
  // - Envolve chamada em try/catch para logar falhas sem quebrar UI.
  // -----------------------------------------------------------------------------
  const loadUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Erro ao carregar contador de notificações:', error);
    }
  };

  // -----------------------------------------------------------------------------
  // Efeito: carregamento inicial + polling a cada 30s.
  // - Cria/limpa intervalo ao montar/desmontar ou quando user.id muda.
  // -----------------------------------------------------------------------------
  useEffect(() => {
    loadUnreadCount();
    
    // Recarrega o contador a cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // -----------------------------------------------------------------------------
  // Efeito: recarrega quando a tela volta ao foco (ex.: usuário retorna do stack).
  // - Adiciona o listener "focus" e retorna unsubscribe na limpeza do efeito.
  // -----------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadUnreadCount);
    return unsubscribe;
  }, [navigation, user?.id]);

  // Navega para a tela de notificações ao tocar no sino
  const handlePress = () => {
    // Cast para evitar erro de tipagem quando não há tipo das rotas configurado
    navigation.navigate('Notifications' as never);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <BellContainer>
        {/* Ícone simples via emoji para compatibilidade ampla; 
           pode ser substituído por ícone vetorial (e.g., react-native-vector-icons). */}
        <BellIcon>🔔</BellIcon>

        {/* Badge só aparece quando houver pelo menos 1 notificação não lida */}
        {unreadCount > 0 && (
          <Badge
            value={unreadCount > 99 ? '99+' : unreadCount.toString()}
            status="error"                 // cor semântica de alerta
            containerStyle={styles.badge}  // posiciona o badge no canto do sino
            textStyle={styles.badgeText}   // reduz tamanho da fonte do badge
          />
        )}
      </BellContainer>
    </TouchableOpacity>
  );
};

// Estilos em objeto JS (usados por react-native-elements no Badge)
const styles = {
  badge: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
  },
  badgeText: {
    fontSize: 10,
  },
};

// Wrapper relativo para posicionar o badge sobre o ícone
const BellContainer = styled.View`
  position: relative;
  padding: 8px;
`;

// Ícone do sino (texto grande e branco sobre o header primário)
const BellIcon = styled.Text`
  font-size: 24px;
  color: ${theme.colors.white};
`;

export default NotificationBell;
