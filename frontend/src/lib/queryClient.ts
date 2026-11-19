import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        count < 2 && !(error instanceof Error && 'status' in error),
      refetchOnWindowFocus: false,
    },
  },
})
