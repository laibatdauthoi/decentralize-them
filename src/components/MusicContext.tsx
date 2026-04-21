"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const CONTRACT_ADDRESS1 = "0x3fee4daed928f18f2c7d61da6ff596854bc3e6dc3f5c22f13bf4a9332631573e";
const MODULE_NAME1 = "sound_battle_v3"; 

const AptosClient1 = new Aptos(
  new AptosConfig({ network: Network.TESTNET })
);

interface Track {
  id?: string | number;
  title: string;
  blobName: string;
  walletAddress: string;
  totalPower?: number;
  saluteCount?: number;
}

type RepeatMode = "off" | "all" | "one";

interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isTrackLoading: boolean;
  playTrack: (track: Track, sourceList?: Track[]) => Promise<void>;
  togglePlay: () => void;
  formatTitle1: (name: string) => string;
  volume: number;
  set_volume: (val: number) => void;
  currentTime: number;
  duration: number;
  seek1: (time: number) => void;
  tracks: Track[];
  set_tracks: (list: Track[]) => void;
  isShuffle: boolean;
  set_is_shuffle: (val: boolean) => void;
  repeatMode: RepeatMode;
  set_repeat_mode: (mode: RepeatMode) => void;
  nextTrack1: () => Promise<void>;
  previousTrack1: () => Promise<void>;
  refreshArenaStats: () => Promise<void>;
  arenaStats: Track[]; 
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const formatTitle1 = (Name1: string) => {
  if (!Name1) return "UNKNOWN TRACK";
  return Name1
    .split("/")
    .pop()!
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTrackLoading, set_is_track_loading] = useState(false);
  const [volume, set_volume] = useState(0.7);
  const [currentTime, set_currentTime] = useState(0);
  const [duration, set_duration] = useState(0);
  const [tracks, set_tracks] = useState<Track[]>([]);
  const [arenaStats, set_arena_stats] = useState<Track[]>([]); 
  const [activeQueue1, set_active_queue] = useState<Track[]>([]); 
  const [isShuffle, set_is_shuffle] = useState(false);
  const [repeatMode, set_repeat_mode] = useState<RepeatMode>("off");

  const audioRef = useRef<HTMLAudioElement>(null);

  const refreshArenaStats = async () => {
    try {
      const resNames1: any = await AptosClient1.view({
        payload: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::get_all_warriors`,
          typeArguments: [],
          functionArguments: [],
        },
      });

      const allNames1 = resNames1[0] || [];
      console.log("Blockchain All Warriors:", allNames1); // Debug xem có bao nhiêu bài

      if (allNames1.length === 0) {
        set_arena_stats([]);
        return;
      }

      const results1 = await Promise.all(
        allNames1.map(async (name1: string) => {
          try {
            const stats1: any = await AptosClient1.view({
              payload: {
                function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::get_warrior_stats`,
                typeArguments: [],
                functionArguments: [name1],
              },
            });
            // stats1: [artist_address, total_power, salute_count]
            return {
              title: name1,
              blobName: name1,
              walletAddress: stats1[0],
              totalPower: parseInt(stats1[1]) / 100_000_000,
              saluteCount: parseInt(stats1[2]),
            };
          } catch (e) {
            console.error(`Lỗi stats bài ${name1}:`, e);
            return null;
          }
        })
      );

      const validArena1 = results1.filter((t): t is Track => t !== null);
      set_arena_stats(validArena1.sort((a, b) => (b.totalPower || 0) - (a.totalPower || 0)));
    } catch (err1) {
      console.error("Arena sync failed:", err1);
    }
  };

  useEffect(() => {
    refreshArenaStats();
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = async (TrackItem1: Track, sourceList?: Track[]) => {
    try {
      set_is_track_loading(true);
      
      if (sourceList) {
        set_active_queue(sourceList);
      } else if (activeQueue1.length === 0) {
        set_active_queue(tracks);
      }

      const RawAddr1 = (TrackItem1.walletAddress || "").toString();
      let CleanAddr1 = RawAddr1.replace("@", "");
      if (CleanAddr1 && !CleanAddr1.startsWith("0x")) CleanAddr1 = "0x" + CleanAddr1;

      const RealFileName1 = TrackItem1.blobName.split("/").pop() || TrackItem1.blobName;
      const ApiUrl1 = `https://api.testnet.shelby.xyz/shelby/v1/blobs/${CleanAddr1}/${encodeURIComponent(RealFileName1)}`;
      
      console.log("Loading Shelby URL:", ApiUrl1);

      const response = await fetch(ApiUrl1);
      if (!response.ok) throw new Error("File nhạc không tồn tại");

      const fileBlob = await response.blob();
      const objectUrl = URL.createObjectURL(fileBlob);
      const audio = audioRef.current;
      if (!audio) return;

      const oldUrl = audio.src;
      audio.src = objectUrl;

      setCurrentTrack({ ...TrackItem1, walletAddress: CleanAddr1 });
      setIsPlaying(true);
      await audio.play();
      if (oldUrl.startsWith("blob:")) URL.revokeObjectURL(oldUrl);
    } catch (error) {
      console.error("Play error:", error);
    } finally {
      set_is_track_loading(false);
    }
  };

  const nextTrack1 = async () => {
    const queue1 = activeQueue1.length > 0 ? activeQueue1 : tracks;
    if (queue1.length === 0 || !currentTrack) return;
    const idx1 = queue1.findIndex((t) => t.blobName === currentTrack.blobName);
    let next1 = isShuffle ? Math.floor(Math.random() * queue1.length) : idx1 + 1;
    if (next1 >= queue1.length) next1 = repeatMode === "all" ? 0 : idx1;
    if (next1 !== idx1 || repeatMode === "all") await playTrack(queue1[next1]);
  };

  const previousTrack1 = async () => {
    const queue1 = activeQueue1.length > 0 ? activeQueue1 : tracks;
    if (queue1.length === 0 || !currentTrack) return;
    const idx1 = queue1.findIndex((t) => t.blobName === currentTrack.blobName);
    let prev1 = idx1 - 1;
    if (prev1 < 0) prev1 = queue1.length - 1;
    await playTrack(queue1[prev1]);
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack, isPlaying, isTrackLoading, playTrack, togglePlay: () => {
          if (audioRef.current?.paused) audioRef.current.play(); else audioRef.current?.pause();
        }, formatTitle1, volume, set_volume, currentTime, duration, seek1: (t) => {
          if (audioRef.current) audioRef.current.currentTime = t;
        }, tracks, set_tracks, isShuffle, set_is_shuffle, repeatMode, set_repeat_mode,
        nextTrack1, previousTrack1, refreshArenaStats, arenaStats,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (repeatMode === "one" && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else nextTrack1();
        }}
        onTimeUpdate={(e) => set_currentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => set_duration(e.currentTarget.duration)}
        onError={() => isPlaying && nextTrack1()}
      />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
}