"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { InsuranceForm } from "@/components/forms/insurance-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Insurance } from "@/lib/schemas";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";

const columns: ColumnDef<Insurance>[] = [
  {
    accessorKey: "policyName",
    header: "Policy Name",
  },
  {
    accessorKey: "provider",
    header: "Provider",
  },
  {
    accessorKey: "coverageAmount",
    header: "Coverage Amount",
    cell: ({ row }) => formatCurrency(row.original.coverageAmount),
  },
  {
    accessorKey: "premium",
    header: "Premium",
    cell: ({ row }) => formatCurrency(row.original.premium),
  },
  {
    accessorKey: "policyType",
    header: "Policy Type",
  },
];

export default function InsurancePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: insurances, isLoading, mutate } = useFinancialData<Insurance[]>("/insurance");

  const handleSave = async (insuranceData: Omit<Insurance, "id" | "createdAt" | "updatedAt">) => {
    // In a real application, you would send this data to your backend API
    console.log("Saving insurance:", insuranceData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    mutate(); // Revalidate data after save
    setIsFormOpen(false);
  };

  if (isLoading) {
    return <div>Loading insurance policies...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Insurance Policies" description="Manage your insurance policies" />
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Policy
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="policyName" columns={columns} data={insurances || []} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add/Edit Insurance Policy</DialogTitle>
          </DialogHeader>
          <InsuranceForm onSubmit={handleSave} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}