import { useState, useMemo, useEffect } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, CurrencyBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/SkeletonCards";
import { getMockTransactions, formatCurrency, truncateAddress } from "@/lib/mock-data";
import { getExplorerTxUrl } from "@/lib/constants";
import { useApp } from "@/contexts/AppContext";
import { ExternalLink, Search, Receipt } from "lucide-react";

export default function FreelancerPayments() {
  const { network } = useApp();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const transactions = useMemo(() => getMockTransactions(network), [network]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      if (search && !tx.txHash.includes(search) && !tx.period.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, statusFilter, search]);

  const summaryStx = useMemo(() => filtered.filter((tx) => tx.type === "STX").reduce((s, tx) => s + tx.amount, 0), [filtered]);
  const summarySbtc = useMemo(() => filtered.filter((tx) => tx.type === "sBTC").reduce((s, tx) => s + tx.amount, 0), [filtered]);

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground text-sm mt-1">All incoming payments</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by hash or period..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="STX">STX</SelectItem>
              <SelectItem value="sBTC">sBTC</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Bar */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{filtered.length} payment{filtered.length !== 1 ? "s" : ""}</span>
            <span className="text-border">·</span>
            <span className="font-mono text-stx">{summaryStx.toLocaleString()} STX</span>
            <span className="text-border">·</span>
            <span className="font-mono text-sbtc">{summarySbtc.toFixed(4)} sBTC</span>
          </div>
        )}

        {/* Desktop */}
        <Card className="glass-card hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        icon={Receipt}
                        title="No payments found"
                        description="No payments match your current filters. Try adjusting your search."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="text-sm">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">{truncateAddress(tx.sender)}</TableCell>
                      <TableCell><CurrencyBadge type={tx.type} /></TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(tx.amount, tx.type)}</TableCell>
                      <TableCell className="text-sm">{tx.period}</TableCell>
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
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payments found"
              description="No payments match your current filters. Try adjusting your search."
            />
          ) : (
            filtered.map((tx) => (
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Period</span>
                    <span className="text-sm">{tx.period}</span>
                  </div>
                  <a href={getExplorerTxUrl(tx.txHash)} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 hover:underline">
                    {truncateAddress(tx.txHash, 8, 6)} <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </div>
    </div>
  );
}
