import * as React from "react";

/**
 * Content card on glass — eyebrow, title, subtitle, body and footer, with hover lift.
 * @startingPoint section="Superficies" subtitle="Tarjeta de contenido con hover-lift" viewport="700x300"
 */
export interface CardProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  tint?: "none" | "blue" | "cyan" | "violet";
  footer?: React.ReactNode;
  /** Lift + brighten on hover (default true) */
  hoverable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
