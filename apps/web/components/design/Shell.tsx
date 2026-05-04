"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { Plan } from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { Icon, type IconName } from "./Icon";

// ── Logo ───────────────────────────────────────────────────────────────────
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 4, height: 22, background: "var(--accent)", flexShrink: 0 }} />
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              letterSpacing: "0.12em",
              color: "var(--fg-primary)",
              lineHeight: 1,
            }}
          >
            BACKHALF
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.16em",
              color: "var(--fg-tertiary)",
              textTransform: "uppercase",
            }}
          >
            Race planner
          </div>
        </div>
      )}
    </div>
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({
  icon,
  label,
  href,
  active,
  badge,
}: {
  icon: IconName;
  label: string;
  href: string;
  active: boolean;
  badge?: number | string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 18px 9px 16px",
        width: "100%",
        textDecoration: "none",
        background: active ? "var(--bg-elevated)" : "transparent",
        borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
        color: active ? "var(--fg-primary)" : "var(--fg-secondary)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.04em",
        textAlign: "left",
        transition: "all 150ms ease-out",
      }}
    >
      <Icon name={icon} size={15} color={active ? "var(--accent)" : "currentColor"} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            padding: "1px 5px",
            background: active ? "var(--accent)" : "var(--bg-elevated)",
            color: active ? "#fff" : "var(--fg-tertiary)",
            borderRadius: 2,
            letterSpacing: "0.04em",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavGroupLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "4px 16px 6px",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        color: "var(--fg-tertiary)",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activePlan, plans, setActivePlan } = usePlanStore();
  const [planMenuOpen, setPlanMenuOpen] = useState(false);

  const otherPlans = Object.values(plans).filter((p) => p.id !== activePlan?.id);
  const totalKm = activePlan
    ? (activePlan.course.loopDistanceM * activePlan.goal.loopCount) / 1000
    : 0;
  const aidCount = activePlan?.course.aidStations.length ?? 0;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className="no-print"
      style={{
        width: 232,
        flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundImage: "url(/design/topo-texture.svg)",
        backgroundSize: "300px",
      }}
    >
      <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--border)" }}>
        <Logo />
      </div>

      {/* Active race selector */}
      {activePlan && (
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            position: "relative",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--fg-tertiary)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Active race
          </div>
          <button
            type="button"
            onClick={() => setPlanMenuOpen((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              padding: "8px 10px",
              cursor: "pointer",
              color: "var(--fg-primary)",
              textAlign: "left",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {activePlan.goal.raceName}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--fg-tertiary)",
                  marginTop: 2,
                  letterSpacing: "0.04em",
                }}
              >
                {totalKm.toFixed(1)} km · {activePlan.goal.loopCount} loop
                {activePlan.goal.loopCount > 1 ? "s" : ""}
              </div>
            </div>
            <Icon name="chevron" size={12} color="var(--fg-tertiary)" />
          </button>

          {planMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 16,
                right: 16,
                zIndex: 30,
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-strong)",
                borderRadius: 2,
                boxShadow: "var(--shadow-lg)",
                marginTop: 4,
                backdropFilter: "blur(8px)",
              }}
            >
              {otherPlans.map((p: Plan) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActivePlan(p.id);
                    setPlanMenuOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-secondary)",
                  }}
                >
                  {p.goal.raceName}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  router.push("/");
                  setPlanMenuOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--accent)",
                  letterSpacing: "0.04em",
                }}
              >
                ↪ All races
              </button>
            </div>
          )}
        </div>
      )}

      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        <NavGroupLabel>Plan</NavGroupLabel>
        <NavItem icon="flag" label="Races" href="/" active={isActive("/")} />
        <NavItem
          icon="pin"
          label="Course"
          href="/plan/course"
          active={isActive("/plan/course")}
          badge={aidCount || undefined}
        />
        <NavItem icon="zap" label="Fuel" href="/plan/fuel" active={isActive("/plan/fuel")} />

        <NavGroupLabel>Output</NavGroupLabel>
        <NavItem
          icon="activity"
          label="Race plan"
          href="/plan/race-plan"
          active={isActive("/plan/race-plan")}
        />

        <NavGroupLabel>Library</NavGroupLabel>
        <NavItem
          icon="package"
          label="Products"
          href="/products"
          active={isActive("/products")}
        />
      </nav>

      <div style={{ borderTop: "1px solid var(--border)", padding: "8px 0" }}>
        <NavItem
          icon="settings"
          label="Settings"
          href="/settings"
          active={isActive("/settings")}
        />
      </div>
    </aside>
  );
}

// ── App header ─────────────────────────────────────────────────────────────
export function AppHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: string[];
  actions?: ReactNode;
}) {
  return (
    <div
      className="app-header"
      style={{
        minHeight: 60,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "10px 28px",
        gap: 16,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumbs && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--fg-tertiary)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 4,
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {breadcrumbs.map((b, i) => (
              <Fragment key={i}>
                <span>{b}</span>
                {i < breadcrumbs.length - 1 && (
                  <span style={{ color: "var(--fg-tertiary)" }}>/</span>
                )}
              </Fragment>
            ))}
          </div>
        )}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            letterSpacing: "0.06em",
            color: "var(--fg-primary)",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-tertiary)",
              marginTop: 4,
              letterSpacing: "0.04em",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

// ── Shell wrapper ──────────────────────────────────────────────────────────
export function Shell({ children }: { children: ReactNode }) {
  const { initFromStorage } = usePlanStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {children}
      </main>
    </div>
  );
}

// Convenience: a screen wrapper that sets up scrollable content area below the header.
export function Screen({
  header,
  children,
  maxWidth = 1200,
  paddingX = 28,
}: {
  header: ReactNode;
  children: ReactNode;
  maxWidth?: number;
  paddingX?: number;
}) {
  return (
    <Fragment>
      {header}
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: `24px ${paddingX}px 60px`,
            maxWidth,
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </div>
    </Fragment>
  );
}
