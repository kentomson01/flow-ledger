import { useState, useEffect, useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, CurrencyBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCardSkeleton, TableSkeleton } from "@/components/SkeletonCards";
import { getMockTransactions, formatCurrency, truncateAddress } from "@/lib/mock-data";
import { getExplorerTxUrl } from "@/lib/constants";
import { useApp } from "@/contexts/AppContext";
import { motion } from "framer-motion";
import { Coins, Bitcoin, Receipt, Wallet, ExternalLink, Clock } from "lucide-react";

export default function FreelancerDashboard() {
  const { wallet, network } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const transactions = useMemo(() => getMockTransactions(network), [network]);

  const confirmedStx = useMemo(
    () => transactions.filter((tx) => tx.status === "confirmed" && tx.type === "STX").reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );
  const confirmedSbtc = useMemo(
    () => transactions.filter((tx) => tx.status === "confirmed" && tx.type === "sBTC").reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );
  const pendingTxs = useMemo(() => transactions.filter((tx) => tx.status === "pending"), [transactions]);

  const stats = [
    { label: "STX Received", value: confirmedStx.toLocaleString(), icon: Coins, color: "text-stx" },
    { label: "sBTC Received", value: confirmedSbtc.toFixed(4), icon: Bitcoin, color: "text-sbtc" },
    { label: "Total Payments", value: String(transactions.length), icon: Receipt, color: "text-primary" },
    { label: "Wallet Balance", value: `${wallet.stxBalance.toLocaleString()} STX`, icon: Wallet, color: "text-accent" },
  ];

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your payment overview</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="glass-card hover:border-primary/20 transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <p className="text-2xl font-bold font-mono">{s.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        {/* Pending Payments */}
        {!isLoading && pendingTxs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Payments
            </h2>
            {pendingTxs.map((tx) => (
              <Card key={tx.id} className="glass-card border-warning/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                    <CurrencyBadge type={tx.type} />
                    <span className="font-mono text-sm font-semibold">{formatCurrency(tx.amount, tx.type)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{tx.period}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Desktop Table */}
        <Card className="glass-card hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="text-sm">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">{truncateAddress(tx.sender)}</TableCell>
                      <TableCell><CurrencyBadge type={tx.type} /></TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(tx.amount, tx.type)}</TableCell>
                      <TableCell>
                        <a href={getExplorerTxUrl(tx.txHash)} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs flex items-center gap-1 hover:text-primary transition-colors">
                          {truncateAddress(tx.txHash, 8, 6)} <ExternalLink className="h-3 w-3 text-primary" />
                        </a>
                      </TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))
            : transactions.slice(0, 5).map((tx) => (
                <Card key={tx.id} className="glass-card">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <CurrencyBadge type={tx.type} />
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-mono text-sm font-semibold">{formatCurrency(tx.amount, tx.type)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="font-mono text-xs">{truncateAddress(tx.sender)}</span>
                    </div>
                    <a href={getExplorerTxUrl(tx.txHash)} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline">
                      {truncateAddress(tx.txHash, 8, 6)} <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
        </div>
    </div>
  );
}
