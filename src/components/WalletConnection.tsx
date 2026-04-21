"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { User, Wallet, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function WalletConnection() {
  const { connect, disconnect, connected, account, wallets } = useWallet();
  const [is_menu_open, set_is_menu_open] = useState(false);
  const menu_ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menu_ref.current && !menu_ref.current.contains(e.target as Node)) {
        set_is_menu_open(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doConnect = () => {
    const Petra = wallets.find(w => w.name === "Petra");
    Petra ? connect(Petra.name) : window.open("https://petra.app/", "_blank");
  };

  if (!connected || !account) {
    return (
      <div className="relative inline-block" ref={menu_ref}>
        <button onClick={doConnect} className="btn_primary">
          connect wallet
        </button>
      </div>
    );
  }

  const address_str = account.address.toString();
  const short_address = `${address_str.slice(0, 6)}...${address_str.slice(-4)}`;

  const goToBalance = () => {
    set_is_menu_open(false);
    router.push("/balance");
  };

  const goToProfile = () => {
    set_is_menu_open(false);
    router.push("/profile");
  };

  return (
    <div className="relative inline-block" ref={menu_ref}>
      
      {/* MAIN BUTTON */}
      <button
        onClick={() => set_is_menu_open(!is_menu_open)}
        className="btn_primary gap-3"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
        <span>{short_address}</span>

        <svg
          className={`w-3 h-3 opacity-70 transition-transform duration-300 ${
            is_menu_open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* DROPDOWN */}
{is_menu_open && (
  <div className="dropdown_menu absolute top-full left-1/2 mt-2 z-50 w-max max-w-[90vw] -translate-x-1/2">
    <div className="py-2">

      <button onClick={goToProfile} className="dropdown_item">
        <User size={14} />
        <span>profile</span>
      </button>

      <button onClick={goToBalance} className="dropdown_item">
        <Wallet size={14} />
        <span>balance</span>
      </button>

      <div className="dropdown_divider"></div>

      <button
        onClick={() => {
          disconnect();
          set_is_menu_open(false);
        }}
        className="dropdown_item text-[var(--pink_main)]"
      >
        <LogOut size={14} />
        <span>disconnect</span>
      </button>

    </div>
  </div>
)}
    </div>
  );
}