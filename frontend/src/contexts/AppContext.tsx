import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { disconnect as walletDisconnect, isConnected as walletIsConnected, getLocalStorage } from "@stacks/connect";
import { fetchStxBalance, fetchSbtcBalance } from "@/lib/stacks-api";

type Role = "business" | "freelancer" | null;
type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";
type Network = "testnet" | "mainnet";

interface WalletState {
  connected: boolean;
  address: string | null;
  stxBalance: number;
  sbtcBalance: number;
}

interface AppState {
  wallet: WalletState;
  role: Role;
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  network: Network;
  setWallet: (w: WalletState) => void;
  setRole: (r: Role) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setNetwork: (n: Network) => void;
  disconnectWallet: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem("flowledger-theme") as Theme) || "system";
      }
      return "system";
    });
    const [systemPref, setSystemPref] = useState<ResolvedTheme>(getSystemTheme);
    const [network, setNetworkState] = useState<Network>(() => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem("flowledger-network") as Network) || "testnet";
      }
      return "testnet";
    });
    const [wallet, setWalletState] = useState<WalletState>(() => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("flowledger-wallet");
          if (saved) return JSON.parse(saved);
        } catch {}
      }
      return { connected: false, address: null, stxBalance: 0, sbtcBalance: 0 };
    });
    const [role, setRoleState] = useState<Role>(() => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem("flowledger-role") as Role) || null;
      }
      return null;
    });

    const resolvedTheme: ResolvedTheme = useMemo(
      () => (theme === "system" ? systemPref : theme),
      [theme, systemPref]
    );

    useEffect(() => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setSystemPref(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
      localStorage.setItem("flowledger-theme", theme);
    }, [theme, resolvedTheme]);

    useEffect(() => {
      localStorage.setItem("flowledger-network", network);
    }, [network]);

    // Restore wallet session from @stacks/connect on mount / refresh
    useEffect(() => {
      if (!walletIsConnected()) {
        // Stacks Connect session gone — clear our local state too
        if (wallet.connected) {
          setWalletState({ connected: false, address: null, stxBalance: 0, sbtcBalance: 0 });
          localStorage.removeItem("flowledger-wallet");
        }
        return;
      }

      const data = getLocalStorage();
      const stxEntry = data?.addresses?.stx?.[0];
      if (!stxEntry?.address) return;

      if (wallet.connected && wallet.address === stxEntry.address) {
        // Already connected with the same address — just refresh balances
        Promise.all([
          fetchStxBalance(stxEntry.address, network),
          fetchSbtcBalance(stxEntry.address, network),
        ]).then(([stxBal, sbtcBal]) => {
          setWalletState((prev) => ({ ...prev, stxBalance: stxBal, sbtcBalance: sbtcBal }));
          localStorage.setItem("flowledger-wallet", JSON.stringify({ connected: true, address: stxEntry.address, stxBalance: stxBal, sbtcBalance: sbtcBal }));
        });
        return;
      }

      const address = stxEntry.address;
      // Set immediately with zero balances, then fetch real ones
      setWalletState({ connected: true, address, stxBalance: 0, sbtcBalance: 0 });

      Promise.all([
        fetchStxBalance(address, network),
        fetchSbtcBalance(address, network),
      ]).then(([stxBal, sbtcBal]) => {
        setWalletState((prev) => ({ ...prev, stxBalance: stxBal, sbtcBalance: sbtcBal }));
        localStorage.setItem("flowledger-wallet", JSON.stringify({ connected: true, address, stxBalance: stxBal, sbtcBalance: sbtcBal }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleTheme = () =>
      setThemeState((t) => {
        if (t === "system") return "light";
        if (t === "light") return "dark";
        return "system";
      });
    const setTheme = (t: Theme) => setThemeState(t);
    const setNetwork = (n: Network) => setNetworkState(n);
    const setWallet = (w: WalletState) => {
      setWalletState(w);
      localStorage.setItem("flowledger-wallet", JSON.stringify(w));
    };
    const setRole = (r: Role) => {
      setRoleState(r);
      if (r) localStorage.setItem("flowledger-role", r);
      else localStorage.removeItem("flowledger-role");
    };
    const disconnectWallet = () => {
      walletDisconnect();
      setWalletState({ connected: false, address: null, stxBalance: 0, sbtcBalance: 0 });
      setRoleState(null);
      localStorage.removeItem("flowledger-wallet");
      localStorage.removeItem("flowledger-role");
    };

    return (
      <AppContext.Provider value={{ wallet, role, theme, resolvedTheme, network, setWallet, setRole, setTheme, toggleTheme, setNetwork, disconnectWallet }}>
        {children}
      </AppContext.Provider>
    );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
