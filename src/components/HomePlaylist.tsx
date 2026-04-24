"use client";

import { useState, useEffect } from "react";
import { Heart, Music, Wallet, Loader2, X, Minus, Plus, Check, AlertCircle } from "lucide-react";
import { useMusic } from "@/components/MusicContext";
import { ShelbyClient } from "@/lib/shelby";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const formatAddress1 = (Addr1: string) => {
  if (!Addr1) return "UNKNOWN";
  const Clean1 = Addr1.toString().replace("@", ""); 
  return `${Clean1.slice(0, 6)}...${Clean1.slice(-4)}`.toUpperCase();
};

export default function HomePlaylist() {
  const { 
    playTrack, 
    formatTitle1, 
    currentTrack, 
    isPlaying,
    arenaStats, 
    refreshArenaStats 
  } = useMusic();

  const { signAndSubmitTransaction, connected, account } = useWallet();
  const [tracksList, set_tracks_list] = useState<any[]>([]);
  const [lovingBlob1, set_loving_blob] = useState<string | null>(null);

  const [SelectedPushId1, set_selected_push_id] = useState<string | null>(null);
  const [BoostAmount1, set_boost_amount] = useState<string>("0.10");
  const [ErrorMsg1, set_error_msg] = useState<string | null>(null);

  useEffect(() => {
    if (arenaStats) {
      set_tracks_list(arenaStats);
    }
  }, [arenaStats]);

  const getMaxPower1 = () => {
    if (!tracksList || tracksList.length === 0) return "0.00";
    const Powers1 = tracksList.map(t => t.totalPower || 0);
    return Math.max(...Powers1).toFixed(2);
  };

  const MaxPower1 = getMaxPower1();

  const isOwner = (artistAddr: any) => {
    if (!connected || !account?.address || !artistAddr) return false;
    const normalize = (addr: string) => addr.toString().toLowerCase().replace(/^0x0*/, "0x");
    return normalize(account.address) === normalize(artistAddr);
  };

  const handleConfirmLove1 = async (track: any) => {
    if (!connected) {
      set_error_msg("CONNECT WALLET FIRST!");
      return;
    }

    if (isOwner(track.walletAddress)) {
      set_error_msg("YOU CANNOT LOVE YOUR OWN TRACK!");
      return;
    }

    const AmountNum1 = parseFloat(BoostAmount1);
    if (isNaN(AmountNum1) || AmountNum1 < 0.01) {
      set_error_msg("MIN 0.01 APT!");
      return;
    }

    set_loving_blob(track.blobName);
    try {
      // FIX: Đổi từ powerUp sang salute để không bị dính lỗi Simulation 0x3 (ETOO_SOON_TO_POWER_UP)
      await ShelbyClient.salute(track.blobName, signAndSubmitTransaction);
      if (refreshArenaStats) await refreshArenaStats();
      set_selected_push_id(null); 
    } catch (e) {
      set_error_msg("TRANSACTION FAILED!");
    } finally {
      set_loving_blob(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
      <div className="w-full py-6 text-center">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.25em] text-white">
          WHICH TRACK <span className="text-[var(--pink_main)]">YOU LOVE?</span>
        </h1>
      </div>

      {tracksList.length > 0 && (
        <div className="flex justify-center -mt-2 mb-6"> 
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl backdrop-blur-sm">
            <span className="text-base mr-1">😎</span>
            <span className="text-[13px] font-black uppercase tracking-wider text-[var(--pink_main)]">Highest Push:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tracking-tighter animate-pulse ml-0.5">{MaxPower1}</span>
              <span className="text-[11px] font-black text-[var(--pink_main)] uppercase ml-0.5">APT</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        {tracksList.map((track) => {
          const isActive = currentTrack?.blobName === track.blobName;
          const isActuallyPlaying = isActive && isPlaying;
          const isLovingThis = lovingBlob1 === track.blobName;
          const isSelectingThis = SelectedPushId1 === track.blobName;
          const userIsOwner = isOwner(track.walletAddress);

          return (
            <div key={track.blobName}>
              <div
                onClick={() => playTrack(track, tracksList)}
                className={`inner_card flex items-center justify-between transition-all duration-500 cursor-pointer select-none active:scale-[0.99] w-full group ${isActive ? "border-[var(--pink_main)] bg-[var(--pink_main)]/10" : "hover:bg-white/5 border border-transparent"}`}
                style={{ height: "76px", padding: "0 20px", borderRadius: "4rem" }}
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border shrink-0 transition-all duration-300 ${isActive ? "border-[var(--pink_main)] text-[var(--pink_main)] shadow-[0_0_10px_rgba(236,72,153,0.3)]" : "border-white/10 text-white/40"}`}>
                    <Music size={16} className={isActuallyPlaying ? "animate-pulse" : ""} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className={`text-xs md:text-sm font-black truncate uppercase tracking-tighter ${isActive ? "text-[var(--pink_main)]" : "text-white"}`}>
                      {formatTitle1(track.blobName)}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-[9px] font-black flex items-center gap-1 uppercase ${isActive ? "text-[var(--pink_main)] opacity-80" : "opacity-30 text-white"}`}>
                        <Wallet size={11} />{formatAddress1(track.walletAddress)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <button
                    disabled={isLovingThis}
                    onClick={(e) => {
                      e.stopPropagation();
                      set_error_msg(null);
                      
                      set_selected_push_id(track.blobName); 
                      set_boost_amount("0.10");

                      if (userIsOwner) {
                        set_error_msg("YOU CANNOT LOVE YOUR OWN TRACK!");
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 cursor-pointer ${isLovingThis ? "opacity-50 cursor-wait" : "hover:scale-110 active:scale-95"} ${isActive ? "bg-[var(--pink_main)] border-[var(--pink_main)] text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] animate-pulse" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-[var(--pink_main)] hover:bg-[var(--pink_main)]/20"}`}
                  >
                    {isLovingThis ? <Loader2 size={16} className="animate-spin" /> : <><span className="text-[10px] font-black uppercase tracking-[0.1em] hidden md:block">Love it</span><Heart size={16} className={isActive ? "fill-white" : ""} /></>}
                  </button>
                </div>
              </div>

              {isSelectingThis && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => set_selected_push_id(null)} />
                  <div className={`relative bg-[#0d0d0d] border ${ErrorMsg1 ? 'border-red-500' : 'border-[var(--pink_main)]/40'} rounded-[2.5rem] p-8 w-full max-w-xs shadow-[0_0_50px_rgba(236,72,153,0.2)] animate-in zoom-in-95 duration-200`}>
                    <button onClick={() => set_selected_push_id(null)} className="absolute top-6 right-6 text-white/20 hover:text-white cursor-pointer"><X size={20} /></button>
                    
                    <div className="flex flex-col items-center gap-6">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${ErrorMsg1 ? 'bg-red-500/10 text-red-500 animate-bounce' : 'bg-[var(--pink_main)]/10 text-[var(--pink_main)] animate-pulse'}`}>
                        {ErrorMsg1 ? <AlertCircle size={32} /> : <Heart size={32} className="fill-current" />}
                      </div>

                      <div className="text-center">
                        <p className="text-[11px] text-white/60 font-black uppercase tracking-[0.2em]">{formatTitle1(track.blobName)}</p>
                        {ErrorMsg1 && <p className="text-[10px] text-red-500 font-black uppercase mt-2">{ErrorMsg1}</p>}
                      </div>

                      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-1 focus-within:border-[var(--pink_main)]/50 transition-colors">
                        <span className="text-[9px] font-black text-[var(--pink_main)] uppercase tracking-widest mb-2">Love Amount</span>
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => set_boost_amount(prev => Math.max(0.01, (parseFloat(prev) || 0) - 0.01).toFixed(2))} 
                            className="bg-white/5 hover:bg-[var(--pink_main)]/20 text-white rounded-full p-3 transition-colors active:scale-95"
                          >
                            <Minus size={20} />
                          </button>

                          <input 
                            type="number" 
                            step="0.01"
                            min="0.01"
                            value={BoostAmount1} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== "" && parseFloat(val) < 0) return;
                              set_boost_amount(val);
                              if (ErrorMsg1 && !userIsOwner) set_error_msg(null);
                            }}
                            onBlur={() => {
                              const num = parseFloat(BoostAmount1);
                              if (isNaN(num) || num < 0.01) set_boost_amount("0.01");
                              else set_boost_amount(num.toFixed(2));
                            }}
                            className="bg-transparent text-4xl font-black text-white w-28 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text" 
                            autoFocus
                          />

                          <button 
                            onClick={() => set_boost_amount(prev => ((parseFloat(prev) || 0) + 0.01).toFixed(2))} 
                            className="bg-white/5 hover:bg-[var(--pink_main)]/20 text-white rounded-full p-3 transition-colors active:scale-95"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleConfirmLove1(track)} 
                        disabled={isLovingThis || userIsOwner} 
                        className={`w-full text-white py-4 rounded-full font-black uppercase text-[12px] flex items-center justify-center gap-3 transition-all ${userIsOwner ? 'bg-red-500/20 text-red-500 cursor-not-allowed opacity-50' : 'bg-[var(--pink_main)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] active:scale-95 cursor-pointer'}`}
                      >
                        {isLovingThis ? <Loader2 size={16} className="animate-spin" /> : <><span>CONFIRM</span><Check size={20} strokeWidth={4} /></>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
