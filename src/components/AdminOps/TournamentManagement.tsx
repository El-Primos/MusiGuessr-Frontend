'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/useApi';

type TournamentStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED';

interface Tournament {
  id: number;
  name: string;
  description?: string;
  playlistId: number;
  creatorId?: number;
  creatorUsername?: string;
  status?: TournamentStatus;
  createDate?: string;
  startDate?: string;
  endDate?: string;
  participantCount?: number;
}

interface TournamentManagementProps {
  apiBase: string;
}

export default function TournamentManagement({
  apiBase,
}: TournamentManagementProps) {
  const { apiFetch } = useApi(apiBase);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'UPCOMING' | 'ACTIVE' | 'FINISHED'
  >('ALL');
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments, searchTerm, statusFilter]);

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/tournaments');
      const text = await res.text();

      if (!res.ok) {
        let errorMsg = `Error ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errorMsg = parsed.error;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = JSON.parse(text);
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Failed to fetch tournaments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tournaments];

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.creatorUsername?.toLowerCase().includes(term)
      );
    }

    setFilteredTournaments(filtered);
  };

  const handleStartTournament = async (tournamentId: number) => {
    if (!confirm('Are you sure you want to start this tournament?')) return;

    const prevTournaments = [...tournaments];
    setTournaments(
      tournaments.map((t) =>
        t.id === tournamentId ? { ...t, status: 'ACTIVE' as TournamentStatus } : t
      )
    );

    try {
      const res = await apiFetch(`/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = `Error ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errorMsg = parsed.error;
        } catch {}
        throw new Error(errorMsg);
      }

      await fetchTournaments(); // Refresh to get updated data
    } catch (err: unknown) {
      console.error('Failed to start tournament:', err);
      setError(err instanceof Error ? err.message :  'Failed to start tournament');
      setTournaments(prevTournaments);
    }
  };

  const handleEndTournament = async (tournamentId: number) => {
    if (!confirm('Are you sure you want to end this tournament?')) return;

    const prevTournaments = [...tournaments];
    setTournaments(
      tournaments.map((t) =>
        t.id === tournamentId ? { ...t, status: 'FINISHED' as TournamentStatus } : t
      )
    );

    try {
      const res = await apiFetch(`/api/tournaments/${tournamentId}/end`, {
        method: 'POST',
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = `Error ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errorMsg = parsed.error;
        } catch {}
        throw new Error(errorMsg);
      }

      await fetchTournaments(); // Refresh to get updated data
    } catch (err: unknown) {
      console.error('Failed to end tournament:', err);
      setError(err instanceof Error ? err.message : 'Failed to end tournament');
      setTournaments(prevTournaments);
    }
  };

  const handleViewDetails = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowDetails(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (status?: TournamentStatus) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500/20 text-blue-400';
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400';
      case 'FINISHED':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Management</h2>
          <p className="text-slate-400 mt-1">
            View and manage all tournaments
          </p>
        </div>
        <button
          onClick={fetchTournaments}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search Tournaments
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description, or creator..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'UPCOMING' | 'ACTIVE' | 'FINISHED'
                )
              }
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="FINISHED">Finished</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Total Tournaments</p>
          <p className="text-2xl font-bold mt-1">{tournaments.length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Upcoming</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">
            {tournaments.filter((t) => t.status === 'UPCOMING').length}
          </p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Active</p>
          <p className="text-2xl font-bold mt-1 text-green-400">
            {tournaments.filter((t) => t.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Finished</p>
          <p className="text-2xl font-bold mt-1 text-gray-400">
            {tournaments.filter((t) => t.status === 'FINISHED').length}
          </p>
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-slate-400">Loading tournaments...</p>
            </div>
          </div>
        )}

        {!loading && filteredTournaments.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No tournaments found</p>
          </div>
        )}

        {!loading && filteredTournaments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredTournaments.map((tournament) => (
                  <tr
                    key={tournament.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {tournament.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {tournament.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {tournament.creatorUsername || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          tournament.status
                        )}`}
                      >
                        {tournament.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDate(tournament.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDate(tournament.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {tournament.participantCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleViewDetails(tournament)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Details
                      </button>
                      {tournament.status === 'UPCOMING' && (
                        <button
                          onClick={() => handleStartTournament(tournament.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Start
                        </button>
                      )}
                      {tournament.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleEndTournament(tournament.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                          End
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

      {/* Details Modal */}
      {showDetails && selectedTournament && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Tournament Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-400">Name</p>
                <p className="text-lg font-semibold">{selectedTournament.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Description</p>
                <p className="text-base">
                  {selectedTournament.description || 'No description'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Creator</p>
                  <p className="text-base">
                    {selectedTournament.creatorUsername || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                      selectedTournament.status
                    )}`}
                  >
                    {selectedTournament.status || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Start Date</p>
                  <p className="text-base">
                    {formatDate(selectedTournament.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">End Date</p>
                  <p className="text-base">
                    {formatDate(selectedTournament.endDate)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Playlist ID</p>
                  <p className="text-base">{selectedTournament.playlistId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Participants</p>
                  <p className="text-base">
                    {selectedTournament.participantCount || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
