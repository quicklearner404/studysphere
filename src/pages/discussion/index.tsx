import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useauth';
import MainLayout from '@/components/Layout/MainLayout';

// Discussion list + create

export default function DiscussionIndex() {
  const router = useRouter();
  const { user, loading } = useAuth(true);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) fetchDiscussions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function fetchDiscussions() {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch('/api/discussions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setDiscussions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const token = await getToken();
    if (!token) return;

    const res = await fetch('/api/discussions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, body })
    });

    if (res.ok) {
      setTitle('');
      setBody('');
      await fetchDiscussions();
    } else {
      console.error('Failed to create discussion', await res.text());
    }

    setSaving(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Discussions</h1>
        </div>

        <section className="mb-6">
          <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4">
            <input
              className="border p-2 w-full mb-2"
              placeholder="Question title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="border p-2 w-full mb-2"
              placeholder="Details (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
            <div className="flex items-center gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>
                {saving ? 'Posting...' : 'Post Question'}
              </button>
              {error && <div className="text-red-600">{error}</div>}
            </div>
          </form>
        </section>

        <section>
          {isLoading ? (
            <div className="text-center py-10">Loading discussions...</div>
          ) : discussions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No discussions yet. Be the first to ask!</div>
          ) : (
            <div className="grid gap-4">
              {discussions.map((d) => (
                <div
                  key={d.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/discussion/${d.id}`)}
                >
                  <h3 className="font-semibold text-lg mb-2">{d.title}</h3>
                  {d.body && <p className="text-gray-600 mb-2">{d.body}</p>}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>by {d.author?.name || 'Unknown'}</span>
                    <span>Answers: {d.discussion_answers?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
