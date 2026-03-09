import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { connect } from "@stacks/connect";
import { fetchStxBalance, fetchSbtcBalance } from "@/lib/stacks-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Wallet, Loader2, CheckCircle2, Building2, Briefcase, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Step = "connect" | "connecting" | "role";

export default function ConnectPage() {
  const [step, setStep] = useState<Step>("connect");
  const { setWallet, setRole, network } = useApp();
  const navigate = useNavigate();

  const handleConnect = async () => {
    setStep("connecting");
    try {
      const response = await connect();
      // Find the STX address from the returned addresses
      const stxAddr = response.addresses.find(
        (a: { symbol: string }) => a.symbol === "STX"
      );
      if (!stxAddr) {
        toast.error("No STX address found in wallet");
        setStep("connect");
        return;
      }

      // Fetch on-chain balances
      const [stxBalance, sbtcBalance] = await Promise.all([
        fetchStxBalance(stxAddr.address, network),
        fetchSbtcBalance(stxAddr.address, network),
      ]);

      setWallet({
        connected: true,
        address: stxAddr.address,
        stxBalance,
        sbtcBalance,
      });
      setStep("role");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User rejected") || msg.includes("cancelled")) {
        toast.error("Connection cancelled");
      } else {
        toast.error("Failed to connect wallet");
      }
      setStep("connect");
    }
  };

  const handleRole = (role: "business" | "freelancer") => {
    setRole(role);
    navigate(role === "business" ? "/dashboard" : "/freelancer");
  };

  const stepAnnouncement =
    step === "connect" ? "Connect your wallet to get started" :
    step === "connecting" ? "Connecting wallet, please approve in your wallet" :
    "Wallet connected. Select your role.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <a
        href="#connect-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>
      <div className="sr-only" aria-live="assertive" role="status">{stepAnnouncement}</div>
      <motion.div id="connect-content" className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6" aria-label="Back to Home">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        {step === "connect" && (
          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
              <CardDescription>Link your Stacks wallet to get started with FlowLedger</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button onClick={handleConnect} className="w-full h-12 gradient-primary border-0 text-white hover:opacity-90">
                <Wallet className="mr-2 h-4 w-4" /> Connect with Hiro Wallet
              </Button>
              <Button onClick={handleConnect} variant="outline" className="w-full h-12">
                <Wallet className="mr-2 h-4 w-4" /> Connect with Leather
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Don't have a wallet? <a href="https://wallet.hiro.so" target="_blank" rel="noreferrer" className="text-primary hover:underline">Get Hiro Wallet</a>
              </p>
            </CardContent>
          </Card>
        )}

        {step === "connecting" && (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Connecting Wallet...</p>
              <p className="text-sm text-muted-foreground mt-1">Approve the connection in your wallet</p>
            </CardContent>
          </Card>
        )}

        {step === "role" && (
          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
              <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Wallet Connected!</CardTitle>
              <CardDescription>How will you use FlowLedger?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button onClick={() => handleRole("business")} variant="outline" className="w-full h-16 justify-start px-6 hover:border-primary/50" aria-label="Continue as Business or Employer">
                <Building2 className="mr-4 h-6 w-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Business / Employer</p>
                  <p className="text-xs text-muted-foreground">Run payroll, manage team</p>
                </div>
              </Button>
              <Button onClick={() => handleRole("freelancer")} variant="outline" className="w-full h-16 justify-start px-6 hover:border-primary/50" aria-label="Continue as Freelancer or Recipient">
                <Briefcase className="mr-4 h-6 w-6 text-stx" />
                <div className="text-left">
                  <p className="font-medium">Freelancer / Recipient</p>
                  <p className="text-xs text-muted-foreground">Track incoming payments</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
