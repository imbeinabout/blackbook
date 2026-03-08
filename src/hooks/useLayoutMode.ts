import * as React from "react";

export type LayoutMode = "mobile" | "desktop";

const MOBILE_QUERY = "(max-width: 899px)";

export function useLayoutMode(): LayoutMode {
  const getMode = () =>
    window.matchMedia(MOBILE_QUERY).matches ? "mobile" : "desktop";

  const [mode, setMode] = React.useState<LayoutMode>(getMode);

  React.useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = () => setMode(getMode());

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return mode;
}