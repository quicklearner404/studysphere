import React, { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // very light client check: rely on API to enforce; here we ping profile
    fetch('/api/profile').then((r) => setAllowed(r.status === 200));
  }, []);

  if (!allowed) return <div>Please log in to continue.</div>;
  return <>{children}</>;
}


