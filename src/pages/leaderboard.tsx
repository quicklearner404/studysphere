import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/hooks/useauth';
import { TrophyIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

type Row = { id: string; name: string; points: number; rank: number };

function RankBadge({ rank }: { rank: number }) {
  const classes =
    rank === 1
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700'
      : rank === 2
      ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/40 dark:text-gray-200 dark:border-gray-600'
      : rank === 3
      ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700'
      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-600';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${classes}`}>
      {rank <= 3 && <TrophyIcon className="w-4 h-4" />}
      #{rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const body = await res.json();
      setRows(body.leaderboard || []);
    } catch (e: any) {
      console.error('Leaderboard load error', e);
      setError(e.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.name || '').toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="p-6">
      <Head>
        <title>Leaderboard • StudySphere</title>
      </Head>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full sm:w-64 pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
              />
            </div>
            <button
              onClick={fetchLeaderboard}
              className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <Link href="/profile" className="text-sm text-gray-600 hover:underline whitespace-nowrap">Your profile</Link>
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700">Error: {error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300">
            No users match your search.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full table-fixed">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="w-24 px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Name</th>
                  <th className="w-40 px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-300">Points</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isMe = user?.id && row.id === user.id;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 even:bg-slate-50/60 dark:even:bg-slate-800/60 ${
                        isMe ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <RankBadge rank={row.rank} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold">
                            {(row.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-medium ${isMe ? 'text-indigo-600 dark:text-indigo-300' : ''}`}>{row.name || 'Anonymous'}</div>
                            {isMe && <div className="text-[11px] text-indigo-500 dark:text-indigo-300">You</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {row.points.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
