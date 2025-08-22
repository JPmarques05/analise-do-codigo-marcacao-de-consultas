// styles/theme.ts
// -----------------------------------------------------------------------------
// Tema base (design tokens) da aplicação.
//
// Objetivo:
// - Centralizar cores, tipografia e espaçamentos para uso consistente em todo o
//   app (via imports diretos ou ThemeProvider, conforme sua arquitetura).
//
// Como usar:
// - Em componentes com styled-components/native, você pode importar este objeto
//   diretamente (`import theme from '../styles/theme'`) como feito no projeto.
// - Alternativamente, pode usar <ThemeProvider theme={theme}> para injetar o tema
//   no contexto do styled-components, habilitando acesso via props.theme.
//   (Se optar por ThemeProvider, defina tipos de tema para autocompletar/TS.)
//
// Observações de design:
// - As cores aqui são tokens “semânticos” (primary, error, success…): mude o
//   valor no tema e toda a UI refletirá a nova identidade visual.
// - Tipografia guarda apenas tamanho/peso; a cor do texto é controlada em `colors.text`.
// - Spacing define escala base de paddings/margens para padronizar ritmos de layout.
// -----------------------------------------------------------------------------

export default {
  // ------------------------------- CORES -------------------------------------
  colors: {
    // Cor principal da marca e para CTAs/realces (botões, ícones ativos, etc.)
    primary: '#4A90E2',

    // Cor secundária para ações alternativas e estados neutros/“voltar”
    secondary: '#6C757D',

    // Cor do plano de fundo da UI (telas, cards leves, etc.)
    background: '#F8F9FA',

    // Cor padrão do texto (boa legibilidade sobre background claro)
    text: '#212529',

    // Paleta de feedback (estados de erro/sucesso/aviso)
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',

    // Branco utilitário para fundos/contrastes
    white: '#FFFFFF',

    // Cor de bordas/divisores (linhas, contornos de cards, etc.)
    border: '#DEE2E6',
  },

  // ---------------------------- TIPOGRAFIA -----------------------------------
  typography: {
    // Título de páginas/seções
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },

    // Subtítulos, nomes, labels de destaque
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
    },

    // Texto corrido/descrições
    body: {
      fontSize: 16,
      fontWeight: 'normal',
    },

    // Anotações/legendas/auxiliares
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
    },
  },

  // ----------------------------- ESPAÇAMENTO ---------------------------------
  spacing: {
    // Utilize estes tokens para paddings/margens em vez de números “mágicos”
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
};
