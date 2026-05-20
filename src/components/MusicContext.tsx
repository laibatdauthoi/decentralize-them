"use client";

import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const CONTRACT_ADDRESS1 = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
const MODULE_NAME1 = "sound_battle_v5";

const AptosClient1 = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
    fullnode: "https://fullnode.testnet.aptoslabs.com/v1",
  })
);

interface Track {
  id?: string | number;
  title: string;
  blobName: string;
  walletAddress: string;
  totalPower?: number;
  saluteCount?: number;
  isWinner?: boolean;
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
  ensureYesterdaySettled: (SignFunc1: any) => Promise<void>;
  getYesterdayId1: () => Promise<number>;
  arenaStats: Track[];
  winnersStats: Track[];
  pushSong1: (SignFunc1: any, BlobName1: string, Amount1: number) => Promise<any>;
  pullReward1: (SignFunc1: any, BlobName1: string) => Promise<void>;
  claimReward1: (SignFunc1: any, BlobName1: string) => Promise<void>;
  settleYesterday1: (SignFunc1: any) => Promise<void>;
  canPullReward1: (BlobName1: string, UserAddr1?: any, DayId1?: number) => Promise<boolean>;
  canClaimReward1: (BlobName1: string, UserAddr1?: any, DayId1?: number) => Promise<boolean>;
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
  const [winnersStats, set_winners_stats] = useState<Track[]>([]);
  const [activeQueue1, set_active_queue] = useState<Track[]>([]);
  const [isShuffle, set_is_shuffle] = useState(false);
  const [repeatMode, set_repeat_mode] = useState<RepeatMode>("off");

  const audioRef = useRef<HTMLAudioElement>(null);

  const getChainYesterdayId = async () => {
    let lastErr: any = null;

    for (let i = 0; i < 3; i++) {
      try {
        const res: any = await AptosClient1.view({
          payload: {
            function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::current_day_id` as any,
            typeArguments: [],
            functionArguments: [],
          },
        });

        return parseInt(res[0]) - 1;
      } catch (err) {
        lastErr = err;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    throw lastErr;
  };

  const refreshArenaStats = async () => {
    try {
      const yesterdayId = await getChainYesterdayId();

      const resArena1: any = await AptosClient1.view({
        payload: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::get_arena_info` as any,
          typeArguments: [],
          functionArguments: [],
        },
      });

      const arenaRaw1 = resArena1[0] || [];

      const arenaMapped1: Track[] = arenaRaw1.map((item: any) => ({
        title: item.blob_name,
        blobName: item.blob_name,
        walletAddress: item.artist,
        totalPower: parseInt(item.total_push) / 100_000_000,
        saluteCount: parseInt(item.total_love),
      }));

      set_arena_stats(arenaMapped1.sort((a, b) => (b.totalPower || 0) - (a.totalPower || 0)));

      const resWinners1: any = await AptosClient1.view({
        payload: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::get_winners_gallery` as any,
          typeArguments: [],
          functionArguments: [yesterdayId.toString()],
        },
      });

      const winnersRaw1 = resWinners1[0] || [];

      const winnersMapped1: Track[] = winnersRaw1.map((item: any) => ({
        title: item.blob_name,
        blobName: item.blob_name,
        walletAddress: item.winner,
        totalPower: parseInt(item.final_points) / 100_000_000,
        isWinner: true,
      }));

      set_winners_stats(winnersMapped1.sort((a, b) => (b.totalPower || 0) - (a.totalPower || 0)));

    } catch (err1) {
      console.warn("Arena sync skipped, keeping previous data:", err1);
    }
  };

  const ensureYesterdaySettled = async (SignFunc1: any) => {
    try {
      const yesterdayId = await getChainYesterdayId();

      const settledRes: any = await AptosClient1.view({
        payload: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::is_day_settled` as any,
          typeArguments: [],
          functionArguments: [yesterdayId.toString()],
        },
      });

      const alreadySettled = settledRes[0];
      if (alreadySettled) return;

      const activityRes: any = await AptosClient1.view({
        payload: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::has_day_activity` as any,
          typeArguments: [],
          functionArguments: [yesterdayId.toString()],
        },
      });

      const hasActivity = activityRes[0];
      if (!hasActivity) return;

      await settleYesterday1(SignFunc1);

      setTimeout(() => {
        refreshArenaStats();
      }, 3000);

    } catch (err) {
      console.error("ensureYesterdaySettled failed:", err);
    }
  };

  const canPullReward1 = async (BlobName1: string, UserAddr1?: any, DayId1?: number) => {
    try {
      if (!UserAddr1) return false;

      const yesterdayId = DayId1 ?? await getChainYesterdayId();

      const res: any = await AptosClient1.view({
        payload: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::can_pull_reward` as any,
          typeArguments: [],
          functionArguments: [
            yesterdayId.toString(),
            BlobName1,
            UserAddr1.toString(),
          ],
        },
      });

      return Boolean(res?.[0]);

    } catch (err1) {
      console.error("Can pull reward failed:", err1);
      return false;
    }
  };

  const canClaimReward1 = async (BlobName1: string, UserAddr1?: any, DayId1?: number) => {
    try {
      if (!UserAddr1) return false;

      const yesterdayId = DayId1 ?? await getChainYesterdayId();

      const res: any = await AptosClient1.view({
        payload: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::can_claim_love_reward` as any,
          typeArguments: [],
          functionArguments: [
            yesterdayId.toString(),
            BlobName1,
            UserAddr1.toString(),
          ],
        },
      });

      return Boolean(res?.[0]);

    } catch (err1) {
      console.error("Can claim love reward failed:", err1);
      return false;
    }
  };

  const pushSong1 = async (SignFunc1: any, BlobName1: string, Amount1: number) => {
    try {
      const payload = {
        data: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::push_song` as any,
          typeArguments: [],
          functionArguments: [
            BlobName1,
            Amount1.toString(),
          ],
        },
      };

      const response = await SignFunc1(payload);

      await AptosClient1.waitForTransaction({
        transactionHash: response.hash,
      });

      await refreshArenaStats();

      return response;

    } catch (err1) {
      console.error("Push song failed:", err1);
      throw err1;
    }
  };

  const pullReward1 = async (SignFunc1: any, BlobName1: string) => {
    try {
      const yesterdayId = await getChainYesterdayId();

      const payload = {
        data: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::pull_reward` as any,
          typeArguments: [],
          functionArguments: [
            yesterdayId.toString(),
            BlobName1,
          ],
        },
      };

      const response = await SignFunc1(payload);

      await AptosClient1.waitForTransaction({
        transactionHash: response.hash,
      });

      await refreshArenaStats();

    } catch (err1) {
      console.error("Pull reward failed:", err1);
    }
  };

  const claimReward1 = async (SignFunc1: any, BlobName1: string) => {
    try {
      const yesterdayId = await getChainYesterdayId();

      const payload = {
        data: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::claim_love_reward` as any,
          typeArguments: [],
          functionArguments: [
            yesterdayId.toString(),
            BlobName1,
          ],
        },
      };

      const response = await SignFunc1(payload);

      await AptosClient1.waitForTransaction({
        transactionHash: response.hash,
      });

      await refreshArenaStats();

    } catch (err1) {
      console.error("Claim reward failed:", err1);
    }
  };

  const settleYesterday1 = async (SignFunc1: any) => {
    try {
      const yesterdayId = await getChainYesterdayId();

      const payload = {
        data: {
          function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::settle_battle` as any,
          typeArguments: [],
          functionArguments: [yesterdayId.toString()],
        },
      };

      const response = await SignFunc1(payload);

      if (response?.hash) {
        await AptosClient1.waitForTransaction({
          transactionHash: response.hash,
        });
      }

      setTimeout(() => {
        refreshArenaStats();
      }, 2000);

      return response;

    } catch (err1) {
      console.error("Settle battle failed:", err1);
      throw err1;
    }
  };

  useEffect(() => {
    refreshArenaStats();

    const interval = setInterval(refreshArenaStats, 120000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
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

      if (CleanAddr1 && !CleanAddr1.startsWith("0x")) {
        CleanAddr1 = "0x" + CleanAddr1;
      }

      const RealFileName1 =
        TrackItem1.blobName.split("/").pop() || TrackItem1.blobName;

      const ApiUrl1 =
        `https://api.testnet.shelby.xyz/shelby/v1/blobs/${CleanAddr1}/${encodeURIComponent(RealFileName1)}`;

      const response = await fetch(ApiUrl1);

      if (!response.ok) {
        throw new Error("File nhạc không tồn tại");
      }

      const fileBlob = await response.blob();
      const objectUrl = URL.createObjectURL(fileBlob);
      const audio = audioRef.current;

      if (!audio) return;

      const oldUrl = audio.src;

      audio.src = objectUrl;

      setCurrentTrack({
        ...TrackItem1,
        walletAddress: CleanAddr1,
      });

      setIsPlaying(true);

      await audio.play();

      if (oldUrl.startsWith("blob:")) {
        URL.revokeObjectURL(oldUrl);
      }

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

    let nextIdx =
      isShuffle
        ? queue1.length > 1
          ? Math.floor(Math.random() * queue1.length)
          : 0
        : idx1 + 1;

    if (nextIdx >= queue1.length || nextIdx === -1) {
      if (repeatMode === "all") {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    await playTrack(queue1[nextIdx]);
  };

  const previousTrack1 = async () => {
    const queue1 = activeQueue1.length > 0 ? activeQueue1 : tracks;

    if (queue1.length === 0 || !currentTrack) return;

    const idx1 = queue1.findIndex((t) => t.blobName === currentTrack.blobName);

    let prev1 = idx1 - 1;

    if (prev1 < 0) {
      prev1 = queue1.length - 1;
    }

    await playTrack(queue1[prev1]);
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isTrackLoading,
        playTrack,

        togglePlay: () => {
          if (audioRef.current?.paused) {
            audioRef.current.play();
          } else {
            audioRef.current?.pause();
          }
        },

        formatTitle1,
        volume,
        set_volume,
        currentTime,
        duration,

        seek1: (t) => {
          if (audioRef.current) {
            audioRef.current.currentTime = t;
          }
        },

        tracks,
        set_tracks,
        isShuffle,
        set_is_shuffle,
        repeatMode,
        set_repeat_mode,
        nextTrack1,
        previousTrack1,
        refreshArenaStats,
        ensureYesterdaySettled,
        getYesterdayId1: getChainYesterdayId,
        arenaStats,
        winnersStats,
        pushSong1,
        pullReward1,
        claimReward1,
        settleYesterday1,
        canPullReward1,
        canClaimReward1,
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
          } else {
            nextTrack1();
          }
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

  if (!context) {
    throw new Error("useMusic must be used within MusicProvider");
  }

  return context;
}