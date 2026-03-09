import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, CurrencyBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/SkeletonCards";
import { formatCurrency, truncateAddress } from "@/lib/mock-data";
import { getExplorerTxUrl } from "@/lib/constants";
import { useApp } from "@/contexts/AppContext";
import { usePayrollPolling } from "@/hooks/use-payroll-polling";
import { Plus, CreditCard, ExternalLink } from "lucide-react";

export default function PayrollListPage() {
  const navigate = useNavigate();
  const { network } = useApp();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const runs = usePayrollPolling(network);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [network]);

  const filtered = useMemo(() => {
    return runs.filter((pr) => {
      if (typeFilter !== "all" && pr.type !== typeFilter) return false;
      if (statusFilter !== "all" && pr.status !== statusFilter) return false;
      return true;
    });
  }, [runs, typeFilter, statusFilter]);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Payroll</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and execute payroll runs</p>
          </div>
          <Button onClick={() => navigate("/dashboard/payroll/new")} className="gradient-primary border-0 text-white hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" /> New Payroll Run
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
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

        {/* Desktop Table */}
        <Card className="glass-card hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton rows={4} cols={7} />
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        icon={CreditCard}
                        title="No payroll runs"
                        description="Create your first payroll run to start paying your team on-chain."
                        actionLabel="New Payroll Run"
                        onAction={() => navigate("/dashboard/payroll/new")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((pr) => (
                    <TableRow key={pr.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell className="font-medium">{pr.period}</TableCell>
                      <TableCell><CurrencyBadge type={pr.type} /></TableCell>
                      <TableCell>{pr.recipients.length}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(pr.totalAmount, pr.type)}</TableCell>
                      <TableCell><StatusBadge status={pr.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(pr.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {pr.txHash && (
                          <a
                            href={getExplorerTxUrl(pr.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="View on Explorer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
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
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payroll runs"
              description="Create your first payroll run to start paying your team on-chain."
              actionLabel="New Payroll Run"
              onAction={() => navigate("/dashboard/payroll/new")}
            />
          ) : (
            filtered.map((pr) => (
              <Card key={pr.id} className="glass-card cursor-pointer hover:bg-accent/30 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{pr.period}</span>
                    <StatusBadge status={pr.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CurrencyBadge type={pr.type} />
                    <span className="font-mono text-sm font-semibold">{formatCurrency(pr.totalAmount, pr.type)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pr.recipients.length} recipient{pr.recipients.length !== 1 ? "s" : ""}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                      {pr.txHash && (
                        <a
                          href={getExplorerTxUrl(pr.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="View on Explorer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
    </div>
  );
}
