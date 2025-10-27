import { PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";

export const NullableView = observer((props: PropsWithChildren<{ condition: boolean }>) =>
  props.condition ? <>{props.children}</> : <></>,
);