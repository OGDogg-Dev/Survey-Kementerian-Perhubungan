import { useEffect, useState } from 'react';

export function usePageLoading() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onStart = () => setLoading(true);
    const onFinish = () => setLoading(false);
    window.addEventListener('inertia:start', onStart);
    window.addEventListener('inertia:finish', onFinish);
    return () => {
      window.removeEventListener('inertia:start', onStart);
      window.removeEventListener('inertia:finish', onFinish);
    };
  }, []);

  return loading;
}
