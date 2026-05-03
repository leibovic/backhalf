"use client";

import type { CSSProperties, ChangeEvent, ReactNode } from "react";
import { Icon } from "./Icon";

// ── Buttons ─────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "bare" | "danger";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: CSSProperties;
  title?: string;
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<BtnSize, CSSProperties> = {
  sm: { padding: "5px 10px", fontSize: 11 },
  md: { padding: "7px 14px", fontSize: 12 },
  lg: { padding: "11px 22px", fontSize: 14 },
};

const VARIANT_STYLES: Record<BtnVariant, CSSProperties> = {
  primary: { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" },
  secondary: {
    background: "var(--bg-elevated)",
    color: "var(--fg-primary)",
    border: "1px solid var(--border-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--fg-secondary)",
    border: "1px solid var(--border)",
  },
  bare: {
    background: "transparent",
    color: "var(--fg-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    background: "transparent",
    color: "var(--danger)",
    border: "1px solid var(--danger-muted)",
  },
};

export function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
  style,
  title,
  fullWidth,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        borderRadius: 2,
        transition: "background 150ms ease-out, border-color 150ms ease-out",
        whiteSpace: "nowrap",
        width: fullWidth ? "100%" : undefined,
        ...SIZE_STYLES[size],
        ...VARIANT_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Form controls ──────────────────────────────────────────────────────────
const inputBase: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  background: "var(--bg-inset)",
  color: "var(--fg-primary)",
  border: "1px solid var(--border)",
  borderRadius: 2,
  padding: "7px 10px",
  outline: "none",
  width: "100%",
  transition: "border-color 150ms ease-out",
};

interface InputProps {
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  step?: number | string;
  min?: number | string;
  max?: number | string;
  style?: CSSProperties;
  onBlur?: () => void;
}

export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  step,
  min,
  max,
  style,
  onBlur,
}: InputProps) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      style={{ ...inputBase, ...style }}
    />
  );
}

interface NumberInputProps {
  value: number | undefined;
  onChange: (v: number) => void;
  step?: number | string;
  min?: number | string;
  max?: number | string;
  suffix?: string;
  style?: CSSProperties;
}

export function NumberInput({ value, onChange, step, min, max, suffix, style }: NumberInputProps) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="number"
        value={value ?? ""}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(isNaN(v) ? 0 : v);
        }}
        style={{ ...inputBase, paddingRight: suffix ? 40 : 10, ...style }}
      />
      {suffix && (
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--fg-tertiary)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Label({
  children,
  htmlFor,
  style,
}: {
  children: ReactNode;
  htmlFor?: string;
  style?: CSSProperties;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "var(--fg-tertiary)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 4,
        ...style,
      }}
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Label>{label}</Label>
      {children}
      {hint && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--fg-tertiary)",
            marginTop: 2,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: "var(--fg-secondary)",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 2,
          border: `1px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
          background: checked ? "var(--accent)" : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 150ms ease-out",
        }}
      >
        {checked && <Icon name="check" size={10} color="#fff" strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
      {label}
    </label>
  );
}

// ── Status pills ───────────────────────────────────────────────────────────
type StatusKind = "ok" | "deficit" | "surplus" | "over" | "warn" | "danger";

const STATUS_MAP: Record<StatusKind, { label: string; color: string; bg: string }> = {
  ok: { label: "On target", color: "var(--topo-green)", bg: "var(--topo-green-muted)" },
  deficit: { label: "Low", color: "var(--topo-ochre)", bg: "var(--topo-ochre-muted)" },
  surplus: { label: "Over", color: "var(--topo-ochre)", bg: "var(--topo-ochre-muted)" },
  over: { label: "Pack over", color: "var(--danger)", bg: "var(--danger-muted)" },
  warn: { label: "Caution", color: "var(--topo-ochre)", bg: "var(--topo-ochre-muted)" },
  danger: { label: "Risk", color: "var(--danger)", bg: "var(--danger-muted)" },
};

export function StatusPill({
  status,
  label,
  size = "md",
}: {
  status: StatusKind;
  label?: string;
  size?: "sm" | "md";
}) {
  const s = STATUS_MAP[status];
  const sz =
    size === "sm" ? { fontSize: 9, padding: "1px 5px" } : { fontSize: 10, padding: "2px 6px" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        borderRadius: 2,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
        ...sz,
      }}
    >
      {label ?? s.label}
    </span>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
  padding = 20,
}: {
  children: ReactNode;
  style?: CSSProperties;
  padding?: number;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 2,
        padding,
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  right,
  style,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 12,
        ...style,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            color: "var(--fg-primary)",
            letterSpacing: "0.08em",
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
      {right && <div style={{ display: "flex", gap: 8 }}>{right}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  accent,
  color,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--fg-tertiary)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            color: color || (accent ? "var(--accent)" : "var(--fg-primary)"),
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        {unit && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-tertiary)" }}>
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state / Alerts ───────────────────────────────────────────────────
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        padding: "64px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          letterSpacing: "0.08em",
          color: "var(--fg-tertiary)",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--fg-secondary)",
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
      {action}
    </div>
  );
}

type AlertVariant = "default" | "warning" | "danger";

export function Alert({
  variant = "default",
  children,
  showIcon = true,
}: {
  variant?: AlertVariant;
  children: ReactNode;
  showIcon?: boolean;
}) {
  const palettes: Record<AlertVariant, { bg: string; border: string; color: string }> = {
    default: {
      bg: "var(--bg-elevated)",
      border: "var(--border)",
      color: "var(--fg-secondary)",
    },
    warning: {
      bg: "var(--topo-ochre-muted)",
      border: "var(--topo-ochre)",
      color: "var(--topo-ochre)",
    },
    danger: { bg: "var(--danger-muted)", border: "var(--danger)", color: "var(--danger)" },
  };
  const p = palettes[variant];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: p.bg,
        border: `1px solid ${p.border}`,
        borderRadius: 2,
        padding: "10px 14px",
      }}
    >
      {showIcon && <Icon name="alert" size={14} color={p.color} style={{ marginTop: 1 }} />}
      <div
        style={{
          flex: 1,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: p.color,
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  );
}
