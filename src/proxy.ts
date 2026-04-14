import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  void request;
  // Auth guard is handled in protected layout via requireUser().
  // Keeping proxy pass-through avoids false redirects with database sessions.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/logs/:path*", "/categories/:path*", "/settings/:path*"],
};
