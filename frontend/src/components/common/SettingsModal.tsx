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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="glass-panel rounded-[32px] max-w-2xl w-full border border-stone">
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center">
                <Settings size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-display text-ink">System Settings</h2>
                <p className="text-ink/60 mt-1">Configure backend connectivity</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-ink/5 transition-colors"
            >
              <X size={24} className="text-ink/60" />
            </button>
          </div>

          {backendError && (
            <div className="mb-6 p-4 bg-ember/10 border border-ember/30 rounded-2xl flex items-start gap-3">
              <div className="w-5 h-5 bg-ember rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-ink mb-1">Backend Offline</h3>
                <p className="text-ink/70 text-sm">Could not connect to {BACKEND_URL}. Ensure the server is running.</p>
              </div>
            </div>
          )}

          <div className={`space-y-6 ${backendError ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-semibold text-ink/70 mb-3">MQTT Broker URL</label>
              <input
                type="text"
                value={config.mqtt_broker}
                onChange={(e) => setConfig({ ...config, mqtt_broker: e.target.value })}
                className="w-full bg-white border border-stone rounded-2xl px-4 py-3 text-ink font-mono focus:ring-2 focus:ring-pine/40 focus:border-pine/70 outline-none transition-all"
                placeholder="mqtt://hostname:port"
              />
              <p className="text-xs text-ink/60 mt-2">
                Supports <code className="bg-white px-2 py-0.5 rounded">mqtt://</code>, <code className="bg-white px-2 py-0.5 rounded">tcp://</code>, and <code className="bg-white px-2 py-0.5 rounded">ws://</code> protocols.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-2xl font-semibold border border-stone hover:border-ink transition-all text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={savingConfig}
                className="flex-1 px-6 py-3 rounded-2xl font-semibold bg-ink text-white hover:bg-black transition-all disabled:opacity-50"
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
