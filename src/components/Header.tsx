// Header.tsx
// -----------------------------------------------------------------------------
// Cabeçalho da aplicação autenticada.
// Responsabilidades:
// 1) Exibir saudação + nome e avatar do usuário autenticado (via AuthContext).
// 2) Mostrar o ícone de notificações (NotificationBell) no canto direito.
// 3) Manter layout responsivo (avatar + textos à esquerda, sino à direita).
//
// Observações de fluxo:
// - Se não houver usuário no contexto (ex.: carregando/deslogado), não renderiza nada.
// - O Avatar usa a URL vinda do user.image; há um fundo primário como fallback visual
//   enquanto carrega.
// -----------------------------------------------------------------------------

import React from 'react';
import styled from 'styled-components/native';
import { Avatar } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import theme from '../styles/theme';

const Header: React.FC = () => {
  // Obtém o estado de autenticação (usuário logado) do AuthContext.
  // Espera-se que `user` tenha ao menos { name: string; image: string }.
  const { user } = useAuth();

  // Regra de exibição:
  // - Sem usuário (ex.: durante splash/loading ou sessão expirada) -> não renderiza o header.
  if (!user) return null;

  return (
    <Container>
      {/* Bloco de informações do usuário (avatar + textos) */}
      <UserInfo>
        <Avatar
          size="medium"
          rounded
          // Fonte da imagem do usuário. Em produção, é bom ter um onError para fallback.
          source={{ uri: user.image }}
          containerStyle={styles.avatar}
        />
        <TextContainer>
          {/* Saudação curta e neutra (suporta nome social no campo user.name) */}
          <WelcomeText>Bem-vindo(a),</WelcomeText>
          <UserName>{user.name}</UserName>
        </TextContainer>
      </UserInfo>

      {/* Sino de notificações à direita (com badge/contagem, se implementado no componente) */}
      <NotificationBell />
    </Container>
  );
};

// Estilos em objeto JS para props específicas do react-native-elements.
const styles = {
  avatar: {
    // Cor de fundo exibida enquanto a imagem remota carrega (ou se falhar sem fallback)
    backgroundColor: theme.colors.primary,
  },
};

// -----------------------------------------------------------------------------
// Estilização do layout do header (barra superior).
// -----------------------------------------------------------------------------

// Barra superior com cor primária, borda inferior suave e itens distribuídos.
const Container = styled.View`
  background-color: ${theme.colors.primary};
  padding: 16px;
  flex-direction: row;
  justify-content: space-between; /* userInfo à esquerda, sino à direita */
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border};
`;

// Agrupa avatar e textos, garantindo alinhamento vertical e uso de espaço.
const UserInfo = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1; /* permite que o bloco ocupe o espaço disponível antes do sino */
`;

// Espaçamento horizontal entre avatar e textos.
const TextContainer = styled.View`
  margin-left: 12px;
`;

// Texto de saudação em tamanho menor, cor clara legível sobre o primário.
const WelcomeText = styled.Text`
  font-size: 14px;
  color: ${theme.colors.white};
  opacity: 0.9;
`;

// Nome do usuário com maior ênfase tipográfica.
const UserName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.white};
`;

export default Header;
