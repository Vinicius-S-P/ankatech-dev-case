import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  skip?: boolean; // If true, the API call will be skipped initially
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fetchData: (...args: any[]) => Promise<void>;
}

const useApi = <T, A extends any[]>( 
  apiCall: (...args: A) => Promise<T>,
  options?: UseApiOptions<T>
): UseApiResult<T> => {
  const { initialData = null, onSuccess, onError, skip = false } = options || {};
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!skip);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (...args: A) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      onError?.(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
  }, [fetchData, skip]);

  return { data, loading, error, fetchData };
};

export default useApi;