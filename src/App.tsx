import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Loader2, Sparkles } from 'lucide-react';

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ConfirmEmail = lazy(() => import("./pages/ConfirmEmail"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Sparkles className="w-8 h-8 text-[#2D2A3E]" />
      </div>
      <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin mx-auto" />
      <p className="text-gray-500 mt-4">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<ClientProfile />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/confirm-email" element={<ConfirmEmail />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

