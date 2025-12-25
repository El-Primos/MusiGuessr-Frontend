'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const SettingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors z-50"
      >
        <Image 
          src="/setting.png" 
          alt="Settings" 
          width={24} 
          height={24}
        />
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4 w-64 z-50 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Settings</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Theme</label>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              className="w-full p-2 border rounded dark:bg-slate-800 dark:text-white dark:border-slate-600 bg-white text-gray-900 border-gray-300"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
