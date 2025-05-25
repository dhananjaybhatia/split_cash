import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query, ...args) => {
  const result = useQuery(query, ...args);
  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (error) {
        setError(error);
        toast.error(error.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return {
    data,
    isLoading,
    error,
    isReady: !isLoading && !error, // Additional helper flag
  };
};

export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (error) {
      setError(error);
      toast.error(error.message || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };
  return {
    mutate,
    isLoading,
    data,
    error,
    isSuccess: Boolean(data && !error && !isLoading),
  };
};
