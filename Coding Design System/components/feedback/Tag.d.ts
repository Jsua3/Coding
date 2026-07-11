import * as React from "react";

/** Removable glass chip for topics and filters. */
export interface TagProps {
  tone?: "neutral" | "blue" | "cyan" | "violet";
  /** Show an X button */
  onRemove?: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Tag(props: TagProps): JSX.Element;
