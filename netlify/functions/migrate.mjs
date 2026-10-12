import { getStore } from "@netlify/blobs";

// 一次性迁移：把老数据（每人只有 activity/food/note、1 小时一格）
// 转成新格式（小林/小琳 两个人，每 2 小时一格）。
// 部署后访问一次 /.netlify/functions/migrate 即可，可重复执行（幂等）。

const STORE_NAME = "plans";
const KEY = "calendar";
const BACKUP_KEY = "calendar_backup_v1";

// 老数据里明确是「小林（我）」写的条目；其余默认归「小琳」
const MINE = ["道歉", "我在做数学"];

export default async () => {
  const store = getStore(STORE_NAME);
  const raw = await store.get(KEY);
  let old = {};
  if (raw) {
    try {
      old = JSON.parse(raw);
    } catch {
      old = {};
    }
  }

  // 先备份原始数据，出问题可回滚
  await store.set(BACKUP_KEY, JSON.stringify(old));

  const next = {};
  let migrated = 0;
  let kept = 0;

  for (const [k, v] of Object.entries(old)) {
    if (!v || typeof v.activity === "undefined") {
      next[k] = v; // 已经是新格式，原样保留
      kept++;
      continue;
    }
    const [date, hourStr] = k.split("_");
    const hour = Number(hourStr);
    // 1 小时 → 2 小时：向下取偶数，并限制在 8..20
    const slot = Math.min(20, Math.max(8, hour - (hour % 2)));
    const nk = `${date}_${slot}`;
    if (!next[nk]) {
      next[nk] = { me: { what: "", where: "", who: "" }, lin: { what: "", where: "", who: "" }, note: "" };
    }

    const isMine = MINE.some((t) => (v.activity || "").includes(t));
    const target = next[nk][isMine ? "me" : "lin"];
    const what = String(v.activity || "").trim();
    const where = String(v.food || "").trim();
    if (what) target.what = target.what ? target.what + " / " + what : what;
    if (where) target.where = target.where ? target.where + " / " + where : where;
    if (v.note) next[nk].note = next[nk].note ? next[nk].note + " / " + v.note : v.note;
    migrated++;
  }

  await store.set(KEY, JSON.stringify(next));
  return new Response(JSON.stringify({ ok: true, migrated, kept }), {
    headers: { "content-type": "application/json" },
  });
};
