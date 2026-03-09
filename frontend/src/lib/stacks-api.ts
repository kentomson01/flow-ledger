import {
  fetchCallReadOnlyFunction,
  standardPrincipalCV,
  ClarityType,
} from "@stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  getStacksApiBase,
} from "@/lib/constants";

type Network = "testnet" | "mainnet";

export async function fetchStxBalance(
  address: string,
  network: Network
): Promise<number> {
  const base = getStacksApiBase(network);
  const res = await fetch(`${base}/v2/accounts/${encodeURIComponent(address)}?proof=0`);
  if (!res.ok) return 0;
  const data = await res.json();
  // balance is hex-encoded u128
  const microStx = parseInt(data.balance, 16);
  return microStx / 1_000_000;
}

export async function fetchSbtcBalance(
  address: string,
  network: Network
): Promise<number> {
  const base = getStacksApiBase(network);
  const sbtcContract =
    network === "mainnet"
      ? "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4"
      : "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT";
  const res = await fetch(
    `${base}/v1/accounts/${encodeURIComponent(address)}/ft/${sbtcContract}.sbtc-token/balance`
  );
  if (!res.ok) return 0;
  const data = await res.json();
  const sats = parseInt(data.balance || "0", 10);
  return sats / 100_000_000;
}

export interface BusinessInfo {
  registered: boolean;
  orgId: number | null;
}

export async function fetchBusinessInfo(
  address: string,
  network: Network
): Promise<BusinessInfo> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-business-info",
      functionArgs: [standardPrincipalCV(address)],
      senderAddress: address,
      network,
    });

    if (result.type === ClarityType.OptionalSome) {
      const tuple = result.value;
      const orgIdVal = tuple.data["org-id"];
      const orgId =
        orgIdVal.type === ClarityType.OptionalSome
          ? Number(orgIdVal.value.value)
          : null;
      return { registered: true, orgId };
    }
    return { registered: false, orgId: null };
  } catch {
    return { registered: false, orgId: null };
  }
}

export async function fetchFreelancerStatus(
  address: string,
  network: Network
): Promise<boolean> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-freelancer-registered",
      functionArgs: [standardPrincipalCV(address)],
      senderAddress: address,
      network,
    });
    return result.type === ClarityType.BoolTrue;
  } catch {
    return false;
  }
}
