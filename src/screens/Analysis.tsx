import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { useAppState, getSafetyColor, getSafetyDot, getSafetyLabel, getSafetyHex, getCategoryPill, getGeminiKey } from '../context';
import type { Ingredient } from '../context';

function IngredientCard({ ingredient, index }: { ingredient: Ingredient; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const pill = getCategoryPill(ingredient.category);

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {ingredient.quantity_warning && (
        <div className="flex items-center gap-2 px-3 py-2 mb-1.5 rounded-t-xl bg-amber-500/10 border border-amber-500/20 animate-pulse-amber">
          <span className="text-amber-400 text-sm shrink-0">&#9888;</span>
          <span className="text-xs text-amber-300/80 leading-snug">{ingredient.quantity_warning}</span>
        </div>
      )}
      <div className={`glass rounded-xl p-4 ${ingredient.quantity_warning ? 'rounded-t-none' : ''} transition-all duration-300`}>
        <div className="flex items-start gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${getSafetyDot(ingredient.safety)}`}
            style={{ boxShadow: `0 0 8px ${getSafetyHex(ingredient.safety)}40` }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-white/90">{ingredient.name}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pill.bg} ${pill.text}`}>
                {ingredient.category}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSafetyColor(ingredient.safety)}`}>
                {getSafetyLabel(ingredient.safety)}
              </span>
            </div>
            <p className="text-xs text-white/35 mt-1.5 leading-relaxed">{ingredient.reason}</p>
          </div>
        </div>

        {ingredient.detail && (
          <div className="mt-3 ml-[1.25rem]">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-mint/70 hover:text-mint flex items-center gap-1 transition-colors"
            >
              <span>{expanded ? 'Know Less' : 'Know More'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <p className="text-xs text-white/30 leading-relaxed">{ingredient.detail}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Analysis() {
  const navigate = useNavigate();
  const { capturedImage, capturedMediaType, scanResult, setScanResult } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scanResult || !capturedImage || !capturedMediaType) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const analyze = async () => {
      try {
        const apiKey = getGeminiKey();
        if (!apiKey) {
          throw new Error('Gemini API key not set. Go back and set it in Settings.');
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: 'Analyze this food label image. Extract ALL ingredients including complex chemical names, E-codes (E102, E621 etc), compound ingredients, and flag abnormal quantities of sugar/salt/fat if visible in nutrition info. Return ONLY a JSON array:\n[{\n  "name": "",\n  "category": "Preservative|Additive|Allergen|Natural|Artificial Colorant|Flavor Enhancer|Sweetener|Other",\n  "safety": "safe|moderate|harmful",\n  "reason": "one sentence",\n  "detail": "3-4 sentences explaining what it is, why it\'s used, health effects, safe daily limits if known",\n  "quantity_warning": "" // e.g. "High sugar content detected: 28g per serving (56% daily intake)" or null\n}]\nIf no ingredient label is visible, return: [{ "error": "No ingredient label found" }]' },
                  { inline_data: { mime_type: capturedMediaType, data: capturedImage } },
                ],
              }],
            }),
          }
        );

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`API error (${res.status}): ${errBody.slice(0, 120)}`);
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        if (cancelled) return;

        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let ingredients: Ingredient[] = [];
        let noLabel = false;

        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            if (parsed.length === 1 && parsed[0].error) {
              noLabel = true;
            } else {
              ingredients = parsed.filter((i: any) => !i.error);
            }
          } else if (parsed.error) {
            noLabel = true;
          }
        } catch {
          const match = cleaned.match(/\[[\s\S]*\]/);
          if (match) {
            try {
              ingredients = JSON.parse(match[0]);
            } catch {
              noLabel = true;
            }
          } else {
            noLabel = true;
          }
        }

        setScanResult({ ingredients, noLabel });
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    analyze();
    return () => { cancelled = true; };
  }, [capturedImage, capturedMediaType, scanResult, setScanResult]);

  if (!capturedImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 page-enter">
        <AlertCircle className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">No image captured</p>
        <button
          onClick={() => navigate('/scan')}
          className="px-6 py-2.5 rounded-xl glass glass-hover text-mint text-sm font-semibold transition-colors"
        >
          Go to Scan
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 space-y-6 page-enter">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-mint animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-mint animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white/70 font-medium">Analyzing ingredients...</p>
          <p className="text-xs text-white/30">AI is reading the label</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 page-enter">
        <div className="glass rounded-2xl p-6 text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-white/70 font-medium mb-2">Analysis Failed</p>
          <p className="text-xs text-white/40 mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setScanResult(null); navigate('/scan'); }}
            className="px-6 py-2.5 rounded-xl bg-mint/15 text-mint text-sm font-semibold hover:bg-mint/25 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (scanResult?.noLabel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 page-enter">
        <div className="glass rounded-2xl p-6 text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-white/70 font-medium mb-2">No ingredient label found</p>
          <p className="text-xs text-white/40 mb-4">Make sure the label is clearly visible and try again.</p>
          <button
            onClick={() => { setScanResult(null); navigate('/scan'); }}
            className="px-6 py-2.5 rounded-xl bg-mint/15 text-mint text-sm font-semibold hover:bg-mint/25 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Scan Again
          </button>
        </div>
      </div>
    );
  }

  const ingredients = scanResult?.ingredients ?? [];
  const harmful = ingredients.filter(i => i.safety === 'harmful').length;
  const allergens = ingredients.filter(i => i.category.toLowerCase().includes('allerg')).length;
  const safe = ingredients.filter(i => i.safety === 'safe').length;

  return (
    <div className="min-h-screen flex flex-col page-enter">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur-md px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/scan')}
            className="w-9 h-9 rounded-xl glass glass-hover flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Analysis</h2>
            <p className="text-xs text-white/35">{ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} detected</p>
          </div>
          <button
            onClick={() => navigate('/score')}
            className="px-4 py-2 rounded-xl bg-mint/15 text-mint text-xs font-semibold hover:bg-mint/25 transition-colors"
          >
            View Score
          </button>
        </div>
        {/* Summary chips */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {harmful > 0 && (
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
              {harmful} Harmful
            </span>
          )}
          {allergens > 0 && (
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
              {allergens} Allergen{allergens !== 1 ? 's' : ''}
            </span>
          )}
          {safe > 0 && (
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {safe} Safe
            </span>
          )}
        </div>
      </div>

      {/* Ingredients list */}
      <div className="flex-1 px-6 py-5 space-y-2.5 overflow-y-auto pb-24">
        {ingredients.map((ingredient, i) => (
          <IngredientCard key={ingredient.name + i} ingredient={ingredient} index={i} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-6 pb-6 pt-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent pointer-events-none">
        <button
          onClick={() => navigate('/score')}
          className="w-full py-3.5 rounded-2xl glass glass-hover flex items-center justify-center gap-2 text-mint font-semibold text-sm transition-colors pointer-events-auto"
        >
          View Health Score
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
