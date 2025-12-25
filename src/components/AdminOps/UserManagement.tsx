'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/useApi';
import { getUserId } from '@/lib/auth';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'BANNED';
  totalScore: number;
  createdAt?: string;
}

interface UserManagementProps {
  apiBase: string;
}

export default function UserManagement({ apiBase }: UserManagementProps) {
  const { apiFetch } = useApi(apiBase);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'BANNED'>('ALL');
  const [myId, setMyId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchUsers();
    setMyId(getUserId());
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/users');
      const text = await res.text();
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = JSON.parse(text);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.username?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
      );
    }
    setFilteredUsers(filtered);
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
  });

  /**
   * BAN / UNBAN işlemini yöneten fonksiyon
   * PATCH /api/users/{id}/role
   */
  const handleToggleBan = async (user: User) => {
    const isBanned = user.role === 'BANNED';
    const newRole = isBanned ? 'USER' : 'BANNED';
    const actionText = isBanned ? 'UNBAN' : 'BAN';

    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

    const prevUsers = [...users];
    // UI'da anında güncelle (Optimistic Update)
    setUsers(prevUsers.map(u => u.id === user.id ? { ...u, role: newRole } : u));

    try {
      const res = await apiFetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error(`${actionText} işlemi başarısız oldu.`);
    } catch (err: any) {
      setError(err.message);
      setUsers(prevUsers); // Hata varsa eski listeye geri dön
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button 
          onClick={fetchUsers} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <input 
          type="text" 
          placeholder="Search users..." 
          className="bg-slate-900 border border-slate-600 p-2 rounded-lg w-full outline-none focus:border-blue-500 transition-colors"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
        {!loading && sortedUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    ID {sortOrder === 'asc' ? '🔼' : '🔽'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-300">{user.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                         user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 
                         user.role === 'BANNED' ? 'bg-red-500/20 text-red-400' :
                         'bg-blue-500/20 text-blue-400'
                       }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.totalScore}</td>
                    <td className="px-6 py-4 text-sm">
                      {/* Kendini, sistem kullanıcısını ve ADMIN'leri değiştiremezsin */}
                      {user.id !== 0 && user.id !== myId && user.role !== "ADMIN" && (
                        <button
                          onClick={() => handleToggleBan(user)}
                          className={`px-3 py-1 rounded font-bold transition-all text-white ${
                            user.role === 'BANNED' 
                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                              : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {user.role === 'BANNED' ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {loading && <div className="p-20 text-center text-slate-400">Loading users...</div>}
      </div>
    </div>
  );
}