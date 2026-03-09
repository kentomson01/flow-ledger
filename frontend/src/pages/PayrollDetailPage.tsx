import { useParams, useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, CurrencyBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { mockPayrollRuns, mockRecipients, formatCurrency, truncateAddress } from "@/lib/mock-data";
import { getExplorerTxUrl, getExplorerAddressUrl } from "@/lib/constants";
import { ArrowLeft, ExternalLink, CheckCircle2, Clock, XCircle, Send, Blocks, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const TOTAL_CONFIRMATIONS = 6;

function getConfirmations(status: string): number {
  if (status === "confirmed") return TOTAL_CONFIRMATIONS;
  if (status === "pending") return 2;
  return 0;
}

const timelineSteps = [
  { key: "submitted", label: "Submitted", icon: Send },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: ShieldCheck },
] as const;

function getTimelineState(status: string) {
  if (status === "confirmed") return { active: 2, failed: false };
  if (status === "pending") return { active: 1, failed: false };
  if (status === "failed") return { active: 1, failed: true };
  return { active: 0, failed: false };
}

export default function PayrollDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const run = mockPayrollRuns.find((r) => r.id === id);

  if (!run) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Payroll run not found.</p>
        <Button onClick={() => navigate("/dashboard/payroll")} className="mt-4">Back</Button>
      </div>
    );
  }

  const confirmations = getConfirmations(run.status);
  const confirmPct = (confirmations / TOTAL_CONFIRMATIONS) * 100;
  const timeline = getTimelineState(run.status);

  // Generate per-recipient breakdown from mock data
  const recipientBreakdown = run.recipients.map((truncAddr, idx) => {
    const found = mockRecipients.find((r) => truncateAddress(r.address) === truncAddr);
    const perRecipientAmount = run.totalAmount / run.recipients.length;
    return {
      address: found?.address || truncAddr,
      name: found?.displayName || `Recipient ${idx + 1}`,
      amount: perRecipientAmount,
      status: run.status,
    };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/payroll")} aria-label="Back to Payroll">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payroll
        </Button>

        {/* Screen reader announcement for transaction status */}
        <div className="sr-only" aria-live="polite" role="status">
          {run.status === "confirmed"
            ? `Transaction confirmed, ${confirmations} of ${TOTAL_CONFIRMATIONS} block confirmations`
            : run.status === "pending"
            ? `Transaction pending, ${confirmations} of ${TOTAL_CONFIRMATIONS} block confirmations`
            : run.status === "failed"
            ? "Transaction failed"
            : `Transaction status: ${run.status}`}
        </div>

        {/* Header Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Payroll Receipt</CardTitle>
                <StatusBadge status={run.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "ID", value: run.id, mono: true },
                { label: "Period", value: run.period },
                { label: "Currency", value: run.type, badge: true },
                { label: "Recipients", value: String(run.recipients.length) },
                { label: "Total Amount", value: formatCurrency(run.totalAmount, run.type), mono: true },
                { label: "Date", value: new Date(run.createdAt).toLocaleString() },
                ...(run.txHash
                  ? [{ label: "Tx Hash", value: truncateAddress(run.txHash, 10, 8), mono: true, link: run.txHash }]
                  : []),
                ...(run.blockHeight
                  ? [{ label: "Block Height", value: String(run.blockHeight), mono: true }]
                  : []),
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {"badge" in item && item.badge ? (
                      <CurrencyBadge type={item.value as any} />
                    ) : (
                      <span className={`text-sm font-medium ${item.mono ? "font-mono" : ""}`}>{item.value}</span>
                    )}
                    {"link" in item && item.link && (
                      <a href={getExplorerTxUrl(item.link as string)} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        <ExternalLink className="h-3 w-3 text-primary" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Timeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Transaction Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-0">
                {timelineSteps.map((step, idx) => {
                  const isActive = idx <= timeline.active;
                  const isFailed = timeline.failed && idx === timeline.active;
                  const StepIcon = isFailed ? XCircle : step.icon;

                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ring-2 transition-colors ${
                            isFailed
                              ? "ring-destructive bg-destructive/10"
                              : isActive
                              ? "ring-success bg-success/10"
                              : "ring-border bg-muted"
                          }`}
                        >
                          <StepIcon
                            className={`h-4 w-4 ${
                              isFailed ? "text-destructive" : isActive ? "text-success" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isFailed ? "text-destructive" : isActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {isFailed ? "Failed" : step.label}
                        </span>
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 rounded-full ${
                            idx < timeline.active ? "bg-success" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Block Confirmations */}
        {run.status !== "failed" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Blocks className="h-4 w-4 text-primary" />
                    Block Confirmations
                  </CardTitle>
                  <span className="text-sm font-mono text-muted-foreground">
                    {confirmations}/{TOTAL_CONFIRMATIONS}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={confirmPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {confirmations === TOTAL_CONFIRMATIONS
                    ? "Transaction is fully confirmed and finalized."
                    : `Waiting for ${TOTAL_CONFIRMATIONS - confirmations} more confirmation${TOTAL_CONFIRMATIONS - confirmations > 1 ? "s" : ""}...`}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recipient Breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Recipient Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipientBreakdown.map((r) => (
                      <TableRow key={r.address} className="hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <a
                            href={getExplorerAddressUrl(r.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs inline-flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            {truncateAddress(r.address)} <ExternalLink className="h-3 w-3 text-primary" />
                          </a>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatCurrency(r.amount, run.type)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-3 space-y-3">
                {recipientBreakdown.map((r) => (
                  <div key={r.address} className="p-3 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.name}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground block">
                      {truncateAddress(r.address)}
                    </span>
                    <span className="font-mono text-sm font-semibold block">
                      {formatCurrency(r.amount, run.type)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Explorer Link */}
        {run.txHash && (
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <a href={getExplorerTxUrl(run.txHash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> View on Stacks Explorer
              </a>
            </Button>
          </div>
        )}
    </div>
  );
}
