import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/SkeletonCards";
import { truncateAddress } from "@/lib/mock-data";
import { loadTeam, saveTeam, isValidStxAddress, getAddressPrefix } from "@/lib/team-utils";
import { useApp } from "@/contexts/AppContext";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, Upload, Trash2, Copy, Users } from "lucide-react";
import { toast } from "sonner";

const createRecipientSchema = (network: "testnet" | "mainnet", existingAddresses: string[]) =>
  z.object({
    address: z
      .string()
      .min(1, "STX address is required")
      .refine((v) => isValidStxAddress(v), {
        message: `Enter a valid Stacks address starting with ${getAddressPrefix(network)}`,
      })
      .refine((v) => !existingAddresses.includes(v), {
        message: "This address is already in your team",
      }),
    displayName: z.string().optional().default(""),
  });

type RecipientFormData = z.infer<ReturnType<typeof createRecipientSchema>>;

export default function TeamPage() {
  const { network } = useApp();
  const [recipients, setRecipients] = useState(() => loadTeam(network));
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<RecipientFormData>({
    resolver: zodResolver(
      createRecipientSchema(network, recipients.map((r) => r.address))
    ),
    defaultValues: { address: "", displayName: "" },
  });

  const prefix = getAddressPrefix(network);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveTeam(recipients);
  }, [recipients]);

  const handleAdd = (data: RecipientFormData) => {
    setRecipients([
      ...recipients,
      {
        address: data.address,
        displayName: data.displayName || "Unnamed",
        lastPaid: null,
        totalReceived: { stx: 0, sbtc: 0 },
      },
    ]);
    form.reset();
    setOpen(false);
    toast.success("Recipient added");
  };

  const handleRemove = (addr: string) => {
    setRecipients(recipients.filter((r) => r.address !== addr));
    toast.success("Recipient removed");
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Team</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-3 w-3" /> <span className="hidden sm:inline">Import</span> CSV
            </Button>
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) form.reset();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary border-0 text-white hover:opacity-90">
                  <Plus className="h-3 w-3" /> <span className="hidden sm:inline ml-1">Add Recipient</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Recipient</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>STX Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={`${prefix}...`} className="font-mono text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Alice Chen" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full gradient-primary border-0 text-white hover:opacity-90">
                      Add Recipient
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Desktop Table */}
          <Card className="glass-card hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Paid</TableHead>
                    <TableHead>Total STX</TableHead>
                    <TableHead className="hidden lg:table-cell">Total sBTC</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton rows={4} cols={6} />
                  ) : recipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={Users}
                          title="No team members"
                          description="Add your first recipient to start building your payroll team."
                          actionLabel="Add Recipient"
                          onAction={() => setOpen(true)}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipients.map((r) => (
                      <TableRow key={r.address} className="hover:bg-accent/50 transition-colors">
                        <TableCell className="font-mono text-xs">{truncateAddress(r.address)}</TableCell>
                        <TableCell className="font-medium">{r.displayName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.lastPaid || "Never"}</TableCell>
                        <TableCell className="font-mono text-sm">{r.totalReceived.stx.toLocaleString()}</TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-sm">{r.totalReceived.sbtc.toFixed(4)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${r.displayName}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(r.address)}>
                                <Copy className="mr-2 h-3 w-3" /> Copy Address
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRemove(r.address)} className="text-destructive">
                                <Trash2 className="mr-2 h-3 w-3" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))
            ) : recipients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No team members"
                description="Add your first recipient to start building your payroll team."
                actionLabel="Add Recipient"
                onAction={() => setOpen(true)}
              />
            ) : (
              recipients.map((r) => (
                <Card key={r.address} className="glass-card">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{r.displayName}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${r.displayName}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(r.address)}>
                            <Copy className="mr-2 h-3 w-3" /> Copy Address
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemove(r.address)} className="text-destructive">
                            <Trash2 className="mr-2 h-3 w-3" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{truncateAddress(r.address)}</span>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>STX: {r.totalReceived.stx.toLocaleString()}</span>
                      <span>sBTC: {r.totalReceived.sbtc.toFixed(4)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>
    </div>
  );
}
