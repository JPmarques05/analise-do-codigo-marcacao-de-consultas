// TimeSlotList.tsx
// -----------------------------------------------------------------------------
// Lista/grade de horários (time slots) para seleção em intervalos de 30 minutos.
// Responsabilidades:
// 1) Gerar slots de horário entre 09:00 e 17:30 (passo de 30 min).
// 2) Exibir os slots em um grid responsivo, destacando o selecionado.
// 3) Notificar o componente pai via onSelectTime(time) quando o usuário toca.
//
// Notas de design:
// - A largura de cada card é ~23% para caber 4 por linha com espaçamentos.
// - Usa cor primária com transparência ("+ '20'") para indicar seleção.
// - Mantém o componente "controlado" pela prop selectedTime (fonte da verdade é o pai).
// -----------------------------------------------------------------------------

import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle, TouchableOpacity } from 'react-native';
import theme from '../styles/theme';

// -----------------------------------------------------------------------------
// Propriedades expostas:
// - onSelectTime: callback acionado ao tocar em um slot.
// - selectedTime: string "HH:MM" do slot atualmente selecionado (controlado pelo pai).
// - style: estilo extra aplicado ao Container para composição em telas.
// -----------------------------------------------------------------------------
interface TimeSlotListProps {
  onSelectTime: (time: string) => void;
  selectedTime?: string;
  style?: ViewStyle;
}

// Props internas para estilização condicional (selecionado ou não)
interface StyledProps {
  isSelected: boolean;
}

const TimeSlotList: React.FC<TimeSlotListProps> = ({
  onSelectTime,
  selectedTime,
  style,
}) => {
  // -----------------------------------------------------------------------------
  // Gera horários de 30 em 30 minutos das 9h às 18h (intervalo [9, 18)):
  // Resultado: 09:00, 09:30, 10:00, ..., 17:30.
  // Em cenários reais, pode-se receber esses slots do backend (por médico/data).
  // -----------------------------------------------------------------------------
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <Container style={style}>
      <TimeGrid>
        {timeSlots.map((time) => (
          <TimeCard
            key={time}
            onPress={() => onSelectTime(time)}      // propaga seleção para o pai
            isSelected={selectedTime === time}      // controla estilo ativo
          >
            <TimeText isSelected={selectedTime === time}>{time}</TimeText>
          </TimeCard>
        ))}
      </TimeGrid>
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos (styled-components)
// -----------------------------------------------------------------------------

// Wrapper com margem inferior para separar a grade de outros blocos
const Container = styled.View`
  margin-bottom: 15px;
`;

// Grade flexível: quebra de linha automática e espaçamento entre itens.
// OBS: `gap` pode não estar disponível em todas as versões do React Native.
// Se não funcionar no alvo do projeto, troque por margens nos itens (p.ex. margem direita/baixo).
const TimeGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
`;

// Card do slot de horário. Largura em % para formar 4 colunas com espaçamento.
// Borda e fundo mudam conforme estado de seleção.
const TimeCard = styled(TouchableOpacity)<StyledProps>`
  width: 23%;
  padding: 8px;
  border-radius: 6px;
  background-color: ${(props: StyledProps) =>
    props.isSelected ? theme.colors.primary + '20' : theme.colors.background};
  border-width: 1px;
  border-color: ${(props: StyledProps) =>
    props.isSelected ? theme.colors.primary : theme.colors.border};
  align-items: center;
  justify-content: center;
`;

// Texto do horário: usa cor primária quando selecionado para reforçar feedback.
const TimeText = styled.Text<StyledProps>`
  font-size: 12px;
  font-weight: 500;
  color: ${(props: StyledProps) =>
    props.isSelected ? theme.colors.primary : theme.colors.text};
`;

export default TimeSlotList;
