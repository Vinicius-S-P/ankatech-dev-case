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
import { useCSVImport } from "@/hooks/useCSVImport";
import { toast } from "sonner";

interface CSVImportDialogProps {
  onImport: (data: any[]) => void;
  dialogTrigger: React.ReactNode;
  title?: string;
  description?: string;
}

export function CSVImportDialog({
  onImport,
  dialogTrigger,
  title = "Import CSV Data",
  description = "Upload a CSV file to import data.",
}: CSVImportDialogProps) {
  const [open, setOpen] = useState(false);
  const { isLoading, csvData, error, handleFileChange } = useCSVImport({
    onImportSuccess: (data) => {
      if (data.length > 0) {
        toast.success(`${data.length} records successfully loaded from CSV.`);
      } else {
        toast.info("CSV file is empty or contains no valid data.");
      }
    },
    onImportError: (errorMessage) => {
      toast.error(`Failed to import CSV: ${errorMessage}`);
    },
  });

  const handleConfirmImport = () => {
    if (csvData.length > 0) {
      onImport(csvData);
      setOpen(false);
    } else {
      toast.error("No data to import. Please upload a valid CSV file.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csvFile" className="text-right">
              CSV File
            </Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
          {isLoading && <p className="text-center">Loading...</p>}
          {error && <p className="text-center text-destructive">Error: {error}</p>}
          {csvData.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {csvData.length} records ready to import.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={isLoading || csvData.length === 0}
          >
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}