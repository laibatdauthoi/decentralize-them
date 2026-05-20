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

// CẬP NHẬT: Trỏ về Resource Account (V5) thay vì ví cá nhân
const CONTRACT_ADDRESS1 =
  process.env.NEXT_PUBLIC_MODULE_ADDRESS ||
  "0x43e0fda1b177c5bc3761edcf4052825387065e7d76c8200e16eac0e6de174629";
const MODULE_NAME1 = "sound_battle_v5";

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

  // Lấy sự kiện để làm Ranking
  async getArenaEvents() {
    try {
      const query = `
        query getEvents($address: String!) {
          events(where: { account_address: { _eq: $address } }, order_by: { transaction_block_height: desc }) {
            data
            type
          }
        }
      `;
      const res = await fetch(
        "https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql",
        {
          method: "POST",
          body: JSON.stringify({
            query,
            variables: { address: CONTRACT_ADDRESS1 },
          }),
        },
      );
      const json = await res.json();
      return json.data.events;
    } catch (e) {
      console.error("Fetch events error:", e);
      return [];
    }
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

  // SỬA: Đổi tên hàm power_up thành push_song theo code Move V5
  async powerUp(blobName: string, amount: number, signer: any) {
    try {
      const octas = Math.floor(amount * 100_000_000);

      const payload: InputGenerateTransactionPayloadData = {
        function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::push_song`,
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

  // SỬA: Đổi tên hàm salute thành love_song theo code Move V5
  async salute(blobName: string, signer: any) {
    try {
      const payload: InputGenerateTransactionPayloadData = {
        function: `${CONTRACT_ADDRESS1}::${MODULE_NAME1}::love_song`,
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
