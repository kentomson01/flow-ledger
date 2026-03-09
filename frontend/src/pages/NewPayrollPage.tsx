import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { truncateAddress, formatCurrency } from "@/lib/mock-data";
import { loadTeam, isValidStxAddress } from "@/lib/team-utils";
import { useApp } from "@/contexts/AppContext";
import { MAX_BATCH_SIZE, getExplorerTxUrl, getErrorMessage } from "@/lib/constants";
import type { CurrencyType } from "@/lib/constants";
import { executePayrollContract } from "@/lib/stacks-payroll";
import { savePayrollRun, generatePayrollId } from "@/lib/payroll-storage";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink, User, Users, Upload } from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;
type PayMode = "single" | "batch";

interface PayItem {
  address: string;
  name: string;
  amount: string;
}

const STEP_LABELS = ["Configure", "Review", "Processing", "Result"] as const;

function StepAnnouncer({ step }: { step: Step }) {
  return (
    <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
      Step {step} of 4: {STEP_LABELS[step - 1]}
    </div>
  );
}

function isValidAmount(val: string): boolean {
  const n = parseFloat(val);
  return !isNaN(n) && n > 0;
}

export default function NewPayrollPage() {
  const navigate = useNavigate();
  const { wallet, network } = useApp();
  const team = useMemo(() => loadTeam(network), [network]);
  const [step, setStep] = useState<Step>(1);
  const [currency, setCurrency] = useState<CurrencyType>("STX");
  const [mode, setMode] = useState<PayMode>("single");
  const [periodRef, setPeriodRef] = useState("");
  const [items, setItems] = useState<PayItem[]>(() => [{ address: team[0]?.address || "", name: team[0]?.displayName || "", amount: "" }]);
  const [result, setResult] = useState<"success" | "fail">("success");
  const [errorCode, setErrorCode] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [touched, setTouched] = useState<Set<number>>(new Set());

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const duplicateAddresses = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    items.forEach((i) => {
      if (i.address && seen.has(i.address)) dupes.add(i.address);
      seen.add(i.address);
    });
    return dupes;
  }, [items]);

  const balanceExceeded = currency === "STX"
    ? total > wallet.stxBalance
    : total > wallet.sbtcBalance;

  const hasDuplicates = duplicateAddresses.size > 0;
  const batchLimitExceeded = items.length > MAX_BATCH_SIZE;

  const allItemsValid = items.every((i) => i.address && isValidAmount(i.amount));
  const canProceed = allItemsValid && !hasDuplicates && !batchLimitExceeded && periodRef.trim().length > 0;

  const addItem = () => {
    if (items.length >= MAX_BATCH_SIZE) {
      toast.error(`Maximum ${MAX_BATCH_SIZE} recipients per batch`);
      return;
    }
    setItems([...items, { address: "", name: "", amount: "" }]);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length === 0) { toast.error("CSV file is empty"); return; }

      // Skip header row if it contains "address"
      const startIdx = lines[0].toLowerCase().includes("address") ? 1 : 0;
      const errors: string[] = [];
      const parsed: PayItem[] = [];
      const seenAddresses = new Set(items.filter((i) => i.address).map((i) => i.address));

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const address = cols[0] || "";
        const amountStr = cols[1] || "";
        const name = cols[2] || "";
        const rowNum = i + 1;

        if (!isValidStxAddress(address)) {
          errors.push(`Row ${rowNum}: invalid address`);
          continue;
        }
        if (!isValidAmount(amountStr)) {
          errors.push(`Row ${rowNum}: invalid amount`);
          continue;
        }
        if (seenAddresses.has(address)) {
          errors.push(`Row ${rowNum}: duplicate address`);
          continue;
        }
        seenAddresses.add(address);

        const found = team.find((r) => r.address === address);
        parsed.push({ address, amount: amountStr, name: name || found?.displayName || "" });
      }

      const slotsAvailable = MAX_BATCH_SIZE - items.length;
      const toAdd = parsed.slice(0, slotsAvailable);

      if (parsed.length > slotsAvailable) {
        toast.warning(`Only ${slotsAvailable} slots available. Imported ${toAdd.length} of ${parsed.length} recipients.`);
      }

      if (errors.length > 0) {
        toast.error(errors.slice(0, 3).join("\n") + (errors.length > 3 ? `\n...and ${errors.length - 3} more` : ""));
      }

      if (toAdd.length > 0) {
        const newItems = [...items, ...toAdd];
        setItems(newItems);
        setTouched((prev) => {
          const next = new Set(prev);
          for (let i = items.length; i < newItems.length; i++) next.add(i);
          return next;
        });
        toast.success(`Imported ${toAdd.length} recipient${toAdd.length > 1 ? "s" : ""}`);
        if (mode !== "batch") setMode("batch");
      }
    };
    reader.readAsText(file);
  };

  const updateItem = (idx: number, field: keyof PayItem, value: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "address") {
      const found = team.find((r) => r.address === value);
      if (found) updated[idx].name = found.displayName;
    }
    setItems(updated);
  };

  const markTouched = (idx: number) => {
    setTouched((prev) => new Set(prev).add(idx));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    setTouched((prev) => {
      const next = new Set<number>();
      prev.forEach((v) => { if (v < idx) next.add(v); else if (v > idx) next.add(v - 1); });
      return next;
    });
  };

  const executePayroll = async () => {
    if (!wallet.address) {
      toast.error("Wallet not connected");
      return;
    }
    setStep(3);
    try {
      const payrollResult = await executePayrollContract({
        sender: wallet.address,
        recipients: items
          .filter((i) => parseFloat(i.amount) > 0)
          .map((i) => ({ address: i.address, amount: parseFloat(i.amount) })),
        currency,
        periodRef,
        network,
      });

      if (payrollResult.userRejected) {
        toast.info("Transaction cancelled by user");
        setStep(2);
        return;
      }

      const validItems = items.filter((i) => parseFloat(i.amount) > 0);

      if (payrollResult.success && payrollResult.txId) {
        setResult("success");
        setTxHash(payrollResult.txId);
        savePayrollRun({
          id: generatePayrollId(),
          type: currency,
          recipients: validItems.map((i) => ({ address: i.address, name: i.name, amount: parseFloat(i.amount) })),
          totalAmount: total,
          status: "pending",
          txHash: payrollResult.txId,
          errorCode: null,
          period: periodRef,
          network,
          createdAt: new Date().toISOString(),
        });
        setStep(4);
      } else {
        const code = payrollResult.errorCode || "u100";
        setResult("fail");
        setErrorCode(code);
        savePayrollRun({
          id: generatePayrollId(),
          type: currency,
          recipients: validItems.map((i) => ({ address: i.address, name: i.name, amount: parseFloat(i.amount) })),
          totalAmount: total,
          status: "failed",
          txHash: null,
          errorCode: code,
          period: periodRef,
          network,
          createdAt: new Date().toISOString(),
        });
        setStep(4);
      }
    } catch {
      setResult("fail");
      setErrorCode("u107");
      savePayrollRun({
        id: generatePayrollId(),
        type: currency,
        recipients: items.filter((i) => parseFloat(i.amount) > 0).map((i) => ({ address: i.address, name: i.name, amount: parseFloat(i.amount) })),
        totalAmount: total,
        status: "failed",
        txHash: null,
        errorCode: "u107",
        period: periodRef,
        network,
        createdAt: new Date().toISOString(),
      });
      setStep(4);
    }
  };

  const isProcessing = step >= 3;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <StepAnnouncer step={step} />

        {/* Back button — hidden during processing/result */}
        {!isProcessing && (
          <Button variant="ghost" onClick={() => step === 1 ? navigate("/dashboard/payroll") : setStep((s) => Math.max(1, s - 1) as Step)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {step === 1 ? "Back to Payroll" : "Back"}
          </Button>
        )}

        {/* Progress bar with labels */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "gradient-primary" : "bg-muted"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {STEP_LABELS.map((label, i) => (
              <span key={label} className={`flex-1 text-center text-xs ${i + 1 <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Configure Payroll</CardTitle>
                  <CardDescription>Select currency, recipients, and amounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mode toggle */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Payment Mode</label>
                    <div className="flex gap-2">
                      <Button variant={mode === "single" ? "default" : "outline"} onClick={() => { setMode("single"); setItems([items[0] || { address: "", name: "", amount: "" }]); setTouched(new Set()); }} size="sm">
                        <User className="mr-1.5 h-3.5 w-3.5" /> Single
                      </Button>
                      <Button variant={mode === "batch" ? "default" : "outline"} onClick={() => setMode("batch")} size="sm">
                        <Users className="mr-1.5 h-3.5 w-3.5" /> Batch
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Currency</label>
                    <div className="flex gap-2">
                      {(["STX", "sBTC"] as CurrencyType[]).map((c) => (
                        <Button key={c} variant={currency === c ? "default" : "outline"} onClick={() => setCurrency(c)}
                          className={currency === c ? (c === "STX" ? "bg-stx hover:bg-stx/90 text-white" : "bg-sbtc hover:bg-sbtc/90 text-white") : ""}>
                          {c}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Period reference */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Period Reference</label>
                    <Input
                      placeholder="e.g. March 2024"
                      value={periodRef}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\x20-\x7E]/g, "").slice(0, 32);
                        setPeriodRef(val);
                      }}
                      maxLength={32}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{periodRef.length}/32 ASCII characters</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Recipients {mode === "batch" && <span className="text-muted-foreground font-normal">({items.length}/{MAX_BATCH_SIZE})</span>}</label>
                    {items.map((item, idx) => {
                      const amountInvalid = touched.has(idx) && !isValidAmount(item.amount);
                      const addressMissing = touched.has(idx) && !item.address;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={item.address} onValueChange={(v) => { updateItem(idx, "address", v); markTouched(idx); }}>
                              <SelectTrigger className={`w-full sm:flex-1 font-mono text-xs ${duplicateAddresses.has(item.address) ? "border-destructive" : addressMissing ? "border-destructive" : ""}`}>
                                <SelectValue placeholder="Select recipient" />
                              </SelectTrigger>
                              <SelectContent>
                                {team.map((r) => (
                                  <SelectItem key={r.address} value={r.address}>
                                    {r.displayName} ({truncateAddress(r.address)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={item.amount}
                                onChange={(e) => updateItem(idx, "amount", e.target.value)}
                                onBlur={() => markTouched(idx)}
                                className={`flex-1 sm:w-28 font-mono text-sm ${amountInvalid ? "border-destructive" : ""}`}
                                min="0"
                                step="any"
                              />
                              {items.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-9 w-9 text-destructive shrink-0">×</Button>
                              )}
                            </div>
                          </div>
                          {duplicateAddresses.has(item.address) && (
                            <p className="text-xs text-destructive ml-1">Duplicate recipient</p>
                          )}
                          {amountInvalid && (
                            <p className="text-xs text-destructive ml-1">Amount must be greater than 0</p>
                          )}
                          {addressMissing && (
                            <p className="text-xs text-destructive ml-1">Select a recipient</p>
                          )}
                        </div>
                      );
                    })}
                    {mode === "batch" && (
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={addItem} disabled={items.length >= MAX_BATCH_SIZE}>
                          + Add Recipient
                        </Button>
                        <label>
                          <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                          <Button variant="outline" size="sm" asChild className="cursor-pointer">
                            <span><Upload className="mr-1.5 h-3.5 w-3.5" /> Import CSV</span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {balanceExceeded && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-sm text-warning">
                        Total ({formatCurrency(total, currency)}) exceeds your {currency} balance ({formatCurrency(currency === "STX" ? wallet.stxBalance : wallet.sbtcBalance, currency)})
                      </p>
                    </div>
                  )}

                  {batchLimitExceeded && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">Maximum {MAX_BATCH_SIZE} recipients per batch</p>
                    </div>
                  )}

                  <div className="border-t pt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total: <span className="font-mono font-semibold text-foreground">{formatCurrency(total, currency)}</span></p>
                    <Button onClick={() => { setTouched(new Set(items.map((_, i) => i))); if (canProceed) setStep(2); }} className="gradient-primary border-0 text-white hover:opacity-90">
                      Review <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Review & Confirm</CardTitle>
                  <CardDescription>Verify the details before executing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-sm text-warning">This action will submit an on-chain transaction. Ensure all details are correct.</p>
                  </div>

                  {balanceExceeded && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">
                        Insufficient balance — Total ({formatCurrency(total, currency)}) exceeds your {currency} balance ({formatCurrency(currency === "STX" ? wallet.stxBalance : wallet.sbtcBalance, currency)}). This transaction will likely fail.
                      </p>
                    </div>
                  )}


                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Period</span>
                    <span className="text-sm font-medium">{periodRef}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Mode</span>
                    <span className="text-sm font-medium capitalize">{mode} · {currency}</span>
                  </div>

                  {items.filter((i) => parseFloat(i.amount) > 0).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{truncateAddress(item.address)}</p>
                      </div>
                      <span className="font-mono text-sm font-semibold">{formatCurrency(parseFloat(item.amount), currency)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-4 flex items-center justify-between">
                    <p className="font-medium">Total: <span className="font-mono">{formatCurrency(total, currency)}</span></p>
                    <Button onClick={executePayroll} className="gradient-primary border-0 text-white hover:opacity-90 animate-pulse-glow">
                      Execute Payroll
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-16" role="status" aria-live="polite">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-lg font-medium">Processing Transaction...</p>
                  <p className="text-sm text-muted-foreground mt-1">Do not close this page</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-16" role="status" aria-live="polite">
                  {result === "success" ? (
                    <>
                      <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      </div>
                      <p className="text-xl font-bold mb-1">Payroll Executed!</p>
                      <p className="text-sm text-muted-foreground mb-2">{formatCurrency(total, currency)} distributed to {items.length} recipient(s)</p>
                      <p className="text-xs text-muted-foreground font-mono mb-4">{truncateAddress(txHash)}</p>
                      <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1 mb-6 hover:underline">
                        View on Explorer <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button onClick={() => navigate("/dashboard/payroll")}>Back to Payroll</Button>
                    </>
                  ) : (
                    <>
                      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-destructive" />
                      </div>
                      <p className="text-xl font-bold mb-1">Transaction Failed</p>
                      <p className="text-sm text-muted-foreground mb-1">{getErrorMessage(errorCode)}</p>
                      <p className="text-xs text-muted-foreground font-mono mb-6">Error code: {errorCode}</p>
                      <Button onClick={() => setStep(2)}>Try Again</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
