"use client";

import Image from "next/image";
import { ExitButton } from "./Game/ExitButton";

interface HeaderProps {
  logoSrc: string;     // PNG path
  onExit?: () => void; // exit callback
  className?: string;  // for extra positioning if needed
  exitVisible?: boolean; // whether to show exit button
}

export const Header = ({ logoSrc, exitVisible = false, onExit, className = "" }: HeaderProps) => {
  return (
    <header
      className={`
        w-full h-32 
        flex items-center justify-between
        bg-slate-950/80 border-b border-blue-900/40
        ${className}
      `}
    >
      {exitVisible && <ExitButton onClick={onExit} />}

      {/* Logo */}
      <div className="flex-1 flex w-72 h-24 justify-center pointer-events-none">
        <div className="relative w-48 h-20 p-4 bg-green-300 rounded-lg">
          <Image 
            src={logoSrc}
            className="p-1" 
            alt="logo"
            fill
            objectFit="contain"
          />
        </div>
      </div>

      {/* logo centered */}
      {exitVisible && <div className="w-10" />}
    </header>
  );
};
