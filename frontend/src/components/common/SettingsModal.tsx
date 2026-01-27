import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { BACKEND_URL } from '../../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({ mqtt_broker: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBackendError(false);
      fetch(`${BACKEND_URL}/api/config`)
        .then(res => {
          if (!res.ok) throw new Error('Backend unavailable');
          return res.json();
        })
        .then(data => setConfig(data))
        .catch(err => {
          console.error('Failed to load config:', err);
          setBackendError(true);
        });
    }
  }, [isOpen]);

  const handleSave = () => {
    setSavingConfig(true);
    fetch(`${BACKEND_URL}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
      .then(res => {
        if (!res.ok) throw new Error('Save failed');
        return res.json();
      })
      .then(() => {
        setSavingConfig(false);
        onSave('Configuration Saved!');
        onClose();
      })
      .catch(() => {
        setSavingConfig(false);
        onSave('Error saving configuration.');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="glass-panel rounded-2xl max-w-2xl w-full border border-white/10">
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-amber to-accent-gold text-dark-950 flex items-center justify-center">
                <Settings size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-display text-white font-bold">System Settings</h2>
                <p className="text-white/60 mt-1">Configure backend connectivity</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={24} className="text-white/60" />
            </button>
          </div>

          {backendError && (
            <div className="mb-6 p-4 bg-accent-red/20 border border-accent-red/40 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 bg-accent-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Backend Offline</h3>
                <p className="text-white/70 text-sm">Could not connect to {BACKEND_URL}. Ensure the server is running.</p>
              </div>
            </div>
          )}

          <div className={`space-y-6 ${backendError ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-bold text-white/70 mb-3 uppercase tracking-wider">MQTT Broker URL</label>
              <input
                type="text"
                value={config.mqtt_broker}
                onChange={(e) => setConfig({ ...config, mqtt_broker: e.target.value })}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white font-mono focus:ring-2 focus:ring-accent-green/40 focus:border-accent-green/70 outline-none transition-all"
                placeholder="mqtt://hostname:port"
              />
              <p className="text-xs text-white/60 mt-2">
                Supports <code className="bg-white/10 px-2 py-0.5 rounded">mqtt://</code>, <code className="bg-white/10 px-2 py-0.5 rounded">tcp://</code>, and <code className="bg-white/10 px-2 py-0.5 rounded">ws://</code> protocols.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl font-bold border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={savingConfig}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-accent-amber to-accent-gold text-dark-950 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
