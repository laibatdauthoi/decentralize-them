"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins } from "lucide-react";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

interface Token {
  symbol: string;
  amount: string;
  asset_type: string;
  icon?: string;
}

export default function BalancePage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllBalances = async () => {
      if (connected && account) {
        setLoading(true);
        try {
          const address = account.address.toString();

          const coinsData = await aptos.getAccountCoinsData({
            accountAddress: address,
          });

          const formattedTokens = coinsData
            .map((coin: any) => {
              const isApt =
                coin.asset_type === "0x1::aptos_coin::AptosCoin";

              const symbol = isApt
                ? "APT"
                : coin.metadata?.symbol || "TOKEN";

              const decimals = coin.metadata?.decimals || 8;

              const amount = (
                coin.amount / Math.pow(10, decimals)
              ).toFixed(2);

              const icon = isApt
                ? "https://raw.githubusercontent.com/hippospace/aptos-coin-list/main/icons/APT.webp"
                : coin.metadata?.icon_uri;

              return {
                symbol,
                amount,
                asset_type: coin.asset_type,
                icon,
              };
            })
            .filter(
              (t) =>
                t.asset_type === "0x1::aptos_coin::AptosCoin" ||
                t.symbol.toLowerCase().includes("shelby") ||
                t.asset_type.toLowerCase().includes("shelby")
            );

          setTokens(formattedTokens);
        } catch (e) {
          console.error("Error fetching assets:", e);
          setTokens([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAllBalances();
  }, [account, connected]);

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-start px-4">

      {/* BACK BUTTON (responsive + same style as wallet button) */}
      <div className="absolute top-2 right-2 z-50">
        <button
          onClick={() => router.back()}
          className="btn_primary gap-2 text-[11px] sm:text-[12px]"
        >
          BACK <ArrowRight size={16} />
        </button>
      </div>

      {/* CENTER CONTENT */}
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl flex flex-col items-center pt-10 sm:pt-14 lg:pt-16">

        {/* TITLE */}
        <div className="w-full text-center mb-3 sm:mb-6 lg:mb-8 px-2">
          <h2 className="neon_heading blink uppercase tracking-[0.2em] leading-tight text-[clamp(2rem,4vw,3.5rem)]">
            Portfolio
          </h2>
        </div>

        {/* PANEL */}
        <div className="glass_panel w-full p-2 sm:p-3 lg:p-4">

          <div className="flex flex-col gap-2 sm:gap-3">

            {loading ? (
              <div className="text-center py-10 animate-pulse text-[var(--pink_main)] text-[14px] sm:text-[16px] lg:text-[18px] font-black uppercase">
                Scanning...
              </div>
            ) : tokens.length > 0 ? (
              tokens.map((token, index) => (
                <div
                  key={index}
                  className="inner_card hover:border-[var(--pink_main)] transition-all group"
                  style={{
                    height: "clamp(64px, 8vw, 80px)",
                    padding: "0 clamp(6px, 1.5vw, 12px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: "9999px",
                  }}
                >
                  <div className="flex items-center min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-neutral-950 border border-[var(--pink_main)]/50 flex items-center justify-center overflow-hidden shrink-0">
                      {token.icon ? (
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Coins size={18} className="text-[var(--pink_main)]" />
                      )}
                    </div>

                    <h3
                      className="font-black uppercase tracking-wide truncate"
                      style={{
                        marginLeft: "clamp(10px, 2vw, 16px)",
                        fontSize: "clamp(14px, 2.5vw, 20px)",
                      }}
                    >
                      {token.symbol}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className="font-black text-[var(--pink_main)] leading-none"
                      style={{
                        fontSize: "clamp(18px, 3vw, 32px)",
                      }}
                    >
                      {token.amount}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-30 text-[10px] sm:text-[12px] uppercase italic">
                No assets found
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}