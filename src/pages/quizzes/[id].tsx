import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/Layout/MainLayout';
import { supabase } from '@/lib/supabaseClient';

interface QuizQuestionOption { id: string; option_text: string }
interface QuizQuestion { id: string; question_text: string; order: number; options: QuizQuestionOption[] }

export default function QuizDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchQuiz = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      const token = session.access_token;
      const resp = await fetch(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) return;
      const data = await resp.json();
      setQuizTitle(data.quiz.title);
      setQuestions(data.questions || []);
      setLoading(false);
    };
    fetchQuiz();
  }, [id, router]);

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((s) => ({ ...s, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    const token = session.access_token;
    const payload = {
      answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({ question_id, selected_option_id }))
    };
    const resp = await fetch(`/api/quizzes/${id}/attempt`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!resp.ok) {
      const err = await resp.json();
      alert(err.error || 'Failed to submit');
      return;
    }
    const data = await resp.json();
    setResult(data);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">Loading quiz...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-3xl mx-auto bg-white border-2 border-black rounded-lg p-6">
          <h2 className="text-2xl font-bold text-black mb-4">{quizTitle}</h2>

          {result ? (
            <div>
              <h3 className="text-xl font-semibold">Your Score: {result.score}%</h3>
              <p className="text-sm text-gray-600">Correct: {result.correctCount} / {result.totalQuestions}</p>
              <div className="mt-4 space-y-4">
                {result.results.map((r: any) => {
                  const q = questions.find((qq) => qq.id === r.question_id);
                  const selectedText = q?.options.find((o) => o.id === r.selected_option_id)?.option_text || 'No answer';
                  const correctText = q?.options.find((o) => o.id === r.correct_option_id)?.option_text || 'Unknown';
                  return (
                    <div key={r.question_id} className={`p-3 border rounded ${r.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="font-medium text-black mb-2">{q?.question_text ?? 'Question'}</p>
                      <p className="text-sm"><span className="font-semibold">Your answer:</span> {selectedText}</p>
                      <p className="text-sm"><span className="font-semibold">Correct answer:</span> {correctText}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q) => (
                <div key={q.id} className="border rounded p-4">
                  <p className="font-medium text-black mb-3">{q.question_text}</p>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2">
                        <input type="radio" name={q.id} checked={answers[q.id] === opt.id} onChange={() => handleSelect(q.id, opt.id)} />
                        <span className="text-sm text-gray-700">{opt.option_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button onClick={handleSubmit} className="px-6 py-2 bg-black text-white rounded-lg">Submit</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
