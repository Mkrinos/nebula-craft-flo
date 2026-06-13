import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Flame } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import { SciFiFrame } from "@/components/ui/sci-fi-frame";
import { SciFiButton } from "@/components/ui/sci-fi-button";
import { SciFiBadge } from "@/components/ui/sci-fi-badge";
import { BackButton } from "@/components/BackButton";
import { usePersona } from "./usePersona";
import { orderByInterestFit, type PersonaConfig } from "./personas.config";
import { badgesUnlockedFor } from "./badges";

const AffinityArc: React.FC<{ value: number; max?: number; color: string }> = ({
  value,
  max = 50,
  color,
}) => {
  const pct = Math.min(1, value / max);
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="4" fill="none" />
      <circle
        cx="24"
        cy="24"
        r={r}
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
};

const PersonaCard: React.FC<{
  persona: PersonaConfig;
  affinity: number;
  isActive: boolean;
  onChoose: () => void;
}> = ({ persona, affinity, isActive, onChoose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const badgeCount = badgesUnlockedFor(persona.id, affinity).length;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <SciFiFrame
      glowIntensity={isActive ? "medium" : "subtle"}
      className="p-4 flex flex-col gap-3"
    >
      <button
        type="button"
        onClick={togglePlay}
        className="relative aspect-square w-full overflow-hidden rounded-lg bg-black min-h-[44px]"
        aria-label={`Preview ${persona.name}`}
      >
        <video
          ref={videoRef}
          src={persona.videoUrl}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
        {!playing && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30"
            style={{ color: persona.accent }}
          >
            <span className="font-display uppercase tracking-widest text-xs">Tap to play</span>
          </div>
        )}
      </button>
      <div className="flex items-center gap-3">
        <AffinityArc value={affinity} color={persona.accent} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-foreground truncate">
              {persona.name}
            </h3>
            {isActive && <SciFiBadge variant="success" size="sm">ACTIVE</SciFiBadge>}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{persona.description}</p>
          <p className="text-[10px] text-muted-foreground/80 mt-1">
            Affinity {affinity} · {badgeCount}/3 badges
          </p>
        </div>
      </div>
      <SciFiButton
        type="button"
        variant={isActive ? "ghost" : "primary"}
        shape="angled"
        onClick={onChoose}
        className="min-h-[44px]"
      >
        {isActive ? "Keep this guide" : "Choose this guide"}
      </SciFiButton>
    </SciFiFrame>
  );
};

export default function PersonaSelectScreen() {
  const navigate = useNavigate();
  const {
    availablePersonas,
    interests,
    affinity,
    activeId,
    setActive,
    streak,
  } = usePersona();

  const ordered = useMemo(
    () => orderByInterestFit(availablePersonas, interests),
    [availablePersonas, interests],
  );

  const handleChoose = (id: string) => {
    setActive(id as any);
    navigate("/creative-journey");
  };

  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      <main className="relative z-10 pt-8 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-4">
            <BackButton />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gradient">
              Choose your guide
            </h1>
            {streak.count > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-sm text-amber-400">
                <Flame className="w-4 h-4" /> {streak.count}-day streak
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Tap a card to preview. Then choose a guide for this session.
          </p>

          {ordered.length === 0 ? (
            <SciFiFrame className="p-8 text-center">
              <p className="text-muted-foreground">
                No personas are available yet. Ask your guardian to enable some in the
                guardian settings.
              </p>
            </SciFiFrame>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ordered.map((p) => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  affinity={affinity[p.id] ?? 0}
                  isActive={activeId === p.id}
                  onChoose={() => handleChoose(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
