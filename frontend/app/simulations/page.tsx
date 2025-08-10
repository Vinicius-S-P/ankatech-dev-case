"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { BarChart } from "@/components/ui/charts/bar-chart";
import { toast } from "sonner";

interface SimulationResult {
  year: number;
  value: number;
}

export default function SimulationsPage() {
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [annualContribution, setAnnualContribution] = useState<number>(1000);
  const [expectedReturn, setExpectedReturn] = useState<number>(7);
  const [years, setYears] = useState<number>(20);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);

  const runSimulation = () => {
    if (initialInvestment < 0 || annualContribution < 0 || expectedReturn < 0 || years <= 0) {
      toast.error("Please enter valid positive numbers for all fields.");
      return;
    }

    let currentInvestment = initialInvestment;
    const results: SimulationResult[] = [];
    const monthlyReturnRate = (expectedReturn / 100) / 12;
    const monthlyContribution = annualContribution / 12;

    for (let i = 1; i <= years; i++) {
      for (let j = 0; j < 12; j++) {
        currentInvestment = (currentInvestment + monthlyContribution) * (1 + monthlyReturnRate);
      }
      results.push({ year: i, value: parseFloat(currentInvestment.toFixed(2)) });
    }
    setSimulationResults(results);
    toast.success("Simulation completed!");
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Heading title="Financial Simulations" description="Project your financial future" />
      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Simulation Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
              <Input
                id="initialInvestment"
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="annualContribution">Annual Contribution ($)</Label>
              <Input
                id="annualContribution"
                type="number"
                value={annualContribution}
                onChange={(e) => setAnnualContribution(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="expectedReturn">Expected Annual Return (%)</Label>
              <Input
                id="expectedReturn"
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="years">Number of Years</Label>
              <Input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(parseInt(e.target.value))}
              />
            </div>
            <Button onClick={runSimulation} className="w-full">
              Run Simulation
            </Button>
          </CardContent>
        </Card>

        {simulationResults.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Simulation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={simulationResults}
                xAxisKey="year"
                barKey="value"
                title="Projected Portfolio Value Over Time"
                description="This chart shows the estimated growth of your investment based on the provided parameters."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}