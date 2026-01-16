import { createTheme, Theme } from '@mui/material/styles';

export const createDarkTheme = (): Theme => {
  return createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#00c6ff',
        light: '#33d1ff',
        dark: '#0099cc',
      },
      secondary: {
        main: '#10b981',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
      text: {
        primary: '#e0e0e0',
        secondary: '#a0a0a0',
      },
      divider: '#333333',
      grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            backgroundColor: '#00c6ff',
            color: '#000000',
            '&:hover': {
              backgroundColor: '#33d1ff',
            },
          },
          outlined: {
            borderColor: '#444444',
            color: '#e0e0e0',
            '&:hover': {
              borderColor: '#00c6ff',
              backgroundColor: 'rgba(0, 198, 255, 0.1)',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: '#a0a0a0',
            '&.Mui-selected': {
              color: '#00c6ff',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: '#1a1a1a',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: '#1a1a1a',
            color: '#e0e0e0',
            fontWeight: 600,
          },
          body: {
            color: '#e0e0e0',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1e1e1e',
              color: '#e0e0e0',
              '& fieldset': {
                borderColor: '#444444',
              },
              '&:hover fieldset': {
                borderColor: '#666666',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00c6ff',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#a0a0a0',
              '&.Mui-focused': {
                color: '#00c6ff',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#444444',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#666666',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00c6ff',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiInputLabel-root': {
              color: '#a0a0a0',
              '&.Mui-focused': {
                color: '#00c6ff',
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            borderBottom: '1px solid #333333',
          },
          indicator: {
            backgroundColor: '#00c6ff',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
            '&:hover': {
              backgroundColor: '#2a2a2a',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 198, 255, 0.15)',
              color: '#00c6ff',
              '&:hover': {
                backgroundColor: 'rgba(0, 198, 255, 0.25)',
              },
            },
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: '#2a2a2a',
            color: '#e0e0e0',
            borderColor: '#444444',
            '&.MuiChip-outlined': {
              backgroundColor: '#1e1e1e',
              borderColor: '#444444',
              color: '#e0e0e0',
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
            '&:hover': {
              backgroundColor: '#2a2a2a',
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: '#e0e0e0',
          },
          secondary: {
            color: '#a0a0a0',
          },
        },
      },
    },
  });
};














