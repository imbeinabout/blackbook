// src/components/layout/Header/index.tsx
import { Console } from "console";
import DesktopHeader, {type HeaderProps} from "./DesktopHeader";
import MobileHeader from "./MobileHeader";

const Header = (props: HeaderProps) => {
  const isMobile = window.matchMedia("(max-width: 899px)").matches;

  
    if (isMobile) {
        console.log("In Mobile Version")
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