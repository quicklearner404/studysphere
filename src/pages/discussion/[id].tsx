import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useauth';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';

export default function DiscussionDetail() {
  const { user, loading } = useAuth(true);
  const router = useRouter();
  const { id } = router.query;
  const [discussion, setDiscussion] = useState<any | null>(null);
  const [answerBody, setAnswerBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  useEffect(() => {
    if (!loading && id) fetchDiscussion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, id]);

  async function fetchDiscussion() {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      // fetch discussion
      const res = await fetch(`/api/discussions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to fetch discussion: ${res.status}`);
      const data = await res.json();
      setDiscussion(data);

      // fetch answers separately
      const a = await fetch(`/api/discussion-answers?discussion_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (a.ok) {
        const answers = await a.json();
        setDiscussion((d: any) => ({ ...(d || {}), discussion_answers: answers }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!answerBody.trim()) return;
    setPosting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`/api/discussion-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ discussion_id: id, body: answerBody })
      });

      if (res.ok) {
        setAnswerBody('');
        // refresh answers
        const a = await fetch(`/api/discussion-answers?discussion_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (a.ok) {
          const answers = await a.json();
          setDiscussion((d: any) => ({ ...(d || {}), discussion_answers: answers }));
        }
      } else {
        console.error('Failed to post answer', await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
  <Link href="/discussion" className="text-sm text-blue-600">&larr; Back to discussions</Link>

        {isLoading ? (
          <div className="text-center py-10">Loading discussion...</div>
        ) : error ? (
          <div className="text-red-600 py-10">{error}</div>
        ) : !discussion ? (
          <div className="py-10">No discussion found.</div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mt-2">{discussion.title}</h1>
            <div className="text-sm text-gray-600">by {discussion.author?.name || 'Unknown'}</div>
            <div className="mt-4">{discussion.body}</div>

            <hr className="my-4" />

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Answers</h2>
              {discussion.author_id === user?.id && (
                <button
                  className="text-red-600 text-sm"
                  onClick={async () => {
                    if (!confirm('Delete this question? This will remove all answers.')) return;
                    try {
                      const token = await getToken();
                      const resp = await fetch(`/api/discussions/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (resp.status === 204) {
                        // go back to list
                        router.push('/discussion');
                      } else {
                        console.error('Failed to delete question', await resp.text());
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Delete question
                </button>
              )}
            </div>
            <ul>
              {discussion.discussion_answers?.map((a: any) => (
                <li key={a.id} className="border-b py-3 flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-600">by {a.author?.name || 'Unknown'}</div>
                    <div className="mt-1">{a.body}</div>
                  </div>
                  {a.author_id === user?.id && (
                    <div>
                      <button
                        className="text-red-600 text-sm"
                        onClick={async () => {
                          if (!confirm('Delete this answer?')) return;
                          try {
                            const token = await getToken();
                            const resp = await fetch(`/api/discussion-answers?id=${a.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            if (resp.status === 204) {
                              // refresh answers
                              const aRes = await fetch(`/api/discussion-answers?discussion_id=${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (aRes.ok) {
                                const answers = await aRes.json();
                                setDiscussion((d: any) => ({ ...(d || {}), discussion_answers: answers }));
                              }
                            } else {
                              console.error('Failed to delete answer', await resp.text());
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <form onSubmit={handleAnswer} className="mt-6 bg-white border rounded-lg p-4">
              <textarea
                className="border p-2 w-full mb-2"
                placeholder="Write your answer"
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                rows={4}
              />
              <div className="flex items-center gap-2">
                <button className="bg-green-600 text-white px-4 py-2 rounded" disabled={posting}>
                  {posting ? 'Posting...' : 'Post Answer'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </MainLayout>
  );
}
