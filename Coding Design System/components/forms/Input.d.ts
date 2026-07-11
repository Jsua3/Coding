import * as React from "react";

/** Glass text field with label, hint and error states; focus ring in accent blue. */
export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  hint?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
