import '../css/app.css';
import '@/styles/theme.lime.css';

// SurveyJS CSS (disable source maps to avoid 404 errors)
import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';

// Override source map URLs to prevent 404 errors
const style = document.createElement('style');
style.textContent = `
  /* Disable SurveyJS source maps */
  [href*="survey-creator-core.css.map"],
  [href*="survey-core.css.map"] {
    display: none !important;
  }
`;
document.head.appendChild(style);

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { ErrorBoundary } from './components/error-boundary';
import AppProviders from './providers/AppProviders';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary>
                <AppProviders>
                    <App {...props} />
                </AppProviders>
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#2563eb',
        showSpinner: false,
        delay: 150,
    },
});

// This will set light / dark mode on load...
initializeTheme();
