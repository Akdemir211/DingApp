import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as ThemeConstants from '@/constants/Theme';

// Define the theme interface
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof ThemeConstants.Colors;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode as requested

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // For now, we'll just use the dark theme as defined in Constants/Theme
  // In the future, we could expand this to include a light theme
  const theme = ThemeConstants.Colors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};