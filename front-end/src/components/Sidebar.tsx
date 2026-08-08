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
import styles from "./Sidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
  requiresTenant?: boolean;
  category?: string;
};

const navLinks: NavItem[] = [
  { href: "/dashboard",    label: "Painel",        icon: LayoutDashboard, category: "Menu Principal" },
  { href: "/clients",      label: "Clientes",      icon: Contact,         requiresTenant: true, category: "Menu Principal" },
  { href: "/funil",        label: "Funil de Vendas",icon: Filter,          requiresTenant: true, category: "Menu Principal" },
  { href: "/chats",        label: "Conversas",     icon: MessageSquare,   badgeKey: "chats", requiresTenant: true, category: "Menu Principal" },
  { href: "/broadcast",    label: "Disparos",      icon: Megaphone,       requiresTenant: true, category: "Menu Principal" },
  { href: "/reports",      label: "Relatórios",    icon: FileText,        requiresTenant: true, category: "Relatórios" },
  { href: "/admin/tenants",label: "Empresas",      icon: Building2,       category: "Relatórios" },
  { href: "/settings",     label: "Configurações", icon: Settings,        requiresTenant: true, category: "Configurações" },
  { href: "/team",         label: "Equipe e Acessos", icon: Users,        requiresTenant: true, category: "Configurações" },
  { href: "/admin/settings",label: "Sistema",      icon: Server,          category: "Configurações" },
  { href: "/profile",      label: "Meu Perfil",    icon: UserCircle,      category: "Configurações" },
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

      if (item.category === "Configurações" && item.label === "Sistema" && role !== "SUPERADMIN") return acc;
      if (item.category === "Relatórios" && item.label === "Empresas" && role !== "SUPERADMIN") return acc;

      if (!hasRouteAccess(item.href, role, permissions)) return acc;
      
      const cat = item.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof navLinks>)
  );

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.sideLogo}>
        <div className={styles.mark}>
          {hasLogo ? (
            <img src={activeTenantLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#0a0f1a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
            </svg>
          )}
        </div>
        <div className={styles.word}>AGENDAZAP</div>
      </div>

      {/* Nav */}
      <nav className={styles.navScroll}>
        {categories.map(([category, items]) => (
          <div key={category}>
            <div className={styles.navLabel}>{category}</div>
            
            {items.map(({ href, label, icon: Icon, badgeKey, requiresTenant }) => {
                const locked = requiresTenant && isSuperAdmin && !activeTenantId;
                const active = isActive(href);

                if (locked) {
                  return (
                    <div
                      key={href}
                      title="Selecione uma empresa no topo para acessar"
                      className={`${styles.navItem} ${styles.locked}`}
                    >
                      <Icon />
                      <span style={{ flex: 1 }}>{label}</span>
                      <Lock style={{ width: 14, height: 14 }} />
                    </div>
                  );
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                  >
                    <Icon />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badgeKey && badges[badgeKey as keyof typeof badges] > 0 && (
                      <span className={`${styles.badge} ${active ? styles.activeBadge : ''}`}>
                        {badges[badgeKey as keyof typeof badges]}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* IA Agent Card */}
      <div className={styles.aiCard}>
        <div className={styles.row}>
          <div className={styles.bot}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
              <rect x="6" y="6" width="12" height="12" rx="3" />
              <circle cx="9.5" cy="11.5" r="1" />
              <circle cx="14.5" cy="11.5" r="1" />
            </svg>
            <span className={styles.statusDot}></span>
          </div>
          <div className={styles.title}>IA Agente Ativo</div>
        </div>
        <p>Monitorando conversas e sugerindo ações inteligentes</p>
      </div>

      {/* Tenant Indicator */}
      {(role === "SUPERADMIN" || tenants.length > 1) && tenants.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <button
            onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
            className={styles.sideUser}
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Building2 style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
            <span className={styles.name} style={{ flex: 1, textAlign: 'left' }}>
              {activeTenantName}
            </span>
            <ChevronDown style={{ width: 14, height: 14, color: 'var(--muted-foreground)', transform: isTenantDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {isTenantDropdownOpen && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '8px', background: 'var(--surface-3)', borderRadius: '10px', overflow: 'hidden', zIndex: 50, border: '1px solid var(--border)' }}>
              {tenants.map((tenant: any) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    update({ tenantId: tenant.id });
                    setIsTenantDropdownOpen(false);
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: tenant.id === activeTenantId ? 'var(--text)' : 'var(--muted-foreground)', background: tenant.id === activeTenantId ? 'var(--surface-2)' : 'transparent', fontWeight: tenant.id === activeTenantId ? 700 : 500, cursor: 'pointer', border: 'none' }}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer User Profile */}
      <div className={styles.sideUser} onClick={() => signOut()} title="Sair do Sistema">
        <div className={styles.av}>
          {hasAvatar ? (
            <img src={avatarSrc} alt="Avatar" />
          ) : (
            initials()
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.name}>
            {session?.user?.name || session?.user?.email?.split('@')[0] || "Admin"}
          </div>
          <div className={styles.role}>
            {role === "SUPERADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : role === "ATTENDANT" ? "Atendente" : "—"}
          </div>
        </div>
        <LogOut style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
      </div>
    </aside>
  );
}
