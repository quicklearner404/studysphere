import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

type Row = { id: string; name: string; points: number; rank: number };

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/gamification/leaderboard');
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
    fetchLeaderboard();
  }, []);

  return (
    <div className="p-6">
      <Head>
        <title>Leaderboard • StudySphere</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <Link href="/profile" className="text-sm text-gray-600 hover:underline">Your profile</Link>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}

        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y table-auto">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-3 text-sm">{row.rank}</td>
                    <td className="px-4 py-3 text-sm">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{row.points}</td>
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
