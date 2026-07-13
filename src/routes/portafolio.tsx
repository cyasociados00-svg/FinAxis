import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portafolio")({
  component: PortafolioLayout,
});

const tabs = [
  { to: "/portafolio/acciones", label: "Acciones EE.UU." },
  { to: "/portafolio/cripto", label: "Cripto" },
  { to: "/portafolio/renta-fija", label: "Renta Fija (CDA)" },
  { to: "/portafolio/fondos", label: "Fondos Mutuos" },
  { to: "/portafolio/ahorros", label: "Ahorro Programado" },
] as const;

function PortafolioLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AppShell title="Portafolio" subtitle="Inversiones multi-activo · Mark-to-Market">
      <div className="mb-4 inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        {tabs.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1 text-xs font-medium transition-all",
                active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </AppShell>
  );
}
