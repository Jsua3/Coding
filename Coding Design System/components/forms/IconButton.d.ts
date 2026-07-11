import * as React from "react";

/** Circular glass button holding a single icon; pass an accessible label. */
export interface IconButtonProps {
  /** Accessible name (required) */
  label: string;
  variant?: "glass" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Pressed/selected state */
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
