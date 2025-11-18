import React, { useState } from 'react';
import { StudySession } from '@/types/studySession';

interface EditSessionFormProps {
  session: StudySession;
  onUpdate: (updatedData: Partial<StudySession>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EditSessionForm({ 
  session, 
  onUpdate, 
  onCancel, 
  isLoading = false 
}: EditSessionFormProps) {
  const [formData, setFormData] = useState({
    title: session.title,
    description: session.description || '',
    start_time: formatDateTimeForInput(session.start_time),
    end_time: session.end_time ? formatDateTimeForInput(session.end_time) : '',
    max_participants: session.max_participants || 10,
    status: session.status
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to format date for datetime-local input
  function formatDateTimeForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (formData.end_time && new Date(formData.end_time) <= new Date(formData.start_time)) {
      newErrors.end_time = 'End time must be after start time';
    }

    if (formData.max_participants < 1) {
      newErrors.max_participants = 'Must have at least 1 participant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onUpdate(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Edit Study Session</h2>
      
      <div className="space-y-6">
        {/* Title Field */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter session title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Describe what you'll be studying..."
          />
        </div>

        {/* Date & Time Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Time *</label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.start_time ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Time</label>
            <input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => handleChange('end_time', e.target.value)}
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.end_time ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>}
          </div>
        </div>

        {/* Participants & Status Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Max Participants</label>
            <input
              type="number"
              value={formData.max_participants}
              onChange={(e) => handleChange('max_participants', parseInt(e.target.value))}
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.max_participants ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
              max="50"
            />
            {errors.max_participants && <p className="text-red-500 text-sm mt-1">{errors.max_participants}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            disabled={isLoading}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update Session'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}