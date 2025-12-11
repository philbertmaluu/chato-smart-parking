"use server";

"use server";

// Ensure this route is treated as dynamic (no static export prerender)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

const DEFAULT_TIMEOUT_MS = 5000;

function buildCameraUrl(params: {
  ip: string;
  port?: string | null;
  computerId?: string | null;
  fromDate?: string | null;
}) {
  const { ip, port, computerId, fromDate } = params;
  const p = port || "80";
  const cid = computerId || "1";
  const dateParam = (fromDate ? new Date(fromDate) : new Date("2000-01-01T00:00:00Z"))
    .toISOString()
    .replace("Z", "");
  const ts = Date.now();
  return `http://${ip}:${p}/edge/cgi-bin/vparcgi.cgi?computerid=${cid}&oper=jsonlastresults&dd=${encodeURIComponent(
    dateParam
  )}&_=${ts}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ip = searchParams.get("ip");
  const port = searchParams.get("port");
  const computerId = searchParams.get("computerId");
  const fromDate = searchParams.get("fromDate");

  if (!ip) {
    return NextResponse.json({ error: "Missing camera IP" }, { status: 400 });
  }

  const url = buildCameraUrl({ ip, port, computerId, fromDate });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Camera request failed (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Camera returned invalid payload" }, { status: 502 });
    }

    const res = NextResponse.json(data);
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
  } catch (error: any) {
    clearTimeout(timeout);
    const message =
      error?.name === "AbortError"
        ? "Camera request timed out"
        : error instanceof Error
        ? error.message
        : "Unknown camera error";

    const res = NextResponse.json({ error: message }, { status: 504 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

