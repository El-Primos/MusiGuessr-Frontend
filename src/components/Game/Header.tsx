"use client";

import { ExitButton } from "./ExitButton";

interface HeaderProps {
  logoSrc: string;     // PNG path
  onExit?: () => void; // exit callback
  className?: string;  // for extra positioning if needed
}

export const Header = ({ logoSrc, onExit, className = "" }: HeaderProps) => {
  return (
    <header
      className={`
        w-full h-32 
        flex items-center justify-between
        bg-slate-950/80 border-b border-blue-900/40
        ${className}
      `}
    >
      <ExitButton onClick={onExit} />

      {/* Logo */}
      <div className="flex-1 flex justify-center pointer-events-none">
        <img 
          src={logoSrc} 
          alt="logo" 
          className="h-28 object-contain"
        />
      </div>

      {/* logo centered */}
      <div className="w-10" />
    </header>
  );
};
