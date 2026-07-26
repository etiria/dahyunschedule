import { NextRequest, NextResponse } from "next/server";
import { readRoster, writeRoster } from "@/lib/label/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PI_ID = process.env.LABEL_PI_ID || "kdh";

// GET /api/label/roster  -> { experts: [...] }  (open: needed for the login picker)
export function GET() {
  return NextResponse.json({ experts: readRoster(), pi: PI_ID });
}

// POST /api/label/roster  { requester, action: "add"|"remove", id }
// Only the PI may modify the roster. The PI id cannot be removed (lockout guard).
export async function POST(req: NextRequest) {
  let body: { requester?: string; action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (body.requester !== PI_ID) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const id = (body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const current = readRoster();
  let next: string[];
  if (body.action === "add") {
    next = [...current, id];
  } else if (body.action === "remove") {
    if (id === PI_ID) {
      return NextResponse.json({ error: "cannot remove PI" }, { status: 400 });
    }
    next = current.filter((x) => x !== id);
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  return NextResponse.json({ experts: writeRoster(next), pi: PI_ID });
}
