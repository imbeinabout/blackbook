// src/components/layout/Footer.tsx
import React from "react";
import PackageData from "../../../package.json";

const version = PackageData.version;

const Footer: React.FC = () => {
  return (
    <footer className="bb-footer" >
      {/* LEFT — status indicator */}
      <div className="bb-footer__left">
        BLACKBOOK // {version}
      </div>

      {/* CENTER —Legal notice */}
      <div className="bb-footer__center">
        Published by arrangement with the Delta Green Partnership. The
        intellectual property known as Delta Green is a trademark and
        copyright owned by the Delta Green Partnership, who has licensed
        its use here. The contents of this document are ©Imbeinabout,
        excepting those elements that are components of the Delta Green
        intellectual property.
      </div>

      {/* RIGHT — optional live clock or “READY” indicator */}
      <div className="bb-footer__right">
        <span className="bb-status-light bb-status-light--ok" />
        <span className="bb-status-light bb-status-light--warn" />
        <span className="bb-status-light bb-status-light--err" />
      </div>
    </footer>
  );
};

export default Footer;