"use client";

import { useState } from "react";
import { BirthForm } from "@/components/BirthForm";
import { ChartView } from "@/components/ChartView";
import { ProfileList } from "@/components/ProfileList";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { BirthInfo } from "@/types/birth";
import type { Profile } from "@/types/profile";

type MobileView = "input" | "chart";

export default function Home() {
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [formValue, setFormValue] = useState<BirthInfo | undefined>();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("input");

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
    <main className="mobile-page app-shell min-h-screen bg-stone-950 text-stone-100">
      <div className="app-container mx-auto flex w-full max-w-[1920px] flex-col gap-6 px-3 py-3 md:px-4 md:py-6 lg:px-6">
        <header
          className={`app-header flex flex-col gap-2 border-b border-stone-800 pb-5 ${
            isMobileResultView ? "max-lg:hidden" : ""
          }`}
        >
          <div className="app-header-row">
            <div>
              <p className="section-kicker">Open Ziwei Chart MVP</p>
              <h1 className="app-title text-2xl font-semibold tracking-normal text-stone-50 sm:text-3xl">
                紫微斗数排盘工具
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="app-layout grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={`app-sidebar space-y-6 ${
              isMobileResultView ? "max-lg:hidden" : ""
            }`}
          >
            <BirthForm initialValue={formValue} onSubmit={handleSubmit} />
            <div className="max-md:hidden">
              <ProfileList
                currentBirthInfo={birthInfo}
                currentProfileId={currentProfileId}
                onLoad={handleLoadProfile}
                onSaved={handleSaved}
              />
            </div>
            <details className="mobile-collapse-card mobile-profile-manager md:hidden">
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
          </aside>

          <div
            className={
              mobileView === "input" || !birthInfo ? "max-lg:hidden" : undefined
            }
          >
            <ChartView birthInfo={birthInfo} />

            {isMobileResultView ? (
              <details className="mobile-collapse-card mobile-profile-manager mt-4 md:hidden">
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
        </div>
      </div>
    </main>
  );
}
