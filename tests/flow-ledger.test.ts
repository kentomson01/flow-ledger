
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

// ============================================================
// Organization Management
// ============================================================
describe("Organization Management", () => {
  it("creates an organization for a registered business", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    const { result } = simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);
    expect(result).toBeOk(Cl.uint(1));
  });

  it("fails if business is not registered", () => {
    const { result } = simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Unknown")], wallet2);
    expect(result).toBeErr(Cl.uint(102));
  });

  it("prevents creating a second organization", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);
    const { result } = simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme 2")], wallet1);
    expect(result).toBeErr(Cl.uint(103));
  });

  it("returns org info after creation", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);
    const { result } = simnet.callReadOnlyFn(contract, "get-org-info", [Cl.uint(1)], wallet1);
    expect(result).toBeSome(
      Cl.tuple({ owner: Cl.principal(wallet1), name: Cl.stringAscii("Acme Corp") })
    );
  });
});

// ============================================================
// Freelancer Registration
// ============================================================
describe("Freelancer Registration", () => {
  it("registers a freelancer", () => {
    const { result } = simnet.callPublicFn(contract, "register-freelancer", [], wallet2);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("confirms freelancer is registered", () => {
    simnet.callPublicFn(contract, "register-freelancer", [], wallet2);
    const { result } = simnet.callReadOnlyFn(contract, "is-freelancer-registered", [Cl.principal(wallet2)], wallet2);
    expect(result).toBeBool(true);
  });

  it("returns false for unregistered freelancer", () => {
    const { result } = simnet.callReadOnlyFn(contract, "is-freelancer-registered", [Cl.principal(wallet3)], wallet3);
    expect(result).toBeBool(false);
  });
});

// ============================================================
// STX Payroll
// ============================================================
describe("STX Payroll", () => {
  it("executes a single STX payment", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);

    const { result, events } = simnet.callPublicFn(
      contract, "execute-payroll",
      [Cl.principal(wallet2), Cl.uint(1000000)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    const stxTransfer = events.find((e: any) => e.event === "stx_transfer_event");
    expect(stxTransfer).toBeDefined();
  });

  it("fails for unregistered business", () => {
    const { result } = simnet.callPublicFn(
      contract, "execute-payroll",
      [Cl.principal(wallet2), Cl.uint(1000000)],
      wallet3
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("fails for business without an organization", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    const { result } = simnet.callPublicFn(
      contract, "execute-payroll",
      [Cl.principal(wallet2), Cl.uint(1000000)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("fails for zero amount", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);
    const { result } = simnet.callPublicFn(
      contract, "execute-payroll",
      [Cl.principal(wallet2), Cl.uint(0)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(105));
  });
});

// ============================================================
// STX Batch Payroll
// ============================================================
describe("STX Batch Payroll", () => {
  it("executes batch payroll to multiple recipients", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);

    const recipients = Cl.list([
      Cl.tuple({ to: Cl.principal(wallet2), ustx: Cl.uint(500000) }),
      Cl.tuple({ to: Cl.principal(wallet3), ustx: Cl.uint(300000) }),
    ]);

    const { result } = simnet.callPublicFn(
      contract, "execute-batch-payroll",
      [recipients, Cl.stringAscii("March-2026")],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("fails for empty recipient list", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);

    const { result } = simnet.callPublicFn(
      contract, "execute-batch-payroll",
      [Cl.list([]), Cl.stringAscii("March-2026")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(105));
  });
});

// ============================================================
// sBTC Payroll
// ============================================================
describe("sBTC Payroll", () => {
  it("executes a single sBTC payment", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);

    const { result } = simnet.callPublicFn(
      contract, "execute-sbtc-payroll",
      [Cl.principal(wallet2), Cl.uint(100000)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("fails for unregistered business", () => {
    const { result } = simnet.callPublicFn(
      contract, "execute-sbtc-payroll",
      [Cl.principal(wallet2), Cl.uint(100000)],
      wallet3
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("fails for business without an organization", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    const { result } = simnet.callPublicFn(
      contract, "execute-sbtc-payroll",
      [Cl.principal(wallet2), Cl.uint(100000)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("fails for zero amount", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);
    const { result } = simnet.callPublicFn(
      contract, "execute-sbtc-payroll",
      [Cl.principal(wallet2), Cl.uint(0)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(105));
  });
});

// ============================================================
// sBTC Batch Payroll
// ============================================================
describe("sBTC Batch Payroll", () => {
  it("executes batch sBTC payroll to multiple recipients", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);

    const recipients = Cl.list([
      Cl.tuple({ to: Cl.principal(wallet2), amount: Cl.uint(50000) }),
      Cl.tuple({ to: Cl.principal(wallet3), amount: Cl.uint(30000) }),
    ]);

    const { result } = simnet.callPublicFn(
      contract, "execute-batch-sbtc-payroll",
      [recipients, Cl.stringAscii("March-2026")],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("fails for empty recipient list", () => {
    simnet.callPublicFn(contract, "register-business", [], wallet1);
    simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);

    const { result } = simnet.callPublicFn(
      contract, "execute-batch-sbtc-payroll",
      [Cl.list([]), Cl.stringAscii("March-2026")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(105));
  });

  it("fails for unregistered business", () => {
    const recipients = Cl.list([
      Cl.tuple({ to: Cl.principal(wallet2), amount: Cl.uint(50000) }),
    ]);
    const { result } = simnet.callPublicFn(
      contract, "execute-batch-sbtc-payroll",
      [recipients, Cl.stringAscii("March-2026")],
      wallet3
    );
    expect(result).toBeErr(Cl.uint(102));
  });
});

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe("Integration: Full STX Payroll Workflow", () => {
  it("business registers, creates org, freelancers register, pays them, verifies balances", () => {
    // Step 1: Business registers
    const reg = simnet.callPublicFn(contract, "register-business", [], wallet1);
    expect(reg.result).toBeOk(Cl.bool(true));

    // Step 2: Business creates organization
    const org = simnet.callPublicFn(contract, "create-organization", [Cl.stringAscii("Acme Corp")], wallet1);
    expect(org.result).toBeOk(Cl.uint(1));

    // Step 3: Verify business state updated with org-id
    const bizInfo = simnet.callReadOnlyFn(contract, "get-business-info", [Cl.principal(wallet1)], wallet1);
    expect(bizInfo.result).toBeSome(
      Cl.tuple({ registered: Cl.bool(true), "org-id": Cl.some(Cl.uint(1)) })
    );

    // Step 4: Freelancers register
    simnet.callPublicFn(contract, "register-freelancer", [], wallet2);
    simnet.callPublicFn(contract, "register-freelancer", [], wallet3);

    // Step 5: Get balances before payroll
    const payerBalanceBefore = getStxBalance(wallet1);
    const recipient1Before = getStxBalance(wallet2);
    const recipient2Before = getStxBalance(wallet3);

    // Step 6: Execute single STX payment to freelancer 1
    const pay1 = simnet.callPublicFn(
      contract, "execute-payroll",
      [Cl.principal(wallet2), Cl.uint(5000000)],
      wallet1
    );
    expect(pay1.result).toBeOk(Cl.bool(true));

    // Step 7: Execute single STX payment to freelancer 2
    const pay2 = simnet.callPublicFn(
      contract, "execute-payroll",
      [Cl.principal(wallet3), Cl.uint(3000000)],
      wallet1
    );
    expect(pay2.result).toBeOk(Cl.bool(true));

    // Step 8: Verify balances after payments
    const payerBalanceAfter = getStxBalance(wallet1);
    const recipient1After = getStxBalance(wallet2);
    const recipient2After = getStxBalance(wallet3);

    expect(recipient1After - recipient1Before).toBe(5000000n);
    expect(recipient2After - recipient2Before).toBe(3000000n);
    expect(payerBalanceBefore - payerBalanceAfter).toBe(8000000n);
  });
});