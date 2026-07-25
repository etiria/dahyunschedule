import { NextRequest, NextResponse } from "next/server";

// Shared access password for the labeling app. Default is the agreed pilot
// password; override with the LABEL_PASSWORD env var if needed.
const PASSWORD = process.env.LABEL_PASSWORD || "2044";

// HTTP Basic Auth gate. Any username is accepted; only the password is checked.
// Applied at the edge to every labeling route (pages + API), so it also covers
// the image endpoint. The schedule app routes are untouched.
export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const password = decoded.slice(decoded.indexOf(":") + 1);
      if (password === PASSWORD) return NextResponse.next();
    } catch {
      // fall through to 401
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="EGGIM Labeling"' },
  });
}

export const config = {
  matcher: ["/label", "/label/:path*", "/api/label/:path*"],
};
