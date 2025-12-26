/**
 * Design System Style Constants
 * Apply these consistently across all financial components
 */

export const designSystemStyles = {
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  spacing: {
    cardPadding: '1.5rem',
    sectionGap: '2rem',
    elementGap: '1rem',
    panelGap: '1.5rem',
  },
  borderRadius: {
    card: '12px',
    button: '8px',
    input: '8px',
  },
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  button: {
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '8px',
    textTransform: 'none' as const,
  },
};




