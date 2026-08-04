"use client";

import Image from "next/image";
import headerTexture from "../../../public/assets/ink-paper-header.webp";
import sealLogo from "../../../public/assets/ziwei-seal.webp";

type AppHeaderProps = {
  currentProfileName?: string;
};

export function AppHeader({ currentProfileName }: AppHeaderProps) {
  return (
    <header
      className="app-top-header"
      style={{ backgroundImage: `url(${headerTexture.src})` }}
    >
      <div className="app-top-header-inner">
        <div className="brand-lockup">
          <span className="brand-seal-frame">
            <Image
              alt="紫微印章"
              className="brand-seal"
              fill
              priority
              sizes="46px"
              src={sealLogo}
            />
          </span>
          <div>
            <strong>紫微斗数排盘工具</strong>
            <span>东方术数研究平台</span>
          </div>
        </div>
        <div className="header-actions">
          <span className="current-profile-name">
            {currentProfileName || "未命名命例"}
          </span>
        </div>
      </div>
    </header>
  );
}
