import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      button: string;
    };
  }
  interface PaletteOptions {
    gradient?: {
      primary: string;
      button: string;
    };
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8', // sky-400
      light: '#7dd3fc', // sky-300
      dark: '#0ea5e9', // sky-500
    },
    secondary: {
      main: '#8b5cf6', // violet-500
      light: '#a78bfa', // violet-400
      dark: '#7c3aed', // violet-600
    },
    background: {
      default: '#0f172a', // slate-900
      paper: 'rgba(15, 23, 42, 0.7)', // transparent slate-900
    },
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#94a3b8', // slate-400
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    gradient: {
      primary: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
      button: 'linear-gradient(90deg, rgba(56, 189, 248, 0.8) 0%, rgba(14, 165, 233, 0.8) 100%)',
    },
    error: {
      main: '#f43f5e', // rose-500
      light: '#fb7185', // rose-400
      dark: '#e11d48', // rose-600
    },
    success: {
      main: '#10b981', // emerald-500
      light: '#34d399', // emerald-400
      dark: '#059669', // emerald-600
    },
    warning: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24', // amber-400
      dark: '#d97706', // amber-600
    },
    info: {
      main: '#0ea5e9', // sky-500
      light: '#38bdf8', // sky-400
      dark: '#0284c7', // sky-600
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#f8fafc',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    body1: {
      fontSize: '1rem',
      color: '#f1f5f9',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#e2e8f0',
    },
    subtitle1: {
      fontSize: '1rem',
      color: '#94a3b8',
    },
    subtitle2: {
      fontSize: '0.875rem',
      color: '#94a3b8',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.8) 0%, rgba(14, 165, 233, 0.8) 100%)',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
          '&:hover': {
            background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.9) 0%, rgba(14, 165, 233, 0.9) 100%)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
            transform: 'translateY(-2px)',
          },
          '&:disabled': {
            background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.3) 0%, rgba(14, 165, 233, 0.3) 100%)',
            color: 'rgba(255, 255, 255, 0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(56, 189, 248, 0.5)',
          color: '#38bdf8',
          '&:hover': {
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
          },
        },
        text: {
          color: '#94a3b8',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#f8fafc',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(12px)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#94a3b8',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#f8fafc',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          '&:hover': {
            borderColor: 'rgba(56, 189, 248, 0.3)',
          },
          '&.Mui-focused': {
            borderColor: '#38bdf8',
            boxShadow: '0 0 0 2px rgba(56, 189, 248, 0.2)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: '#94a3b8',
          '&.Mui-selected': {
            color: '#38bdf8',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94a3b8',
          '&:hover': {
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            color: '#38bdf8',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
          borderRadius: '0.75rem',
          border: '1px solid #334155',
        },
      },
    },
  },
});

export default theme;
