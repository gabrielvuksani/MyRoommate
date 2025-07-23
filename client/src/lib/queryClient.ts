import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let processedData = data;

  const res = await fetch(url, {
    method,
    headers: processedData ? { "Content-Type": "application/json" } : {},
    body: processedData ? JSON.stringify(processedData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // No polling - WebSocket handles real-time updates
      refetchOnWindowFocus: false, // WebSocket handles focus/visibility changes
      refetchOnReconnect: true, // Still refetch when coming back online
      staleTime: 30 * 60 * 1000, // 30 minutes - WebSocket invalidates when needed
      gcTime: 60 * 60 * 1000, // 1 hour - keep data cached longer
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
