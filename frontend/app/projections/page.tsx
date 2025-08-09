"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProjectionResult {
  year: number;
  projectedValue: number;
  realValue: number;
  afterTaxValue: number;
}

export default function ProjectionsPage() {
  const [initialValue, setInitialValue] = useState<number>(100000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [annualRate, setAnnualRate] = useState<number>(0.07);
  const [years, setYears] = useState<number>(20);
  const [projectionData, setProjectionData] = useState<ProjectionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateProjection = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real application, this would call a backend API
      // For now, we'll simulate the calculation
      const monthlyRate = annualRate / 12;
      const months = years * 12;
      let currentValue = initialValue;
      const data: ProjectionResult[] = [];

      for (let i = 0; i < months; i++) {
        currentValue = (currentValue + monthlyContribution) * (1 + monthlyRate);
        if ((i + 1) % 12 === 0) { // End of year calculations
          const year = (i + 1) / 12;
          // Simplified calculations for frontend demo
          const afterTaxValue = currentValue * 0.85; // 15% tax
          const realValue = afterTaxValue / Math.pow(1.03, year); // 3% inflation
          data.push({
            year: year,
            projectedValue: currentValue,
            realValue: realValue,
            afterTaxValue: afterTaxValue
          });
        }
      }
      setProjectionData(data);
    } catch (err) {
      setError("Failed to calculate projection. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Financial Projections</h1>

        <Card>
          <CardHeader>
            <CardTitle>Projection Parameters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="initialValue">Initial Value</Label>
              <Input
                id="initialValue"
                type="number"
                value={initialValue}
                onChange={(e) => setInitialValue(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
              <Input
                id="monthlyContribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="annualRate">Annual Growth Rate (%)</Label>
              <Input
                id="annualRate"
                type="number"
                step="0.01"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="years">Projection Years</Label>
              <Input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
            </div>
            <div className="col-span-full">
              <Button onClick={handleCalculateProjection} disabled={loading}>
                {loading ? "Calculating..." : "Calculate Projection"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && <div className="text-red-500">{error}</div>}

        {projectionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projection Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="projectedValue" stroke="#8884d8" name="Projected Value" />
                    <Line type="monotone" dataKey="realValue" stroke="#82ca9d" name="Real Value (Inflation Adjusted)" />
                    <Line type="monotone" dataKey="afterTaxValue" stroke="#ffc658" name="After Tax Value" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
