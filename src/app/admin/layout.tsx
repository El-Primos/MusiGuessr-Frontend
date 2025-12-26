'use client';

import { useRouter } from 'next/navigation';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { t } = useLanguage();

  useAdminGuard(router);

  const navItems = [
    { name: t('admin.dashboard'), href: '/admin', icon: '📊' },
    { name: t('admin.artists'), href: '/admin/artist', icon: '🎤' },
    { name: t('admin.genres'), href: '/admin/genre', icon: '🎵' },
    { name: t('admin.musicUpload'), href: '/admin/musicUpload', icon: '⬆️' },
    { name: t('admin.playlists'), href: '/admin/playlist', icon: '📝' },
    { name: t('admin.tournament'), href: '/admin/tournament', icon: '🏆' },
    { name: t('admin.users'), href: '/admin/users', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-white flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 transition-all duration-300 fixed h-full z-10`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {isSidebarOpen && (
            <div>
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">{t('admin.dashboard')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">MusiGuessr</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                {isSidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button
            onClick={() => router.push('/')}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300`}
            title={!isSidebarOpen ? t('game.exit') : undefined}
          >
            <span className="text-xl">🚪</span>
            {isSidebarOpen && <span className="font-medium">{t('game.exit')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 ${
          isSidebarOpen ? 'ml-64' : 'ml-16'
        } transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  );
}
