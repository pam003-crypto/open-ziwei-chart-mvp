"use client";

import { useState } from "react";
import { BirthForm } from "@/components/BirthForm";
import { ChartView } from "@/components/ChartView";
import { ProfileList } from "@/components/ProfileList";
import { AppHeader } from "@/components/layout/AppHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MainWorkspace } from "@/components/layout/MainWorkspace";
import type { BirthInfo } from "@/types/birth";
import type { Profile } from "@/types/profile";

type MobileView = "input" | "chart";

export default function Home() {
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [formValue, setFormValue] = useState<BirthInfo | undefined>();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("input");
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  function showMobileChart() {
    setMobileView("chart");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function handleSubmit(nextBirthInfo: BirthInfo) {
    setBirthInfo(nextBirthInfo);
    setFormValue(nextBirthInfo);
    showMobileChart();
  }

  function handleLoadProfile(profile: Profile) {
    setBirthInfo(profile.birthInfo);
    setFormValue(profile.birthInfo);
    setCurrentProfileId(profile.id);
    showMobileChart();
  }

  function handleSaved(profile: Profile) {
    setCurrentProfileId(profile.id);
  }

  function handleBackToInput() {
    setMobileView("input");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const isMobileResultView = mobileView === "chart" && birthInfo !== null;

  return (
    <main className="mobile-page app-shell">
      <AppHeader currentProfileName={birthInfo?.name} />

      <div className={isDesktopSidebarCollapsed ? "app-body is-input-sidebar-collapsed" : "app-body"}>
        <DesktopSidebar>
          <div className="desktop-sidebar-content">
            {birthInfo ? (
              <div className="desktop-sidebar-collapse-control">
                <button
                  aria-expanded={!isDesktopSidebarCollapsed}
                  aria-label={isDesktopSidebarCollapsed ? "展开输入栏" : "收起输入栏"}
                  className="text-action"
                  title={isDesktopSidebarCollapsed ? "展开输入栏" : "收起输入栏"}
                  type="button"
                  onClick={() => setIsDesktopSidebarCollapsed((collapsed) => !collapsed)}
                >
                  {isDesktopSidebarCollapsed ? "展开" : "收起输入栏"}
                </button>
              </div>
            ) : null}

            <div className={`desktop-sidebar-panels ${isMobileResultView ? "is-hidden-on-mobile" : ""}`}>
              <BirthForm initialValue={formValue} onSubmit={handleSubmit} />
              <div className="desktop-profile-manager">
                <ProfileList
                  currentBirthInfo={birthInfo}
                  currentProfileId={currentProfileId}
                  onLoad={handleLoadProfile}
                  onSaved={handleSaved}
                />
              </div>
              <details className="mobile-collapse-card mobile-profile-manager mobile-only">
                <summary>命例管理</summary>
                <div className="mobile-profile-actions">
                  <ProfileList
                    currentBirthInfo={birthInfo}
                    currentProfileId={currentProfileId}
                    onLoad={handleLoadProfile}
                    onSaved={handleSaved}
                  />
                </div>
              </details>
            </div>
          </div>
        </DesktopSidebar>

        <MainWorkspace>
          <div className={mobileView === "input" || !birthInfo ? "is-hidden-on-mobile" : ""}>
            <ChartView birthInfo={birthInfo} />

            {isMobileResultView ? (
              <details className="mobile-collapse-card mobile-profile-manager mobile-only result-profile-manager">
                <summary>命例管理</summary>
                <div className="mobile-profile-actions">
                  <button
                    className="secondary-action w-full"
                    type="button"
                    onClick={handleBackToInput}
                  >
                    返回输入修改
                  </button>
                  <ProfileList
                    currentBirthInfo={birthInfo}
                    currentProfileId={currentProfileId}
                    onLoad={handleLoadProfile}
                    onSaved={handleSaved}
                  />
                </div>
              </details>
            ) : null}
          </div>
        </MainWorkspace>
      </div>
    </main>
  );
}
