import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { syncQueue } from "@/lib/sync-queue";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Podés intentar recargar o volver al inicio.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "FinAxis" },
      { name: "description", content: "Finanzas personales e inversiones." },
      { name: "theme-color", content: "#1e293b" },
      // iOS: allow add-to-home-screen as a standalone app
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "FinAxis" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Retry the offline sync queue. Failures aren't always network-related (a
// data/schema bug can queue an op while the browser stays "online" the whole
// time), so relying solely on the browser's `online` event leaves those stuck
// forever. Called on boot and on a periodic timer too, so a fixed bug's
// backlog drains on its own without requiring an actual reconnect.
async function flushSyncQueue() {
  if (syncQueue.size() === 0 || !navigator.onLine) return;
  const { supabase: sb } = await import("@/integrations/supabase/client");
  const result = await syncQueue.flush(sb);
  if (result.flushed > 0) {
    const { toast } = await import("sonner");
    toast.success(
      `${result.flushed} cambio${result.flushed > 1 ? "s" : ""} sincronizado${result.flushed > 1 ? "s" : ""}`,
    );
  }
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Lazy import to avoid SSR issues with zustand persist
    async function boot() {
      const { useStore } = await import("@/lib/store");
      const store = useStore.getState();

      // Run pending programmed-savings deposits
      try {
        store.runProgrammedSavings();
      } catch (e) {
        console.error(e);
      }

      // If already logged in, hydrate from Supabase immediately
      store.hydrate();

      // Retry any leftover offline-queue ops now, in case they were stuck on
      // a bug (not a real disconnect) that's since been fixed.
      flushSyncQueue();
    }
    boot();

    // Safety net: also retry periodically while the app stays open and
    // online, so a queue that gets stuck mid-session doesn't wait for a
    // reload or an actual online/offline transition to drain.
    const flushInterval = setInterval(flushSyncQueue, 60_000);

    // Re-act to auth changes (login / logout from any tab).
    // IMPORTANT: gotrue holds an internal lock while firing this callback.
    // store.hydrate() calls supabase.auth.getUser(), which needs that same
    // lock — calling it directly here deadlocks signInWithPassword (the login
    // promise never resolves, UI stuck on "Cargando..."). Defer with
    // setTimeout(…, 0) so the work runs after the lock is released.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      setTimeout(async () => {
        const { useStore } = await import("@/lib/store");
        const store = useStore.getState();

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          await store.hydrate();
        } else if (event === "SIGNED_OUT") {
          store.clearLocal();
        }
      }, 0);
    });

    // Flush offline queue when connection returns
    window.addEventListener("online", flushSyncQueue);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", flushSyncQueue);
      clearInterval(flushInterval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
