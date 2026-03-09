import { useState, useMemo, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge, CurrencyBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/SkeletonCards";
import { mockTransactions, truncateAddress, formatCurrency } from "@/lib/mock-data";
import { getExplorerTxUrl } from "@/lib/constants";
import { Download, Search, ExternalLink, CalendarIcon, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return mockTransactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      if (search && !tx.txHash.includes(search) && !tx.period.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && new Date(tx.timestamp) < dateFrom) return false;
      if (dateTo && new Date(tx.timestamp) > dateTo) return false;
      return true;
    });
  }, [typeFilter, statusFilter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const csv = ["Timestamp,Type,Recipients,Amount,Period,TxHash,Block,Status",
      ...filtered.map((t) => `${t.timestamp},${t.type},${t.recipients.length},${t.amount},${t.period},${t.txHash},${t.blockHeight},${t.status}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "flowledger-history.csv"; a.click();
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground text-sm mt-1">Full audit log of all payroll transactions</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-2 h-3 w-3" /> Export CSV</Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by hash or period..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[calc(50%-6px)] sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="STX">STX</SelectItem>
              <SelectItem value="sBTC">sBTC</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[calc(50%-6px)] sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left text-xs font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setPage(1); }} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left text-xs font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setPage(1); }} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setPage(1); }} className="text-xs">
              Clear dates
            </Button>
          )}
        </div>

        {/* Desktop Table */}
        <Card className="glass-card hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="hidden lg:table-cell">Tx Hash</TableHead>
                  <TableHead className="hidden lg:table-cell">Block</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton rows={5} cols={8} />
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState
                        icon={FileText}
                        title="No transactions"
                        description="No transactions match your current filters. Try adjusting your search or date range."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="text-sm">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell><CurrencyBadge type={tx.type} /></TableCell>
                      <TableCell>{tx.recipients.length}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(tx.amount, tx.type)}</TableCell>
                      <TableCell className="text-sm">{tx.period}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <a href={getExplorerTxUrl(tx.txHash)} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs flex items-center gap-1 hover:text-primary transition-colors">
                          {truncateAddress(tx.txHash, 8, 6)} <ExternalLink className="h-3 w-3 text-primary" />
                        </a>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-sm">{tx.blockHeight}</TableCell>
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
          ) : paginated.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No transactions"
              description="No transactions match your current filters."
            />
          ) : (
            paginated.map((tx) => (
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
                    <span className="text-sm text-muted-foreground">Period</span>
                    <span className="text-sm">{tx.period}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">{new Date(tx.timestamp).toLocaleDateString()}</span>
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

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
    </div>
  );
}
