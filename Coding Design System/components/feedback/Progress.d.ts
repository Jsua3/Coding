import * as React from "react";

/**
 * Course-progress indicator: glowing bar or ring.
 * @startingPoint section="Feedback" subtitle="Barra/anillo de progreso con brillo" viewport="700x200"
 */
export interface ProgressProps {
  /** 0-100 */
  value: number;
  tone?: "blue" | "cyan" | "violet" | "success";
  shape?: "bar" | "ring";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  style?: React.CSSProperties;
}
export declare function Progress(props: ProgressProps): JSX.Element;
