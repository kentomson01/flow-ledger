import { LayoutDashboard, Users, CreditCard, History, Settings, Briefcase, Receipt } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

const businessItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Team", url: "/dashboard/team", icon: Users },
  { title: "Payroll", url: "/dashboard/payroll", icon: CreditCard },
  { title: "History", url: "/dashboard/history", icon: History },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const freelancerItems = [
  { title: "Dashboard", url: "/freelancer", icon: Briefcase, exact: true },
  { title: "Payments", url: "/freelancer/payments", icon: Receipt },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function BottomNav() {
  const { role } = useApp();
  const location = useLocation();
  const effectiveRole = role || (location.pathname.startsWith("/freelancer") ? "freelancer" : "business");
  const items = effectiveRole === "freelancer" ? freelancerItems : businessItems;

  const isActive = (item: (typeof items)[0]) => {
    if (item.exact) return location.pathname === item.url;
    return location.pathname.startsWith(item.url);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-background/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.url}
              to={item.url}
              aria-label={item.title}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors",
                active && "text-primary"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
