import React, { useState } from 'react';
import { Beer } from 'lucide-react';

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
        return (
          <div className="min-h-screen flex items-center justify-center bg-surface px-4">
            <div className="w-full max-w-lg glass-panel rounded-[28px] border border-stone p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center shadow">
                  <Beer size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-ink">SmartBar Control</h2>
                  <p className="text-ink/60 text-sm">{mode === 'login' ? 'Sign in to continue' : 'Create a new account'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-sm text-ink/70">Username</span>
                  <input
                    className="mt-1 block w-full bg-white border border-stone rounded-2xl px-4 py-3 text-ink outline-none"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-ink/70">Password</span>
                  <input
                    type="password"
                    className="mt-1 block w-full bg-white border border-stone rounded-2xl px-4 py-3 text-ink outline-none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </label>

                {error && <div className="text-red-600 mb-2">{error}</div>}

                <button
                  type="submit"
                  className="w-full rounded-2xl py-3 font-semibold bg-ink text-white disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (mode === 'login' ? 'Signing in…' : 'Creating…') : (mode === 'login' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-ink/70">
                {mode === 'login' ? (
                  <>
                    Don't have an account? <button className="text-ink underline" onClick={() => setMode('signup')}>Create one</button>
                  </>
                ) : (
                  <>
                    Already have an account? <button className="text-ink underline" onClick={() => setMode('login')}>Sign in</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
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
