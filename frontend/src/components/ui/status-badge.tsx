import { cn } from "@/lib/utils";
import type { PayrollStatus, CurrencyType } from "@/lib/constants";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: PayrollStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      status === "confirmed" && "bg-success/10 text-success",
      status === "pending" && "bg-warning/10 text-warning",
      status === "failed" && "bg-destructive/10 text-destructive",
    )}>
      {status === "confirmed" && <CheckCircle2 className="h-3 w-3" />}
      {status === "pending" && <Clock className="h-3 w-3" />}
      {status === "failed" && <XCircle className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function CurrencyBadge({ type }: { type: CurrencyType }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
      type === "STX" ? "bg-stx/10 text-stx" : "bg-sbtc/10 text-sbtc",
    )}>
      {type}
    </span>
  );
}
