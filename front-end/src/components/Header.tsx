"use client";

import { Bell, Search, Building2, ChevronDown, Menu, LayoutDashboard, Calendar, CalendarDays, CalendarCheck, MessageSquare, CreditCard, Settings, Building2 as Building2Icon, Users, Server, Contact, Filter, Megaphone, UserCircle, Wand2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaletteToggle } from "@/components/PaletteToggle";
import { usePathname } from "next/navigation";
import { hasRouteAccess } from "@/lib/routePermissions";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBackendUrl } from "@/lib/api";


type NavItem = {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  badgeKey?: string;
  requiresTenant?: boolean;
  category?: string;
};

const navLinks: NavItem[] = [
  { href: "/",             label: "Painel",        icon: LayoutDashboard, category: "Principal" },
  { href: "/calendar",     label: "Agenda",        icon: CalendarDays,        requiresTenant: true, category: "Principal" },
  { href: "/appointments", label: "Agendamentos",  icon: CalendarCheck,        requiresTenant: true, category: "Principal" },
  { href: "/clients",      label: "Clientes",      icon: Contact,         requiresTenant: true, category: "Relacionamento" },
  { href: "/funil",        label: "Funil",         icon: Filter,          requiresTenant: true, category: "Relacionamento" },
  { href: "/chats",        label: "Conversas",     icon: MessageSquare,   badgeKey: "chats", requiresTenant: true, category: "Relacionamento" },
  { href: "/broadcast",    label: "Disparos",      icon: Megaphone,       requiresTenant: true, category: "Relacionamento" },
  { href: "/payments",     label: "Pagamentos",    icon: CreditCard,      badgeKey: "payments", requiresTenant: true, category: "Financeiro" },
  { href: "/admin/tenants",label: "Empresas",      icon: Building2,       category: "Administração" },
  { href: "/admin/users",  label: "Usuários",      icon: Users,           category: "Administração" },
  { href: "/admin/broadcast", label: "Disparos",   icon: Megaphone,       category: "Administração" },
  { href: "/admin/settings",label: "Sistema",      icon: Server,          category: "Administração" },
  { href: "/admin/ai-presets",label: "Templates de IA", icon: Wand2,           category: "Administração" },
  { href: "/settings",     label: "Configurações", icon: Settings,        requiresTenant: true, category: "Administração" },
  { href: "/profile",      label: "Meu Perfil",    icon: UserCircle, category: "Administração" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    if ((session?.user as any)?.role === "SUPERADMIN") {
      const token = (session?.user as any)?.accessToken;
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(getBackendUrl('/api/tenants'), { headers })
        .then((r) => r.json())
        .then((d) => { if (d.success) setTenants(d.data); });
    } else if (session?.user && (session.user as any).tenants) {
      setTenants((session.user as any).tenants);
    }
  }, [session]);

  if (pathname === "/login") return null;

  const activeTenant = tenants.find((t) => t.id === (session as any)?.tenantId);

  const pageTitles: Record<string, { title: string; sub: string }> = {
    "/dashboard":        { title: "Painel",               sub: "Visão geral do sistema" },
    "/calendar":         { title: "Agenda",               sub: "Controle de horários" },
    "/appointments":     { title: "Agendamentos",         sub: "Histórico e status" },
    "/clients":          { title: "Clientes",             sub: "Base de contatos" },
    "/assinantes":       { title: "Assinantes",           sub: "Quem assinou seus planos" },
    "/funil":            { title: "Funil de Vendas",      sub: "Pipeline de leads" },
    "/chats":            { title: "Conversas",            sub: "Inbox de mensagens" },
    "/broadcast":        { title: "Disparos",             sub: "Mensagens em massa" },
    "/payments":         { title: "Recibos",              sub: "Cobranças e recebimentos" },
    "/reports":          { title: "Relatórios",          sub: "Análise de desempenho" },
    "/planos":           { title: "Planos",               sub: "Planos oferecidos" },
    "/settings":         { title: "Configurações",       sub: "Dados e preferências" },
    "/team":             { title: "Equipe e Acessos",    sub: "Usuários e permissões" },
    "/services":         { title: "Serviços",            sub: "Catálogo de serviços" },
    "/billing":          { title: "Minha Assinatura",    sub: "Plano atual e faturamento" },
    "/profile":          { title: "Meu Perfil",          sub: "Dados da sua conta" },
    "/admin/tenants":    { title: "Empresas",             sub: "Gestão de tenants" },
    "/admin/settings":   { title: "Sistema",             sub: "Configurações globais" },
    "/admin/ai-presets": { title: "Templates IA",        sub: "Modelos de inteligência artificial" },
  };

  const current = Object.entries(pageTitles).reverse().find(([k]) =>
    k === "/dashboard" ? pathname === "/dashboard" || pathname === "/" : pathname.startsWith(k)
  );
  const pageInfo = current?.[1] ?? { title: "Painel", sub: "" };

  // Item 15 — browser tab title
  useEffect(() => {
    document.title = pageInfo.title ? `AgendaZap — ${pageInfo.title}` : "AgendaZap";
  }, [pageInfo.title]);
  
  const avatarRaw = (session?.user?.image || (session?.user as any)?.picture) as string;
  const hasAvatar = typeof avatarRaw === 'string' && avatarRaw.trim() !== '' && avatarRaw !== 'null';
  const avatarSrc = hasAvatar ? `/api/image-proxy?url=${encodeURIComponent(avatarRaw)}` : "";

  return (
    <header
      className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-md"
    >
      {/* Left: title */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger className="p-2 -ml-2 rounded-lg hover:bg-muted lg:hidden transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] p-0 flex flex-col border-none"
            style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
          >
            {/* Mobile brand */}
            <div className="p-5 flex items-center gap-3">
              <div
                className="w-9 h-9 flex items-center justify-center font-display font-extrabold text-xl overflow-hidden shadow-sm rounded-lg"
                style={{
                  background: "var(--sidebar-primary)",
                  color: "var(--sidebar-primary-foreground)",
                  transform: "rotate(-4deg)",
                }}
              >
                A
              </div>
              <span className="font-display text-xl font-extrabold tracking-wide" style={{ color: "var(--sidebar-foreground)" }}>
                AgendaZap
              </span>
            </div>
            
            {/* Mobile nav */}
            <nav className="flex flex-col gap-1 flex-1 px-3 py-2 overflow-y-auto">
              {Object.entries(
                navLinks.reduce((acc: any, item: any) => {
                  const activeTenantId = (session as any)?.tenantId;
                  const tenantObj = tenants.find((t: any) => t.id === activeTenantId);
                  const permissions = tenantObj?.permissions || [];
                  if (!hasRouteAccess(item.href, (session?.user as any)?.role, permissions)) return acc;
                  
                  const cat = item.category || "Outros";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {})
              ).map(([category, items]: [string, any], catIndex) => (
                <div key={category} className="flex flex-col">
                  {catIndex > 0 && (
                    <div className="mx-3 my-2" style={{ borderTop: "1px solid var(--sidebar-border)" }} />
                  )}
                  <div className="px-3 text-[10px] font-bold tracking-[0.12em] uppercase mb-1 opacity-40">
                    {category}
                  </div>
                  {items.map((item: any) => {
                    const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN";
                    const activeTenantId = (session as any)?.tenantId;
                    const locked = item.requiresTenant && isSuperAdmin && !activeTenantId;
                    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        href={locked ? "#" : item.href}
                        key={item.label}
                        className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                          locked
                            ? 'opacity-25 cursor-not-allowed font-medium'
                            : active
                              ? 'font-bold shadow-sm'
                              : 'font-medium opacity-65 hover:opacity-100 hover:bg-white/[0.06]'
                        }`}
                        style={
                          active && !locked
                            ? { background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }
                            : undefined
                        }
                      >
                        {active && !locked && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                            style={{ background: "var(--sidebar-primary-foreground)" }}
                          />
                        )}
                        <Icon className={`w-4 h-4 transition-transform duration-200 ${!active && !locked ? 'group-hover:scale-110' : ''}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Page title */}
        <div>
          <h1 className="font-display font-extrabold text-lg sm:text-2xl leading-none text-foreground truncate max-w-[120px] sm:max-w-none">
            {pageInfo.title}
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{pageInfo.sub}</p>
        </div>

        {/* Tenant selector */}
        {tenants.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 text-sm font-semibold border border-border rounded-xl px-3 py-1.5 bg-background/50 hover:bg-muted transition-colors focus:outline-none text-muted-foreground"
            >
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="max-w-[80px] sm:max-w-[140px] truncate">
                {activeTenant ? activeTenant.name : "Selecionar empresa"}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Empresas</div>
              <DropdownMenuSeparator />
              {(session?.user as any)?.role === "SUPERADMIN" && (
                <DropdownMenuItem
                  onClick={async () => { await update({ tenantId: null }); window.location.reload(); }}
                  className={!(session as any)?.tenantId ? "font-semibold text-primary" : ""}
                >
                  Todas as Empresas (Painel)
                </DropdownMenuItem>
              )}
              {tenants.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={async () => { await update({ tenantId: t.id }); window.location.reload(); }}
                  className={(session as any)?.tenantId === t.id ? "font-semibold" : ""}
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Palette toggle */}
        <PaletteToggle />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center relative hover:bg-muted transition-colors outline-none"
          >
            <Bell className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-0" align="end">
            <div className="p-3 border-b font-semibold flex justify-between items-center">
              Notificações
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">0</span>
            </div>
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
              <Bell className="w-8 h-8 opacity-20 mb-2" />
              Nenhuma notificação no momento.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center hover:opacity-85 transition-opacity focus:outline-none overflow-hidden"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {hasAvatar ? (
              <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase()
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52" align="end">
            <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground font-normal">
              <div className="text-sm font-semibold text-foreground">{session?.user?.name || "Admin"}</div>
              <div className="text-xs text-muted-foreground">{session?.user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <Link href="/profile" className="w-full">
              <DropdownMenuItem className="cursor-pointer">Perfil</DropdownMenuItem>
            </Link>
            <Link href="/settings" className="w-full">
              <DropdownMenuItem className="cursor-pointer">Configurações</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
