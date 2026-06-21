import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ExchangeRateInput } from "@/components/exchange-rate-input";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { syncQueue } from "@/lib/sync-queue";
import { Wifi, WifiOff, Clock } from "lucide-react";

function SyncIndicator() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const tick = () => {
      setOnline(navigator.onLine);
      setPending(syncQueue.size());
    };
    tick();
    const interval = setInterval(tick, 3000);
    window.addEventListener("online", tick);
    window.addEventListener("offline", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", tick);
      window.removeEventListener("offline", tick);
    };
  }, []);

  if (online && pending === 0) return null; // all good - invisible

  if (!online)
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <WifiOff className="h-3 w-3" /> Sin conexión
      </div>
    );

  // online but queue not empty
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
      <Clock className="h-3 w-3" /> {pending} pendiente{pending > 1 ? "s" : ""}
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null | undefined>(undefined);

  const accounts = useStore((s) => s.accounts);
  const cards = useStore((s) => s.cards);
  const hasPaymentMethods = accounts.length > 0 || cards.length > 0;

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="min-w-0">
                <h1 className="text-sm font-semibold tracking-tight truncate">{title}</h1>
                {subtitle ? (
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{subtitle}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {mounted && <SyncIndicator />}
              {mounted ? actions : null}
              {mounted ? <ExchangeRateInput /> : null}
            </div>
          </header>

          {/* Banner: not logged in */}
          {mounted && userEmail === null && (
            <div className="flex items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <span>Modo local - los datos solo se guardan en este navegador.</span>
              <Link
                to="/auth"
                className="shrink-0 rounded bg-amber-200 px-2 py-0.5 font-medium hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700"
              >
                Iniciar sesión &rarr;
              </Link>
            </div>
          )}

          {/* Banner: logged in but no payment methods */}
          {mounted && userEmail && !hasPaymentMethods && (
            <div className="flex items-center justify-between gap-3 border-b bg-blue-50 px-4 py-2 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              <span>Para registrar movimientos necesitás al menos una cuenta o tarjeta.</span>
              <Link
                to="/onboarding"
                className="shrink-0 rounded bg-blue-200 px-2 py-0.5 font-medium hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700"
              >
                Configurar &rarr;
              </Link>
            </div>
          )}

          <main className="flex-1 p-4 md:p-6">
            {mounted ? children : <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
