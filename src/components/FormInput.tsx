import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, ...props }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontWeight: 600 }}>{label}</label>
      <input {...props} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }} />
      {error && <div style={{ color: 'crimson', fontSize: 12 }}>{error}</div>}
    </div>
  );
}


