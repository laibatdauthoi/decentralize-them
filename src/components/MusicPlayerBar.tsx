"use client";

import { useMemo, useRef, useState } from "react";
import { useMusic } from "@/components/MusicContext";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music as MusicIcon,
  Volume2,
  Shuffle,
  Repeat,
  Repeat1,
  Wallet,
} from "lucide-react";

const formatAddress1 = (Addr1: string) => {
  if (!Addr1) return "0XUNKNOWN";
  const Clean1 = Addr1.replace("@", "");
  return `${Clean1.slice(0, 6)}...${Clean1.slice(-4)}`.toUpperCase();
};

const formatTitle1 = (Name1: string) => {
  return Name1
    .split("/")
    .pop()!
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

export function MusicPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isTrackLoading,
    togglePlay,
    volume,
    set_volume,
    currentTime,
    duration,
    seek1,
    isShuffle,
    set_is_shuffle,
    repeatMode,
    set_repeat_mode,
    nextTrack1,
    previousTrack1,
  } = useMusic();

  const seekWrapRef = useRef<HTMLDivElement>(null);
  const [hoverTime, set_hover_time] = useState<number | null>(null);
  const [hoverX, set_hover_x] = useState(0);

  const bubbleField = useMemo(() => {
    let seed1 = Date.now();
    const rand1 = () => {
      seed1 |= 0; 
      seed1 = seed1 + 0x6D2B79F5 | 0;
      let t1 = Math.imul(seed1 ^ seed1 >>> 15, 1 | seed1);
      t1 = t1 + Math.imul(t1 ^ t1 >>> 7, 61 | t1) ^ t1;
      return ((t1 ^ t1 >>> 14) >>> 0) / 4294967296;
    };

    const cols = 7;
    const rows = 4;
    const total = 28;

    return Array.from({ length: total }).map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const baseX = 10 + (col * (80 / (cols - 1)));
      const baseY = 15 + (row * (70 / (rows - 1)));

      return {
        id: i,
        size: 14 + rand1() * 20,
        left: baseX + (rand1() - 0.5) * 8,
        top: baseY + (rand1() - 0.5) * 8,
        duration: 10 + rand1() * 15, 
        delay: rand1() * -20,
        opacity: 0.2 + rand1() * 0.2,
        x1: (rand1() - 0.5) * 40,
        y1: (rand1() - 0.5) * 30,
        x2: (rand1() - 0.5) * 40,
        y2: (rand1() - 0.5) * 30,
        x3: (rand1() - 0.5) * 40,
        y3: (rand1() - 0.5) * 30,
      };
    });
  }, []);

  if (!currentTrack) return null;

  const handleShuffleClick1 = () => {
    const next = !isShuffle;
    set_is_shuffle(next);
    if (next) set_repeat_mode("off");
  };

  const handleRepeatClick1 = () => {
    if (isShuffle) set_is_shuffle(false);
    if (repeatMode === "off") set_repeat_mode("all");
    else if (repeatMode === "all") set_repeat_mode("one");
    else set_repeat_mode("off");
  };

  const formatSeconds1 = (Secs1: number) => {
    if (isNaN(Secs1)) return "00:00";
    const M1 = Math.floor(Secs1 / 60);
    const S1 = Math.floor(Secs1 % 60);
    return `${M1.toString().padStart(2, "0")}:${S1.toString().padStart(2, "0")}`;
  };

  const handleSeekHover1 = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekWrapRef.current) return;
    const rect = seekWrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const time = Math.max(0, Math.min(1, ratio)) * duration;
    set_hover_time(time);
    set_hover_x(x);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[99999] pointer-events-none">
      <div className="relative w-full glass_panel compact flat pointer-events-auto flex flex-col pt-2 pb-3 overflow-visible rounded-t-xl border-t border-white/10">

        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-t-xl">
          {bubbleField.map((bubble) => (
            <div
              key={bubble.id}
              className="absolute rounded-full animate-bubbleFloat transition-opacity duration-1000"
              style={{
                width: bubble.size,
                height: bubble.size,
                left: `${bubble.left}%`,
                top: `${bubble.top}%`,
                opacity: isPlaying ? bubble.opacity : bubble.opacity * 0.4,
                background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 40%, transparent 80%)",
                boxShadow: "0 0 15px rgba(255,255,255,0.5)",
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
                ["--x1" as any]: `${bubble.x1}px`,
                ["--y1" as any]: `${bubble.y1}px`,
                ["--x2" as any]: `${bubble.x2}px`,
                ["--y2" as any]: `${bubble.y2}px`,
                ["--x3" as any]: `${bubble.x3}px`,
                ["--y3" as any]: `${bubble.y3}px`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full flex flex-col">
          <div className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-6 mb-2 overflow-visible">
            <span className="text-[12px] text-[var(--pink_main)] font-mono font-bold min-w-[40px]">
              {formatSeconds1(currentTime)}
            </span>

            {/* SEEK BAR WRAPPER - ADDED CURSOR POINTER */}
            <div
              ref={seekWrapRef}
              className="relative flex-1 h-6 flex items-center group cursor-pointer"
              onMouseMove={handleSeekHover1}
              onMouseLeave={() => set_hover_time(null)}
            >
              {hoverTime !== null && (
                <div
                  className="absolute -top-10 px-2 py-1 rounded-md text-[12px] font-mono font-bold text-white bg-black/95 border border-[var(--pink_main)] shadow-[0_0_20px_rgba(255,46,126,0.6)] pointer-events-none whitespace-nowrap z-[100001] scale-110"
                  style={{
                    left: `clamp(30px, ${hoverX}px, calc(100% - 30px))`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {formatSeconds1(hoverTime)}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black border-r border-b border-[var(--pink_main)] rotate-45"></div>
                </div>
              )}

              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={(e) => seek1(parseFloat(e.target.value))}
                className="w-full h-1 accent-[var(--pink_main)] bg-white/10 rounded-full appearance-none cursor-pointer relative z-10"
                style={{
                  boxShadow: "0 0 10px rgba(255,46,126,0.3)",
                  backgroundImage: `linear-gradient(to right, var(--pink_main) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.08) ${(currentTime / (duration || 1)) * 100}%)`,
                }}
              />
            </div>

            <span className="text-[12px] opacity-60 font-mono font-bold min-w-[40px] text-right">
              {formatSeconds1(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black flex items-center justify-center border border-[var(--pink_main)] shadow-[0_0_15px_rgba(255,46,126,0.4)] shrink-0 overflow-hidden">
                <MusicIcon
                  size={22}
                  className={isPlaying ? "animate-spin text-[var(--pink_main)]" : "text-[var(--pink_main)]"}
                />
              </div>

              <div className="truncate min-w-0 hidden sm:block">
                <p className="text-xs font-bold text-[var(--pink_main)] truncate uppercase tracking-tighter">
                  {formatTitle1(currentTrack.blobName)}
                </p>
                
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-[var(--pink_main)] opacity-70 font-bold flex items-center gap-1 uppercase tracking-tight">
                    <Wallet size={11} strokeWidth={2.5} />
                    {formatAddress1(currentTrack.walletAddress)}
                  </span>
                </div>
              </div>
            </div>

            {/* CONTROLS AREA - ALL BUTTONS WITH CURSOR POINTER */}
            <div className="flex items-center gap-3 sm:gap-6 justify-center shrink-0">
              <button
                onClick={handleShuffleClick1}
                className={`transition-all hover:scale-125 active:scale-90 cursor-pointer ${isShuffle ? "text-[var(--pink_main)] drop-shadow-[0_0_10px_var(--pink_main)]" : "text-white/70 hover:text-white"}`}
              >
                <Shuffle size={20} strokeWidth={2.5} />
              </button>

              <button onClick={previousTrack1} className="text-white/70 hover:text-[var(--pink_main)] transition-all hover:scale-125 active:scale-90 cursor-pointer">
                <SkipBack size={22} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                className="bg-[var(--pink_main)] text-black p-2.5 sm:p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,46,126,0.45)] cursor-pointer"
              >
                {isTrackLoading ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause size={22} fill="currentColor" />
                ) : (
                  <Play size={22} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button onClick={nextTrack1} className="text-white/70 hover:text-[var(--pink_main)] transition-all hover:scale-125 active:scale-90 cursor-pointer">
                <SkipForward size={22} fill="currentColor" />
              </button>

              <button
                onClick={handleRepeatClick1}
                className={`transition-all hover:scale-125 active:scale-90 cursor-pointer ${repeatMode !== "off" ? "text-[var(--pink_main)] drop-shadow-[0_0_10px_var(--pink_main)]" : "text-white/70 hover:text-white"}`}
              >
                {repeatMode === "one" ? <Repeat1 size={22} strokeWidth={2.5} /> : <Repeat size={22} strokeWidth={2.5} />}
              </button>
            </div>

            {/* VOLUME AREA - ADDED CURSOR POINTER */}
            <div className="hidden md:flex items-center gap-3 justify-end flex-1 min-w-0">
              <Volume2 size={18} className="text-[var(--pink_main)] drop-shadow-[0_0_8px_var(--pink_main)] shrink-0" />
              <input
                type="range" min="0" max="1" step="0.01" value={volume}
                onChange={(e) => set_volume(parseFloat(e.target.value))}
                className="w-24 accent-white cursor-pointer h-1.5 bg-white/10 rounded-full appearance-none transition-all hover:h-2"
                style={{
                   backgroundImage: `linear-gradient(to right, var(--pink_main) ${volume * 100}%, rgba(255,255,255,0.1) 0%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bubbleFloat {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(var(--x1), var(--y2), 0) scale(1.05); }
          50% { transform: translate3d(var(--x2), var(--y3), 0) scale(0.95); }
          75% { transform: translate3d(var(--x3), var(--y1), 0) scale(1.02); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }

        .animate-bubbleFloat {
          animation-name: bubbleFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 10px var(--pink_main);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}