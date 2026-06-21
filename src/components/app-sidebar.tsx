import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  CreditCard,
  TrendingUp,
  Bitcoin,
  Landmark,
  PiggyBank,
  Settings,
  LineChart,
  Receipt,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const main = [
  { title: "Resumen", url: "/", icon: LayoutDashboard },
  { title: "Registrar", url: "/quick-log", icon: PlusCircle },
  { title: "Cuentas", url: "/tesoreria", icon: CreditCard },
  { title: "Cuotas", url: "/cuotas", icon: Receipt },
];

const portfolio = [
  { title: "Acciones EE.UU.", url: "/portafolio/acciones", icon: TrendingUp },
  { title: "Cripto", url: "/portafolio/cripto", icon: Bitcoin },
  { title: "Renta Fija (CDA)", url: "/portafolio/renta-fija", icon: Landmark },
  { title: "Fondos Mutuos", url: "/portafolio/fondos", icon: PiggyBank },
];

const config = [{ title: "Configuración", url: "/configuracion", icon: Settings }];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  const renderItems = (items: typeof main) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
            <LineChart className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-sidebar-foreground">
              FinAxis
            </div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              Finanzas personales
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(main)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Inversiones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(portfolio)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(config)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
