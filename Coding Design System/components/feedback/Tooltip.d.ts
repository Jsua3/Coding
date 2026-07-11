import * as React from "react";

/** Hover glass bubble with a short hint. */
export interface TooltipProps {
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
