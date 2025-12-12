"use client";

import { useEffect, useState } from "react";

interface CircularCountdownProps {
  duration: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export const CircularCountdown = ({
  duration,
  onComplete,
  autoStart = true,
}: CircularCountdownProps) => {
  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  // Reset on duration change
  useEffect(() => {
    setRemaining(duration);
    setIsRunning(autoStart);
  }, [duration, autoStart]);

  useEffect(() => {
    if (!isRunning) return;
    if (remaining <= 0) {
      setIsRunning(false);
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remaining, onComplete]);

  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  const progress = duration > 0 ? remaining / duration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  // Color transition
  const getStrokeColor = (p: number) => {
    const startHue = 50; // yellow
    const endHue = 0; // red
    const clamped = Math.max(0, Math.min(1, p));
    const hue = endHue + (startHue - endHue) * clamped;
    return `hsl(${hue}, 100%, 50%)`;
  };

  const strokeColor = getStrokeColor(progress);

  return (
    <div className="flex justify-center items-center">
      <div className="relative w-[160px] h-[160px] flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#eee"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />

          {/* Animated circle */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1s linear, stroke 0.5s linear",
            }}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute text-center">
          <div className="text-2xl font-semibold">
            {remaining > 0 ? remaining : 0}
          </div>
          <div className="text-xs opacity-70">saniye</div>
        </div>
      </div>
    </div>
  );
};
