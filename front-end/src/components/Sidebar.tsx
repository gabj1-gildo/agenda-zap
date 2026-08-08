"use client";

import Link from "next/link";
import { hasRouteAccess } from "@/lib/routePermissions";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { 
  Home, Users, Calendar, Settings, MessageSquare, 
  Building2, UserCircle, LogOut, ChevronDown, 
  Megaphone, Server, FileText, LayoutDashboard, Lock, Coins, Wand2, CreditCard, Contact, CalendarDays, CalendarCheck, Filter, Zap, Bot
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
  { href: "/dashboard",    label: "Painel",        icon: LayoutDashboard, category: "MENU PRINCIPAL" },
  { href: "/clients",      label: "Clientes",      icon: Contact,         requiresTenant: true, category: "MENU PRINCIPAL" },
  { href: "/funil",        label: "Funil de Vendas",icon: Filter,          requiresTenant: true, category: "MENU PRINCIPAL" },
  { href: "/chats",        label: "Conversas",     icon: MessageSquare,   badgeKey: "chats", requiresTenant: true, category: "MENU PRINCIPAL" },
  { href: "/broadcast",    label: "Disparos",      icon: Megaphone,       requiresTenant: true, category: "MENU PRINCIPAL" },
  { href: "/reports",      label: "Relatórios",    icon: FileText,        requiresTenant: true, category: "RELATÓRIOS" },
  { href: "/admin/tenants",label: "Empresas",      icon: Building2,       category: "RELATÓRIOS" },
  { href: "/settings",     label: "Configurações", icon: Settings,        requiresTenant: true, category: "CONFIGURAÇÕES" },
  { href: "/team",         label: "Equipe e Acessos", icon: Users,        requiresTenant: true, category: "CONFIGURAÇÕES" },
  { href: "/admin/settings",label: "Sistema",      icon: Server,          category: "CONFIGURAÇÕES" },
  { href: "/profile",      label: "Meu Perfil",    icon: UserCircle,      category: "CONFIGURAÇÕES" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [badges, setBadges] = useState({ chats: 0, payments: 0 });
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);

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

  const isSuperAdmin = role === "SUPERADMIN";

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

  const categories = Object.entries(
    navLinks.reduce((acc, item) => {
      const activeTenantId = (session as any)?.tenantId;
      const activeTenant = tenants.find((t: any) => t.id === activeTenantId);
      const permissions = activeTenant?.permissions || [];

      if (item.category === "CONFIGURAÇÕES" && item.label === "Sistema" && role !== "SUPERADMIN") return acc;
      if (item.category === "RELATÓRIOS" && item.label === "Empresas" && role !== "SUPERADMIN") return acc;

      if (!hasRouteAccess(item.href, role, permissions)) return acc;
      
      const cat = item.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof navLinks>)
  );

  return (
    <aside
      className="hidden lg:flex w-[240px] flex-shrink-0 flex-col h-screen sticky top-0 z-20 px-4 py-6 font-sans bg-[#0B0F19] text-white"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 pb-6">
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#FFB400] text-[#0B0F19] shadow-[0_0_15px_rgba(255,180,0,0.3)]">
          {hasLogo ? (
            <img src={activeTenantLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
          ) : (
            <Zap className="w-5 h-5 fill-current" />
          )}
        </div>
        <span className="font-display text-[15px] font-black tracking-widest uppercase">
          AgendaZap
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
        {categories.map(([category, items]) => (
          <div key={category} className="mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
              {category}
            </h3>
            
            <div className="flex flex-col gap-1">
              {items.map(({ href, label, icon: Icon, badgeKey, requiresTenant }) => {
                const locked = requiresTenant && isSuperAdmin && !activeTenantId;
                const active = isActive(href);

                if (locked) {
                  return (
                    <div
                      key={href}
                      title="Selecione uma empresa no topo para acessar"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium cursor-not-allowed opacity-20"
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
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200
                      ${active
                        ? "font-bold bg-[#FFB400] text-[#0B0F19] shadow-[0_4px_12px_rgba(255,180,0,0.25)]"
                        : "font-medium text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#0B0F19]' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="flex-1 tracking-wide">{label}</span>
                    {badgeKey && badges[badgeKey as keyof typeof badges] > 0 && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          active 
                            ? 'bg-[#0B0F19] text-[#FFB400]' 
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {badges[badgeKey as keyof typeof badges]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* IA Agent Card */}
      <div className="mt-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5 text-emerald-400" />
          <span className="text-[13px] font-bold text-white">IA Agente Ativo</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Monitorando conversas e sugerindo ações inteligentes
        </p>
      </div>

      {/* Tenant Indicator */}
      {(role === "SUPERADMIN" || tenants.length > 1) && tenants.length > 0 && (
        <div className="relative mb-3">
          <button
            onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
            className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[11px]"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold truncate flex-1 text-left text-slate-300">{activeTenantName}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isTenantDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isTenantDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto bg-[#1A1D27] border border-white/10">
              {tenants.map((tenant: any) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    update({ tenantId: tenant.id });
                    setIsTenantDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5 ${
                    tenant.id === activeTenantId ? 'text-[#FFB400] font-bold bg-[#FFB400]/10' : 'text-slate-300'
                  }`}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer User Profile */}
      <div className="flex items-center gap-3 mt-auto cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-white/10 text-white overflow-hidden shadow-inner shrink-0">
          {hasAvatar ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold truncate text-white">
            {session?.user?.name || session?.user?.email?.split('@')[0] || "Admin"}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {role === "SUPERADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : role === "ATTENDANT" ? "Atendente" : "—"}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
      </div>
    </aside>
  );
}
