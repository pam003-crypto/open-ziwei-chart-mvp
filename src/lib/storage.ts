import type { BirthInfo } from "@/types/birth";
import { BIRTH_HOURS } from "@/types/birth";
import type { Profile } from "@/types/profile";

const STORAGE_KEY = "open-ziwei-chart-mvp:profiles:v1";

type ImportPayload = Profile[] | { profiles: Profile[] };

function hasWindowStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBirthInfo(value: unknown): value is BirthInfo {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    (value.gender === "男" || value.gender === "女") &&
    (value.calendarType === "solar" || value.calendarType === "lunar") &&
    typeof value.birthday === "string" &&
    typeof value.birthHour === "string" &&
    BIRTH_HOURS.includes(value.birthHour as (typeof BIRTH_HOURS)[number]) &&
    typeof value.isLeapMonth === "boolean" &&
    (typeof value.note === "undefined" || typeof value.note === "string")
  );
}

function isIsoDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isBirthInfo(value.birthInfo) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isIsoDate(value.createdAt) &&
    isIsoDate(value.updatedAt)
  );
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sortProfiles(profiles: Profile[]): Profile[] {
  return [...profiles].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

function readRawProfiles(): Profile[] {
  if (!hasWindowStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isProfile) : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: Profile[]): void {
  if (!hasWindowStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortProfiles(profiles)));
}

export function getProfiles(): Profile[] {
  return sortProfiles(readRawProfiles());
}

export function saveProfile(birthInfo: BirthInfo, profileId?: string | null): Profile {
  const profiles = getProfiles();
  const now = new Date().toISOString();
  const existing = profileId ? profiles.find((profile) => profile.id === profileId) : undefined;

  const profile: Profile = existing
    ? {
        ...existing,
        birthInfo,
        updatedAt: now,
      }
    : {
        id: createId(),
        birthInfo,
        createdAt: now,
        updatedAt: now,
      };

  const nextProfiles = existing
    ? profiles.map((item) => (item.id === profile.id ? profile : item))
    : [profile, ...profiles];

  writeProfiles(nextProfiles);
  return profile;
}

export function deleteProfile(profileId: string): Profile[] {
  const nextProfiles = getProfiles().filter((profile) => profile.id !== profileId);
  writeProfiles(nextProfiles);
  return nextProfiles;
}

export function exportProfilesJson(profiles: Profile[] = getProfiles()): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profiles: sortProfiles(profiles),
    },
    null,
    2,
  );
}

function getProfilesFromImportPayload(payload: unknown): Profile[] {
  const candidate: unknown = Array.isArray(payload)
    ? (payload satisfies unknown[])
    : isRecord(payload)
      ? payload.profiles
      : undefined;

  if (!Array.isArray(candidate)) {
    throw new Error("JSON 中没有可导入的命例列表");
  }

  return candidate.filter(isProfile);
}

export function importProfilesJson(json: string): {
  profiles: Profile[];
  importedCount: number;
  skippedCount: number;
} {
  const parsed: unknown = JSON.parse(json) as ImportPayload;
  const importedProfiles = getProfilesFromImportPayload(parsed);

  if (importedProfiles.length === 0) {
    throw new Error("没有找到有效命例");
  }

  const merged = new Map(getProfiles().map((profile) => [profile.id, profile]));
  let importedCount = 0;

  for (const profile of importedProfiles) {
    const existing = merged.get(profile.id);
    const shouldUseImported =
      !existing || Date.parse(profile.updatedAt) >= Date.parse(existing.updatedAt);

    if (shouldUseImported) {
      merged.set(profile.id, profile);
      importedCount += 1;
    }
  }

  const profiles = sortProfiles(Array.from(merged.values()));
  writeProfiles(profiles);

  return {
    profiles,
    importedCount,
    skippedCount: importedProfiles.length - importedCount,
  };
}
