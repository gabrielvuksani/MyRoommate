import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Minimal App with Query Client</h1>
        <p>Testing query client initialization...</p>
      </div>
    </QueryClientProvider>
  );
}

export default MinimalApp;