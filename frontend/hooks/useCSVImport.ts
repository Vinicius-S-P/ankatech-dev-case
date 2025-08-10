import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";

interface UseCSVImportOptions {
  onImportSuccess?: (data: any[]) => void;
  onImportError?: (error: string) => void;
}

export function useCSVImport(options?: UseCSVImportOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== "text/csv") {
        setError("Please upload a CSV file.");
        toast.error("Please upload a CSV file.");
        options?.onImportError?.("Please upload a CSV file.");
        return;
      }
      setIsLoading(true);
      setError(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            const errorMessage = results.errors.map(err => err.message).join("; ");
            setError(errorMessage);
            toast.error(`CSV parsing error: ${errorMessage}`);
            options?.onImportError?.(errorMessage);
          } else {
            setCsvData(results.data);
            toast.success("CSV file parsed successfully!");
            options?.onImportSuccess?.(results.data);
          }
          setIsLoading(false);
        },
        error: (err: Error) => {
          setError(err.message);
          toast.error(`CSV parsing error: ${err.message}`);
          options?.onImportError?.(err.message);
          setIsLoading(false);
        },
      });
    }
  };

  return {
    isLoading,
    csvData,
    error,
    handleFileChange,
  };
}