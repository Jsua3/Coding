import * as React from "react";

/** Heavy-blur floating notification card with tone icon. */
export interface ToastProps {
  tone?: "info" | "success" | "warning" | "danger";
  title: string;
  description?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
