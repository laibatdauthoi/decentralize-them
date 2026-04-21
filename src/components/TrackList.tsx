"use client";

import { Music, Headphones, AlertCircle, Loader2, Wallet, Swords, Check, X, Zap, Minus, Plus } from "lucide-react";
import { useMusic } from "@/components/MusicContext";
import { useState } from "react";
import { ShelbyClient } from "@/lib/shelby";
import { useWallet } from "@aptos-labs/wallet-adapter-react"; 

interface track_info {
  id: string | number;
  title: string;
  size: number;
  blobName: string;
  walletAddress: string;
}

interface track_list_props {
  tracks: track_info[];
  isLoading: boolean;
  error: any;
}

const formatAddress1 = (Addr1: string) => {
  if (!Addr1) return "UNKNOWN";
  const Clean1 = Addr1.replace("@", "");
  return `${Clean1.slice(0, 6)}...${Clean1.slice(-4)}`.toUpperCase();
};

export function TrackList({
  tracks,
  isLoading,
  error,
}: track_list_props) {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    formatTitle1,
    set_tracks,
    playTrack,
    refreshArenaStats,
    arenaStats, 
  } = useMusic();

  const { signAndSubmitTransaction, connected } = useWallet();
  const [LoadingTrack1, set_loading_track] = useState<string | null>(null);
  const [TrackError1, set_track_error] = useState<string | null>(null);
  const [PushingId1, set_pushing_id] = useState<string | number | null>(null);
  
  const [SelectedPushId1, set_selected_push_id] = useState<string | number | null>(null);
  const [BoostAmount1, set_boost_amount] = useState<string>("0.10"); // Mặc định 2 chữ số thập phân

  const [StatusMsg1, set_status_msg] = useState<{id: string|number, text: string, type: 'success' | 'error' | 'info'} | null>(null);

  const showStatus1 = (id: string|number, text: string, type: 'success' | 'error' | 'info') => {
    set_status_msg({ id, text, type });
    setTimeout(() => set_status_msg(null), 4000);
  };

  const handleTrackAction = async (Item1: track_info) => {
    const IsActive1 = currentTrack?.blobName === Item1.blobName;
    if (IsActive1) {
      togglePlay();
      return;
    }

    set_loading_track(Item1.blobName);
    set_track_error(null);

    try {
      const Playlist1 = [...tracks].reverse().map((T1) => ({
        title: T1.title,
        blobName: T1.blobName,
        walletAddress: T1.walletAddress,
      }));

      set_tracks(Playlist1);
      const SelectedTrack1 = Playlist1.find((T1) => T1.blobName === Item1.blobName);
      if (!SelectedTrack1) throw new Error("Track not found");

      await playTrack(SelectedTrack1, Playlist1);
    } catch (Err1: any) {
      console.error("Play error:", Err1);
      set_track_error(Item1.blobName);
      setTimeout(() => set_track_error(null), 3000);
    } finally {
      set_loading_track(null);
    }
  };

  const handleConfirmPush1 = async (Item1: track_info) => {
    if (!connected) {
      showStatus1(Item1.id, "CONNECT WALLET FIRST!", "info");
      return;
    }

    const AmountNum1 = parseFloat(BoostAmount1);
    if (isNaN(AmountNum1) || AmountNum1 < 0.01) {
      showStatus1(Item1.id, "MIN 0.01 APT!", "error");
      return;
    }

    set_pushing_id(Item1.id);

    try {
      const IsInArena1 = arenaStats?.some((W1: any) => W1.blobName === Item1.blobName);

      if (!IsInArena1) {
        showStatus1(Item1.id, "JOINING ARENA...", "info");
        await ShelbyClient.joinArena(Item1.blobName, signAndSubmitTransaction);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      showStatus1(Item1.id, `POWERING UP ${AmountNum1} APT...`, "info");
      await ShelbyClient.powerUp(Item1.blobName, AmountNum1, signAndSubmitTransaction);
      
      showStatus1(Item1.id, "SUCCESSFULLY PUSHED!", "success");
      set_selected_push_id(null);
      
      if (refreshArenaStats) await refreshArenaStats();
      
    } catch (Err1: any) {
      console.error("Push Error Detail:", Err1);
      showStatus1(Item1.id, "TRANSACTION FAILED", "error");
    } finally {
      set_pushing_id(null);
    }
  };

  if (isLoading) return <div className="text-center py-16 animate-pulse text-[var(--pink_main)] font-bold tracking-widest">CONNECTING...</div>;
  if (error) return <div className="text-center py-16 text-red-400 bg-red-400/10 rounded-xl border border-red-400/20"><AlertCircle className="mx-auto mb-2" size={20} />SYNC ERROR</div>;

  return (
    <div className="flex flex-col gap-2 w-full relative z-0">
      {[...tracks].reverse().map((Item1) => {
        const IsActive1 = currentTrack?.blobName === Item1.blobName;
        const IsActuallyPlaying1 = IsActive1 && isPlaying;
        const IsThisLoading1 = LoadingTrack1 === Item1.blobName;
        const HasThisError1 = TrackError1 === Item1.blobName;
        const IsPushingThis1 = PushingId1 === Item1.id;
        const IsSelectingThis1 = SelectedPushId1 === Item1.id;
        const MyStatus1 = StatusMsg1?.id === Item1.id ? StatusMsg1 : null;

        return (
          <div key={Item1.id}>
            <div
              onClick={() => !IsThisLoading1 && handleTrackAction(Item1)}
              className={`
                inner_card flex items-center justify-between transition-all duration-500
                cursor-pointer select-none active:scale-[0.99] w-full group relative
                ${IsActive1 ? "border-[var(--pink_main)] bg-[var(--pink_main)]/10" : "hover:bg-white/5 border border-transparent"}
                ${HasThisError1 ? "border-red-500/50 bg-red-500/5" : ""}
                ${IsThisLoading1 ? "opacity-60" : ""}
              `}
              style={{ height: "86px", padding: "0 20px", borderRadius: "4rem" }}
            >
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border shrink-0 transition-all duration-300 ${
                  IsActive1 ? "border-[var(--pink_main)] text-[var(--pink_main)] shadow-[0_0_10px_rgba(236,72,153,0.3)]" : "border-white/10 text-white/40"
                }`}>
                  {IsThisLoading1 ? <Loader2 size={16} className="animate-spin text-[var(--pink_main)]" /> : <Music size={16} className={IsActuallyPlaying1 ? "animate-pulse" : ""} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className={`text-xs md:text-sm font-black truncate uppercase tracking-tighter ${IsActive1 ? "text-[var(--pink_main)]" : "text-white"}`}>
                    {formatTitle1(Item1.blobName)}
                  </h3>
                  
                  {MyStatus1 ? (
                    <div className={`flex items-center gap-1.5 text-[11px] font-black uppercase mt-0.5 animate-in fade-in slide-in-from-left-1 ${
                      MyStatus1.type === 'success' ? 'text-green-400' : MyStatus1.type === 'error' ? 'text-red-400' : 'text-[var(--pink_main)]'
                    }`}>
                      <Zap size={12} className="fill-current" />
                      {MyStatus1.text}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[9px] opacity-40 font-black flex items-center gap-1 uppercase"><Headphones size={11} />{(Item1.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className={`text-[9px] font-black flex items-center gap-1 uppercase ${IsActive1 ? "text-[var(--pink_main)] opacity-80" : "opacity-30 text-white"}`}><Wallet size={11} />{formatAddress1(Item1.walletAddress)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {IsActuallyPlaying1 && (
                  <div className="flex gap-0.5 items-end h-3 mr-1">
                    <div className="w-0.5 h-full bg-[var(--pink_main)] animate-[bounce_1s_infinite_0.1s]" />
                    <div className="w-0.5 h-full bg-[var(--pink_main)] animate-[bounce_1s_infinite_0.3s]" />
                    <div className="w-0.5 h-full bg-[var(--pink_main)] animate-[bounce_1s_infinite_0.5s]" />
                  </div>
                )}

                <button
                  disabled={IsPushingThis1}
                  onClick={(e) => {
                    e.stopPropagation();
                    set_selected_push_id(Item1.id);
                    set_boost_amount("0.10"); 
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 cursor-pointer ${IsPushingThis1 ? "opacity-50 cursor-not-allowed" : "animate-pulse hover:animate-none hover:scale-110 active:scale-95"} ${IsActive1 ? "bg-[var(--pink_main)] border-[var(--pink_main)] text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-[var(--pink_main)] hover:bg-[var(--pink_main)]/20"}`}
                >
                  {IsPushingThis1 ? <Loader2 size={16} className="animate-spin" /> : <><span className="text-[10px] font-black uppercase tracking-[0.1em] hidden md:block">Push It</span><Swords size={16} /></>}
                </button>
              </div>
            </div>

            {IsSelectingThis1 && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => set_selected_push_id(null)} />
                <div className="relative bg-[#0d0d0d] border border-[var(--pink_main)]/40 rounded-[2.5rem] p-8 w-full max-w-xs shadow-[0_0_50px_rgba(236,72,153,0.2)] animate-in zoom-in-95 duration-200">
                  <button onClick={() => set_selected_push_id(null)} className="absolute top-6 right-6 text-white/20 hover:text-white cursor-pointer"><X size={20} /></button>
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-[var(--pink_main)]/10 rounded-full flex items-center justify-center text-[var(--pink_main)] shadow-[0_0_15px_rgba(236,72,153,0.1)] animate-pulse">
                      <Swords size={32} />
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] text-white/60 font-black uppercase tracking-[0.2em]">{formatTitle1(Item1.blobName)}</p>
                    </div>

                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-1 focus-within:border-[var(--pink_main)]/50 transition-colors">
                      <span className="text-[9px] font-black text-[var(--pink_main)] uppercase tracking-widest mb-2">Set APT Amount</span>
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => {
                            const Val1 = parseFloat(BoostAmount1);
                            // GIẢM 0.01 VÀ CHẶN TỐI THIỂU 0.01
                            set_boost_amount(Math.max(0.01, Val1 - 0.01).toFixed(2));
                          }} 
                          className="bg-white/5 hover:bg-[var(--pink_main)]/20 text-white hover:text-[var(--pink_main)] rounded-full p-3 transition-colors cursor-pointer active:scale-95"
                        >
                          <Minus size={20} strokeWidth={3} />
                        </button>
                        <input
                          type="number" step="0.01" min="0.01"
                          value={BoostAmount1}
                          onChange={(e) => {
                            const V1 = e.target.value;
                            if (parseFloat(V1) < 0) return;
                            set_boost_amount(V1);
                          }}
                          className="bg-transparent text-4xl font-black text-white outline-none w-28 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                        <button 
                          onClick={() => {
                            const Val1 = parseFloat(BoostAmount1);
                            // TĂNG 0.01
                            set_boost_amount((Val1 + 0.01).toFixed(2));
                          }} 
                          className="bg-white/5 hover:bg-[var(--pink_main)]/20 text-white hover:text-[var(--pink_main)] rounded-full p-3 transition-colors cursor-pointer active:scale-95"
                        >
                          <Plus size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleConfirmPush1(Item1)}
                      disabled={IsPushingThis1}
                      className="w-full bg-[var(--pink_main)] text-white py-4 rounded-full font-black uppercase text-[12px] flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed group"
                    >
                      {IsPushingThis1 ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <span className="tracking-widest">CONFIRM</span>
                          <Check size={20} strokeWidth={4} className="group-hover:scale-110 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}