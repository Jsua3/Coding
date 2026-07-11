import * as React from "react";

/**
 * Segmented glass control with a sliding glass thumb.
 * @startingPoint section="Navegacion" subtitle="Control segmentado con thumb deslizante" viewport="700x180"
 */
export interface TabItem { id: string; label: string; icon?: React.ReactNode; }
export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (id: string) => void;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
