import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function RatingSummary({ email }: { email?: string }) {
  const { lang } = useApp();
  const [summary, setSummary] = useState<{ average: number | null; count: number } | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!email) return;
      void fetch(`/api/ratings?recipient=${encodeURIComponent(email)}`, { credentials: 'include' })
        .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
        .then(data => { if (active) setSummary(data); }).catch(() => { if (active) setSummary(null); });
    };
    refresh();
    window.addEventListener('kawing:rating-saved', refresh);
    return () => { active = false; window.removeEventListener('kawing:rating-saved', refresh); };
  }, [email]);
  return <span>{summary ? summary.count > 0 ? `${summary.average?.toFixed(1)} · ${summary.count} ${lang === 'en' ? 'reviews' : 'rating'}` : (lang === 'en' ? 'No ratings yet' : 'Wala pang rating') : (lang === 'en' ? 'Rating unavailable' : 'Hindi makuha ang rating')}</span>;
}
