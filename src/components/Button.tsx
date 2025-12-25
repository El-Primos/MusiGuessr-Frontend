import React from "react";

export default function Button({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`${className} rounded-md cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center dark:text-background gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}