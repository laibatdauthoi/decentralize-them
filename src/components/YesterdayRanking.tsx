"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, Ghost, Loader2 } from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMusic } from "@/components/MusicContext";

export default function YesterdayRanking({
  formatTitle1,
}: {
  formatTitle1: (name: string) => string;
}) {
  const {
    winnersStats,
    ensureYesterdaySettled,
    refreshArenaStats,
    pullReward1,
    claimReward1,
    canPullReward1,
    canClaimReward1,
    getYesterdayId1,
  } = useMusic();

  const { signAndSubmitTransaction, connected, account } = useWallet();

  const [loading, set_loading] = useState(true);
  const [actionLoading, set_action_loading] = useState<string | null>(null);
  const [rewardStatus, set_reward_status] = useState<
    Record<string, { canPull: boolean; canClaim: boolean }>
  >({});

  const alreadyTriedRef = useRef(false);

  const refreshRewardStatus = async () => {
    if (!connected || !account?.address) {
      set_reward_status({});
      return;
    }

    try {
      const yesterdayId = await getYesterdayId1();
      const statuses: Record<string, { canPull: boolean; canClaim: boolean }> = {};

      for (const track of winnersStats || []) {
        const canPull = await canPullReward1(
          track.blobName,
          account.address,
          yesterdayId
        );

        const canClaim = await canClaimReward1(
          track.blobName,
          account.address,
          yesterdayId
        );

        statuses[track.blobName] = {
          canPull,
          canClaim,
        };
      }

      set_reward_status(statuses);

    } catch (err) {
      console.error("Refresh reward status failed:", err);
      set_reward_status({});
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!connected || !signAndSubmitTransaction) {
        set_loading(false);
        return;
      }

      if (alreadyTriedRef.current) return;

      alreadyTriedRef.current = true;

      try {
        set_loading(true);

        await ensureYesterdaySettled(signAndSubmitTransaction);
        await refreshArenaStats();

      } catch (err) {
        console.error("Yesterday ranking auto settle failed:", err);

      } finally {
        set_loading(false);
      }
    };

    run();

  }, [
    connected,
    signAndSubmitTransaction,
  ]);

  useEffect(() => {
    refreshRewardStatus();
  }, [
    connected,
    account?.address,
    winnersStats,
  ]);

  const handlePullReward = async (BlobName1: string) => {
    if (!signAndSubmitTransaction) return;

    try {
      set_action_loading(`pull-${BlobName1}`);

      await pullReward1(signAndSubmitTransaction, BlobName1);
      await refreshArenaStats();
      await refreshRewardStatus();

    } catch (err) {
      console.error("Pull reward UI failed:", err);

    } finally {
      set_action_loading(null);
    }
  };

  const handleClaimReward = async (BlobName1: string) => {
    if (!signAndSubmitTransaction) return;

    try {
      set_action_loading(`claim-${BlobName1}`);

      await claimReward1(signAndSubmitTransaction, BlobName1);
      await refreshArenaStats();
      await refreshRewardStatus();

    } catch (err) {
      console.error("Claim reward UI failed:", err);

    } finally {
      set_action_loading(null);
    }
  };

  const ranking =
    (winnersStats || [])
      .slice(-5)
      .reverse()
      .map((t) => ({
        blobName: t.blobName,
        count: t.totalPower || 0,
        canPull: rewardStatus[t.blobName]?.canPull || false,
        canClaim: rewardStatus[t.blobName]?.canClaim || false,
      }));

  return (
    <div className="relative py-10 px-2 sm:px-4 select-none w-full min-w-0">
      <div className="absolute top-6 left-0 right-0 h-4 bg-gradient-to-b from-[#33001a] via-[var(--pink_main)] to-[#33001a] rounded-full shadow-[0_0_15px_rgba(255,46,144,0.5)] z-20" />

      <div className="relative bg-black/40 backdrop-blur-md border-x-[6px] sm:border-x-[10px] border-[var(--pink_main)]/30 pt-4 pb-8 px-3 sm:px-5 xl:px-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] min-w-0">
        <div className="relative z-10">
          <header className="flex items-center justify-center gap-3 border-b-2 border-[var(--pink_main)]/20 pb-3 mb-4">
            <Trophy
              className="text-[var(--pink_main)] animate-bounce shrink-0"
              size={18}
            />

            <h2 className="text-[13px] font-black text-white uppercase tracking-[0.1em] whitespace-nowrap shadow-[0_0_10px_rgba(255,46,144,0.3)]">
              Yesterday Ranking
            </h2>
          </header>

          {loading ? (
            <div className="flex flex-col items-center py-10 opacity-40 text-[var(--pink_main)]">
              <Loader2
                className="animate-spin"
                size={20}
              />
            </div>

          ) : ranking.length > 0 ? (
            <div className="flex flex-col gap-4">
              {ranking.map((t, i) => (
                <div
                  key={`${t.blobName}-${i}`}
                  className="flex items-center justify-between gap-3 xl:gap-4 border-b border-white/5 pb-3 min-w-0"
                >
                  <div className="flex items-center gap-3 xl:gap-4 min-w-0 flex-1">
                    <span className="bg-[var(--pink_main)] text-black w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-black shadow-[0_0_10px_rgba(255,46,144,0.5)] rotate-2 shrink-0">
                      {i + 1}
                    </span>

                    <span className="text-white/80 text-[11px] font-black uppercase tracking-wider truncate min-w-0">
                      {formatTitle1(t.blobName)}
                    </span>
                  </div>

                  <div className="flex gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => handlePullReward(t.blobName)}
                      disabled={
                        actionLoading !== null ||
                        !t.canPull
                      }
                      className="px-2 py-1 bg-green-500/20 border border-green-500/40 text-green-300 text-[9px] font-black uppercase rounded hover:bg-green-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {actionLoading === `pull-${t.blobName}` ? "..." : "Pull"}
                    </button>

                    <button
                      onClick={() => handleClaimReward(t.blobName)}
                      disabled={
                        actionLoading !== null ||
                        !t.canClaim
                      }
                      className="px-2 py-1 bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[9px] font-black uppercase rounded hover:bg-pink-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {actionLoading === `claim-${t.blobName}` ? "..." : "Claim"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          ) : (
            <div className="flex flex-col items-center py-6 opacity-40 text-white">
              <Ghost
                size={20}
                className="mb-2"
              />

              <span className="text-[9px] font-black uppercase tracking-widest text-center">
                No ranking data found for yesterday
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 h-4 bg-gradient-to-b from-[#33001a] via-[var(--pink_main)] to-[#33001a] rounded-full shadow-[0_0_15px_rgba(255,46,144,0.5)] z-20" />
    </div>
  );
}
