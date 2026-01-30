import React, { useState } from 'react';

type Props = {
  onLogin: (token: string) => void;
};

const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Login failed');
      }
      const body = await res.json();
      if (body && body.token) {
        onLogin(body.token);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            <span className="text-sm">Username</span>
            <input
              className="mt-1 block w-full border rounded px-3 py-2"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm">Password</span>
            <input
              type="password"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="text-red-600 mb-2">{error}</div>}

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
