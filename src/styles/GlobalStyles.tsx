import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

// Цветовая палитра для скроллбара
const scrollbarColors = {
  primary: {
    main: '#8B0000',
    dark: '#660000'
  }
};

const GlobalStyles = () => (
  <MuiGlobalStyles
    styles={{
      '*::-webkit-scrollbar': {
        width: '12px',
        background: 'transparent'
      },
      '*::-webkit-scrollbar-track': {
        background: '#f5f5f5',
        borderRadius: '8px',
      },
      '*::-webkit-scrollbar-thumb': {
        background: `linear-gradient(135deg, ${scrollbarColors.primary.main} 0%, ${scrollbarColors.primary.dark} 100%)`,
        borderRadius: '8px',
        border: '3px solid #f5f5f5',
        '&:hover': {
          background: scrollbarColors.primary.dark,
        }
      },
      '*': {
        scrollbarWidth: 'thin',
        scrollbarColor: `${scrollbarColors.primary.main} #f5f5f5`
      },
      'html, body': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      },
      '*, *::before, *::after': {
        boxSizing: 'inherit'
      }
    }}
  />
);

export default GlobalStyles; 