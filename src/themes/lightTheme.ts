import { createTheme, Theme } from '@mui/material/styles';

export const createLightTheme = (): Theme => {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2563eb',
        light: '#60a5fa',
        dark: '#1d4ed8',
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
            backgroundColor: '#2563eb',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1d4ed8',
            },
          },
          outlined: {
            borderColor: '#e5e7eb',
            color: '#111827',
            '&:hover': {
              borderColor: '#2563eb',
              backgroundColor: '#f0f9ff',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: '#6b7280',
            '&.Mui-selected': {
              color: '#2563eb',
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
                borderColor: '#2563eb',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#6b7280',
              '&.Mui-focused': {
                color: '#2563eb',
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
              borderColor: '#2563eb',
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
                color: '#2563eb',
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
            backgroundColor: '#2563eb',
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
              backgroundColor: '#f0f9ff',
              color: '#2563eb',
              '&:hover': {
                backgroundColor: '#e0f2fe',
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



