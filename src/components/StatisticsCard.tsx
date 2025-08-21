// StatisticsCard.tsx
// -----------------------------------------------------------------------------
// Cartão estatístico genérico para dashboards.
// Responsabilidades:
// 1) Exibir um título (contexto da métrica), valor principal e um subtítulo opcional.
// 2) Permitir personalização de cor de ênfase (borda e valor).
// 3) Renderizar um ícone opcional alinhado ao título.
// 4) Aceitar `style` externo para ajuste de layout pelo componente pai.
//
// Decisões de UI:
// - Fundo branco com borda esquerda colorida: cria hierarquia visual discreta.
// - Sombra leve + radius: aparência de card.
// - A cor de ênfase (prop `color`) também colore o número principal (Value).
// -----------------------------------------------------------------------------

import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle } from 'react-native';
import theme from '../styles/theme';

// -----------------------------------------------------------------------------
// Propriedades do componente:
// - title: rótulo da métrica (ex.: "Consultas Confirmadas").
// - value: valor exibido em destaque (string ou number).
// - subtitle: detalhe contextual (ex.: "últimos 7 dias").
// - color: cor de ênfase (borda e valor). Default: theme.colors.primary.
// - icon: ReactNode opcional exibido à esquerda do título (SVG/emoji/ícone).
// - style: estilo extra aplicado ao Container externo (compor grid responsivo).
// -----------------------------------------------------------------------------
interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

// -----------------------------------------------------------------------------
// Componente principal:
// - Encapsula layout do card; mantém responsabilidade única de apresentação.
// - Não executa cálculo de métricas: recebe tudo pronto via props.
// -----------------------------------------------------------------------------
const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  subtitle,
  color = theme.colors.primary, // cor padrão consistente com a marca/tema
  icon,
  style,
}) => {
  return (
    <Container style={style} color={color}>
      <Header>
        {/* Ícone opcional; útil para reforçar semântica (ex.: 📈, 👨‍⚕️) */}
        {icon && <IconContainer>{icon}</IconContainer>}
        <Title>{title}</Title>
      </Header>

      {/* Valor principal: recebe mesma cor de ênfase da borda esquerda */}
      <Value color={color}>{value}</Value>

      {/* Subtítulo opcional para contexto (comparativo/intervalo temporal) */}
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos (styled-components)
// - Container: card com borda esquerda colorida e sombra suave.
// -----------------------------------------------------------------------------
const Container = styled.View<{ color: string }>`
  background-color: ${theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  margin: 8px;
  min-height: 120px;
  justify-content: space-between;

  /* Ênfase visual: faixa colorida à esquerda */
  border-left-width: 4px;
  border-left-color: ${(props) => props.color};

  /* Sombra (iOS) + elevation (Android) */
  shadow-color: ${theme.colors.text};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const IconContainer = styled.View`
  margin-right: 8px; /* espaça o ícone do título */
`;

const Title = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text};
  font-weight: 500;
  opacity: 0.8; /* reduz ênfase para não competir com o valor */
`;

const Value = styled.Text<{ color: string }>`
  font-size: 28px;
  font-weight: bold;
  color: ${(props) => props.color};
  margin-bottom: 4px;
`;

const Subtitle = styled.Text`
  font-size: 12px;
  color: ${theme.colors.text};
  opacity: 0.6; /* subtítulo deve ser mais sutil */
`;

export default StatisticsCard;
