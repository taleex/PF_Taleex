import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import Header from "./components/Header";
import Index from "./pages/Index";
import ProjectsPage from "./pages/ProjectsPage";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ServiceUnavailable from "./pages/ServiceUnavailable";
import ScrollToTop from "./components/ScrollToTop";
import ScrollProgress from "./components/ScrollProgress";
import BackToTop from "./components/BackToTop";
import { SupabaseErrorHandler } from "./components/ErrorBoundary";
import { notifySupabaseError } from "./lib/supabase-error";
import { ClickSoundManager } from "./components/ClickSoundManager";

// Lazy load FeedbackChat component
const FeedbackChat = lazy(() => import("./components/FeedbackChat"));

const queryCache = new QueryCache({
  onError: (error, query) => {
    notifySupabaseError(error, {
      source: "react-query",
      queryKey: query?.queryKey,
    });
  },
});

const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const supabaseError = error as { code?: string; message?: string };
        // Don't retry on Supabase errors
        if (
          supabaseError?.code === "PGRST" ||
          supabaseError?.message?.includes("supabase")
        ) {
          return false;
        }
        return failureCount < 3;
      },
      // Optimize caching to reduce unnecessary refetches
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      refetchOnMount: "stale", // Only refetch if data is stale
    },
  },
});

const AppContent = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const isAdminRoute =
    location.pathname.startsWith("/admin") || location.pathname === "/auth";

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        {!isAdminRoute && <AppSidebar />}
        <div className="flex-1 flex flex-col w-full">
          {!isAdminRoute && (
            <>
              <Header />
              <ScrollToTop />
              <ScrollProgress />
              <BackToTop />
              <Suspense fallback={null}>
                <FeedbackChat onOpenChange={setIsChatOpen} />
              </Suspense>
            </>
          )}
          <Routes>
            <Route path="/" element={<Index isChatOpen={isChatOpen} />} />
            <Route
              path="/projects"
              element={<ProjectsPage isChatOpen={isChatOpen} />}
            />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-unavailable"
              element={<ServiceUnavailable />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SupabaseErrorHandler>
            <ClickSoundManager />
            <AppContent />
          </SupabaseErrorHandler>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
