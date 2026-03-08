// src/components/layout/Header/index.tsx
import DesktopHeader, {type HeaderProps} from "./DesktopHeader";
import MobileHeader from "./MobileHeader";
import { useLayoutMode } from "../../../hooks/useLayoutMode";

const Header = (props: HeaderProps) => {
  const layoutMode = useLayoutMode();

  
    if (layoutMode === "mobile") {
        return (
        <MobileHeader
            isPlayMode={props.isPlayMode}
            onToggleSidebar={props.onToggleSidebar}
            onNewAgent={props.onNewAgent}
            onLoadAgent={props.onLoadAgent}
            onExportAgent={props.onExportAgent}
            onImportRequested={props.onImportRequested}
            onExit={props.onExit}
        />
        );
    }

    return <DesktopHeader {...props} />;
};

export default Header;
export type { HeaderProps };