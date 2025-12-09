"use client";

interface ExitButtonProps {
  onClick?: () => void;
  className?: string; // allow custom positioning (absolute, fixed, etc.)
}

export const ExitButton = ({ onClick, className = "" }: ExitButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-10 h-10 
        flex items-center justify-center 
        rounded-xl 
        bg-slate-900/80
        border border-blue-900/60
        text-blue-200
        hover:bg-blue-900/40 hover:border-blue-500
        active:scale-95
        transition-all duration-150
        ${className}
      `}
    >
      {/* Arrowed Door Icon */}
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.8"
      >
        {/* Door */}
        <rect x="12" y="3" width="7" height="18" rx="1" ry="1" />
        {/* Arrow horizontal line */}
        <path d="M12 12H5" strokeLinecap="round" />
        {/* Arrow head */}
        <path
          d="M7.5 9.5L5 12l2.5 2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
