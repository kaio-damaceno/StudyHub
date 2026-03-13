import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'default';
  size?: 'sm' | 'default';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'default', size = 'default', className = '', children, ...props }) => {
  const baseClasses = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    ghost: 'bg-transparent hover:bg-white/20 border-transparent text-white',
    default: 'bg-white/10 hover:bg-white/20 text-white border-white/10',
  };
  const sizes = {
    sm: 'px-3 py-2 h-9 text-sm',
    default: 'px-4 py-2.5 h-10 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size as keyof typeof sizes] ?? sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
