import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { connect } from "@stacks/connect";
import { fetchStxBalance, fetchSbtcBalance } from "@/lib/stacks-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Building2, Briefcase, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Step = "connecting" | "role";

export default function ConnectPage() {
  const [step, setStep] = useState<Step>("connecting");
  const { wallet, setWallet, setRole, network } = useApp();
  const navigate = useNavigate();
  const triggered = useRef(false);

  // If already connected (e.g. navigated here while connected), skip straight to role
  useEffect(() => {
    if (wallet.connected) {
      setStep("role");
      return;
    }
    if (triggered.current) return;
    triggered.current = true;

    // Auto-trigger the native Stacks wallet popup on mount
    (async () => {
      try {
        const response = await connect();
        const stxAddr = response.addresses.find(
          (a: { symbol: string }) => a.symbol === "STX"
        );
        if (!stxAddr) {
          toast.error("No STX address found in wallet");
          navigate("/");
          return;
        }

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
        navigate("/");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRole = (role: "business" | "freelancer") => {
    setRole(role);
    navigate(role === "business" ? "/dashboard" : "/freelancer");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <a
        href="#connect-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>
      <motion.div id="connect-content" className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6" aria-label="Back to Home">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        {step === "connecting" && (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Connecting Wallet...</p>
              <p className="text-sm text-muted-foreground mt-1">Approve the connection in your wallet extension</p>
            </CardContent>
          </Card>
        )}

        {step === "role" && (
          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
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
