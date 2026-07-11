import * as React from "react";

/** Tinted glass status pill; optional glowing dot. */
export interface BadgeProps {
  tone?: "neutral" | "blue" | "cyan" | "violet" | "amber" | "success" | "warning" | "danger";
  /** Glowing status dot */
  dot?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
