// AppointmentForm.tsx
// -----------------------------------------------------------------------------
// Tela/Formulário de agendamento de consulta.
// Responsabilidades principais:
// 1) Permitir a escolha de um médico, data e horário (entre 09:00 e 17:30 a cada 30min).
// 2) Validar a data digitada no formato DD/MM/AAAA e dentro de uma janela (hoje..+3 meses).
// 3) Coletar uma descrição e enviar todos os dados via onSubmit(appointment).
// 4) Manter feedback visual de seleção (médico/horário) e de erro de data.
//
// Observações de design:
// - A lista de médicos é mockada localmente (const doctors).
// - A máscara de data é aplicada "on the fly" enquanto o usuário digita.
// - A verificação de disponibilidade de horário é um stub (sempre true) para expansão futura.
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import styled from 'styled-components/native';
import { Button, Input, Text } from 'react-native-elements';
import { Platform, View, TouchableOpacity } from 'react-native'; // NOTE: Platform e View não são usados no momento (pode-se remover futuramente)
import theme from '../styles/theme';
import { Doctor } from '../types/doctors';
import { Appointment } from '../types/appointments'; // NOTE: Importado mas não utilizado neste arquivo (mantido se houver future-use)

// -----------------------------------------------------------------------------
// Mock de médicos para seleção (substituir por dados vindos de API quando houver).
// -----------------------------------------------------------------------------
const doctors: Doctor[] = [
   {
      id: '1',
      name: 'Dr. João Silva',
      specialty: 'Cardiologista',
      image: 'https://mighty.tools/mockmind-api/content/human/91.jpg',
   },
   {
      id: '2',
      name: 'Dra. Maria Santos',
      specialty: 'Dermatologista',
      image: 'https://mighty.tools/mockmind-api/content/human/97.jpg',
   },
   {
      id: '3',
      name: 'Dr. Pedro Oliveira',
      specialty: 'Oftalmologista',
      image: 'https://mighty.tools/mockmind-api/content/human/79.jpg',
   },
];

// Props do formulário: expõe apenas o callback onSubmit com payload consolidado.
type AppointmentFormProps = {
   onSubmit: (appointment: {
      doctorId: string;
      date: Date;
      time: string;
      description: string;
   }) => void;
};

// -----------------------------------------------------------------------------
// generateTimeSlots:
// Gera slots a cada 30min das 09:00 às 17:30 (intervalo [9, 18)).
// -----------------------------------------------------------------------------
const generateTimeSlots = () => {
   const slots = [];
   for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
   }
   return slots;
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSubmit }) => {
   // --------------------------------------------------------------------------
   // Estados controlados do formulário:
   // - selectedDoctor: id do médico escolhido.
   // - dateInput: string visível/editável (com máscara) no input de data.
   // - selectedTime: slot de horário selecionado (texto "HH:MM").
   // - description: descrição livre da consulta (motivo/sintomas).
   // --------------------------------------------------------------------------
   const [selectedDoctor, setSelectedDoctor] = useState<string>('');
   const [dateInput, setDateInput] = useState('');
   const [selectedTime, setSelectedTime] = useState<string>('');
   const [description, setDescription] = useState('');
   const timeSlots = generateTimeSlots();

   // --------------------------------------------------------------------------
   // validateDate:
   // - Valida o padrão DD/MM/AAAA.
   // - Constrói um Date para comparação.
   // - Restringe a janela entre "hoje" e "hoje + 3 meses".
   //
   // Nota: a comparação inclui o horário atual. Em dias-limite "hoje", isso pode
   // reprovar se o relógio já passou de 00:00. Para uma validação mais "justa"
   // é comum normalizar as datas para 00:00 via setHours(0,0,0,0) (TODO possível).
   // --------------------------------------------------------------------------
   const validateDate = (inputDate: string) => {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = inputDate.match(dateRegex);

      if (!match) return false;

      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();
      const maxDate = new Date(new Date().setMonth(new Date().getMonth() + 3));

      return date >= today && date <= maxDate;
   };

   // --------------------------------------------------------------------------
   // handleDateChange:
   // - Remove caracteres não numéricos.
   // - Aplica formatação incremental para DD/MM/AAAA enquanto digita.
   //   Ex.: "1" -> "1", "1207" -> "12/07", "12072025" -> "12/07/2025".
   // --------------------------------------------------------------------------
   const handleDateChange = (text: string) => {
      // Remove todos os caracteres não numéricos
      const numbers = text.replace(/\D/g, '');
      
      // Formata a data enquanto digita
      let formattedDate = '';
      if (numbers.length > 0) {
         if (numbers.length <= 2) {
            formattedDate = numbers;
         } else if (numbers.length <= 4) {
            formattedDate = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
         } else {
            formattedDate = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
         }
      }

      setDateInput(formattedDate);
   };

   // --------------------------------------------------------------------------
   // handleSubmit:
   // - Checa preenchimento obrigatório (médico, horário, descrição).
   // - Valida a data no formato e no intervalo permitido.
   // - Converte a string "DD/MM/AAAA" para Date (atenção ao fuso do device).
   // - Invoca onSubmit com o payload consolidado para o fluxo superior (ex.: API).
   // --------------------------------------------------------------------------
   const handleSubmit = () => {
      if (!selectedDoctor || !selectedTime || !description) {
         alert('Por favor, preencha todos os campos');
         return;
      }

      if (!validateDate(dateInput)) {
         alert('Por favor, insira uma data válida (DD/MM/AAAA)');
         return;
      }

      const [day, month, year] = dateInput.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      onSubmit({
         doctorId: selectedDoctor,
         date,
         time: selectedTime,
         description,
      });
   };

   // --------------------------------------------------------------------------
   // isTimeSlotAvailable:
   // - Stub de disponibilidade. Sempre true no momento.
   // - Futuro: consultar agenda do médico/usuário e desabilitar slots ocupados.
   // --------------------------------------------------------------------------
   const isTimeSlotAvailable = (time: string) => {
      // Aqui você pode adicionar lógica para verificar se o horário está disponível
      // Por exemplo, verificar se já existe uma consulta agendada para este horário
      return true;
   };

   return (
      <Container>
         {/* Seção: seleção de médico (cards clicáveis). */}
         <Title>Selecione o Médico</Title>
         <DoctorList>
            {doctors.map((doctor) => (
               <DoctorCard
                  key={doctor.id}
                  selected={selectedDoctor === doctor.id}
                  onPress={() => setSelectedDoctor(doctor.id)}
               >
                  <DoctorImage source={{ uri: doctor.image }} />
                  <DoctorInfo>
                     <DoctorName>{doctor.name}</DoctorName>
                     <DoctorSpecialty>{doctor.specialty}</DoctorSpecialty>
                  </DoctorInfo>
               </DoctorCard>
            ))}
         </DoctorList>

         {/* Seção: data e hora */}
         <Title>Data e Hora</Ti
