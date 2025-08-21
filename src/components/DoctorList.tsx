// DoctorList.tsx
// -----------------------------------------------------------------------------
// Lista de médicos reutilizável.
// Responsabilidades:
// 1) Renderizar uma lista de médicos (nome, especialidade, avatar).
// 2) Destacar visualmente o item selecionado (selectedDoctorId).
// 3) Propagar seleção para o componente pai via onSelectDoctor(doctor).
// 4) Permitir estilização externa via prop `style`.
// -----------------------------------------------------------------------------
// Observação: para listas muito longas, considere migrar para FlatList (melhor
// performance, renderização virtualizada e suporte a onEndReached).
// -----------------------------------------------------------------------------

import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle } from 'react-native';
import { ListItem, Avatar } from 'react-native-elements';
import theme from '../styles/theme';

// -----------------------------------------------------------------------------
// Tipos locais (caso não exista um /types/doctors central).
// Se já houver um tipo Doctor global, pode-se importar e remover esta interface.
// -----------------------------------------------------------------------------
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

// -----------------------------------------------------------------------------
// Propriedades do componente:
// - doctors: coleção a ser listada.
// - onSelectDoctor: callback chamado ao tocar em um item.
// - selectedDoctorId: marca visualmente o item ativo.
// - style: permite aplicar estilos ao Container externo.
// -----------------------------------------------------------------------------
interface DoctorListProps {
  doctors: Doctor[];
  onSelectDoctor: (doctor: Doctor) => void;
  selectedDoctorId?: string;
  style?: ViewStyle;
}

// -----------------------------------------------------------------------------
// Componente principal:
// - Mapeia a lista para ListItem do react-native-elements.
// - Aplica estilo condicional quando o item é o selecionado.
// - Chevron no fim do item dá affordance de "item clicável".
// -----------------------------------------------------------------------------
const DoctorList: React.FC<DoctorListProps> = ({
  doctors,
  onSelectDoctor,
  selectedDoctorId,
  style,
}) => {
  return (
    <Container style={style}>
      {doctors.map((doctor) => (
        <ListItem
          key={doctor.id}
          onPress={() => onSelectDoctor(doctor)} // Propaga a seleção para o pai
          containerStyle={[
            styles.listItem,
            // Estilo adicional se for o item selecionado
            selectedDoctorId === doctor.id && styles.selectedItem,
          ]}
        >
          {/* Avatar do médico. Em produção, validar URL e adicionar fallback local. */}
          <Avatar
            size="medium"
            rounded
            source={{ uri: doctor.image }}
            containerStyle={styles.avatar}
          />
          <ListItem.Content>
            {/* Título (nome) com destaque tipográfico */}
            <ListItem.Title style={styles.name}>{doctor.name}</ListItem.Title>
            {/* Subtítulo (especialidade) com ênfase menor */}
            <ListItem.Subtitle style={styles.specialty}>
              {doctor.specialty}
            </ListItem.Subtitle>
          </ListItem.Content>
          {/* Chevron: indicador visual de navegabilidade */}
          <ListItem.Chevron />
        </ListItem>
      ))}
    </Container>
  );
};

// -----------------------------------------------------------------------------
// Estilos em objeto JS para props do react-native-elements.
// - selectedItem: usa cor com alpha ao concatenar '20' ao hex (≈12.5% de opacidade).
//   Certifique-se de que theme.colors.primary seja um hex (#RRGGBB) para isso funcionar.
// -----------------------------------------------------------------------------
const styles = {
  listItem: {
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedItem: {
    // Aplica leve realce quando selecionado
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  avatar: {
    backgroundColor: theme.colors.primary, // cor de fundo enquanto a imagem carrega
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
  },
  specialty: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.7,
  },
};

// Container externo que separa a lista de outros blocos da tela
const Container = styled.View`
  margin-bottom: 15px;
`;

export default DoctorList;
