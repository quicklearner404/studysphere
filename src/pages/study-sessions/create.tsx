import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import MainLayout from '@/components/Layout/MainLayout';
import FormInput from '@/components/FormInput';

export default function CreateStudySessionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    max_participants: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create study session');
      }

      router.push('/study-sessions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Study Session</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>

          <FormInput
            label="Start Time"
            name="start_time"
            type="datetime-local"
            value={formData.start_time}
            onChange={handleChange}
            required
          />

          <FormInput
            label="End Time"
            name="end_time"
            type="datetime-local"
            value={formData.end_time}
            onChange={handleChange}
          />

          <FormInput
            label="Maximum Participants"
            name="max_participants"
            type="number"
            value={formData.max_participants}
            onChange={handleChange}
            min="2"
          />

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Session'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border px-4 py-2 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}