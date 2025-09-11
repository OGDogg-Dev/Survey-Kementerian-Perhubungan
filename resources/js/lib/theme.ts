import { useEffect, useState } from 'react';

const storageKey = 'theme';

function getInitialTheme() {
    if (typeof window === 'undefined') {
        return false;
    }
    const stored = localStorage.getItem(storageKey);
    if (stored) {
        return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
    const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle('dark', isDark);
        localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggle = () => setIsDark((prev) => !prev);

    return { isDark, toggle } as const;
}
