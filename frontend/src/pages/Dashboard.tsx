import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { DashboardSkeleton } from "@/components/SkeletonCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, CurrencyBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { mockPayrollRuns, mockRecipients, mockMonthlySpending, formatCurrency } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Coins, Bitcoin, Users, CreditCard, Plus, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Legend } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

const totalStx = mockRecipients.reduce((sum, r) => sum + r.totalReceived.stx, 0);
const totalSbtc = mockRecipients.reduce((sum, r) => sum + r.totalReceived.sbtc, 0);

const stats = [
  { label: "Total Paid STX", value: totalStx.toLocaleString(), sub: "All-time", icon: Coins, color: "text-stx" },
  { label: "Total Paid sBTC", value: totalSbtc.toFixed(4), sub: "All-time", icon: Bitcoin, color: "text-sbtc" },
  { label: "Team Members", value: String(mockRecipients.length), sub: "Active recipients", icon: Users, color: "text-primary" },
  { label: "Payroll Runs", value: String(mockPayrollRuns.length), sub: "This quarter", icon: CreditCard, color: "text-success" },
];

const currencyBreakdown = [
  { name: "STX", value: totalStx, fill: "hsl(245 100% 64%)" },
  { name: "sBTC", value: totalSbtc * 40000, fill: "hsl(24 94% 53%)" },
];

const topRecipients = [...mockRecipients]
  .sort((a, b) => b.totalReceived.stx - a.totalReceived.stx)
  .slice(0, 5)
  .map((r) => ({ name: r.displayName, stx: r.totalReceived.stx }));

const areaChartConfig: ChartConfig = {
  stx: { label: "STX Spent", color: "hsl(245 100% 64%)" },
  sbtc: { label: "sBTC Spent", color: "hsl(24 94% 53%)" },
};

const pieChartConfig: ChartConfig = {
  STX: { label: "STX", color: "hsl(245 100% 64%)" },
  sBTC: { label: "sBTC (USD equiv)", color: "hsl(24 94% 53%)" },
};

const barChartConfig: ChartConfig = {
  stx: { label: "STX Received", color: "hsl(var(--primary))" },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { wallet } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's your payroll overview.</p>
          </div>
          <Button onClick={() => navigate("/dashboard/payroll/new")} className="gradient-primary border-0 text-white hover:opacity-90" size="sm">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline ml-1">New Payroll</span>
          </Button>
        </div>

        {/* Stats */}
        <motion.div
          className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={staggerItem}>
              <Card className="glass-card hover:border-primary/20 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold font-mono">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Payroll */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Recent Payroll Runs</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/payroll")} className="text-primary">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            {/* Desktop Table */}
            <CardContent className="p-0 hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayrollRuns.map((pr) => (
                    <TableRow key={pr.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/dashboard/payroll/${pr.id}`)}>
                      <TableCell className="font-medium">{pr.period}</TableCell>
                      <TableCell><CurrencyBadge type={pr.type} /></TableCell>
                      <TableCell>{pr.recipients.length}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(pr.totalAmount, pr.type)}</TableCell>
                      <TableCell><StatusBadge status={pr.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            {/* Mobile Cards */}
            <CardContent className="p-3 space-y-3 md:hidden">
              {mockPayrollRuns.map((pr) => (
                <Card key={pr.id} className="glass-card cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate(`/dashboard/payroll/${pr.id}`)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{pr.period}</span>
                      <StatusBadge status={pr.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <CurrencyBadge type={pr.type} />
                      <span className="font-mono text-sm font-semibold">{formatCurrency(pr.totalAmount, pr.type)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pr.recipients.length} recipient{pr.recipients.length !== 1 ? "s" : ""}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Charts */}
        <motion.div
          className="grid lg:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Payroll Over Time */}
          <motion.div variants={staggerItem} className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Payroll Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={areaChartConfig} className="h-[220px] sm:h-[280px] w-full min-w-0">
                  <AreaChart data={mockMonthlySpending} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stxGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(245 100% 64%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(245 100% 64%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="sbtcGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(24 94% 53%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(24 94% 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis yAxisId="stx" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis yAxisId="sbtc" orientation="right" tick={{ fontSize: 12, fill: "hsl(24 94% 53%)" }} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{
                                  backgroundColor: name === "STX Spent" ? "hsl(245 100% 64%)" : "hsl(24 94% 53%)",
                                }}
                              />
                              <span className="text-muted-foreground">{name}</span>
                              <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                                {name === "STX Spent"
                                  ? `${Number(value).toLocaleString()} STX`
                                  : `${Number(value).toFixed(4)} sBTC`}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      type="monotone"
                      dataKey="stx"
                      name="STX Spent"
                      yAxisId="stx"
                      stroke="hsl(245 100% 64%)"
                      strokeWidth={2}
                      fill="url(#stxGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="sbtc"
                      name="sBTC Spent"
                      yAxisId="sbtc"
                      stroke="hsl(24 94% 53%)"
                      strokeWidth={2}
                      fill="url(#sbtcGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Currency Breakdown */}
          <motion.div variants={staggerItem}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Currency Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={pieChartConfig} className="h-[220px] sm:h-[280px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={currencyBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {currencyBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Recipients */}
          <motion.div variants={staggerItem}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[220px] sm:h-[280px] w-full">
                  <BarChart data={topRecipients} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} className="fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="stx" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
  );
}
