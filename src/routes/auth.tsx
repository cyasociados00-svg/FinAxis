import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LineChart } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Acceder - FinAxis" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  function friendlyError(msg: string) {
    const m = msg.toLowerCase();
    if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
    if (m.includes("email not confirmed")) return "Tu email aún no está confirmado. Revisá tu casilla o pedí al administrador desactivar la confirmación por email.";
    if (m.includes("user already registered") || m.includes("already been registered")) return "Ya existe una cuenta con ese email. Iniciá sesión.";
    if (m.includes("rate limit")) return "Demasiados intentos seguidos. Esperá unos minutos e intentá de nuevo.";
    if (m.includes("signups not allowed") || m.includes("signup is disabled")) return "El registro está deshabilitado en el servidor.";
    if (m.includes("password should be")) return "La contraseña debe tener al menos 6 caracteres.";
    return msg;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(friendlyError(error.message)); return; }
    toast.success("Bienvenido! Cargando tus datos...");
    navigate({ to: "/" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { toast.error(friendlyError(error.message)); return; }

    // If email confirmation is enabled, signUp returns no session — the user
    // must click a link in their email before they can log in. Don't pretend
    // they're logged in; tell them what to do.
    if (!data.session) {
      toast.info("Cuenta creada. Revisá tu email para confirmar la cuenta antes de iniciar sesión.");
      return;
    }

    toast.success("¡Cuenta creada! Configurá tus métodos de pago para empezar.");
    navigate({ to: "/onboarding" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold">FinAxis</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Finanzas personales</div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Accedé a tu cuenta</CardTitle>
            <p className="text-xs text-muted-foreground">
              Tus datos se sincronizan en la nube y los podés ver desde cualquier dispositivo.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <Label htmlFor="l-email" className="text-xs uppercase tracking-wider">Email</Label>
                    <Input id="l-email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div>
                    <Label htmlFor="l-pw" className="text-xs uppercase tracking-wider">Contraseña</Label>
                    <Input id="l-pw" type="password" value={password}
                      onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Cargando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div>
                    <Label htmlFor="s-email" className="text-xs uppercase tracking-wider">Email</Label>
                    <Input id="s-email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div>
                    <Label htmlFor="s-pw" className="text-xs uppercase tracking-wider">Contraseña</Label>
                    <Input id="s-pw" type="password" minLength={6} value={password}
                      onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                    <p className="mt-1 text-[11px] text-muted-foreground">Mínimo 6 caracteres</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creando cuenta..." : "Crear cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                Continuar sin cuenta (solo local)
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
