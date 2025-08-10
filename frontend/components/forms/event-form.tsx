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
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  date: z.date({ required_error: "Event date is required." }),
  description: z.string().optional(),
});

interface EventFormProps {
  initialData?: z.infer<typeof formSchema>;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel?: () => void;
}

export function EventForm({ initialData, onSubmit, onCancel }: EventFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? { ...initialData, date: new Date(initialData.date) } : {
      name: "",
      date: undefined,
      description: "",
    },
  });

  function handleSubmit(data: z.infer<typeof formSchema>) {
    onSubmit(data);
    toast.success("Event saved successfully!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="Birthday Party" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Date</FormLabel>
              <FormControl>
                <DatePicker date={field.value} setDate={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Brief description of the event" {...field} />
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
          <Button type="submit">Save Event</Button>
        </div>
      </form>
    </Form>
  );
}