// Load SurveyJS base styles first so our app.css can override them
import 'survey-core/survey-core.css';
import '../css/tokens.css';

// Our app styles (Tailwind + custom overrides)
import '../css/app.css';
// creator CSS is loaded dynamically only on the editor page

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

// Ensure no legacy Service Worker remains registered (disable PWA)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Unregister any existing SWs registered from previous builds
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      reg.unregister().catch(() => {});
    }
  }).catch(() => {});
}

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
