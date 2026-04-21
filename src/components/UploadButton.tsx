"use client";

import { Plus, Loader2, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUploadBlobs, useBlobMetadata } from "@shelby-protocol/react";
import { useQueryClient } from "@tanstack/react-query";

interface UploadButtonProps {
  onUploaded?: () => void | Promise<any>;
}

export function UploadButton({
  onUploaded,
}: UploadButtonProps) {
  const [Mounted1, set_mounted] = useState(false);
  const [ShowSuccess1, set_show_success] = useState(false);
  const [ShowRejected1, set_show_rejected] = useState(false);
  const [ShowError1, set_show_error] = useState(false);
  const [ShowDuplicate1, set_show_duplicate] = useState(false);

  const [IsSigning1, set_is_signing] = useState(false);
  const [IsStoring1, set_is_storing] = useState(false);

  const [CheckingName1, set_checking_name] = useState("");
  const [PendingFile1, set_pending_file] = useState<File | null>(null);

  const QueryClient1 = useQueryClient();
  const { connected, account, signAndSubmitTransaction } =
    useWallet();

  const WalletAddress1 =
    account?.address?.toString() || "";

  const { data: Metadata1, isFetching: IsChecking1 } =
    useBlobMetadata({
      account: WalletAddress1,
      name: CheckingName1,
    });

  const { mutateAsync: UploadAsync1 } = useUploadBlobs({
    queryClient: QueryClient1,
  });

  useEffect(() => {
    set_mounted(true);
  }, []);

  useEffect(() => {
    if (!CheckingName1 || IsChecking1 || !PendingFile1)
      return;

    if (Metadata1) {
      set_show_duplicate(true);
      set_checking_name("");
      set_pending_file(null);
      return;
    }

    startUpload1(PendingFile1, CheckingName1);
    set_checking_name("");
    set_pending_file(null);
  }, [Metadata1, IsChecking1, CheckingName1, PendingFile1]);

  useEffect(() => {
    let Timer1: NodeJS.Timeout | undefined;

    if (
      ShowSuccess1 ||
      ShowRejected1 ||
      ShowError1 ||
      ShowDuplicate1
    ) {
      Timer1 = setTimeout(() => {
        set_show_success(false);
        set_show_rejected(false);
        set_show_error(false);
        set_show_duplicate(false);
      }, 3000);
    }

    return () => {
      if (Timer1) clearTimeout(Timer1);
    };
  }, [
    ShowSuccess1,
    ShowRejected1,
    ShowError1,
    ShowDuplicate1,
  ]);

  const slugify1 = (Str1: string) => {
    return Str1
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-zA-Z0-9./-]/g, " ")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const startUpload1 = async (
    File1: File,
    SafeName1: string
  ) => {
    try {
      if (!account?.address) {
        set_show_error(true);
        return;
      }

      const Data1 = new Uint8Array(await File1.arrayBuffer());

      set_is_signing(true);
      set_is_storing(false);

      await UploadAsync1({
        signer: {
          account: account.address,
          signAndSubmitTransaction,
        },
        blobs: [
          {
            blobName: SafeName1,
            blobData: Data1,
          },
        ],
        expirationMicros:
          (Date.now() + 365 * 24 * 60 * 60 * 1000) * 1000,
      });

      set_is_signing(false);
      set_is_storing(true);

      // refresh track list ngay sau upload
      await onUploaded?.();

      await new Promise((Resolve1) =>
        setTimeout(Resolve1, 1000)
      );

      set_is_storing(false);
      set_show_success(true);
    } catch (Err1: any) {
      console.error("Upload error:", Err1);

      set_is_signing(false);
      set_is_storing(false);

      const Msg1 = (Err1?.message || "").toLowerCase();

      if (
        Msg1.includes("reject") ||
        Msg1.includes("denied") ||
        Msg1.includes("cancel") ||
        Err1?.code === 4001
      ) {
        set_show_rejected(true);
      } else {
        set_show_error(true);
      }
    }
  };

  const handleFileChange = (
    Event1: React.ChangeEvent<HTMLInputElement>
  ) => {
    const File1 = Event1.target.files?.[0];

    if (!connected || !account || !File1) return;

    set_checking_name(slugify1(File1.name));
    set_pending_file(File1);

    Event1.target.value = "";
  };

  if (!Mounted1) return null;

  const renderStatusText1 = () => {
    if (IsChecking1) return "CHECKING...";
    if (IsSigning1) return "AWAITING WALLET...";
    if (IsStoring1) return "STORING...";
    if (ShowSuccess1) return "UPLOAD COMPLETED!";
    if (ShowDuplicate1) return "FILE ALREADY EXISTS!";
    if (ShowRejected1) return "REJECTED!";
    if (ShowError1) return "FAILED!";
    return "UPLOAD";
  };

  const IsLoading1 =
    IsChecking1 || IsSigning1 || IsStoring1;

  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      <label
        className={`
          plus_btn_neon w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-300
          ${
            IsLoading1
              ? "opacity-50 pointer-events-none"
              : "hover:scale-110 active:scale-95"
          }
          ${
            ShowSuccess1
              ? "border-green-400 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]"
              : ""
          }
          ${
            ShowDuplicate1 || IsSigning1 || IsStoring1
              ? "border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              : ""
          }
          ${
            !ShowSuccess1 &&
            !ShowDuplicate1 &&
            !IsLoading1
              ? "text-[var(--pink_main)]"
              : ""
          }
          cursor-pointer
        `}
      >
        <input
          type="file"
          className="hidden"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={IsLoading1}
        />

        {IsLoading1 ? (
          <Loader2 className="animate-spin" size={28} />
        ) : ShowSuccess1 ? (
          <Check size={32} />
        ) : ShowDuplicate1 ? (
          <AlertCircle size={32} />
        ) : (
          <Plus size={32} />
        )}
      </label>

      <span
        className={`
          text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap
          ${IsLoading1 || ShowDuplicate1 ? "text-yellow-500" : ""}
          ${ShowSuccess1 ? "text-green-400" : ""}
          ${ShowError1 ? "text-red-500" : ""}
          ${
            !ShowSuccess1 &&
            !ShowDuplicate1 &&
            !ShowError1 &&
            !IsLoading1
              ? "text-[var(--pink_main)] opacity-80"
              : ""
          }
        `}
      >
        {renderStatusText1()}
      </span>
    </div>
  );
}