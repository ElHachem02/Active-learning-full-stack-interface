import { createTheme } from '@mui/material/styles';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/600.css';

const fontFamily = '"Helvetica Neue", sans-serif';

export const theme = createTheme({
  typography: {
    fontFamily: '"Helvetica Neue", sans-serif',
    h1: {
      fontFamily,
      fontSize: '3rem',
      fontWeight: 600,
      letterSpacing: '0.5px'
    },
    h2: {
      fontFamily,
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '0.5px'
    },
    h3: {
      fontFamily,
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '0.5px'
    },
    h4: {
      fontFamily,
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0.5px'
    },
    h5: {
      fontFamily,
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.5px'
    },
    h6: {
      fontFamily,
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0.5px'
    },
    body1: {
      fontFamily,
      fontSize: '1rem',
      letterSpacing: '0.3px'
    },
    body2: {
      fontFamily,
      fontSize: '0.875rem',
      letterSpacing: '0.3px'
    },
    button: {
      fontFamily,
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.5px'
    }
  },
  palette: {
    primary: {
      main: '#606C38', // sage green for primary actions
      contrastText: '#ffffff', // white text for primary buttons
    },
    secondary: {
      main: '#D2B48C', // tan color for secondary actions
      contrastText: '#ffffff', // white text for secondary buttons
    },
    background: {
      default: '#FEFAE0',
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@font-face': [
          {
            fontFamily: 'roxborough-cf',
            fontStyle: 'normal',
            fontWeight: 400,
            fontDisplay: 'swap',
          },
          {
            fontFamily: 'roxborough-cf',
            fontStyle: 'normal',
            fontWeight: 600,
            fontDisplay: 'swap',
          }
        ],
        body: {
          margin: 0,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
  },
}); 