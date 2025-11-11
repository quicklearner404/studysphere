import React, { useState } from 'react';

type Flashcard = {
  id: string;
  front: string;
  back: string;
  repetition_count?: number;
  interval_days?: number;
  ease?: number;
  next_review_at?: string;
};

type Props = {
  card: Flashcard;
  onReview: (id: string, quality: number) => Promise<void>;
};

export default function FlashcardViewer({ card, onReview }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleReview = async (quality: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await onReview(card.id, quality);
    } finally {
      setBusy(false);
      setFlipped(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-4">
        <div
          className="cursor-pointer select-none"
          onClick={() => setFlipped(s => !s)}
          role="button"
          aria-pressed={flipped}
        >
          <div className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed">
            {flipped ? card.back : card.front}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <div>Repetitions: {card.repetition_count ?? 0}</div>
          <div>Interval (days): {card.interval_days ?? 1}</div>
          <div>Ease: {card.ease ?? 2.5}</div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => handleReview(0)}
          disabled={busy}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Again
        </button>
        <button
          onClick={() => handleReview(2)}
          disabled={busy}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          Hard
        </button>
        <button
          onClick={() => handleReview(4)}
          disabled={busy}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Good
        </button>
        <button
          onClick={() => handleReview(5)}
          disabled={busy}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Easy
        </button>
      </div>
    </div>
  );
}
