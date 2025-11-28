/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Enable class-based dark mode
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                // Dark theme palette
                dark: {
                    bg: '#0f172a', // dark background
                    surface: '#1e293b', // cards, surfaces
                    text: '#e2e8f0', // primary text
                },
            },
            // Glassmorphism utility
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                md: '8px',
                lg: '12px',
                xl: '16px',
            },
            backgroundOpacity: {
                10: '0.1',
                20: '0.2',
                30: '0.3',
                40: '0.4',
                50: '0.5',
            },
            boxShadow: {
                glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
            },
        },
    },
    plugins: [],
};
