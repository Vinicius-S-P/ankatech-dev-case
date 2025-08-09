"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react"

export default function PortfolioPage() {
  const totalPortfolioValue = 1500000; // Example value
  const portfolioChange = 0.05; // Example 5% increase

  const investments = [
    { name: "Tech Stocks", value: 750000, allocation: 50, change: 0.10 },
    { name: "Real Estate Fund", value: 450000, allocation: 30, change: 0.02 },
    { name: "Bonds", value: 300000, allocation: 20, change: -0.01 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
              <p className="text-xs text-muted-foreground">
                {portfolioChange >= 0 ? (
                  <span className="inline-flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{ (portfolioChange * 100).toFixed(1) }% from last month
                  </span>
                ) : (
                  <span className="inline-flex items-center text-red-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    { (portfolioChange * 100).toFixed(1) }% from last month
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Number of Investments</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investments.length}</div>
              <p className="text-xs text-muted-foreground">Total unique assets</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Investment Allocation</CardTitle>
              <CardDescription>Distribution of portfolio across different assets.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="space-y-4">
                {investments.map((inv, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">{inv.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{inv.allocation}%</span>
                      <span className="text-sm font-medium">{formatCurrency(inv.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button>Manage Investments</Button>
        </div>
      </main>
    </div>
  );
}
