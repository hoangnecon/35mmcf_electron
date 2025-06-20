// client/src/App.tsx
import { Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location"; // SỬA DÒNG NÀY ĐỂ IMPORT CHÍNH XÁC
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PosPage from "@/pages/pos";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useHashLocation();

  return (
    <Switch location={location}>
      <Route path="/" component={PosPage} />
      {/* MenuPage is now integrated into PosPage as a tab, so no longer a separate route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;