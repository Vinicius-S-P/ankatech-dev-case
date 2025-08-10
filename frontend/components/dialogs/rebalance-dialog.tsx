"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RebalanceDialogProps {
  onRebalance: (amount: number) => void;
}

export function RebalanceDialog({ onRebalance }: RebalanceDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  const handleRebalance = () => {
    if (amount > 0) {
      onRebalance(amount);
      toast.success(`Rebalanced with $${amount.toFixed(2)}`);
      setOpen(false);
      setAmount(0);
    } else {
      toast.error("Please enter a valid amount.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Rebalance Portfolio</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rebalance Portfolio</DialogTitle>
          <DialogDescription>
            Enter the amount you wish to rebalance your portfolio by.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleRebalance}>
            Confirm Rebalance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}