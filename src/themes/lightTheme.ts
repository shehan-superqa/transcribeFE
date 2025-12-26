import { createTheme, Theme } from '@mui/material/styles';

export const createLightTheme = (): Theme => {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#6b21a8', // Purple accent - primary color
        light: '#9333ea',
        dark: '#581c87',
      },
      secondary: {
        main: '#10b981',
      },
      background: {
        default: '#f9fafb',
        paper: '#ffffff',
      },
      text: {
        primary: '#111827',
        secondary: '#6b7280',
      },
      grey: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      // Purple color scale for design system
      purple: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
      },
      // Status colors
      status: {
        awaiting: '#6b21a8',
        open: '#10b981',
        completed: '#6b7280',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            backgroundColor: '#6b21a8',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#581c87',
            },
          },
          outlined: {
            borderColor: '#e5e7eb',
            color: '#111827',
            '&:hover': {
              borderColor: '#6b21a8',
              backgroundColor: '#faf5ff',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: '#6b7280',
            '&.Mui-selected': {
              color: '#6b21a8',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: '#f9fafb',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: '#f9fafb',
            color: '#111827',
            fontWeight: 600,
          },
          body: {
            color: '#111827',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              color: '#111827',
              '& fieldset': {
                borderColor: '#d1d5db',
              },
              '&:hover fieldset': {
                borderColor: '#9ca3af',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#6b21a8',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#6b7280',
              '&.Mui-focused': {
                color: '#6b21a8',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#d1d5db',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#9ca3af',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6b21a8',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiInputLabel-root': {
              color: '#6b7280',
              '&.Mui-focused': {
                color: '#6b21a8',
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
          },
          indicator: {
            backgroundColor: '#6b21a8',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
            '&:hover': {
              backgroundColor: '#f3f4f6',
            },
            '&.Mui-selected': {
              backgroundColor: '#faf5ff',
              color: '#6b21a8',
              '&:hover': {
                backgroundColor: '#f3e8ff',
              },
            },
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: '#f3f4f6',
            color: '#111827',
            borderColor: '#d1d5db',
            '&.MuiChip-outlined': {
              backgroundColor: '#ffffff',
              borderColor: '#d1d5db',
              color: '#111827',
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#111827',
            '&:hover': {
              backgroundColor: '#f3f4f6',
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: '#111827',
          },
          secondary: {
            color: '#6b7280',
          },
        },
      },
    },
  });
};




