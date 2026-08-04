"use client";

import Image from "next/image";
import headerTexture from "../../../public/assets/ink-paper-header.webp";
import sealLogo from "../../../public/assets/ziwei-seal.webp";

const NAV_ITEMS = ["命盘", "飞星", "四化", "流年", "大运", "合盘", "笔记"];

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

        <nav className="primary-navigation" aria-label="主导航">
          {NAV_ITEMS.map((item, index) => (
            <button
              aria-current={index === 0 ? "page" : undefined}
              className={index === 0 ? "is-active" : ""}
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <span className="current-profile-name">
            {currentProfileName || "未命名命例"}
          </span>
          <button className="header-text-button" type="button">设置</button>
          <button className="header-account-button" type="button">登录 / 注册</button>
        </div>
      </div>
    </header>
  );
}
