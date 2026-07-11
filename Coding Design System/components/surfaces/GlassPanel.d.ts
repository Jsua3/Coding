import * as React from "react";

/**
 * Foundational Liquid Glass surface: translucent fill, backdrop blur, refraction edge and depth shadow.
 * @startingPoint section="Superficies" subtitle="Panel de vidrio base del sistema" viewport="700x260"
 */
export interface GlassPanelProps {
  /** Color tint refracted through the glass */
  tint?: "none" | "blue" | "cyan" | "violet";
  /** Fill opacity / elevation */
  strength?: "subtle" | "default" | "strong";
  /** Show top specular sheen */
  specular?: boolean;
  radius?: string;
  padding?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children?: React.ReactNode;
}
export declare function GlassPanel(props: GlassPanelProps): JSX.Element;
