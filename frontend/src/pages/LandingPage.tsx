import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { truncateAddress } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { Zap, Coins, Users, Wallet, Building2, UserPlus, CreditCard, ArrowRight, Github, Twitter, Menu, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.5 } }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const features = [
  { icon: Zap, title: "Atomic Payments", desc: "Every payroll transaction is settled on-chain with finality guaranteed by Bitcoin's proof-of-work." },
  { icon: Coins, title: "STX + sBTC", desc: "Pay your team in native STX or Bitcoin-pegged sBTC — both secured by the Stacks blockchain." },
  { icon: Users, title: "Batch Payroll", desc: "Run payroll for up to 20 recipients in a single transaction with itemized on-chain receipts." },
];

const steps = [
  { icon: Wallet, label: "Connect Wallet", desc: "Link your Hiro or Leather wallet" },
  { icon: Building2, label: "Register Org", desc: "Create your on-chain organization" },
  { icon: UserPlus, label: "Add Team", desc: "Add recipients by STX address" },
  { icon: CreditCard, label: "Run Payroll", desc: "Execute and settle on Bitcoin" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { wallet, role, disconnectWallet } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = role === "freelancer" ? "/freelancer" : "/dashboard";
  const handleGetStarted = () => navigate(wallet.connected ? dashboardPath : "/connect");

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl" aria-label="Main navigation">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <span className="font-semibold text-lg tracking-tight">FlowLedger</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-2">
            {wallet.connected && wallet.address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:inline-flex gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs">{truncateAddress(wallet.address)}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { disconnectWallet(); }} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/connect")} className="gradient-primary border-0 text-white hover:opacity-90 hidden sm:inline-flex">
                <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
              </Button>
            )}
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 hover:text-primary transition-colors">Features</a>
                  <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 hover:text-primary transition-colors">How It Works</a>
                  {wallet.connected && wallet.address ? (
                    <>
                      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="font-mono text-xs">{truncateAddress(wallet.address)}</span>
                      </div>
                      <Button onClick={() => { setMobileOpen(false); navigate(dashboardPath); }} variant="outline" className="justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                      </Button>
                      <Button onClick={() => { setMobileOpen(false); disconnectWallet(); }} variant="ghost" className="justify-start text-destructive hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" /> Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => { setMobileOpen(false); navigate("/connect"); }} className="gradient-primary border-0 text-white hover:opacity-90 mt-4">
                      <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="container py-24 md:py-32 lg:py-40">
        <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-primary tracking-widest uppercase mb-4">
            Stacks-Powered Payroll
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            On-Chain Payroll.{" "}
            <motion.span
              className="gradient-text inline-block"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Settled on Bitcoin.
            </motion.span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            FlowLedger brings transparent, auditable payroll to the Stacks blockchain.
            Pay your team in STX or sBTC with full on-chain accountability.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="gradient-primary border-0 text-white hover:opacity-90 text-base px-8">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }} className="text-base px-8">
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20 md:py-28">
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
            Built for Modern Teams
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
            Enterprise-grade payroll infrastructure secured by Bitcoin
          </motion.p>
        </motion.div>
        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={staggerItem}>
              <Card className="glass-card hover:border-primary/30 transition-all duration-300 h-full group">
                <CardContent className="p-6 pt-6">
                  <motion.div
                    className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <f.icon className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-y bg-muted/30 py-20 md:py-28">
        <div className="container">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg">
              Four steps to on-chain payroll
            </motion.p>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((s, i) => (
              <motion.div key={s.label} className="text-center" variants={staggerItem}>
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                  <s.icon className="h-7 w-7 text-primary" />
                  <motion.span
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full gradient-primary text-white text-xs font-bold flex items-center justify-center"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 + 0.3, type: "spring", stiffness: 400 }}
                  >
                    {i + 1}
                  </motion.span>
                </div>
                <h3 className="font-semibold mb-1">{s.label}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 md:py-28">
        <motion.div
          className="max-w-3xl mx-auto text-center glass-card rounded-2xl p-10 md:p-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.h2 variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl md:text-4xl font-bold mb-4">
            Ready to modernize payroll?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-muted-foreground mb-8 text-lg">
            Join the future of transparent, Bitcoin-secured compensation.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Button size="lg" onClick={handleGetStarted} className="gradient-primary border-0 text-white hover:opacity-90 text-base px-8">
              Connect Wallet & Start <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-sm text-muted-foreground">FlowLedger · Stacks Testnet</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="GitHub"><Github className="h-4 w-4" /></a>
            <a href="#" className="text-muted-foreground hover:text-foreground" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
