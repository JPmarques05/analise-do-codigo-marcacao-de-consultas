// AppointmentCard.tsx
// -----------------------------------------------------------------------------
// Componente de cartão que representa uma consulta médica na listagem.
// Responsabilidades principais:
// 1) Exibir dados principais da consulta (médico, especialidade, data, hora).
// 2) Mostrar status da consulta com cor semântica (pendente, confirmada, cancelada).
// 3) Permitir ação de clique opcional via onPress (navegar para detalhes, etc.).
// 4) Reaproveitar estilos consistentes de acordo com o tema global.
// -----------------------------------------------------------------------------

import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle } from 'react-native';
import { Card, Text, Avatar } from 'react-native-elements';
import theme from '../styles/theme';

// -----------------------------------------------------------------------------
// Tipagem das props recebidas:
// - doctorName: nome do médico responsável.
// - date, time: informações de agendamento.
// - specialty: área médica associada.
// - status: estado atual da consulta (pendente, confirmada, cancelada).
// - onPress: callback para clique (opcional).
// - style: permite customização externa do estilo do Card.
// -----------------------------------------------------------------------------
interface AppointmentCardProps {
  doctorName: string;
  date: string;
  time: string;
  specialty: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  onPress?: () => void;
  style?: ViewStyle;
}

// -----------------------------------------------------------------------------
// Componente principal AppointmentCard
// -----------------------------------------------------------------------------
const AppointmentCard: React.FC<AppointmentCardProps> = ({
  doctorName,
  date,
  time,
  specialty,
  status,
  onPress,
  style,
}) => {
  // Função utilitária: retorna cor semântica com base no status.
  // Mantém a lógica encapsulada e evita duplicação no JSX.
  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;   // verde para confirmado
      case 'cancelled':
        return theme.colors.error;     // vermelho para cancelado
      default:
        return theme.colors.primary;   // cor principal para pendente
    }
  };

  return (
    <Card containerStyle={[styles.card, style]} onPress={onPress}>
      <CardContent>
        {/* Bloco do médico: avatar + nome + especialidade */}
        <DoctorInfo>
          <Avatar
            size="medium"
            rounded
            // Usa um avatar aleatório para efeito visual. 
            // Em produção, poderia vir da API do médico/paciente.
            source={{
              uri: `https://randomuser.me/api/portraits/men/${Math.floor(
                Math.random() * 10
              )}.jpg`,
            }}
            containerStyle={styles.avatar}
          />
          <TextContainer>
            <DoctorName>{doctorName}</DoctorName>
            <Specialty>{specialty}</Specialty>
          </TextContainer>
        </DoctorInfo>

        {/* Bloco de informações da consulta */}
        <AppointmentInfo>
          <InfoRow>
            <InfoLabel>Data:</InfoLabel>
            <InfoValue>{date}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Horário:</InfoLabel>
            <InfoValue>{time}</InfoValue>
          </InfoRow>
        </AppointmentInfo>

        {/* Status visual (ponto colorido + texto) */}
        <StatusContainer>
          <StatusDot color={getStatusColor()} />
          <StatusText color={getStatusColor()}>
            {status === 'confirmed'
              ? 'Confirmada'
              : status === 'cancelled'
              ? 'Cancelada'
              : 'Pendente'}
          </StatusText>
        </StatusContainer>
      </CardContent>
    </Card>
  );
};

// -----------------------------------------------------------------------------
// Estilos em objeto JS (necessários para react-native-elements).
// -----------------------------------------------------------------------------
const styles = {
  card: {
    borderRadius: 10,
    marginHorizontal: 0,
    marginVertical: 8,
    padding: 15,
    elevation: 3, // sombra no Android
    shadowColor: '#000', // sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
};

// -----------------------------------------------------------------------------
// Styled-components (usados para estrutura e tipografia)
// -----------------------------------------------------------------------------

// Conteúdo interno do Card (padding adicional)
const CardContent = styled.View`
  padding: 10px;
`;

// Container das infos do médico (avatar + textos)
const DoctorInfo = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 15px;
`;

const TextContainer = styled.View`
  margin-left: 15px;
`;

// Nome do médico (destaque)
const DoctorName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text};
`;

// Especialidade (texto secundário)
const Specialty = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text};
  opacity: 0.7;
`;

// Área das infos de consulta (data/hora)
const AppointmentInfo = styled.View`
  margin-bottom: 15px;
`;

// Linha genérica label/valor
const InfoRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const InfoLabel = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text};
  opacity: 0.7;
`;

const InfoValue = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text};
  font-weight: 500;
`;

// Status (dot colorido + texto)
const StatusContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
`;

const StatusDot = styled.View<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => props.color};
  margin-right: 8px;
`;

const StatusText = styled.Text<{ color: string }>`
  font-size: 14px;
  color: ${(props) => props.color};
  font-weight: 500;
`;

export default AppointmentCard;
