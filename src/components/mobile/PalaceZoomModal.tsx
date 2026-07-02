"use client";

import type { PalaceViewModel } from "./palaceViewModel";

type PalaceZoomModalProps = {
  palace: PalaceViewModel | null;
  open: boolean;
  onClose: () => void;
};

function StarList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="palace-zoom-block">
      <span>{label}</span>
      <p>{items.length > 0 ? items.join("、") : "暂无"}</p>
    </div>
  );
}

export function PalaceZoomModal({
  palace,
  open,
  onClose,
}: PalaceZoomModalProps) {
  if (!open || !palace) {
    return null;
  }

  return (
    <div className="palace-zoom-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-label={`${palace.palaceName}放大查看`}
        className="palace-zoom-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="palace-zoom-head">
          <div>
            <p className="section-kicker">Palace Zoom</p>
            <h3>
              {palace.palaceName}
              {palace.isBodyPalace ? <small>身宫</small> : null}
              {palace.isLifePalace ? <small>命宫</small> : null}
            </h3>
          </div>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="palace-zoom-meta">
          <b>地支：{palace.earthlyBranch}</b>
          <b>干支：{palace.stemBranch}</b>
          <b>大限：{palace.decadalAgeRange}</b>
          <b>流年数字：{palace.yearlyAges.join("、") || "暂无"}</b>
          <b>当前：{palace.triggerLabel || "综合命盘"}</b>
        </div>

        <div className="palace-zoom-grid">
          <StarList label="主星" items={palace.majorStars} />
          <StarList label="辅星" items={palace.minorStars} />
          <StarList label="杂曜" items={palace.miscStars} />
          <StarList label="流曜" items={palace.flowStars} />
          <StarList label="四化" items={palace.mutagens} />
          <StarList label="十二神" items={palace.gods} />
          <StarList label="解读依据" items={[palace.keyword]} />
        </div>
      </section>
    </div>
  );
}
