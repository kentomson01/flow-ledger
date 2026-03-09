import {
  LayoutDashboard, Users, CreditCard, History, Building2, Settings, Briefcase, Receipt,
  ExternalLink, LogOut, Wifi,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/mock-data";
import { NETWORK, getExplorerAddressUrl } from "@/lib/constants";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const businessItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Organization", url: "/dashboard/organization", icon: Building2 },
  { title: "Team", url: "/dashboard/team", icon: Users },
  { title: "Payroll", url: "/dashboard/payroll", icon: CreditCard },
  { title: "History", url: "/dashboard/history", icon: History },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const freelancerItems = [
  { title: "Dashboard", url: "/freelancer", icon: Briefcase },
  { title: "Payments", url: "/freelancer/payments", icon: Receipt },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, wallet, disconnectWallet } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const effectiveRole = role || (location.pathname.startsWith("/freelancer") ? "freelancer" : "business");
  const items = effectiveRole === "freelancer" ? freelancerItems : businessItems;

  const handleDisconnect = () => {
    disconnectWallet();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size="md" className="shrink-0" />
          {!collapsed && <span className="font-semibold text-lg tracking-tight">FlowLedger</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{role === "freelancer" ? "Freelancer" : "Business"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu role="navigation" aria-label="Main navigation">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard" || item.url === "/freelancer"}
                      className="hover:bg-accent/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* View on Explorer */}
              {wallet.connected && wallet.address && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a
                      href={getExplorerAddressUrl(wallet.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-accent/50 flex items-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>View on Explorer</span>}
                      {collapsed && <span className="sr-only">View on Explorer</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-3">
        {wallet.connected && wallet.address && !collapsed && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-3 w-3 text-success shrink-0" />
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                {NETWORK}
              </Badge>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground truncate">
              {truncateAddress(wallet.address)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              aria-label="Disconnect wallet"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs px-2"
            >
              <LogOut className="mr-1.5 h-3 w-3" /> Disconnect
            </Button>
          </div>
        )}
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground text-center">FlowLedger v1.0.0-beta · Testnet</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
