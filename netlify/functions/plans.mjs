import { getStore } from "@netlify/blobs";

// 整张安排表存成一个 JSON 对象，键为 "日期_小时"
const STORE_NAME = "plans";
const KEY = "calendar";

const cors = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "Content-Type",
};

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: cors });

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const store = getStore(STORE_NAME);
  const url = new URL(req.url);

  try {
    let data = {};
    const raw = await store.get(KEY);
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }
    }

    if (req.method === "GET") {
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      const rows = [];
      for (const [k, v] of Object.entries(data)) {
        const i = k.indexOf("_");
        const date = k.slice(0, i);
        const hour = Number(k.slice(i + 1));
        if (from && date < from) continue;
        if (to && date > to) continue;
        rows.push({
          date,
          hour,
          activity: v.activity || "",
          food: v.food || "",
          note: v.note || "",
        });
      }
      rows.sort((a, b) =>
        (a.date + "_" + String(a.hour).padStart(2, "0")).localeCompare(
          b.date + "_" + String(b.hour).padStart(2, "0"),
        ),
      );
      return json(rows);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const date = String(body.date || "");
      const hour = Number(body.hour);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(hour)) {
        return json({ error: "参数不对" }, 400);
      }
      data[`${date}_${hour}`] = {
        activity: String(body.activity || "").slice(0, 100),
        food: String(body.food || "").slice(0, 100),
        note: String(body.note || "").slice(0, 1000),
        updated_at: new Date().toISOString(),
      };
      await store.set(KEY, JSON.stringify(data));
      return json({ ok: true });
    }

    if (req.method === "DELETE") {
      const date = url.searchParams.get("date");
      const hour = url.searchParams.get("hour");
      if (!date || hour == null) {
        return json({ error: "参数不对" }, 400);
      }
      delete data[`${date}_${hour}`];
      await store.set(KEY, JSON.stringify(data));
      return json({ ok: true });
    }

    return json({ error: "不支持的请求" }, 405);
  } catch (e) {
    return json(
      { error: "服务器出错了：" + (e && e.message ? e.message : String(e)) },
      500,
    );
  }
};
