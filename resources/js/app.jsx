import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#90caf9' },
        background: {
            default: '#0d1117',
            paper: '#161b22',
        },
    },
    typography: { fontFamily: 'Inter, system-ui, sans-serif' },
});

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <App {...props} />
            </ThemeProvider>,
        );
    },
    progress: { color: '#90caf9' },
});
