import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { resolveImagePath } from "@/lib/label/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
};

// GET /api/label/image?p=<relative image path under DATA_DIR/images>
// Streams a labeling image from disk, guarding against path traversal.
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p") || "";
  const full = resolveImagePath(p);
  if (!full) return new NextResponse("not found", { status: 404 });
  const ext = full.slice(full.lastIndexOf(".")).toLowerCase();
  const data = fs.readFileSync(full);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
