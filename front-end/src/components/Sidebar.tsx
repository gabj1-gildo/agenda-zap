"use client";

import Link from "next/link";
import { hasRouteAccess } from "@/lib/routePermissions";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { 
  Home, Users, Calendar, Settings, MessageSquare, 
  Menu, X, Building2, UserCircle, LogOut, ChevronDown, 
  ChevronRight, Megaphone, Server, Activity, BarChart, FileText, LayoutDashboard, Database, Link as LinkIcon, Lock, Key, Coins, Wand2, CreditCard, Contact, CalendarDays, CalendarCheck, Filter
} from "lucide-react";
import { getBackendUrl } from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
  requiresTenant?: boolean;
  category?: string;
};

const navLinks: NavItem[] = [
  { href: "/dashboard",    label: "Painel",        icon: LayoutDashboard, category: "Principal" },
  { href: "/agenda",       label: "Agenda",        icon: CalendarDays,    requiresTenant: true, category: "Principal" },
  { href: "/appointments", label: "Agendamentos",  icon: CalendarCheck,   requiresTenant: true, category: "Principal" },
  { href: "/clients",      label: "Clientes",      icon: Contact,         requiresTenant: true, category: "Relacionamento" },
  { href: "/funil",        label: "Funil",         icon: Filter,          requiresTenant: true, category: "Relacionamento" },
  { href: "/chats",        label: "Conversas",     icon: MessageSquare,   badgeKey: "chats", requiresTenant: true, category: "Relacionamento" },
  { href: "/broadcast",    label: "Disparos",      icon: Megaphone,       requiresTenant: true, category: "Relacionamento" },
  { href: "/payments",     label: "Pagamentos",    icon: CreditCard,      badgeKey: "payments", requiresTenant: true, category: "Financeiro" },
  { href: "/planos",       label: "Planos de Venda", icon: Coins,         requiresTenant: true, category: "Financeiro" },
  { href: "/settings",     label: "Configurações", icon: Settings,        requiresTenant: true, category: "Administração" },
  { href: "/services",     label: "Serviços e Horários", icon: Calendar,   requiresTenant: true, category: "Administração" },
  { href: "/team",         label: "Equipe e Acessos", icon: Users,        requiresTenant: true, category: "Administração" },
  { href: "/billing",      label: "Plano",         icon: CreditCard,      requiresTenant: true, category: "Administração" },
  { href: "/reports",      label: "Relatórios",    icon: FileText,        requiresTenant: true, category: "Administração" },
  { href: "/admin/tenants",label: "Empresas",      icon: Building2,       category: "Administração (Super)" },
  { href: "/admin/users",  label: "Usuários",      icon: Users,           category: "Administração (Super)" },
  { href: "/admin/broadcast", label: "Disparos Globais", icon: Megaphone, category: "Administração (Super)" },
  { href: "/admin/settings",label: "Sistema",      icon: Server,          category: "Administração (Super)" },
  { href: "/admin/plans",  label: "Planos (SaaS)", icon: CreditCard,      category: "Administração (Super)" },
  { href: "/admin/ai-presets",label: "Templates IA", icon: Wand2,       category: "Administração (Super)" },
  { href: "/profile",      label: "Meu Perfil",    icon: UserCircle,      category: "Minha Conta" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Principal": LayoutDashboard,
  "Relacionamento": MessageSquare,
  "Financeiro": CreditCard,
  "Administração": Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [badges, setBadges] = useState({ chats: 0, payments: 0 });
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const role = (session?.user as any)?.role;
  const activeTenantId = (session as any)?.tenantId;
  const tenants = (session?.user as any)?.tenants || [];
  const activeTenant = tenants.find((t: any) => t.id === activeTenantId);
  const activeTenantName = activeTenant?.name || "Empresa selecionada";
  const activeTenantLogoRaw = activeTenant?.logoUrl;
  const hasLogo = typeof activeTenantLogoRaw === 'string' && activeTenantLogoRaw.trim() !== '' && activeTenantLogoRaw !== 'null';
  const activeTenantLogo = hasLogo ? `/api/image-proxy?url=${encodeURIComponent(activeTenantLogoRaw)}` : "";
  
  const avatarRaw = (session?.user?.image || (session?.user as any)?.picture) as string;
  const hasAvatar = typeof avatarRaw === 'string' && avatarRaw.trim() !== '' && avatarRaw !== 'null';
  const avatarSrc = hasAvatar ? `/api/image-proxy?url=${encodeURIComponent(avatarRaw)}` : "";

  useEffect(() => {
    if (activeTenantId) {
      fetch(getBackendUrl(`/api/tenants/${activeTenantId}/badges`), { headers: { 'Authorization': `Bearer ${(session?.user as any)?.accessToken}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setBadges(d.data);
        });
    }
  }, [activeTenantId]);

  const isTenantAdmin = role === "ADMIN";
  const isSuperAdmin = role === "SUPERADMIN";
  const isAttendant = role === "ATTENDANT";

  // Auto-open the category that contains the active route
  useEffect(() => {
    const categoriesMap = navLinks.reduce((acc, item) => {
      const cat = item.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof navLinks>);

    let activeCat = "Principal";
    for (const [cat, items] of Object.entries(categoriesMap)) {
      const hasActive = items.some(item => {
        if (item.href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(item.href);
      });
      if (hasActive) {
        activeCat = cat;
        break;
      }
    }
    setOpenCategories({ [activeCat]: true });
  }, [pathname]);

  if (pathname === "/login") return null;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = () => {
    const name = session?.user?.name;
    if (name) return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return (session?.user?.email || "A").charAt(0).toUpperCase();
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ [cat]: !prev[cat] }));
  };

  const categories = Object.entries(
    navLinks.reduce((acc, item) => {
      const activeTenantId = (session as any)?.tenantId;
      const activeTenant = tenants.find((t: any) => t.id === activeTenantId);
      const permissions = activeTenant?.permissions || [];

      // Ocultar categoria Superadmin para não-superadmins, independentemente de rotas
      if (item.category === "Administração (Super)" && role !== "SUPERADMIN") return acc;

      if (!hasRouteAccess(item.href, role, permissions)) return acc;
      
      const cat = item.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof navLinks>)
  );

  // Check if any item in a category has a badge
  const getCategoryBadge = (items: typeof navLinks) => {
    let total = 0;
    items.forEach(item => {
      if (item.badgeKey && badges[item.badgeKey as keyof typeof badges] > 0) {
        total += badges[item.badgeKey as keyof typeof badges];
      }
    });
    return total;
  };

  return (
    <aside
      className="hidden lg:flex w-[220px] flex-shrink-0 flex-col h-screen sticky top-0 z-20 px-3 py-4"
      style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-1">
        <div
          className={`w-8 h-8 flex items-center justify-center font-display font-extrabold text-lg overflow-hidden shadow-sm ${hasLogo ? 'rounded-md' : 'rounded-lg'}`}
          style={{
            background: hasLogo ? "#ffffff" : "var(--sidebar-primary)",
            color: hasLogo ? "var(--foreground)" : "var(--sidebar-primary-foreground)",
            transform: hasLogo ? "none" : "rotate(-4deg)",
          }}
        >
          {hasLogo ? (
            <img src={activeTenantLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            "A"
          )}
        </div>
        <span className="font-display text-lg font-extrabold tracking-wide" style={{ color: "var(--sidebar-foreground)" }}>
          AgendaZap
        </span>
      </div>

      {/* Nav — collapsible submenus */}
      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto pr-1">
        {categories.map(([category, items]) => {
          const isOpen = openCategories[category] ?? false;
          const catBadge = getCategoryBadge(items);
          const hasActiveItem = items.some(item => isActive(item.href));

          return (
            <div key={category}>
              {/* Category toggle */}
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200 ${
                  hasActiveItem
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                />
                <span className="flex-1 text-left">{category}</span>
                {catBadge > 0 && !isOpen && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                    style={{ background: "var(--destructive)", color: "var(--destructive-foreground)" }}
                  >
                    {catBadge}
                  </span>
                )}
              </button>
              
              {/* Submenu items */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0'
                }`}
              >
                {items.map(({ href, label, icon: Icon, badgeKey, requiresTenant }) => {
                  const locked = requiresTenant && isSuperAdmin && !activeTenantId;
                  const active = isActive(href);

                  if (locked) {
                    return (
                      <div
                        key={href}
                        title="Selecione uma empresa no topo para acessar"
                        className="flex items-center gap-2.5 pl-7 pr-2 py-1.5 rounded-lg text-[13px] font-medium cursor-not-allowed select-none opacity-20"
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                        <Lock className="w-3 h-3" />
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`group relative flex items-center gap-2.5 pl-7 pr-2 py-1.5 rounded-lg text-[13px] transition-all duration-150
                        ${active
                          ? "font-bold"
                          : "font-medium opacity-60 hover:opacity-100 hover:bg-white/[0.05]"
                        }`}
                      style={
                        active
                          ? {
                              background: "var(--sidebar-primary)",
                              color: "var(--sidebar-primary-foreground)",
                            }
                          : undefined
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{label}</span>
                      {badgeKey && badges[badgeKey as keyof typeof badges] > 0 && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono-custom animate-pulse"
                          style={
                            active
                              ? { background: "var(--sidebar-primary-foreground)", color: "var(--sidebar-primary)" }
                              : { background: "var(--destructive)", color: "var(--destructive-foreground)" }
                          }
                        >
                          {badges[badgeKey as keyof typeof badges]}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Tenant indicator */}
      {(role === "SUPERADMIN" || tenants.length > 1) && tenants.length > 0 && (
        <div className="relative mb-2 mt-1">
          <button
            onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
            className="w-full rounded-lg px-2.5 py-2 flex items-center gap-2 transition-colors text-[11px]"
            style={{
              background: "color-mix(in srgb, var(--sidebar-primary) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--sidebar-primary) 25%, transparent)",
              color: "var(--sidebar-primary)",
            }}
          >
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold truncate flex-1 text-left">{activeTenantName}</span>
            <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isTenantDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isTenantDropdownOpen && (
            <div 
              className="absolute bottom-full left-0 right-0 mb-1 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {tenants.map((tenant: any) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    update({ tenantId: tenant.id });
                    setIsTenantDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-muted ${
                    tenant.id === activeTenantId
                      ? 'text-primary font-bold bg-primary/5'
                      : 'text-foreground'
                  }`}
                >
                  {tenant.name}
                </button>
              ))}
              <Link
                href="/empresas"
                onClick={() => setIsTenantDropdownOpen(false)}
                className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-muted block border-t"
              >
                + Gerenciar Filiais
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="pt-3 flex items-center gap-2.5"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
          style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}
        >
          {hasAvatar ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate" style={{ color: "var(--sidebar-foreground)" }}>
            {session?.user?.name || session?.user?.email || "Admin"}
          </div>
          <div className="text-[10px] opacity-40">
            {role === "SUPERADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : role === "ATTENDANT" ? "Atendente" : "—"}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="opacity-40 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10"
          title="Sair"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
