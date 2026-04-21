import { WalletConnection } from "@/components/WalletConnection";
import HomePlaylist from "@/components/HomePlaylist"; // Nhớ kiểm tra đường dẫn file này

export default function Home() {
  return (
    <section className="relative w-full min-h-screen pt-20 px-0 z-20 overflow-y-auto scrollbar-hide">
      
      {/* HEADER SECTION - Giữ nguyên Title và Wallet ở vị trí cũ */}
      <div className="fixed top-0 left-0 right-0 h-15 bg-black/50 backdrop-blur-md z-30 pointer-events-none">
        <div className="absolute top-2 left-2 pointer-events-auto">
          <h1 className="neon_heading blink leading-none">
            decentralize them
          </h1>
        </div>

        <div className="absolute top-2 right-2 pointer-events-auto">
          <WalletConnection />
        </div>
      </div>

      {/* CONTENT SECTION - Nơi danh sách 20 bài Boost hiện lên */}
      <div className="w-full max-w-5xl mx-auto pb-40 relative z-10">
        <HomePlaylist />
      </div>

      {/* Trang trí thêm một chút hiệu ứng nền nếu mày muốn nó "Cyber" hơn */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_rgba(236,72,153,0.05),transparent_70%)]" />
    </section>
  );
}