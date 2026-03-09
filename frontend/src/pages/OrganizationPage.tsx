import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { truncateAddress, getMockWalletAddress } from "@/lib/mock-data";
import { getExplorerTxUrl, getExplorerAddressUrl, getErrorMessage } from "@/lib/constants";
import { Building2, CheckCircle2, Globe, Hash, User, Plus, Loader2, XCircle, ExternalLink, AlertTriangle, FileText, Link2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";

type OrgState = "not-registered" | "no-org" | "registered";
type TxState = "idle" | "pending" | "confirmed" | "failed";

const MOCK_TX_HASH = "0x8a3b1c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890";
const MOCK_BLOCK_HEIGHT = 142857;
const ASCII_REGEX = /^[\x20-\x7E]*$/;

const createOrgSchema = (network: string) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Organization name is required")
      .max(64, "Name must be 64 characters or fewer")
      .refine((v) => ASCII_REGEX.test(v), "Name must contain only ASCII characters"),
    description: z
      .string()
      .trim()
      .max(256, "Description must be 256 characters or fewer")
      .refine((v) => !v || ASCII_REGEX.test(v), "Description must contain only ASCII characters")
      .optional()
      .default(""),
    stxAddress: z
      .string()
      .trim()
      .min(1, "STX address is required")
      .regex(
        network === "mainnet" ? /^SP[A-Z0-9]{38,40}$/ : /^ST[A-Z0-9]{38,40}$/,
        `Must be a valid ${network === "mainnet" ? "mainnet (SP...)" : "testnet (ST...)"} STX address`
      ),
    website: z
      .string()
      .trim()
      .refine((v) => !v || /^https?:\/\/.+\..+/.test(v), "Must be a valid URL (https://...)")
      .optional()
      .default(""),
  });

type OrgFormData = z.infer<ReturnType<typeof createOrgSchema>>;

function TxStatusCard({ txState, txHash, errorCode, onRetry }: {
  txState: TxState;
  txHash: string;
  errorCode?: string;
  onRetry?: () => void;
}) {
  if (txState === "idle") return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
      {txState === "pending" && (
        <div className="rounded-lg border border-warning/50 bg-warning/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-warning" />
            <span className="text-sm font-medium text-warning">Transaction Pending</span>
          </div>
          <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            {txHash.slice(0, 10)}…{txHash.slice(-8)} <ExternalLink className="h-3 w-3" />
          </a>
          <div className="flex items-center gap-1.5 text-xs text-warning/80">
            <AlertTriangle className="h-3 w-3" /> Do not close this page
          </div>
        </div>
      )}
      {txState === "confirmed" && (
        <div className="rounded-lg border border-success/50 bg-success/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">Transaction Confirmed</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Block #{MOCK_BLOCK_HEIGHT.toLocaleString()}</span>
            <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
      {txState === "failed" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Transaction Failed</span>
          </div>
          <p className="text-xs text-muted-foreground">{errorCode ? getErrorMessage(errorCode) : "An unexpected error occurred"}</p>
          {onRetry && <Button variant="outline" size="sm" onClick={onRetry} className="text-xs">Retry</Button>}
        </div>
      )}
    </motion.div>
  );
}

export default function OrganizationPage() {
  const { wallet, network } = useApp();
  const [orgState, setOrgState] = useState<OrgState>("not-registered");
  const [txState, setTxState] = useState<TxState>("idle");
  const [txAnnouncement, setTxAnnouncement] = useState("");
  const [savedOrg, setSavedOrg] = useState<OrgFormData | null>(null);

  const networkLabel = network.charAt(0).toUpperCase() + network.slice(1);
  const isDisabled = txState === "pending";

  const form = useForm<OrgFormData>({
    resolver: zodResolver(createOrgSchema(network)),
    defaultValues: {
      name: "",
      description: "",
      stxAddress: wallet.address || getMockWalletAddress(network),
      website: "",
    },
    mode: "onBlur",
  });

  const nameLength = form.watch("name")?.length || 0;
  const descLength = form.watch("description")?.length || 0;

  const simulateTx = useCallback((onSuccess: () => void, failCode?: string) => {
    setTxState("pending");
    setTxAnnouncement("Transaction pending. Do not close this page.");
    setTimeout(() => {
      const shouldFail = failCode || Math.random() < 0.1;
      if (shouldFail) {
        const code = typeof failCode === "string" ? failCode : "u107";
        setTxState("failed");
        setTxAnnouncement(`Transaction failed: ${getErrorMessage(code)}`);
        toast.error(`Transaction failed: ${getErrorMessage(code)}`);
      } else {
        setTxState("confirmed");
        setTxAnnouncement("Transaction confirmed!");
        toast.success("Transaction confirmed!");
        setTimeout(() => { setTxState("idle"); onSuccess(); }, 1500);
      }
    }, 2500);
  }, []);

  const handleRegister = () => simulateTx(() => setOrgState("no-org"));

  const onCreateOrg = (data: OrgFormData) => {
    setSavedOrg(data);
    simulateTx(() => setOrgState("registered"));
  };

  const handleRetry = () => setTxState("idle");

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Organization</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your on-chain organization profile</p>
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">{txAnnouncement}</div>

        <motion.div key={orgState} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Step 1: Register */}
          {orgState === "not-registered" && (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Register as Business</CardTitle>
                    <CardDescription>Register your wallet address as a business on-chain to start using FlowLedger</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wallet</span>
                    <span className="font-mono text-xs">{truncateAddress(wallet.address || getMockWalletAddress(network))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span>{networkLabel}</span>
                  </div>
                </div>
                <Button onClick={handleRegister} disabled={isDisabled} className="gradient-primary border-0 text-white hover:opacity-90 w-full">
                  {txState === "pending" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : "Register as Business"}
                </Button>
                <TxStatusCard txState={txState} txHash={MOCK_TX_HASH} onRetry={handleRetry} />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Create Organization */}
          {orgState === "no-org" && (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Create Organization</CardTitle>
                    <CardDescription>You're registered! Now create your on-chain organization to manage payroll.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateOrg)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Acme Corp" maxLength={64} disabled={isDisabled} {...field} />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <FormDescription className="ml-auto">{nameLength}/64</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of your organization"
                              maxLength={256}
                              disabled={isDisabled}
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <FormDescription className="ml-auto">Optional · {descLength}/256</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stxAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business STX Address *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={network === "mainnet" ? "SP..." : "ST..."}
                              disabled={isDisabled}
                              className="font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          {!form.formState.errors.stxAddress && (
                            <FormDescription>
                              {network === "mainnet" ? "Mainnet address (SP...)" : "Testnet address (ST...)"}
                            </FormDescription>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" disabled={isDisabled} {...field} />
                          </FormControl>
                          <FormMessage />
                          {!form.formState.errors.website && (
                            <FormDescription>Optional</FormDescription>
                          )}
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isDisabled} className="gradient-primary border-0 text-white hover:opacity-90 w-full">
                      {txState === "pending" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Organization"}
                    </Button>
                  </form>
                </Form>
                <TxStatusCard txState={txState} txHash={MOCK_TX_HASH} onRetry={handleRetry} />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Registered */}
          {orgState === "registered" && savedOrg && (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{savedOrg.name}</CardTitle>
                      <CardDescription>Registered on-chain organization</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Hash, label: "Organization ID", value: "org-0001" },
                  { icon: User, label: "Owner", value: truncateAddress(savedOrg.stxAddress), mono: true, explorerUrl: getExplorerAddressUrl(savedOrg.stxAddress) },
                  { icon: CheckCircle2, label: "Status", value: "Active", color: "text-success" },
                  { icon: Globe, label: "Network", value: networkLabel },
                  ...(savedOrg.description ? [{ icon: FileText, label: "Description", value: savedOrg.description }] : []),
                  ...(savedOrg.website ? [{ icon: Link2, label: "Website", value: savedOrg.website, isLink: true }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    {"explorerUrl" in item && item.explorerUrl ? (
                      <a href={item.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium font-mono inline-flex items-center gap-1 hover:text-primary truncate">
                        {item.value} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : "isLink" in item && item.isLink ? (
                      <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium inline-flex items-center gap-1 hover:text-primary truncate">
                        {item.value} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className={`text-sm font-medium ${"mono" in item && item.mono ? "font-mono" : ""} ${"color" in item && item.color ? item.color : ""} truncate`}>
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
