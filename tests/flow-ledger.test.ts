
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const contract = "flow-ledger";
const sbtcAsset = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token";

function getStxBalance(addr: string): bigint {
  return simnet.getAssetsMap().get("STX")?.get(addr) ?? 0n;
}

function getFtTransfers(events: any[]): Array<{sender: string, recipient: string, amount: bigint}> {
  return events
    .filter((e: any) => e.event === "ft_transfer_event")
    .map((e: any) => ({
      sender: e.data.sender,
      recipient: e.data.recipient,
      amount: BigInt(e.data.amount),
    }));
}

// ============================================================
// Business Registration
// ============================================================
describe("Business Registration", () => {
  it("registers a new business", () => {
    const { result } = simnet.callPublicFn(contract, "register-business", [], wallet1);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents duplicate registration", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    const { result } = simnet.callPublicFn(contract, "register-business", [], wallet1);
    expect(result).toBeErr(Cl.uint(101));
  });

  it("returns business info after registration", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    const { result } = simnet.callReadOnlyFn(contract, "get-business-info", [Cl.principal(wallet1)], wallet1);
    expect(result).toBeSome(
      Cl.tuple({ registered: Cl.bool(true), "org-id": Cl.none() })
    );
  });
});