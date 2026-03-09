
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { truncateAddress, mockRecipients, mockTransactions } from "@/lib/mock-data";
import { CONTRACT_ADDRESS, CONTRACT_NAME, APP_VERSION } from "@/lib/constants";
import { Moon, Sun, Monitor, Wallet, Globe, Info, LogOut, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SettingsPage() {
  const { wallet, theme, resolvedTheme, network, setTheme, setNetwork, disconnectWallet } = useApp();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnectWallet();
    navigate("/");
  };

  const exportTeamCSV = () => {
    const csv = ["Name,Address,Last Paid,Total STX,Total sBTC",
      ...mockRecipients.map((r) => `${r.displayName},${r.address},${r.lastPaid || "Never"},${r.totalReceived.stx},${r.totalReceived.sbtc}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "flowledger-team.csv"; a.click();
    toast.success("Team data exported");
  };

  const exportHistoryCSV = () => {
    const csv = ["Timestamp,Type,Recipients,Amount,Period,TxHash,Block,Status",
      ...mockTransactions.map((t) => `${t.timestamp},${t.type},${t.recipients.length},${t.amount},${t.period},${t.txHash},${t.blockHeight},${t.status}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "flowledger-history.csv"; a.click();
    toast.success("Transaction history exported");
  };

  return (
    <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your preferences</p>
        </div>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Network</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Active Network</p>
                <p className="text-xs text-muted-foreground mt-0.5">Switch between Testnet and Mainnet</p>
              </div>
              <Select value={network} onValueChange={(v) => setNetwork(v as "testnet" | "mainnet")}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="testnet">Testnet</SelectItem>
                  <SelectItem value="mainnet">Mainnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2">{resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Theme</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {theme === "system" ? `Following system preference (${resolvedTheme})` : `Using ${theme} mode`}
                </p>
              </div>
              <Select value={theme} onValueChange={(v) => setTheme(v as "dark" | "light" | "system")}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system"><span className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5" /> System</span></SelectItem>
                  <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-3.5 w-3.5" /> Light</span></SelectItem>
                  <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-3.5 w-3.5" /> Dark</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {wallet.connected && wallet.address ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <span className="font-mono text-xs">{truncateAddress(wallet.address)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">STX Balance</p>
                  <span className="font-mono text-sm">{wallet.stxBalance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">sBTC Balance</p>
                  <span className="font-mono text-sm">{wallet.sbtcBalance.toFixed(4)}</span>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDisconnect} className="mt-2">
                  <LogOut className="mr-2 h-3 w-3" /> Disconnect Wallet
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No wallet connected</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Data Export</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Export your data as CSV files for reporting and record-keeping.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportTeamCSV}>
                <Download className="mr-2 h-3 w-3" /> Export Team Data
              </Button>
              <Button variant="outline" size="sm" onClick={exportHistoryCSV}>
                <Download className="mr-2 h-3 w-3" /> Export Transaction History
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" /> About</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Contract", value: truncateAddress(CONTRACT_ADDRESS), mono: true },
              { label: "Contract Name", value: CONTRACT_NAME, mono: true },
              { label: "Version", value: APP_VERSION },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <span className={`text-sm ${item.mono ? "font-mono text-xs" : ""}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
    </div>
  );
}
