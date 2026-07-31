"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import paperArtwork from "../../public/assets/paper-bamboo-mountain.webp";
import {
  deleteProfile,
  exportProfilesJson,
  getProfiles,
  importProfilesJson,
  saveProfile,
} from "@/lib/storage";
import type { BirthInfo } from "@/types/birth";
import type { Profile } from "@/types/profile";

type ProfileListProps = {
  currentBirthInfo: BirthInfo | null;
  currentProfileId: string | null;
  onLoad: (profile: Profile) => void;
  onSaved: (profile: Profile) => void;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function downloadJson(json: string): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `open-ziwei-profiles-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProfileList({
  currentBirthInfo,
  currentProfileId,
  onLoad,
  onSaved,
}: ProfileListProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfiles(getProfiles());
  }, []);

  function handleSave() {
    if (!currentBirthInfo) {
      setMessage("请先完成排盘");
      return;
    }

    const profile = saveProfile(currentBirthInfo, currentProfileId);
    setProfiles(getProfiles());
    setMessage("命例已保存");
    onSaved(profile);
  }

  function handleDelete(profileId: string) {
    setProfiles(deleteProfile(profileId));
    setMessage("命例已删除");
  }

  function handleExport() {
    const json = exportProfilesJson(profiles);
    downloadJson(json);
    setMessage("JSON 已导出");
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const result = importProfilesJson(text);
      setProfiles(result.profiles);
      setMessage(`已导入 ${result.importedCount} 条，跳过 ${result.skippedCount} 条`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="tool-panel profile-panel">
      <Image
        alt=""
        aria-hidden="true"
        className="profile-paper-art"
        fill
        sizes="300px"
        src={paperArtwork}
      />
      <div className="panel-heading">
        <span className="panel-heading-mark" aria-hidden="true" />
        <div>
        <p className="section-kicker">Profiles</p>
        <h2 className="section-title">命例管理</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="secondary-action" type="button" onClick={handleSave}>
          保存当前命例
        </button>
        <button
          className="secondary-action"
          disabled={profiles.length === 0}
          type="button"
          onClick={handleExport}
        >
          导出 JSON
        </button>
        <button
          className="secondary-action col-span-2"
          type="button"
          onClick={() => importInputRef.current?.click()}
        >
          导入 JSON
        </button>
        <input
          ref={importInputRef}
          accept="application/json,.json"
          className="hidden"
          type="file"
          onChange={handleImport}
        />
      </div>

      {message ? (
        <p className="profile-message">
          {message}
        </p>
      ) : null}

      <div className="space-y-3">
        {profiles.length === 0 ? (
          <p className="profile-empty">
            暂无保存命例
          </p>
        ) : (
          profiles.map((profile) => (
            <article
              className={`profile-card ${profile.id === currentProfileId ? "is-active" : ""}`}
              key={profile.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3>
                    {profile.birthInfo.name}
                  </h3>
                  <p>
                    {profile.birthInfo.birthday} · {profile.birthInfo.birthHour}时 ·{" "}
                    {profile.birthInfo.gender}
                  </p>
                  <p className="profile-date">
                    更新于 {formatDateTime(profile.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="mini-action"
                  type="button"
                  onClick={() => onLoad(profile)}
                >
                  重新排盘
                </button>
                <button
                  className="mini-action danger"
                  type="button"
                  onClick={() => handleDelete(profile.id)}
                >
                  删除
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
