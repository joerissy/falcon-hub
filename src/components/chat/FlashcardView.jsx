import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

function parseFlashcards(content) {
  const cards = [];

  // Try to match patterns like:
  // **Front:** ... **Back:** ...
  // Front: ... Back: ...
  // Q: ... A: ...
  // Numbered: 1. Term - Definition
  const blockPattern = /(?:\*\*)?(?:Front|Term|Q)(?:\*\*)?[:\s]+(.+?)(?:\n|\r\n?)\s*(?:\*\*)?(?:Back|Definition|A)(?:\*\*)?[:\s]+(.+?)(?=\n\s*(?:\*\*)?(?:Front|Term|Q)(?:\*\*)?[:\s]|$)/gis;
  let match;
  while ((match = blockPattern.exec(content)) !== null) {
    const front = match[1].trim().replace(/\*\*/g, '');
    const back = match[2].trim().replace(/\*\*/g, '');
    if (front && back) cards.push({ front, back });
  }

  // Fallback: numbered list "1. Term — Definition"
  if (cards.length === 0) {
    const lines = content.split('\n');
    for (const line of lines) {
      const m = line.match(/^\d+[\.\)]\s+(.+?)\s*[—\-–:]\s*(.+)$/);
      if (m) cards.push({ front: m[1].trim().replace(/\*\*/g, ''), back: m[2].trim().replace(/\*\*/g, '') });
    }
  }

  return cards;
}

function FlipCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1000px', height: '260px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-rose-300 bg-card flex flex-col items-center justify-center px-6 py-5 text-center shadow-sm"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Term</p>
          <p className="text-lg font-bold text-foreground leading-snug">{card.front}</p>
          <p className="text-xs text-muted-foreground mt-4 opacity-60">Tap to reveal</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-primary/40 bg-primary/5 flex flex-col items-center justify-center px-6 py-5 text-center shadow-sm"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs text-primary mb-3 font-medium uppercase tracking-wider">Definition</p>
          <p className="text-base font-semibold text-foreground leading-snug">{card.back}</p>
          <p className="text-xs text-muted-foreground mt-4 opacity-60">Tap to flip back</p>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardView({ content }) {
  const [cards, setCards] = useState(() => parseFlashcards(content));
  const [current, setCurrent] = useState(0);
  const [key, setKey] = useState(0); // force re-mount to reset flip on navigation

  if (cards.length === 0) return null;

  const goTo = (i) => {
    setCurrent(i);
    setKey(k => k + 1);
  };

  const shuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    goTo(0);
  };

  const card = cards[current];

  return (
    <div className="w-full space-y-3 py-1">
      {/* Card */}
      <FlipCard key={`${key}-${current}`} card={card} index={current} total={cards.length} />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo((current - 1 + cards.length) % cards.length)}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>

        <span className="flex-1 text-center text-sm font-semibold text-muted-foreground">
          {current + 1} / {cards.length}
        </span>

        <button
          onClick={() => goTo((current + 1) % cards.length)}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-1">
        {/* Progress dots */}
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {cards.slice(0, 10).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current ? "w-4 bg-rose-400" : "w-1.5 bg-border"
              )}
            />
          ))}
          {cards.length > 10 && <span className="text-xs text-muted-foreground">+{cards.length - 10}</span>}
        </div>
        <button
          onClick={shuffle}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Shuffle
        </button>
      </div>
    </div>
  );
}