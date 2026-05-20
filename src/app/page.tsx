"use client";

import { WalletConnection } from "@/components/WalletConnection";
import HomePlaylist from "@/components/HomePlaylist";
import YesterdayRanking from "@/components/YesterdayRanking";
import { useMusic } from "@/components/MusicContext";

export default function Home() {
  const { formatTitle1 } = useMusic();

  return (
    <section className="relative w-full min-h-screen pt-20 px-0 z-20 scrollbar-hide">
      
      {/* HEADER SECTION */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-md z-40 border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-6 h-full flex items-center justify-between">
          <h1 className="neon_heading blink leading-none">
            decentralize them
          </h1>
          <div className="flex items-center">
            <WalletConnection />
          </div>
        </div>
      </div>

      {/* CONTENT SECTION - Chia đôi 50/50 */}
      <div className="hidden lg:block w-full max-w-[1600px] mx-auto pb-40 px-4 xl:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 xl:gap-6 items-start">
          
          {/* CỘT TRÁI (Bảng xếp hạng): Chiếm nửa trái, đứng im khi cuộn */}
          <div className="lg:w-1/2 sticky top-24 self-start order-1 min-w-0">
             <div className="pr-4"> {/* Padding nhẹ để không dính vào playlist */}
                <YesterdayRanking formatTitle1={formatTitle1} />
             </div>
          </div>

          {/* CỘT PHẢI (Playlist): Chiếm nửa phải, cuộn dọc */}
          <div className="w-full lg:w-1/2 order-2 min-w-0">
            <div className="pl-2 xl:pl-4 border-l border-white/5">
               <HomePlaylist />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile view - Hiện bảng xếp hạng trước playlist khi trên điện thoại */}
      <div className="lg:hidden px-3 sm:px-6 flex flex-col gap-8 pb-28 relative z-10">
        <YesterdayRanking formatTitle1={formatTitle1} />
        <HomePlaylist />
      </div>

      {/* Nền Gradient mờ ảo */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_rgba(236,72,153,0.05),transparent_70%)] -z-10" />
    </section>
  );
}
