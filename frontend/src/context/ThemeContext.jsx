import { createContext, useContext, useEffect, useState } from 'react';
import whooshSound from '@/assets/1215.MP3';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first, default to 'light' (no system preference)
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }

        // Default to light mode for all new users
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove both classes first
        root.classList.remove('light', 'dark');

        // Add the current theme class
        root.classList.add(theme);

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const playThemeSwitchSound = () => {
        try {
            // Import and play custom sound effect
            const audio = new Audio(whooshSound);
            audio.volume = 0.1; // Set volume to 40% for a subtle effect
            audio.play().catch(error => {
                // Silently fail if audio playback is blocked by browser
                console.log('Audio playback prevented:', error);
            });
        } catch (error) {
            // Silently fail if audio is not supported
            console.log('Audio playback not supported:', error);
        }
    };

    const toggleTheme = () => {
        playThemeSwitchSound();
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    // Set theme with sound effect (for dropdown selection)
    const setThemeWithSound = (newTheme) => {
        playThemeSwitchSound();
        setTheme(newTheme);
    };

    const value = {
        theme,
        setTheme,
        setThemeWithSound,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
