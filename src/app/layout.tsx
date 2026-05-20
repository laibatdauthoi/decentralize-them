import type { Metadata } from "next";
import "./globals.css";
import { AppProviders as app_providers } from "@/components/AppProviders";
import { MusicProvider } from "@/components/MusicContext";
import { MusicPlayerBar } from "@/components/MusicPlayerBar";

export const metadata: Metadata = {
  title: "decentralize them",
  description: "Decentralized Music",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const Providers = app_providers;

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <MusicProvider>
          <Providers>
            
            {/* FULL SCREEN APP AREA */}
            <div className="min-h-screen w-full flex flex-col">
              <main className="flex-1 w-full pb-24">
                {children}
              </main>
            </div>

            {/* render outside app shell */}
            <MusicPlayerBar />

          </Providers>
        </MusicProvider>
      </body>
    </html>
  );
}