import {
  ShelbyClient as ShelbyBaseClient,
  createDefaultErasureCodingProvider,
  generateCommitments,
} from "@shelby-protocol/sdk/browser";
import {
  Aptos,
  AptosConfig,
  Network,
  InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";

const API_KEY1 = process.env.NEXT_PUBLIC_SHELBY_API_KEY || "";

// FIX: CẬP NHẬT TRỎ VỀ V3 ĐỂ ĐỒNG BỘ VỚI HOME VÀ CONTEXT
const CONTRACT_ADDRESS1 =
  "0x3fee4daed928f18f2c7d61da6ff596854bc3e6dc3f5c22f13bf4a9332631573e";
const MODULE_NAME1 = "sound_battle_v3";

const AptosClient1 = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
  }),
);

class shelby_service {
  private client: ShelbyBaseClient;

  constructor() {
    this.client = new ShelbyBaseClient({
      network: Network.TESTNET,
      apiKey: API_KEY1,
    });
  }

  private normalizeBlobName(fileName: string) {
    const dotIndex = fileName.lastIndexOf(".");
    const nameOnly = dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName;
    const extension = dotIndex > -1 ? fileName.slice(dotIndex) : "";

    const safeName = nameOnly
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 120);

    return `${safeName}${extension.toLowerCase()}`;
  }

  async store(file: File, signer: any, account: any) {
    try {
      if (!account?.address) {
        throw new Error("Wallet address is missing");
      }

      const blobName = this.normalizeBlobName(file.name);
      const data = new Uint8Array(await file.arrayBuffer());

      const provider = await createDefaultErasureCodingProvider();
      const commitments = await generateCommitments(provider, data);

      const payload: InputGenerateTransactionPayloadData = {
        function:
          "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a::blob_metadata::register_blob",
        typeArguments: [],
        functionArguments: [
          blobName,
          commitments.blob_merkle_root,
          commitments.raw_data_size,
          getExpirationTime(),
        ],
      };

      const tx = await signer({ data: payload });
      await AptosClient1.waitForTransaction({ transactionHash: tx.hash });

      const response = await this.client.rpc.putBlob({
        account: account.address,
        blobName: blobName,
        blobData: data,
      });

      return {
        success: true,
        txHash: tx.hash,
        blobName: blobName,
        response: response,
      };
    } catch (error) {
      console.error("Shelby store error:", error);
      throw error;
    }
  }

  async powerUp(blobName: string, amount: number, signer: any) {
    try {
      const octas = Math.floor(amount * 100_000_000);

      const payload: InputGenerateTransactionPayloadData = {
        function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::power_up`,
        typeArguments: [],
        functionArguments: [blobName, octas.toString()],
      };

      const tx = await signer({ data: payload });
      return await AptosClient1.waitForTransaction({
        transactionHash: tx.hash,
      });
    } catch (error) {
      console.error("Arena power up error:", error);
      throw error;
    }
  }

  async salute(blobName: string, signer: any) {
    try {
      const payload: InputGenerateTransactionPayloadData = {
        function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::salute`,
        typeArguments: [],
        functionArguments: [blobName],
      };

      const tx = await signer({ data: payload });
      return await AptosClient1.waitForTransaction({
        transactionHash: tx.hash,
      });
    } catch (error) {
      console.error("Arena salute error:", error);
      throw error;
    }
  }

  async joinArena(blobName: string, signer: any) {
    try {
      const payload: InputGenerateTransactionPayloadData = {
        function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::join_arena`,
        typeArguments: [],
        functionArguments: [blobName],
      };

      const tx = await signer({ data: payload });
      return await AptosClient1.waitForTransaction({
        transactionHash: tx.hash,
      });
    } catch (error) {
      console.error("Join arena error:", error);
      throw error;
    }
  }
}

export const ShelbyClient = new shelby_service();

export function getExpirationTime() {
  return (Date.now() + 1000 * 60 * 60 * 24 * 365) * 1000;
}
