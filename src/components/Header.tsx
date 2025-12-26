"use client";

import Image from "next/image";
import React from "react";
import { ExitButton } from "./Game/ExitButton";

interface HeaderProps {
  logoSrc: string;     // PNG path
  onExit?: () => void; // exit callback
  className?: string;  // for extra positioning if needed
  exitVisible?: boolean; // whether to show exit button
  exitButtonStyle?: 'icon' | 'button'; // 'icon' for small icon button, 'button' for styled button
  rightContent?: React.ReactNode; // optional content on the right side
}

export const Header = ({ logoSrc, exitVisible = false, onExit, className = "", exitButtonStyle = 'button', rightContent }: HeaderProps) => {
  return (
    <header
      className={`
        w-full h-20 md:h-32 
        flex items-center justify-between
        bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-blue-900/40
        ${className}
      `}
    >
      {/* Left side - Exit button or spacer */}
      <div className="w-20 md:w-32 flex items-center pl-2 md:pl-4">
        {exitVisible && (
          exitButtonStyle === 'icon' ? (
            <ExitButton onClick={onExit} />
          ) : (
            <button
              onClick={onExit}
              className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
              title="Go Home"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="hidden sm:inline">Home</span>
            </button>
          )
        )}
      </div>

      {/* Logo - Centered */}
      <div className="flex-1 flex justify-center pointer-events-none">
        <div className="relative w-32 md:w-48 h-16 md:h-20 p-2 md:p-4 bg-green-300 rounded-lg">
          <Image 
            src={logoSrc}
            className="p-1" 
            alt="logo"
            fill
            objectFit="contain"
          />
        </div>
      </div>

      {/* Right content (profile button, etc.) */}
      <div className="w-20 md:w-32 flex items-center justify-end pr-2 md:pr-4">
        {rightContent}
      </div>
    </header>
  );
};
