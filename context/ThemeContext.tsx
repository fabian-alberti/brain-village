import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  colors: typeof colors;
}

// App colors (single light theme)
const colors = {
  background: '#FFFBF2',
  surface: '#F1EADB',
  card: '#F1EADB',
  text: '#232323',
  textSecondary: '#929292',
  border: '#000000',
  primary: '#1052A0',
  icon: '#000000',
  divider: 'rgba(0,0,0,0.12)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export colors for use outside of React components
export { colors };
