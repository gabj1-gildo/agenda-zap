"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, CalendarDays, CalendarCheck, Contact, Filter,
  MessageSquare, Megaphone, CreditCard, FileText, Settings, Users,
  Briefcase, Package, Building2, Server, Wand2, ChevronDown, LogOut,
  UserCheck
} from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import styles from "./Sidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
  requiresTenant?: boolean;
};

type NavCategory = {
  key: string;
  label: string;
  items: NavItem[];
  roles?: string[];
};

const NAV_STRUCTURE: NavCategory[] = [
  {
    key: "principal",
    label: "Principal",
    items: [
      { href: "/dashboard",     label: "Painel",           icon: LayoutDashboard },
      { href: "/calendar",      label: "Agenda",            icon: CalendarDays,   requiresTenant: true },
      { href: "/appointments",  label: "Agendamentos",      icon: CalendarCheck,  requiresTenant: true },
      { href: "/clients",       label: "Clientes",          icon: Contact,        requiresTenant: true },
      { href: "/assinantes",    label: "Assinantes",        icon: UserCheck,      requiresTenant: true },
      { href: "/funil",         label: "Funil de Vendas",   icon: Filter,         requiresTenant: true },
      { href: "/chats",         label: "Conversas",         icon: MessageSquare,  badgeKey: "chats", requiresTenant: true },
      { href: "/broadcast",     label: "Disparos",          icon: Megaphone,      requiresTenant: true },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    roles: ["ADMIN", "SUPERADMIN"],
    items: [
      { href: "/payments",  label: "Recibos",      icon: CreditCard, requiresTenant: true },
      { href: "/reports",   label: "Relatórios",   icon: FileText,   requiresTenant: true },
    ],
  },
  {
    key: "planos",
    label: "Planos",
    roles: ["ADMIN", "SUPERADMIN"],
    items: [
      { href: "/planos", label: "Planos", icon: Package, requiresTenant: true },
    ],
  },
  {
    key: "configuracoes",
    label: "Configurações",
    roles: ["ADMIN", "SUPERADMIN"],
    items: [
      { href: "/settings",  label: "Configurações",    icon: Settings,  requiresTenant: true },
      { href: "/team",      label: "Equipe e Acessos", icon: Users,     requiresTenant: true },
      { href: "/services",  label: "Serviços",         icon: Briefcase, requiresTenant: true },
      { href: "/billing",   label: "Minha Assinatura", icon: CreditCard, requiresTenant: true },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    roles: ["SUPERADMIN"],
    items: [
      { href: "/admin/tenants",   label: "Empresas",     icon: Building2 },
      { href: "/admin/settings",  label: "Sistema",      icon: Server },
      { href: "/admin/ai-presets",label: "Templates IA", icon: Wand2 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [badges, setBadges] = useState({ chats: 0 });
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);

  const role = (session?.user as any)?.role as string;
  const activeTenantId = (session as any)?.tenantId as string | undefined;
  const tenants = (session?.user as any)?.tenants || [];
  const activeTenant = tenants.find((t: any) => t.id === activeTenantId);
  const activeTenantName = activeTenant?.name || "Empresa";
  const activeTenantLogoRaw = activeTenant?.logoUrl || activeTenant?.logo_url;
  const hasLogo = typeof activeTenantLogoRaw === "string" && activeTenantLogoRaw.trim() !== "" && activeTenantLogoRaw !== "null";
  const activeTenantLogo = hasLogo ? `/api/image-proxy?url=${encodeURIComponent(activeTenantLogoRaw)}` : "";

  const avatarRaw = (session?.user?.image || (session?.user as any)?.picture) as string;
  const hasAvatar = typeof avatarRaw === "string" && avatarRaw.trim() !== "" && avatarRaw !== "null";
  const avatarSrc = hasAvatar ? `/api/image-proxy?url=${encodeURIComponent(avatarRaw)}` : "";

  const isSuperAdmin = role === "SUPERADMIN";

  // Determine active category from pathname
  const activeCategory = NAV_STRUCTURE.find(cat =>
    cat.items.some(item => {
      if (item.href === "/dashboard") return pathname === item.href;
      return pathname.startsWith(item.href);
    })
  )?.key ?? "principal";

  // Accordion: only one open at a time
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_STRUCTURE.forEach(cat => { initial[cat.key] = cat.key === activeCategory; });
    return initial;
  });

  // Keep active category open when route changes
  useEffect(() => {
    setOpenCategories(prev => {
      // Close all, open only active
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach(k => { next[k] = k === activeCategory; });
      return next;
    });
  }, [activeCategory]);

  useEffect(() => {
    if (activeTenantId) {
      const token = (session?.user as any)?.accessToken;
      fetch(getBackendUrl(`/api/tenants/${activeTenantId}/badges`), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => { if (d.success) setBadges(d.data); })
        .catch(() => {});
    }
  }, [activeTenantId]);

  if (pathname === "/login") return null;

  // Exclusive toggle: close all others when clicking
  const toggleCategory = (key: string) => {
    setOpenCategories(prev => {
      const isAlreadyOpen = prev[key];
      const allClosed: Record<string, boolean> = {};
      Object.keys(prev).forEach(k => { allClosed[k] = false; });
      return { ...allClosed, [key]: !isAlreadyOpen };
    });
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = () => {
    const name = session?.user?.name;
    if (name) return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    return (session?.user?.email || "A").charAt(0).toUpperCase();
  };

  const visibleCategories = NAV_STRUCTURE.filter(cat => {
    if (!cat.roles) return true;
    if (isSuperAdmin) return true;
    return cat.roles.includes(role);
  });

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.sideLogo}>
        <div className={styles.mark}>
          {hasLogo ? (
            <img src={activeTenantLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "8px", padding: "3px" }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#f5a524" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
            </svg>
          )}
        </div>
        <div className={styles.word}>AGENDAZAP</div>
      </div>

      {/* Accordion Nav */}
      <nav className={styles.navScroll}>
        {visibleCategories.map(cat => {
          const isOpen = openCategories[cat.key] ?? false;
          const hasActive = cat.items.some(item => isActive(item.href));

          return (
            <div key={cat.key} className={styles.accordionSection}>
              <button
                className={`${styles.accordionHeader} ${hasActive ? styles.accordionHeaderActive : ""}`}
                onClick={() => toggleCategory(cat.key)}
                aria-expanded={isOpen}
              >
                <span className={styles.navLabel}>{cat.label}</span>
                <ChevronDown
                  className={`${styles.accordionChevron} ${isOpen ? styles.accordionChevronOpen : ""}`}
                />
              </button>

              {isOpen && (
                <div className={styles.accordionItems}>
                  {cat.items.map(({ href, label, icon: Icon, badgeKey, requiresTenant }) => {
                    const locked = requiresTenant && isSuperAdmin && !activeTenantId;
                    const active = isActive(href);

                    if (locked) {
                      return (
                        <div key={href} title="Selecione uma empresa" className={`${styles.navItem} ${styles.locked}`}>
                          <Icon />
                          <span style={{ flex: 1 }}>{label}</span>
                        </div>
                      );
                    }

                    return (
                      <Link key={href} href={href} className={`${styles.navItem} ${active ? styles.active : ""}`}>
                        <Icon />
                        <span style={{ flex: 1 }}>{label}</span>
                        {badgeKey && badges[badgeKey as keyof typeof badges] > 0 && (
                          <span className={`${styles.badge} ${active ? styles.activeBadge : ""}`}>
                            {badges[badgeKey as keyof typeof badges]}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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

      {/* Tenant Selector */}
      {(isSuperAdmin || tenants.length > 1) && tenants.length > 0 && (
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <button
            onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
            className={styles.sideUser}
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Building2 style={{ width: 14, height: 14, color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span className={styles.name} style={{ flex: 1, textAlign: "left" }}>{activeTenantName}</span>
            <ChevronDown style={{ width: 14, height: 14, color: "var(--muted-foreground)", transform: isTenantDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
          </button>

          {isTenantDropdownOpen && (
            <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 8, background: "var(--surface-3)", borderRadius: 10, overflow: "hidden", zIndex: 50, border: "1px solid var(--border)" }}>
              {tenants.map((tenant: any) => (
                <button
                  key={tenant.id}
                  onClick={() => { update({ tenantId: tenant.id }); setIsTenantDropdownOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "10px 12px", fontSize: 11, color: tenant.id === activeTenantId ? "var(--text)" : "var(--muted-foreground)", background: tenant.id === activeTenantId ? "var(--surface-2)" : "transparent", fontWeight: tenant.id === activeTenantId ? 700 : 500, cursor: "pointer", border: "none" }}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer: User Profile + Logout */}
      <div className={styles.sideUserFooter}>
        <Link href="/profile" className={styles.sideUserInfo} title="Meu Perfil">
          <div className={styles.av}>
            {hasAvatar ? <img src={avatarSrc} alt="Avatar" /> : initials()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.name}>
              {session?.user?.name || session?.user?.email?.split("@")[0] || "Admin"}
            </div>
            <div className={styles.role}>
              {role === "SUPERADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : role === "ATTENDANT" ? "Atendente" : "—"}
            </div>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={styles.logoutBtn}
          title="Sair do Sistema"
        >
          <LogOut style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </aside>
  );
}
