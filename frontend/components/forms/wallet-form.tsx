"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Wallet name must be at least 2 characters." }),
  balance: z.coerce.number().min(0, { message: "Balance must be a positive number." }),
});

interface WalletFormProps {
  initialData?: z.infer<typeof formSchema>;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel?: () => void;
}

export function WalletForm({ initialData, onSubmit, onCancel }: WalletFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      balance: 0,
    },
  });

  function handleSubmit(data: z.infer<typeof formSchema>) {
    onSubmit(data);
    toast.success("Wallet saved successfully!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet Name</FormLabel>
              <FormControl>
                <Input placeholder="Checking Account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Balance</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1000.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Save Wallet</Button>
        </div>
      </form>
    </Form>
  );
}