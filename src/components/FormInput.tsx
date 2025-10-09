import React from 'react';
import { motion } from 'framer-motion';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, ...props }: Props) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <motion.label
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'block',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#000',
          fontSize: '0.95rem',
          transition: 'color 0.3s ease'
        }}
      >
        {label}
      </motion.label>

      <motion.input
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        whileFocus={{ scale: 1.01 }}
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
          fontFamily: 'inherit'
        }}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: '#ff4444',
            fontSize: '0.85rem',
            marginTop: '6px',
            fontWeight: 500
          }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}