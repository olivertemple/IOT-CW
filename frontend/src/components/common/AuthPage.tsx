import React, { useState } from 'react';

type Props = {
  onLogin: (token: string) => void;
};

async function sha256Hex(message: string) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Hash password client-side (SHA-256) before sending
      const clientHash = await sha256Hex(password);

      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, clientHash }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Request failed');
      if (body && body.token) {
        onLogin(body.token);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err: any) {
      setError(err.message || 'Auth error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
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
            {loading ? (mode === 'login' ? 'Signing in…' : 'Creating…') : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <>
              Don't have an account? <button className="text-primary underline" onClick={() => setMode('signup')}>Create one</button>
            </>
          ) : (
            <>
              Already have an account? <button className="text-primary underline" onClick={() => setMode('login')}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
