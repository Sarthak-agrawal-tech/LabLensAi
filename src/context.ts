import { createContext, useContext } from 'react';

const GEMINI_KEY_STORAGE = 'labellens_gemini_key';

export function getGeminiKey(): string | null {
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}

export function setGeminiKey(key: string): void {
  localStorage.setItem(GEMINI_KEY_STORAGE, key);
}

export type SafetyLevel = 'harmful' | 'moderate' | 'safe';

export interface Ingredient {
  name: string;
  category: string;
  safety: SafetyLevel;
  reason: string;
  detail?: string;
  quantity_warning?: string | null;
}

export interface ScanResult {
  ingredients: Ingredient[];
  noLabel: boolean;
}

export interface AppState {
  capturedImage: string | null;
  capturedMediaType: string | null;
  scanResult: ScanResult | null;
  setCapturedImage: (dataUrl: string | null, mediaType: string | null) => void;
  setScanResult: (result: ScanResult | null) => void;
}

export const AppContext = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function getSafetyColor(safety: SafetyLevel): string {
  switch (safety) {
    case 'harmful': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'moderate': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'safe': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  }
}

export function getSafetyDot(safety: SafetyLevel): string {
  switch (safety) {
    case 'harmful': return 'bg-red-500';
    case 'moderate': return 'bg-amber-500';
    case 'safe': return 'bg-emerald-500';
  }
}

export function getSafetyLabel(safety: SafetyLevel): string {
  switch (safety) {
    case 'harmful': return 'Harmful';
    case 'moderate': return 'Moderate';
    case 'safe': return 'Safe';
  }
}

export function getSafetyHex(safety: SafetyLevel): string {
  switch (safety) {
    case 'harmful': return '#EF4444';
    case 'moderate': return '#F59E0B';
    case 'safe': return '#00E5A0';
  }
}

export function getCategoryPill(category: string): { bg: string; text: string } {
  const lower = category.toLowerCase();
  if (lower.includes('preserv')) return { bg: 'bg-purple-500/15', text: 'text-purple-400' };
  if (lower.includes('addit')) return { bg: 'bg-sky-500/15', text: 'text-sky-400' };
  if (lower.includes('allerg')) return { bg: 'bg-rose-500/15', text: 'text-rose-400' };
  if (lower.includes('natural')) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400' };
  if (lower.includes('colorant') || lower.includes('colourant') || lower.includes('color')) return { bg: 'bg-pink-500/15', text: 'text-pink-400' };
  if (lower.includes('flavor') || lower.includes('flavour')) return { bg: 'bg-orange-500/15', text: 'text-orange-400' };
  if (lower.includes('sweet')) return { bg: 'bg-cyan-500/15', text: 'text-cyan-400' };
  return { bg: 'bg-white/10', text: 'text-white/50' };
}

export function groupByCategory(ingredients: Ingredient[]): { name: string; ingredients: Ingredient[] }[] {
  const map = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const cat = ing.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(ing);
  }
  return Array.from(map.entries()).map(([name, ingredients]) => ({ name, ingredients }));
}

export function calculateScore(ingredients: Ingredient[]): number {
  if (ingredients.length === 0) return 0;
  let raw = 0;
  for (const ing of ingredients) {
    switch (ing.safety) {
      case 'safe': raw += 10; break;
      case 'moderate': raw += 5; break;
      case 'harmful': raw += 0; break;
    }
  }
  const maxPossible = ingredients.length * 10;
  return Math.round((raw / maxPossible) * 100);
}

export function deriveInsights(ingredients: Ingredient[]): { icon: string; text: string; detail?: string }[] {
  const harmful = ingredients.filter(i => i.safety === 'harmful');
  const moderate = ingredients.filter(i => i.safety === 'moderate');
  const allergens = ingredients.filter(i => i.category.toLowerCase().includes('allerg'));
  const colorants = ingredients.filter(i => i.category.toLowerCase().includes('color'));
  const sweeteners = ingredients.filter(i => i.category.toLowerCase().includes('sweet'));
  const quantityWarnings = ingredients.filter(i => i.quantity_warning);

  const insights: { icon: string; text: string; detail?: string }[] = [];

  if (harmful.length > 0) {
    insights.push({
      icon: 'alert',
      text: `Contains ${harmful.length} potentially harmful ingredient${harmful.length > 1 ? 's' : ''}`,
      detail: harmful.map(h => `${h.name}: ${h.reason}`).join('. '),
    });
  }
  if (allergens.length > 0) {
    insights.push({
      icon: 'allergen',
      text: `Has ${allergens.length} allergen${allergens.length > 1 ? 's' : ''} — check sensitivity`,
      detail: allergens.map(a => a.name).join(', '),
    });
  }
  if (colorants.length > 0) {
    insights.push({
      icon: 'colorant',
      text: `Includes ${colorants.length} artificial colorant${colorants.length > 1 ? 's' : ''}`,
    });
  }
  if (sweeteners.length > 0) {
    insights.push({
      icon: 'sweetener',
      text: `Contains ${sweeteners.length} sweetener${sweeteners.length > 1 ? 's' : ''}`,
    });
  }
  if (quantityWarnings.length > 0) {
    insights.push({
      icon: 'quantity',
      text: `Abnormal quantity warning${quantityWarnings.length > 1 ? 's' : ''} detected`,
      detail: quantityWarnings.map(w => w.quantity_warning).filter(Boolean).join('. '),
    });
  }
  if (moderate.length > 0) {
    insights.push({
      icon: 'moderate',
      text: `${moderate.length} ingredient${moderate.length > 1 ? 's' : ''} of moderate concern`,
    });
  }

  const safe = ingredients.filter(i => i.safety === 'safe');
  if (safe.length > 0 && insights.length < 4) {
    insights.push({
      icon: 'safe',
      text: `${safe.length} ingredient${safe.length > 1 ? 's' : ''} considered safe`,
    });
  }

  return insights.slice(0, 5);
}
