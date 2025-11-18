import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, ...props }: Props) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: 'block',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#000',
          fontSize: '0.95rem',
        }}
      >
        {label}
      </label>

      <input
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: error ? '2px solid #ff4444' : isFocused ? '2px solid #000' : '2px solid #e0e0e0',
          borderRadius: '10px',
          fontSize: '1rem',
          outline: 'none',
          transition: 'all 0.3s ease',
          background: '#ffffff',
          color: '#000',
          fontFamily: 'inherit',
          transform: isFocused ? 'scale(1.01)' : 'scale(1)',
        }}
      />

      {error && (
        <div
          style={{
            color: '#ff4444',
            fontSize: '0.85rem',
            marginTop: '6px',
            fontWeight: 500
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}