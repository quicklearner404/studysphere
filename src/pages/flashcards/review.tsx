import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';
import FlashcardViewer from '@/components/FlashcardViewer';
import { useAuth } from '@/hooks/useauth';

type Flashcard = {
  id: string;
  front: string;
  back: string;
  repetition_count?: number;
  interval_days?: number;
  ease?: number;
  next_review_at?: string;
};

export default function ReviewPage() {
  const { user, loading } = useAuth(true);
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchDue = async () => {
      setLoadingCards(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('No session token');

        const res = await fetch('/api/flashcards?due=true', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const body = await res.json();
        setCards(body.flashcards || []);
        setIndex(0);
      } catch (e: any) {
        console.error('Failed to fetch due flashcards', e);
        setError(e.message || 'Failed to fetch flashcards');
      } finally {
        setLoadingCards(false);
      }
    };

    fetchDue();
  }, [user, loading]);

  const handleReview = async (id: string, quality: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No session token');

      const res = await fetch(`/api/flashcards/${id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quality })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Review failed: ${res.status}`);
      }

      const body = await res.json();

      // replace current card with updated from server and advance
      const updated = body.flashcard;
      setCards(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.id === id);
        if (idx >= 0) copy[idx] = updated;
        return copy;
      });

      // move to next due card
      setIndex(i => Math.min(i + 1, Math.max(0, cards.length - 1)));
    } catch (e: any) {
      console.error('Review error', e);
      setError(e.message || 'Review failed');
    }
  };

  if (loading || loadingCards) return <div className="p-6">Loading...</div>;

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  if (!cards || cards.length === 0) {
    return <div className="p-6">No due flashcards. Great job!</div>;
  }

  const current = cards[index];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Review Due Flashcards</h1>
      <div className="mb-4 text-sm text-gray-500">Card {index + 1} of {cards.length}</div>
      <FlashcardViewer card={current} onReview={handleReview} />
      <div className="mt-6 flex justify-between">
        <button
          className="px-3 py-2 bg-gray-200 rounded"
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Prev
        </button>
        <button
          className="px-3 py-2 bg-gray-200 rounded"
          onClick={() => setIndex(i => Math.min(cards.length - 1, i + 1))}
          disabled={index >= cards.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
