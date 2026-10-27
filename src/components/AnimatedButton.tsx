import React from 'react';
import { motion } from 'motion/react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'accent' | 'gradient';
  id?: string;
}

export default function AnimatedButton({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  variant = 'primary',
  id,
}: AnimatedButtonProps) {
  // Base theme styles matching Kawing's premium aesthetic with responsive motion
  const baseStyle = "relative overflow-hidden font-extrabold rounded-2xl text-xs px-5 py-3 shadow-md flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white focus:ring-emerald-500 shadow-emerald-600/20 border border-emerald-400/30",
    gradient: "bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-white focus:ring-emerald-500 shadow-lg shadow-emerald-500/20 border border-white/30",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-500 border border-slate-300 dark:border-slate-700",
    danger: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white focus:ring-red-500 shadow-red-500/20 border border-red-400/30",
    ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent focus:ring-slate-500",
    outline: "bg-transparent border-2 border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 focus:ring-emerald-500",
    accent: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white focus:ring-amber-500 shadow-amber-500/20 border border-amber-300/30"
  };

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.025, translateY: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 font-display tracking-wider">
        {children}
      </span>
    </motion.button>
  );
}
