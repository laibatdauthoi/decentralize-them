"use client";

import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { PetraWallet } from "petra-plugin-wallet-adapter";

import { ShelbyClientProvider } from "@shelby-protocol/react";
import { ShelbyClient as ShelbyBrowserClient } from "@shelby-protocol/sdk/browser";

const query_client = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  const wallets = useMemo(() => [new PetraWallet()], []);

  const shelby_client = useMemo(
    () =>
      new ShelbyBrowserClient({
        network: Network.TESTNET,
        apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || "",
      }),
    []
  );

  return (
    <QueryClientProvider client={query_client}>
      <AptosWalletAdapterProvider
        plugins={wallets}
        autoConnect={true}
        dappConfig={{
          network: Network.TESTNET,
          aptosApiKeys: {
            testnet: process.env.NEXT_PUBLIC_TESTNET_API_KEY,
          },
        }}
        onError={(error) => {
          console.error("Aptos Wallet Error:", error);
        }}
      >
        <ShelbyClientProvider client={shelby_client}>
          {children}
        </ShelbyClientProvider>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}