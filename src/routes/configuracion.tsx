import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatPYG } from "@/lib/format";
import { pushLocalToCloud } from "@/lib/cloud-sync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { RefreshCw, LogOut, LogIn, Upload, CheckCircle2, Trash2 } from "lucide-react";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuracion - FinAxis" }] }),
  component: Configuracion,
});

function Configuracion() {
  const store = useStore();
  const hydrate = useStore((s) => s.hydrate);
  const accounts = useStore((s) => s.accounts);
  const cards = useStore((s) => s.cards);
  const rate = useStore((s) => s.exchangeRate);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [cloudIsEmpty, setCloudIsEmpty] = useState<boolean | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check if Supabase is empty for this user (to show the one-time migration button)
  useEffect(() => {
    if (!userEmail) return;
    const hasLocalData = accounts.length > 0 || cards.length > 0 || store.transactions.length > 0;
    if (!hasLocalData) {
      setCloudIsEmpty(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { count } = await (supabase as any)
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.user.id);
      setCloudIsEmpty((count ?? 0) === 0);
    });
  }, [userEmail, accounts.length]);

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      await pushLocalToCloud({
        exchangeRate: store.exchangeRate,
        accounts: store.accounts,
        cards: store.cards,
        transactions: store.transactions,
        installments: store.installments,
        stocks: store.stocks,
        crypto: store.crypto,
        cdas: store.cdas,
        funds: store.funds,
      });
      setMigrationDone(true);
      setCloudIsEmpty(false);
      toast.success("¡Datos migrados a Supabase correctamente!");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al migrar.");
    } finally {
      setIsMigrating(false);
    }
  };

  const handlePull = async () => {
    setIsSyncing(true);
    try {
      await hydrate();
      toast.success("Datos actualizados desde la nube.");
    } catch {
      toast.error("Error al obtener datos.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    toast.success("Sesión cerrada.");
  };

  const handleReset = async () => {
    try {
      await store.resetData();
      toast.success("Datos eliminados.");
    } catch (e: any) {
      toast.error(e.message ?? "Error al borrar");
    }
  };

  const showMigrationButton = userEmail && cloudIsEmpty === true && !migrationDone;

  return (
    <AppShell title="Configuración" subtitle="Cuenta, sincronización y datos">
      <div className="max-w-2xl space-y-4">
        {/* Account status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userEmail ? (
              <div className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{userEmail}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Sincronizacion activa
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  {isLoggingOut ? "Saliendo..." : "Cerrar sesion"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Sin sesion - los datos solo viven en este navegador.</p>
                <Button asChild size="sm">
                  <Link to="/auth">
                    <LogIn className="mr-1.5 h-3.5 w-3.5" /> Iniciar sesión
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* One-time migration - only shown when logged in + local data + cloud empty */}
        {showMigrationButton && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                Subir datos locales a la nube
              </CardTitle>
              <CardDescription>
                Tenés datos guardados en este navegador que aún no están en Supabase. Hacé clic para migrarlos. Este
                botón desaparece después de hacerlo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleMigrate} disabled={isMigrating} className="bg-blue-600 hover:bg-blue-700">
                {isMigrating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Migrando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Subir datos locales a Supabase
                  </>
                )}
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Solo inserta. No borra ni sobreescribe datos existentes en la nube.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sync */}
        {userEmail && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sincronización</CardTitle>
              <CardDescription>
                Los cambios se sincronizan automáticamente. Usá este botón si ves datos desactualizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={handlePull} disabled={isSyncing}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Actualizando..." : "Recargar desde la nube"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cuentas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin cuentas. Agregá desde Tesorería.</p>
              ) : (
                accounts.map((a) => (
                  <div key={a.id} className="flex justify-between border-b pb-1.5 last:border-0">
                    <div>
                      <div>{a.name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{a.kind}</div>
                    </div>
                    <div className="num font-mono font-medium">{formatPYG(a.balancePYG)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tarjetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {cards.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin tarjetas. Agregá desde Tesorería.</p>
              ) : (
                cards.map((c) => (
                  <div key={c.id} className="flex justify-between border-b pb-1.5 last:border-0">
                    <div>
                      <div>{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        TNA {c.tna}% · cierre {c.closingDay} · vto. {c.dueDay}
                      </div>
                    </div>
                    <div className="num font-mono font-medium">{formatPYG(c.balancePYG)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Danger zone */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Zona de peligro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Tipo de cambio:{" "}
              <span className="num font-mono text-foreground">{rate.toLocaleString("es-PY")} PYG/USD</span>
            </p>
            <Button variant="destructive" size="sm" onClick={() => setConfirmReset(true)}>
              Borrar todos los datos (local + nube)
            </Button>
          </CardContent>
        </Card>
      </div>
      <ConfirmDelete
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="¿Borrar todos los datos?"
        description="Esta acción elimina todos tus datos locales y en la nube. No se puede deshacer."
        onConfirm={handleReset}
      />
    </AppShell>
  );
}
