// client/src/lib/queryClient.ts
 import { QueryClient, QueryFunction } from "@tanstack/react-query";

    declare global {
      interface Window {
        isElectron?: boolean;
        API_BASE_URL?: string;
        electronAPI?: {
          isElectronBuild: boolean;
          isProductionEnv: boolean;
        };
        location: Location;
      }
    }

    const API_BASE_URL = (window.electronAPI?.isElectronBuild || window.location.protocol === 'file:')
      ? 'http://localhost:5000'
      : '';

    window.API_BASE_URL = API_BASE_URL;

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
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log("apiRequest: Attempting to fetch from URL:", fullUrl);
      // debugger; // XÓA DÒNG NÀY
      const res = await fetch(fullUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
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
        const fullUrl = `${API_BASE_URL}${queryKey[0] as string}`;
        console.log("getQueryFn: Attempting to fetch from URL:", fullUrl);
        // debugger; // XÓA DÒNG NÀY
        const res = await fetch(fullUrl, {
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
          refetchInterval: false,
          refetchOnWindowFocus: false,
          staleTime: 0,
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });