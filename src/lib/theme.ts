import { createTheme } from '@mui/material/styles';
import { viVN } from '@mui/x-data-grid/locales';
import type {} from '@mui/x-data-grid/themeAugmentation';

/**
 * Company UI Design System Theme for Material UI (MUI)
 * Authoritative tokens:
 * - Brand Navy: #031da6 (primary brand, active states, key numbers, primary CTA)
 * - Brand Deep Navy: #020f5c
 * - Teal Accent: #02b8a9 (aliveness, success, positive indicators)
 * - Background: #f7f8fc (soft gray-blue)
 * - Surface: #ffffff
 * - Ink / Text: #0d1025 (primary), #45495e (secondary), #8a8fa3 (mute)
 * - Border / Line: #eef0f5, #d3dbe8
 * - Typography: Manrope (UI Sans), Fraunces (Headlines/Display), JetBrains Mono (Numbers/Codes/Timestamps)
 */

export const companyTheme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: {
        main: '#031da6',
        light: '#2a44d8',
        dark: '#020f5c',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#02b8a9',
        light: '#2ee6d6',
        dark: '#018a7f',
        contrastText: '#010833',
      },
      error: {
        main: '#e11d48',
        light: '#fef1f4',
        dark: '#be123c',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#d97706',
        light: '#fef6eb',
        dark: '#b45309',
        contrastText: '#ffffff',
      },
      info: {
        main: '#031da6',
        light: '#eef2ff',
        dark: '#020f5c',
        contrastText: '#ffffff',
      },
      success: {
        main: '#02b8a9',
        light: '#e6faf7',
        dark: '#018a7f',
        contrastText: '#ffffff',
      },
      text: {
        primary: '#0d1025',
        secondary: '#45495e',
        disabled: '#8a8fa3',
      },
      background: {
        default: '#f7f8fc',
        paper: '#ffffff',
      },
      divider: '#eef0f5',
      action: {
        active: '#031da6',
        hover: 'rgba(3, 29, 166, 0.04)',
        hoverOpacity: 0.04,
        selected: 'rgba(3, 29, 166, 0.08)',
        selectedOpacity: 0.08,
        disabled: '#8a8fa3',
        disabledBackground: 'rgba(138, 143, 163, 0.12)',
      },
    },
    typography: {
      fontFamily: 'var(--font-manrope), "Manrope", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontFamily: 'var(--font-fraunces), "Fraunces", ui-serif, Georgia, serif',
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.25,
        letterSpacing: '-0.025em',
        color: '#0d1025',
      },
      h2: {
        fontFamily: 'var(--font-fraunces), "Fraunces", ui-serif, Georgia, serif',
        fontWeight: 600,
        fontSize: '1.625rem',
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
        color: '#0d1025',
      },
      h3: {
        fontFamily: 'var(--font-fraunces), "Fraunces", ui-serif, Georgia, serif',
        fontWeight: 600,
        fontSize: '1.375rem',
        lineHeight: 1.35,
        letterSpacing: '-0.015em',
        color: '#0d1025',
      },
      h4: {
        fontFamily: 'var(--font-fraunces), "Fraunces", ui-serif, Georgia, serif',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.4,
        color: '#0d1025',
      },
      h5: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontWeight: 700,
        fontSize: '1rem',
        lineHeight: 1.45,
        color: '#0d1025',
      },
      h6: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontWeight: 700,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        color: '#0d1025',
      },
      subtitle1: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontWeight: 600,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        color: '#45495e',
      },
      subtitle2: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontWeight: 600,
        fontSize: '0.8125rem',
        lineHeight: 1.5,
        color: '#45495e',
      },
      body1: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontSize: '0.84375rem',
        lineHeight: 1.5,
        color: '#0d1025',
      },
      body2: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontSize: '0.78125rem',
        lineHeight: 1.5,
        color: '#45495e',
      },
      button: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontWeight: 700,
        fontSize: '0.8125rem',
        textTransform: 'none',
        letterSpacing: '0.01em',
      },
      caption: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontSize: '0.71875rem',
        lineHeight: 1.4,
        color: '#8a8fa3',
      },
      overline: {
        fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
        fontWeight: 700,
        fontSize: '0.625rem',
        lineHeight: 1.4,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#8a8fa3',
      },
    },
    shape: {
      borderRadius: 10,
    },
    shadows: [
      'none',
      '0 1px 2px rgba(13, 16, 37, 0.04)',
      '0 1px 3px rgba(13, 16, 37, 0.04), 0 1px 2px rgba(13, 16, 37, 0.03)',
      '0 4px 12px rgba(13, 16, 37, 0.06), 0 2px 4px rgba(13, 16, 37, 0.03)',
      '0 6px 16px rgba(13, 16, 37, 0.07)',
      '0 8px 24px rgba(13, 16, 37, 0.08)',
      '0 12px 32px rgba(13, 16, 37, 0.08)',
      '0 16px 40px rgba(13, 16, 37, 0.09)',
      '0 20px 48px rgba(13, 16, 37, 0.10)',
      '0 24px 56px rgba(13, 16, 37, 0.11)',
      '0 28px 64px rgba(13, 16, 37, 0.12)',
      '0 32px 72px rgba(13, 16, 37, 0.13)',
      '0 36px 80px rgba(13, 16, 37, 0.14)',
      '0 40px 88px rgba(13, 16, 37, 0.15)',
      '0 44px 96px rgba(13, 16, 37, 0.16)',
      '0 48px 104px rgba(13, 16, 37, 0.17)',
      '0 52px 112px rgba(13, 16, 37, 0.18)',
      '0 56px 120px rgba(13, 16, 37, 0.19)',
      '0 60px 128px rgba(13, 16, 37, 0.20)',
      '0 64px 136px rgba(13, 16, 37, 0.21)',
      '0 68px 144px rgba(13, 16, 37, 0.22)',
      '0 72px 152px rgba(13, 16, 37, 0.23)',
      '0 76px 160px rgba(13, 16, 37, 0.24)',
      '0 80px 168px rgba(13, 16, 37, 0.25)',
      '0 84px 176px rgba(13, 16, 37, 0.26)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            boxSizing: 'border-box',
          },
          '*, *::before, *::after': {
            boxSizing: 'inherit',
          },
          body: {
            backgroundColor: '#f7f8fc',
            color: '#0d1025',
            fontFamily: 'var(--font-manrope), "Manrope", ui-sans-serif, system-ui, sans-serif',
            minHeight: '100vh',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 700,
            fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
            padding: '7px 16px',
            transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          },
          contained: ({ ownerState }) => ({
            ...(ownerState.color === 'primary' && {
              background: 'linear-gradient(135deg, #031da6 0%, #020f5c 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px -2px rgba(3, 29, 166, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #020f5c 0%, #010833 100%)',
                boxShadow: '0 6px 16px -2px rgba(3, 29, 166, 0.45)',
              },
              '&:active': {
                opacity: 0.94,
              },
            }),
            ...(ownerState.color === 'secondary' && {
              background: '#02b8a9',
              color: '#010833',
              boxShadow: '0 4px 12px -2px rgba(2, 184, 169, 0.35)',
              '&:hover': {
                background: '#018a7f',
                color: '#ffffff',
              },
            }),
          }),
          outlined: ({ ownerState }) => ({
            ...(ownerState.color === 'primary' && {
              borderColor: '#d3dbe8',
              color: '#031da6',
              '&:hover': {
                borderColor: '#031da6',
                backgroundColor: 'rgba(3, 29, 166, 0.04)',
              },
            }),
            ...(ownerState.color === 'secondary' && {
              borderColor: 'rgba(2, 184, 169, 0.4)',
              color: '#018a7f',
              '&:hover': {
                borderColor: '#02b8a9',
                backgroundColor: '#e6faf7',
              },
            }),
          }),
          text: ({ ownerState }) => ({
            ...(ownerState.color === 'primary' && {
              color: '#031da6',
              '&:hover': {
                backgroundColor: 'rgba(3, 29, 166, 0.05)',
              },
            }),
          }),
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 14,
          },
          outlined: {
            borderColor: '#eef0f5',
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 14,
            border: '1px solid #eef0f5',
            boxShadow: '0 1px 3px rgba(13, 16, 37, 0.04), 0 1px 2px rgba(13, 16, 37, 0.03)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              borderColor: 'rgba(3, 29, 166, 0.12)',
              boxShadow: '0 4px 12px rgba(13, 16, 37, 0.06)',
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: '#ffffff',
            fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
            fontSize: '0.84375rem',
            transition: 'all 0.15s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#d3dbe8',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#031da6',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(3, 29, 166, 0.08)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#031da6',
              borderWidth: '1.5px',
            },
          },
          input: {
            padding: '8.5px 13px',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
            fontSize: '0.84375rem',
            color: '#45495e',
            '&.Mui-focused': {
              color: '#031da6',
              fontWeight: 600,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: 6,
            fontWeight: 600,
            fontFamily: 'var(--font-jetbrains), "JetBrains Mono", var(--font-manrope), monospace',
            fontSize: '0.75rem',
            height: 26,
            ...(ownerState.color === 'primary' && {
              backgroundColor: 'rgba(3, 29, 166, 0.07)',
              color: '#031da6',
              border: '1px solid rgba(3, 29, 166, 0.16)',
            }),
            ...(ownerState.color === 'secondary' && {
              backgroundColor: '#e6faf7',
              color: '#018a7f',
              border: '1px solid rgba(2, 184, 169, 0.25)',
            }),
            ...(ownerState.color === 'success' && {
              backgroundColor: '#e6faf7',
              color: '#018a7f',
              border: '1px solid rgba(2, 184, 169, 0.25)',
            }),
            ...(ownerState.color === 'warning' && {
              backgroundColor: '#fef6eb',
              color: '#d97706',
              border: '1px solid rgba(217, 119, 6, 0.25)',
            }),
            ...(ownerState.color === 'error' && {
              backgroundColor: '#fef1f4',
              color: '#e11d48',
              border: '1px solid rgba(225, 29, 72, 0.25)',
            }),
          }),
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            borderCollapse: 'separate',
            borderSpacing: 0,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: '#fafbfd',
            '& .MuiTableCell-head': {
              fontWeight: 700,
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#8a8fa3',
              borderBottom: '1px solid #eef0f5',
              padding: '10px 14px',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '11px 14px',
            fontSize: '0.8125rem',
            borderColor: '#eef0f5',
            color: '#0d1025',
            fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(3, 29, 166, 0.03)',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 18,
            border: '1px solid #eef0f5',
            boxShadow: '0 12px 32px rgba(13, 16, 37, 0.1)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-fraunces), "Fraunces", serif',
            fontWeight: 600,
            fontSize: '1.25rem',
            color: '#0d1025',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 40,
          },
          indicator: {
            backgroundColor: '#031da6',
            height: 2.5,
            borderRadius: 2,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
            minHeight: 40,
            padding: '6px 14px',
            fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
            color: '#45495e',
            '&.Mui-selected': {
              color: '#031da6',
              fontWeight: 700,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: '#0d1025',
            color: '#ffffff',
            borderRadius: 6,
            fontSize: '0.75rem',
            padding: '5px 10px',
            boxShadow: '0 4px 12px rgba(13, 16, 37, 0.15)',
          },
          arrow: {
            color: '#0d1025',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: '1px solid #eef0f5',
            borderRadius: 14,
            backgroundColor: '#ffffff',
            fontFamily: 'var(--font-manrope), "Manrope", sans-serif',
            fontSize: '0.8125rem',
            color: '#0d1025',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#fafbfd',
              borderBottom: '1px solid #eef0f5',
              color: '#8a8fa3',
              fontWeight: 700,
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            },
            '& .MuiDataGrid-row': {
              transition: 'background-color 0.15s ease',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(3, 29, 166, 0.03)',
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: 'rgba(3, 29, 166, 0.06)',
              '&:hover': {
                backgroundColor: 'rgba(3, 29, 166, 0.09)',
              },
            },
            '& .MuiDataGrid-cell': {
              borderColor: '#eef0f5',
              padding: '0 14px',
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none !important',
            },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
              outline: 'none !important',
            },
            '& .MuiDataGrid-footerContainer': {
              borderColor: '#eef0f5',
              backgroundColor: '#fafbfd',
              borderRadius: '0 0 14px 14px',
            },
            '& .MuiCheckbox-root.Mui-checked': {
              color: '#02b8a9',
            },
            '& .MuiDataGrid-toolbarContainer': {
              padding: '10px 14px',
              gap: '10px',
              borderBottom: '1px solid #eef0f5',
              backgroundColor: '#ffffff',
              borderRadius: '14px 14px 0 0',
            },
          },
        },
      },
    },
  },
  viVN
);

export default companyTheme;
