import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageTransition } from "@/components/PageTransition";
import { useApp } from "@/contexts/AppContext";
import { Moon, Sun, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/mock-data";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { wallet, resolvedTheme, toggleTheme } = useApp();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to content
        </a>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="shrink-0 hidden md:flex" />
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" aria-label="Toggle theme">
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {wallet.connected && wallet.address && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-sm">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-xs">{truncateAddress(wallet.address)}</span>
                </div>
              )}
            </div>
          </header>
          <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 outline-none">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}

/** Standalone wrapper for pages that manually use DashboardLayout */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

/** Layout route: renders once, animates only inner content via Outlet */
export function DashboardLayoutRoute() {
  const location = useLocation();

  return (
    <DashboardShell>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </AnimatePresence>
    </DashboardShell>
  );
}
