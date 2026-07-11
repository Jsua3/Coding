import * as React from "react";

/** Modal on deep-blurred scrim; glass sheet springs in. */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  footer?: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element;
