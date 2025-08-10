import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface FinancialDataHook<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any;
  mutate: (data?: T | Promise<T> | ((currentData: T | undefined) => T | undefined), shouldRevalidate?: boolean) => Promise<T | undefined>;
}

const fetcher = async (url: string) => {
  try {
    const response = await api.get(url);
    return response;
  } catch (error: any) {
    toast.error(`Failed to fetch data: ${error.message}`);
    throw error;
  }
};

export function useFinancialData<T>(endpoint: string): FinancialDataHook<T> {
  const { data, error, isLoading, mutate } = useSWR<T>(endpoint, fetcher);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}