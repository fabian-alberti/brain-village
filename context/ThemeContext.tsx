import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  colors: typeof colors;
}

// ── Design System ──────────────────────────────────────────────
// Single source of truth for the app's color palette.
const colors = {
  // Backgrounds
  background: '#FFFBF2',       // warm cream — used as the root background
  surface: '#F5F5F0',          // light gray — input fields, secondary surfaces
  card: '#FFFFFF',             // white — primary card background

  // Text
  text: '#1A1A1A',            // primary text
  textSecondary: '#8B9D77',   // secondary / muted text

  // Brand
  primary: '#2D5A3D',         // deep forest green — buttons, active states
  primaryLight: '#E8F5E9',    // very light green — icon backgrounds, badges
  accent: '#F4A261',          // warm orange — XP, streaks, highlights
  danger: '#EF4444',          // red — destructive actions, errors

  // Borders & Dividers
  border: '#E8E8E8',          // soft gray border
  divider: '#F0EDE5',         // subtle divider

  // Icons
  icon: '#1A1A1A',            // default icon color
  iconSecondary: '#8B9D77',   // muted icon color
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
