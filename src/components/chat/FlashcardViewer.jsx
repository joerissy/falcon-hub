import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

function parseFlashcards(content) {
  // Try to parse JSON array of {front, back} objects
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || content.match(/(\[[\s\S]*?\])/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed) && parsed[0]?.front) return parsed;
    }
  } catch {}

  // Try to parse numbered list like "1. **Term** — Definition" or "Front: ... Back: ..."
  const cards = [];

  // Pattern: Front: ... \n Back: ...
  const frontBackPattern = /Front:\s*(.+?)\s*\n+\s*Back:\s*(.+?)(?=\n+Front:|\n*$)/gis;
  let m;
  while ((m = frontBackPattern.exec(content)) !== null) {
    cards.push({ front: m[1].trim(), back: m[2].trim() });
  }
  if (cards.length > 0) return cards;

  // Pattern: **Term** — Definition or **Term**: Definition
  const boldPattern = /\*\*(.+?)\*\*\s*[—:-]+\s*(.+)/g;
  while ((m = boldPattern.exec(content)) !== null) {
    cards.push({ front: m[1].trim(), back: m[2].trim() });
  }
  if (cards.length > 0) return cards;

  // Pattern: numbered "1. Term — Definition"
  const numberedPattern = /^\d+\.\s+(.+?)\s+[—–-]+\s+(.+)$/gm;
  while ((m = numberedPattern.exec(content)) !== null) {
    cards.push({ front: m[1].trim(), back: m[2].trim() });
  }

  return cards;
}

export default function FlashcardViewer({ content }) {
  const cards = parseFlashcards(content);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return null;

  const card = cards[current];

  const goNext = () => { setCurrent(i => (i + 1) % cards.length); setFlipped(false); };
  const goPrev = () => { setCurrent(i => (i - 1 + cards.length) % cards.length); setFlipped(false); };

  return (
    <div className="my-3 select-none">
      {/* Card */}
      <div
        className="cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(v => !v)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '160px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-violet-400/60 bg-gradient-to-br from-violet-50 to-white flex flex-col items-center justify-center px-6 py-6 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">Term</p>
            <p className="text-base font-bold text-foreground leading-snug">{card.front}</p>
            <p className="text-xs text-muted-foreground mt-4">Tap to reveal</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-white flex flex-col items-center justify-center px-6 py-6 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">Definition</p>
            <p className="text-sm text-foreground leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-3 px-1">
        <button
          onClick={goPrev}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">{current + 1} / {cards.length}</span>
          <button
            onClick={() => setFlipped(false)}
            className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            title="Reset flip"
          >
            <RotateCcw className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        <button
          onClick={goNext}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1 mt-2">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setFlipped(false); }}
            className={cn(
              "rounded-full transition-all",
              i === current ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}