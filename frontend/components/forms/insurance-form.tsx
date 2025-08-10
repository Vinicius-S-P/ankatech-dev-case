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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  policyName: z.string().min(2, { message: "Policy name must be at least 2 characters." }),
  provider: z.string().min(2, { message: "Provider name must be at least 2 characters." }),
  coverageAmount: z.coerce.number().min(0, { message: "Coverage amount must be a positive number." }),
  premium: z.coerce.number().min(0, { message: "Premium must be a positive number." }),
  notes: z.string().optional(),
});

interface InsuranceFormProps {
  initialData?: z.infer<typeof formSchema>;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel?: () => void;
}

export function InsuranceForm({ initialData, onSubmit, onCancel }: InsuranceFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      policyName: "",
      provider: "",
      coverageAmount: 0,
      premium: 0,
      notes: "",
    },
  });

  function handleSubmit(data: z.infer<typeof formSchema>) {
    onSubmit(data);
    toast.success("Insurance policy saved successfully!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="policyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Name</FormLabel>
              <FormControl>
                <Input placeholder="Life Insurance" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <Input placeholder="Acme Insurance" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverageAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coverage Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="100000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="premium"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Premium</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional notes" {...field} />
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
          <Button type="submit">Save Policy</Button>
        </div>
      </form>
    </Form>
  );
}