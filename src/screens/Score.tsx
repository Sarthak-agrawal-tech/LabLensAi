import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, AlertTriangle, Eye, ShieldCheck, ChevronDown, Flame, Candy, Droplets } from 'lucide-react';
import { useAppState, calculateScore, deriveInsights } from '../context';

function getScoreColor(score: number): string {
  if (score >= 70) return '#00E5A0';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getScoreGrade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

function getSummary(score: number, harmfulCount: number): string {
  if (score >= 80) return 'Excellent — this product contains mostly safe ingredients.';
  if (score >= 60) return 'Moderate risk — consider switching to a cleaner alternative with fewer additives.';
  if (score >= 40) return 'Higher risk — this product contains several concerning ingredients. Consider avoiding.';
  return `High risk — ${harmfulCount} harmful ingredient${harmfulCount !== 1 ? 's' : ''} detected. Best to avoid this product.`;
}

const insightIconMap: Record<string, typeof AlertTriangle> = {
  alert: AlertTriangle,
  allergen: Flame,
  colorant: Eye,
  sweetener: Candy,
  quantity: Droplets,
  moderate: Eye,
  safe: ShieldCheck,
};

function InsightCard({ insight, index }: { insight: { icon: string; text: string; detail?: string }; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = insightIconMap[insight.icon] || ShieldCheck;

  return (
    <div
      className="glass rounded-xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${0.15 + index * 0.08}s` }}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/60 leading-relaxed">{insight.text}</p>
          {insight.detail && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-mint/70 hover:text-mint flex items-center gap-1 mt-1.5 transition-colors"
            >
              <span>{expanded ? 'Less' : 'Details'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
      {insight.detail && (
        <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-3 pt-0 ml-11">
            <p className="text-xs text-white/30 leading-relaxed">{insight.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Score() {
  const navigate = useNavigate();
  const { scanResult, setScanResult, setCapturedImage } = useAppState();

  const ingredients = scanResult?.ingredients ?? [];
  const score = calculateScore(ingredients);
  const insights = deriveInsights(ingredients);
  const harmfulCount = ingredients.filter(i => i.safety === 'harmful').length;
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const summary = getSummary(score, harmfulCount);

  const handleScanAgain = () => {
    setScanResult(null);
    setCapturedImage(null, null);
    navigate('/scan');
  };

  if (ingredients.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 page-enter">
        <p className="text-white/40 text-sm">No analysis data yet</p>
        <button
          onClick={() => navigate('/scan')}
          className="px-6 py-2.5 rounded-xl glass glass-hover text-mint text-sm font-semibold transition-colors"
        >
          Scan a Label
        </button>
      </div>
    );
  }

  // Color shift: interpolate from red -> yellow -> green
  const ringGradientId = 'score-ring-gradient';
  const startColor = '#EF4444';
  const midColor = '#F59E0B';
  const endColor = '#00E5A0';

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/analysis')}
          className="w-9 h-9 rounded-xl glass glass-hover flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <h2 className="text-lg font-semibold">Health Score</h2>
      </div>

      {/* Animated circular progress ring */}
      <div className="flex flex-col items-center mb-8 animate-fade-in-up">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={startColor} />
                <stop offset="50%" stopColor={midColor} />
                <stop offset="100%" stopColor={endColor} />
              </linearGradient>
            </defs>
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              className="animate-score-ring"
              style={{
                '--target-offset': offset,
                filter: `drop-shadow(0 0 12px ${color}60)`,
              } as React.CSSProperties}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold animate-score-number" style={{ color }}>{score}</span>
            <span className="text-xs text-white/25 mt-1">out of 100</span>
          </div>
        </div>

        <div
          className="mt-4 w-12 h-12 rounded-xl glass flex items-center justify-center"
          style={{ boxShadow: `0 0 24px ${color}20` }}
        >
          <span className="text-xl font-bold" style={{ color }}>{getScoreGrade(score)}</span>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-2.5 mb-6">
        <h3 className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-2">
          Key Insights
        </h3>
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} index={i} />
        ))}
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-5 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <p className="text-sm text-white/50 leading-relaxed">{summary}</p>
      </div>

      {/* Scan Again */}
      <div className="mt-auto">
        <button
          onClick={handleScanAgain}
          className="w-full py-3.5 rounded-2xl bg-mint text-[#0a0a0f] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <RotateCcw className="w-4 h-4" />
          Scan Again
        </button>
      </div>
    </div>
  );
}
