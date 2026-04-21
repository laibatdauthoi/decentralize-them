"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAccountBlobs } from "@shelby-protocol/react";
import { UploadButton } from "@/components/UploadButton";
import { TrackList } from "@/components/TrackList";
import { useMusic } from "@/components/MusicContext";

const AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".m4a",
  ".aac",
  ".opus",
  ".wma",
  ".aiff",
];

const isAudioFile = (fileName: string) => {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

export default function ProfilePage() {
  const router = useRouter();
  const { account } = useWallet();
  const { playTrack } = useMusic();

  const walletAddress = useMemo(
    () => account?.address?.toString(),
    [account]
  );

  const {
    data: blobList,
    isLoading,
    error,
    refetch,
  } = useAccountBlobs({
    account: walletAddress || "",
    pagination: { limit: 100, offset: 0 },
  });

  const tracks = useMemo(() => {
    return (blobList || [])
      .filter((blob: any) => {
        const fileName = blob.name.split("/").pop() || "";
        return isAudioFile(fileName);
      })
      .map((blob: any, index: number) => ({
        id: blob.name || index,
        title: blob.name.split("/").pop() || blob.name,
        size: blob.size,
        createdAt: blob.created_at,
        blobName: blob.name,
        walletAddress: walletAddress || "",
      }));
  }, [blobList, walletAddress]);

  const handlePlay = async (blobName: string) => {
    if (!walletAddress) return;

    await playTrack({
      title: blobName.split("/").pop() || blobName,
      blobName,
      walletAddress,
    });
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center px-4 pt-6">
      <div className="absolute top-2 right-2 z-50">
        <button
          onClick={() => router.back()}
          className="btn_primary gap-2 text-[11px] sm:text-[12px]"
        >
          BACK <ArrowRight size={16} />
        </button>
      </div>

      <div className="w-full max-w-[850px] flex flex-col items-center">
        <header className="w-full text-center mb-4">
          <h2 className="neon_heading blink uppercase tracking-[0.2em] leading-tight text-[clamp(2rem,4vw,3.5rem)]">
            My Studio
          </h2>
        </header>

        <div className="mb-8 flex justify-center w-full">
          <div className="w-full max-w-[420px] flex justify-center">
            <UploadButton onUploaded={refetch} />
          </div>
        </div>

        <div className="w-full flex flex-col gap-8">
          <section className="glass_panel w-full !p-4 !border-[3px]">
            <TrackList
              tracks={tracks}
              isLoading={isLoading}
              error={error}
            />
          </section>
        </div>
      </div>
    </section>
  );
}