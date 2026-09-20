"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, CalendarDays, CalendarCheck, Contact, Filter,
  MessageSquare, Megaphone, CreditCard, FileText, Settings, Users,
  Briefcase, Package, Building2, Server, Wand2, ChevronDown, LogOut,
  UserCheck
} from "lucide-react";
import { useBadges } from "@/lib/hooks/useShared";
import styles from "./Sidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
  requiresTenant?: boolean;
  roles?: string[];
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
    label: "Visão geral",
    items: [
      { href: "/dashboard",     label: "Painel",           icon: LayoutDashboard },
      { href: "/calendar",      label: "Agenda",            icon: CalendarDays,   requiresTenant: true },
      { href: "/appointments",  label: "Agendamentos",      icon: CalendarCheck,  requiresTenant: true },
      { href: "/funil",         label: "Funil de Vendas",   icon: Filter,         requiresTenant: true },
    ],
  },
  {
    key: "relacionamento",
    label: "Relacionamento",
    items: [
      { href: "/chats",         label: "Conversas",         icon: MessageSquare,  badgeKey: "chats", requiresTenant: true },
      { href: "/broadcast",     label: "Disparos",          icon: Megaphone,      requiresTenant: true },
      { href: "/automations",   label: "Automações",        icon: Wand2,          requiresTenant: true },
    ],
  },
  {
    key: "planos",
    label: "Planos & Assinaturas",
    items: [
      { href: "/planos",     label: "Planos",     icon: Package,   requiresTenant: true, roles: ["ADMIN", "SUPERADMIN"] },
      { href: "/assinantes", label: "Assinantes", icon: UserCheck, requiresTenant: true },
      { href: "/clients",    label: "Clientes",   icon: Contact,   requiresTenant: true },
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
    key: "gerenciamento",
    label: "Gestão",
    roles: ["ADMIN", "SUPERADMIN"],
    items: [
      { href: "/settings",  label: "Configurações",    icon: Settings,  requiresTenant: true },
      { href: "/team",      label: "Equipe",           icon: Users,     requiresTenant: true },
      { href: "/services",  label: "Serviços",         icon: Briefcase, requiresTenant: true },
      { href: "/billing",   label: "Minha Assinatura", icon: CreditCard, requiresTenant: true },
    ],
  },
  {
    key: "admin",
    label: "Administração",
    roles: ["SUPERADMIN"],
    items: [
      { href: "/admin/tenants",   label: "Empresas",         icon: Building2 },
      { href: "/admin/broadcast", label: "Disparos Globais", icon: Megaphone },
      { href: "/admin/settings",  label: "Sistema",          icon: Server },
      { href: "/admin/ai-presets",label: "Templates IA",     icon: Wand2 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);

  const role = (session?.user as any)?.role as string;
  const activeTenantId = (session as any)?.tenantId as string | undefined;
  const { data: badgesData } = useBadges(activeTenantId);
  const badges = (badgesData || { chats: 0 }) as { chats: number };
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

  if (pathname === "/login") return null;

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
            <svg viewBox="0 0 24 24" fill="none" stroke="#263830" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
            </svg>
          )}
        </div>
        <div className={styles.word}>AGENDAZAP</div>
      </div>

      {/* Empresa ativa */}
      {tenants.length > 0 && (
        <div className={styles.company}>
          <span className={styles.companyLabel}>Empresa ativa</span>
          <div className={styles.companyRow}>
            <b className={styles.companyName}>{activeTenantName}</b>
            {(isSuperAdmin || tenants.length > 1) && (
              <button
                type="button"
                className={styles.companyToggle}
                onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
                aria-expanded={isTenantDropdownOpen}
                title="Trocar empresa"
              >
                <ChevronDown
                  className={isTenantDropdownOpen ? styles.chevronOpen : undefined}
                  style={{ width: 14, height: 14 }}
                />
              </button>
            )}
          </div>

          {isTenantDropdownOpen && (
            <div className={styles.tenantList}>
              {isSuperAdmin && (
                <button
                  type="button"
                  className={styles.tenantItem}
                  onClick={() => { update({ tenantId: null }); setIsTenantDropdownOpen(false); window.location.reload(); }}
                >
                  Todas as Empresas (Painel)
                </button>
              )}
              {tenants.map((tenant: any) => (
                <button
                  key={tenant.id}
                  type="button"
                  className={`${styles.tenantItem} ${tenant.id === activeTenantId ? styles.tenantItemActive : ""}`}
                  onClick={() => { update({ tenantId: tenant.id }); setIsTenantDropdownOpen(false); window.location.reload(); }}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav plana */}
      <nav className={styles.navScroll}>
        {visibleCategories.map(cat => (
          <div key={cat.key} className={styles.navGroup}>
            <div className={styles.navLabel}>{cat.label}</div>
            {cat.items.map(({ href, label, icon: Icon, badgeKey, requiresTenant, roles: itemRoles }) => {
              if (itemRoles && !isSuperAdmin && !itemRoles.includes(role)) return null;

              const locked = requiresTenant && isSuperAdmin && !activeTenantId;
              const active = isActive(href);

              if (locked) {
                return (
                  <div key={href} title="Selecione uma empresa" className={`${styles.navItem} ${styles.locked}`}>
                    <Icon />
                    <span className={styles.navText}>{label}</span>
                  </div>
                );
              }

              return (
                <Link key={href} href={href} className={`${styles.navItem} ${active ? styles.active : ""}`}>
                  <Icon />
                  <span className={styles.navText}>{label}</span>
                  {badgeKey && badges[badgeKey as keyof typeof badges] > 0 && (
                    <span className={`${styles.badge} ${active ? styles.activeBadge : ""}`}>
                      {badges[badgeKey as keyof typeof badges]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* IA status sutil */}
      <div className={styles.aiStatus} title="IA agente ativa">
        <span className={styles.aiDot}></span>
        <span>IA ativa</span>
      </div>

      {/* Footer: User Profile + Logout */}
      <div className={styles.sideUserFooter}>
        <Link href="/profile" className={styles.sideUserInfo} title="Meu Perfil">
          <div className={styles.av}>
            {hasAvatar ? <img src={avatarSrc} alt="Avatar" /> : initials()}
          </div>
          <div className={styles.userMeta}>
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
