"use client";

import Image from "next/image";
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
        <Image 
          src={logoSrc} 
          alt="logo" 
          width={300}
          height={90}
        />
      </div>

      {/* logo centered */}
      <div className="w-10" />
    </header>
  );
};
