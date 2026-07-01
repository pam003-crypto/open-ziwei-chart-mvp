"use client";

import { useEffect, useMemo, useState } from "react";
import { BIRTH_HOURS, isBirthHour, type BirthInfo } from "@/types/birth";

const DEFAULT_BIRTH_INFO: BirthInfo = {
  name: "",
  gender: "男",
  calendarType: "solar",
  birthday: "1990-01-01",
  birthHour: "子",
  isLeapMonth: false,
  note: "",
};

type BirthFormProps = {
  initialValue?: BirthInfo;
  onSubmit: (birthInfo: BirthInfo) => void;
};

function normalizeBirthInfo(value: BirthInfo): BirthInfo {
  return {
    ...value,
    name: value.name.trim(),
    birthday: value.birthday.trim(),
    birthHour: isBirthHour(value.birthHour) ? value.birthHour : "子",
    isLeapMonth: value.calendarType === "lunar" ? value.isLeapMonth : false,
    note: value.note?.trim() || undefined,
  };
}

export function BirthForm({ initialValue, onSubmit }: BirthFormProps) {
  const [form, setForm] = useState<BirthInfo>(initialValue ?? DEFAULT_BIRTH_INFO);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue) {
      setForm(initialValue);
      setError(null);
    }
  }, [initialValue]);

  const dateLabel = useMemo(
    () => (form.calendarType === "solar" ? "公历日期" : "农历日期"),
    [form.calendarType],
  );

  function updateField<K extends keyof BirthInfo>(key: K, value: BirthInfo[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "calendarType" && value === "solar" ? { isLeapMonth: false } : {}),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBirthInfo = normalizeBirthInfo(form);

    if (!nextBirthInfo.name) {
      setError("请输入姓名");
      return;
    }

    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(nextBirthInfo.birthday)) {
      setError("日期格式需要为 YYYY-MM-DD");
      return;
    }

    setError(null);
    onSubmit(nextBirthInfo);
  }

  return (
    <form className="tool-panel space-y-5" onSubmit={handleSubmit}>
      <div>
        <p className="section-kicker">Birth Info</p>
        <h2 className="section-title">出生信息</h2>
      </div>

      <label className="field-label">
        <span>姓名</span>
        <input
          className="field-input"
          type="text"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="请输入姓名"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="field-legend">性别</legend>
          <div className="segmented-control">
            {(["男", "女"] as const).map((gender) => (
              <button
                className={form.gender === gender ? "is-active" : ""}
                key={gender}
                type="button"
                onClick={() => updateField("gender", gender)}
              >
                {gender}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="field-legend">历法</legend>
          <div className="segmented-control">
            {[
              { label: "公历", value: "solar" },
              { label: "农历", value: "lunar" },
            ].map((item) => (
              <button
                className={form.calendarType === item.value ? "is-active" : ""}
                key={item.value}
                type="button"
                onClick={() =>
                  updateField("calendarType", item.value as BirthInfo["calendarType"])
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          <span>{dateLabel}</span>
          <input
            className="field-input"
            type="text"
            inputMode="numeric"
            value={form.birthday}
            onChange={(event) => updateField("birthday", event.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </label>

        <label className="field-label">
          <span>出生时辰</span>
          <select
            className="field-input"
            value={form.birthHour}
            onChange={(event) => updateField("birthHour", event.target.value)}
          >
            {BIRTH_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label
        className={`inline-flex items-center gap-3 text-sm ${
          form.calendarType === "solar" ? "text-stone-500" : "text-stone-200"
        }`}
      >
        <input
          checked={form.calendarType === "lunar" && form.isLeapMonth}
          className="h-4 w-4 accent-emerald-500"
          disabled={form.calendarType === "solar"}
          type="checkbox"
          onChange={(event) => updateField("isLeapMonth", event.target.checked)}
        />
        是否闰月
      </label>

      <label className="field-label">
        <span>备注</span>
        <textarea
          className="field-input min-h-24 resize-y"
          value={form.note ?? ""}
          onChange={(event) => updateField("note", event.target.value)}
          placeholder="可选"
        />
      </label>

      {error ? <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

      <button className="primary-action w-full" type="submit">
        开始排盘
      </button>
    </form>
  );
}
