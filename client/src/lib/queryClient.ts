 import { QueryClient, QueryFunction } from "@tanstack/react-query";

    // Khai báo một giao diện để TypeScript biết về thuộc tính `isElectron`
    declare global {
      interface Window {
        isElectron?: boolean;
        API_BASE_URL?: string;
        // Bạn có thể thêm các API khác được expose qua contextBridge tại đây
        // electronAPI?: {
        //   getDbPath: () => Promise<string>;
        // };
      }
    }

    // Xác định base URL cho API.
    // Khi chạy trong Electron (được đánh dấu bởi window.isElectron), API backend sẽ chạy trên cổng 5000.
    // Trong môi trường trình duyệt thông thường (Vite dev server), nó vẫn là /api (được proxy bởi Vite).
    const API_BASE_URL = window.isElectron
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
      const fullUrl = `${API_BASE_URL}${url}`; // Kết hợp base URL với đường dẫn API
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
        const fullUrl = `${API_BASE_URL}${queryKey[0] as string}`; // Kết hợp base URL
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
          staleTime: Infinity,
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });