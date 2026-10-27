import { Moon, Sun } from 'lucide-react';
import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useApp } from '../context/AppContext';

let themeRevealRunning = false;

export default function ThemeToggle({ variant }: { variant: 'landing' | 'sidebar' | 'floating' }) {
  const { theme, toggleTheme, lang } = useApp();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const modeLabel = theme === 'dark'
    ? (lang === 'tl' ? 'Maliwanag na Mode' : 'Light Mode')
    : (lang === 'tl' ? 'Madilim na Mode' : 'Dark Mode');

  const handleToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (themeRevealRunning) return;
    const root = document.documentElement;
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      toggleTheme();
      return;
    }

    const sidebar = event.currentTarget.closest('.desktop-sidebar-shell');
    const holdSidebarOpen = sidebar?.matches(':hover') ?? false;
    if (holdSidebarOpen) sidebar?.classList.add('theme-reveal-expanded');
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty('--theme-reveal-x', `${x}px`);
    root.style.setProperty('--theme-reveal-y', `${y}px`);
    root.style.setProperty('--theme-reveal-radius', `${radius}px`);
    root.classList.add('theme-revealing');
    themeRevealRunning = true;
    let applied = false;
    const applyTheme = () => {
      if (applied) return;
      applied = true;
      flushSync(() => toggleTheme());
      root.classList.toggle('dark', theme !== 'dark');
    };
    try {
      const transition = document.startViewTransition(applyTheme);
      // A skipped animation must still apply the selected theme.
      void transition.ready.catch(() => {});
      await transition.finished;
    } catch {
      applyTheme();
    } finally {
      root.classList.remove('theme-revealing');
      for (const property of ['--theme-reveal-x', '--theme-reveal-y', '--theme-reveal-radius']) root.style.removeProperty(property);
      // Let pointer hit testing return to the live page before releasing hover.
      if (holdSidebarOpen) {
        await new Promise<void>(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
        sidebar?.classList.remove('theme-reveal-expanded');
      }
      themeRevealRunning = false;
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className={variant === 'landing' ? 'landing-theme-toggle' : `${variant === 'sidebar' ? 'sidebar-theme-toggle w-full gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold' : 'h-10 w-10 rounded-full'} shrink-0 flex cursor-pointer items-center justify-center border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
      {variant === 'sidebar' && <span className="sidebar-expanded-only">{modeLabel}</span>}
    </button>
  );
}
