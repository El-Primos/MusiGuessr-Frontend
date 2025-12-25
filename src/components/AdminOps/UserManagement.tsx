'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/useApi';
import { getUserId } from '@/lib/auth';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
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
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [myId, setMyId] = useState<number | null>(null);


  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchUsers();
    const id = getUserId();
    setMyId(id);
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

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const prevUsers = [...users];
    setUsers(users.filter((u) => u.id !== userId));
    try {
      const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (err: any) {
      setError(err.message);
      setUsers(prevUsers);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <input 
          type="text" 
          placeholder="Search..." 
          className="bg-slate-900 border border-slate-600 p-2 rounded w-full"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
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
                {/* --- MİNİMAL EKLEME 4: sortedUsers Kullanımı --- */}
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-300">{user.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                       <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.totalScore}</td>
                    <td className="px-6 py-4 text-sm">
                      {user.id !== 0 && user.id !== myId && user.role !== "ADMIN" && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}