"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { EventForm } from "@/components/forms/event-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Event } from "@/lib/schemas";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

const columns: ColumnDef<Event>[] = [
  {
    accessorKey: "name",
    header: "Event Name",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.date), "PPP"),
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];

export default function EventsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: events, isLoading, mutate } = useFinancialData<Event[]>("/events");

  const handleSave = async (eventData: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
    // In a real application, you would send this data to your backend API
    console.log("Saving event:", eventData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    mutate(); // Revalidate data after save
    setIsFormOpen(false);
  };

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Events" description="Manage your important financial events" />
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={events || []} />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add/Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm onSubmit={handleSave} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}