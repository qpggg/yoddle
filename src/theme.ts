import { createTheme } from '@mui/material/styles'
import { red } from '@mui/material/colors'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#8B0000',
      dark: '#6B0000',
    },
    secondary: {
      main: '#1E1E1E',
      light: '#2C2C2C',
      dark: '#141414',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#F0F0F0',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E1E1E',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.35,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: 0,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: 0,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    body1: {
      fontSize: '1.125rem',
      lineHeight: 1.6,
      letterSpacing: 0,
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: 0,
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
    overline: {
      fontWeight: 600,
      letterSpacing: '0.1em',
      lineHeight: 1.6,
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'none',
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
})