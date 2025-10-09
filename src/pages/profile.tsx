import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import FormInput from '@/components/FormInput';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setProfile(d.profile);
        setName(d.profile.name);
      });
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setSaving(false);
  }

  return (
    <ProtectedRoute>
      <main style={{ maxWidth: 640, margin: '40px auto' }}>
        <h1>Profile</h1>
        {profile && (
          <div>
            <div>Email: {profile.email}</div>
            <div>Points: {profile.points}</div>
            <FormInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}


