import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, ShieldCheck, Settings, X, Check } from 'lucide-react';
import { getGeminiKey, setGeminiKey } from '../context';

export default function Welcome() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(getGeminiKey() ?? '');
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveKey = () => {
    if (keyInput.trim()) {
      setGeminiKey(keyInput.trim());
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 1500);
    }
  };

  const canScan = !!getGeminiKey();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden page-enter">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-mint/8 rounded-full blur-[120px] animate-drift-1" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-teal-500/6 rounded-full blur-[100px] animate-drift-2" />
        <div className="absolute top-[40%] left-[50%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[80px] animate-drift-3" />
      </div>

      {/* Settings button */}
      <div className="w-full flex justify-end">
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 rounded-xl glass glass-hover flex items-center justify-center transition-colors"
        >
          <Settings className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center text-center space-y-8 animate-fade-in-up">
        {/* Logo with frosted glass card */}
        <div className="w-28 h-28 rounded-3xl glass flex items-center justify-center glow-mint-soft relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent" />
          <ScanLine className="w-14 h-14 text-mint" strokeWidth={1.5} />
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">
            Label<span className="text-mint">Lens</span>
          </h1>
          <p className="text-lg text-white/40 font-light tracking-wide">
            Know what you eat
          </p>
        </div>

        <div className="frosted-card rounded-2xl px-5 py-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-mint/70" />
          <span className="text-xs text-white/50 tracking-wider uppercase font-medium">Ingredient Intelligence</span>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {canScan ? (
          <button
            onClick={() => navigate('/scan')}
            className="w-full py-4 rounded-2xl bg-mint text-[#0a0a0f] font-semibold text-base tracking-wide animate-pulse-glow active:scale-[0.98] transition-transform"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="w-full py-4 rounded-2xl bg-mint/20 text-mint font-semibold text-base tracking-wide border border-mint/30 active:scale-[0.98] transition-transform"
          >
            Set API Key to Start
          </button>
        )}
        <p className="text-center text-xs text-white/20">
          No sign-up required. 100% free.
        </p>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[340px] frosted-card rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-lg glass glass-hover flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            <label className="block text-xs text-white/40 mb-2 tracking-wide uppercase">
              Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 placeholder-white/20 outline-none focus:border-mint/40 transition-colors"
            />
            <p className="text-[11px] text-white/25 mt-2">
              Key is stored locally in your browser. Get a free key from Google AI Studio.
            </p>

            <button
              onClick={handleSaveKey}
              className="w-full mt-4 py-3 rounded-xl bg-mint text-[#0a0a0f] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {keySaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Key'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
