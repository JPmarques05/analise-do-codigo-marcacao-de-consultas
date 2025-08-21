// AppointmentActionModal.tsx
// -----------------------------------------------------------------------------
// Componente de modal reutilizável para ações sobre uma consulta médica:
// - "confirm": confirma uma consulta existente.
// - "cancel": cancela uma consulta (opcionalmente coletando o motivo).
//
// Responsabilidades principais:
// 1) Exibir os detalhes da consulta (paciente, médico, especialidade, data/hora).
// 2) Quando actionType === 'cancel', permitir que o usuário informe um "motivo".
// 3) Emitir o callback onConfirm(reason?) com o motivo (se houver) e fechar o modal.
// 4) Garantir que estado interno (reason) seja limpo sempre que o modal for fechado.
// -----------------------------------------------------------------------------

import React from 'react';
import styled from 'styled-components/native';
import { Modal, ViewStyle } from 'react-native';
import { Button, Input } from 'react-native-elements';
import theme from '../styles/theme';

// -----------------------------------------------------------------------------
// Tipagem das props do componente.
// - visible: controla a visibilidade do Modal (controlado pelo componente pai).
// - onClose: callback para fechar o Modal (também limpa estado interno).
// - onConfirm: callback executado ao confirmar a ação; recebe um "reason" opcional.
// - actionType: define o modo do modal ("confirm" | "cancel").
// - appointmentDetails: dados imutáveis da consulta para renderização.
// -----------------------------------------------------------------------------
interface AppointmentActionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  actionType: 'confirm' | 'cancel';
  appointmentDetails: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    specialty: string;
  };
}

// -----------------------------------------------------------------------------
// Componente principal.
// Estratégia de estado local:
// - reason: string controlada apenas quando actionType === 'cancel'.
//   * É limpa em dois momentos: ao confirmar (handleConfirm) e ao fechar (handleClose).
//   * Ao confirmar, envia-se `undefined` se string vazia/whitespace (evita mandar "").
// -----------------------------------------------------------------------------
const AppointmentActionModal: React.FC<AppointmentActionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  actionType,
  appointmentDetails,
}) => {
  // Estado local para o motivo de cancelamento (usado apenas no modo "cancel")
  const [reason, setReason] = React.useState('');

  // -----------------------------------------------------------------------------
  // handleConfirm:
  // - Normaliza o motivo (trim).
  // - Passa `undefined` se o usuário não digitou conteúdo útil.
  // - Limpa o estado interno e fecha o modal.
  // Observação: `onConfirm` é responsabilidade do pai (ex.: chamar API/atualizar store).
  // -----------------------------------------------------------------------------
  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason('');
    onClose();
  };

  // -----------------------------------------------------------------------------
  // handleClose:
  // - Fecha o modal e sempre limpa o estado local (previne vazamento de estado entre usos).
  // -----------------------------------------------------------------------------
  const handleClose = () => {
    setReason('');
    onClose();
  };

  // Flag de conveniência (melhora legibilidade de condicionais no JSX)
  const isCancel = actionType === 'cancel';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose} // Android: back button -> fecha com limpeza de estado
    >
      <Overlay>
        <ModalContainer>
          <Header>
            <Title>
              {isCancel ? 'Cancelar Consulta' : 'Confirmar Consulta'}
            </Title>
          </Header>

          <Content>
            {/* Bloco informativo: mostra dados principais da consulta.
                Mantém layout compacto e legível (labels à esquerda, valores à direita). */}
            <AppointmentInfo>
              <InfoRow>
                <InfoLabel>Paciente:</InfoLabel>
                <InfoValue>{appointmentDetails.patientName}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Médico:</InfoLabel>
                <InfoValue>{appointmentDetails.doctorName}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Especialidade:</InfoLabel>
                <InfoValue>{appointmentDetails.specialty}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Data/Hora:</InfoLabel>
                <InfoValue>
                  {appointmentDetails.date} às {appointmentDetails.time}
                </InfoValue>
              </InfoRow>
            </AppointmentInfo>

            {/* Campo de motivo: aparece apenas no fluxo de cancelamento.
               - multiline para anotações curtas.
               - O label deixa explícito que é opcional. */}
            {isCancel && (
              <ReasonContainer>
                <Input
                  label="Motivo do cancelamento (opcional)"
                  placeholder="Digite o motivo..."
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  containerStyle={styles.reasonInput}
                />
              </ReasonContainer>
            )}

            {/* Mensagem de confirmação contextual: destaca visualmente com cor semântica. */}
            <ConfirmationText isCancel={isCancel}>
              {isCancel
                ? 'Tem certeza que deseja cancelar esta consulta?'
                : 'Tem certeza que deseja confirmar esta consulta?'}
            </ConfirmationText>
          </Content>

          {/* Ações: Cancelar (fecha modal) e Confirmar (dispara callback e fecha). */}
          <ButtonContainer>
            <Button
              title="Cancelar"
              onPress={handleClose}
              containerStyle={styles.cancelButton as ViewStyle} // garante largura/spacing lateral
              buttonStyle={styles.cancelButtonStyle}            // cor/negrito do botão
            />
            <Button
              title={isCancel ? 'Confirmar Cancelamento' : 'Confirmar'}
              onPress={handleConfirm}
              containerStyle={styles.confirmButton as ViewStyle}
              // Define a cor do botão "confirm" de forma contextual:
              // - erro (vermelho) para cancelar
              // - sucesso (verde) para confirmar
              buttonStyle={[
                styles.confirmButtonStyle,
                { backgroundColor: isCancel ? theme.colors.error : theme.colors.success },
              ]}
            />
          </ButtonContainer>
        </ModalContainer>
      </Overlay>
    </Modal>
  );
};

// -----------------------------------------------------------------------------
// Estilos em objeto JS usados por componentes do react-native-elements.
// Mantidos fora de styled-components pois esses props esperam objetos JS.
// -----------------------------------------------------------------------------
const styles = {
  reasonInput: {
    marginBottom: 10,
  },
  // ContainerStyle dos botões: divide espaço igualmente e cria espaçamento entre eles
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
  },
  // Estilo visual do botão "Cancelar" (cor secundária, padding consistente)
  cancelButtonStyle: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
  },
  // Estilo base do botão "Confirmar"; a cor é definida dinamicamente acima
  confirmButtonStyle: {
    paddingVertical: 12,
  },
};

// -----------------------------------------------------------------------------
// Styled-components para layout e tipografia.
// Observação importante: evite inserir comentários dentro dos template literals
// (``) pois eles fazem parte da string CSS. Comente acima das declarações.
// -----------------------------------------------------------------------------

// Camada de fundo translúcida para destacar o modal
const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

// Container visual do modal (cartão com sombra e raio)
const ModalContainer = styled.View`
  background-color: ${theme.colors.white};
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  shadow-color: ${theme.colors.text};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
  elevation: 5;
`;

// Cabeçalho com borda inferior discreta
const Header = styled.View`
  padding: 20px 20px 10px 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border};
`;

// Título centralizado
const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text};
  text-align: center;
`;

// Área principal do conteúdo
const Content = styled.View`
  padding: 20px;
`;

// Box de informações da consulta (fundo suave para agrupar campos)
const AppointmentInfo = styled.View`
  background-color: ${theme.colors.background};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

// Linha label/valor (label à esquerda, valor alinhado à direita)
const InfoRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
`;

// Texto do label (semibold)
const InfoLabel = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text};
  font-weight: 500;
`;

// Texto do valor (flex:1 para quebrar em telas menores, alinhado à direita)
const InfoValue = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text};
  font-weight: 400;
  flex: 1;
  text-align: right;
`;

// Wrapper do campo de motivo (apenas quando cancelar)
const ReasonContainer = styled.View`
  margin-bottom: 16px;
`;

// Mensagem final de confirmação, com cor semântica baseada no tipo de ação
const ConfirmationText = styled.Text<{ isCancel: boolean }>`
  font-size: 16px;
  color: ${(props: { isCancel: boolean }) =>
    props.isCancel ? theme.colors.error : theme.colors.success};
  text-align: center;
  margin-bottom: 20px;
  font-weight: 500;
`;

// Container dos botões de ação (lado a lado)
const ButtonContainer = styled.View`
  flex-direction: row;
  padding: 0 20px 20px 20px;
`;

export default AppointmentActionModal;
