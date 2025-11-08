import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/Layout/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface QuizSummary {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
}

interface Subject { id: string; name: string; topics?: { id: string; name: string }[] }

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      const token = session.access_token;

      let url = '/api/quizzes';
      const params: string[] = [];
      if (selectedTopic) params.push(`topic_id=${selectedTopic}`);
      else if (selectedSubject) params.push(`subject_id=${selectedSubject}`);
      if (params.length) url += `?${params.join('&')}`;

      try {
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) {
          console.error('Failed to fetch quizzes', resp.statusText);
          setQuizzes([]);
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setQuizzes(data || []);
      } catch (err) {
        console.error('Error fetching quizzes', err);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubjects = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;
      try {
        const resp = await fetch('/api/subjects', { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) {
          console.error('Failed to fetch subjects', resp.statusText);
          setSubjects([]);
          return;
        }
        const sdata = await resp.json();
        setSubjects(sdata || []);
      } catch (err) {
        console.error('Error fetching subjects', err);
        setSubjects([]);
      }
    };

    fetchQuizzes();
    fetchSubjects();
  }, [router, selectedSubject, selectedTopic]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-black mb-4">Quizzes</h2>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 items-center mb-3">
                <label className="text-sm text-gray-700">Subject:</label>
                <select value={selectedSubject ?? ''} onChange={(e) => { setSelectedSubject(e.target.value || null); setSelectedTopic(null); }} className="border rounded px-2 py-1">
                  <option value="">All</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <label className="text-sm text-gray-700">Topic:</label>
                <select value={selectedTopic ?? ''} onChange={(e) => setSelectedTopic(e.target.value || null)} className="border rounded px-2 py-1">
                  <option value="">All</option>
                  {selectedSubject && subjects.find(s => s.id === selectedSubject)?.topics?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={() => { setSelectedSubject(null); setSelectedTopic(null); }} className="ml-2 text-sm text-gray-600">Clear</button>
              </div>

              {quizzes.length === 0 ? (
                <div className="bg-white border-2 border-black rounded-lg p-6">No quizzes available</div>
              ) : (
                quizzes.map((q) => (
                  <div key={q.id} className="bg-white border-2 border-black rounded-lg p-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg text-black"><Link href={`/quizzes/${q.id}`} className="hover:underline">{q.title}</Link></h3>
                      <p className="text-sm text-gray-600">{q.description}</p>
                    </div>
                    <Link href={`/quizzes/${q.id}`} className="px-4 py-2 bg-black text-white rounded-lg">Take</Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
