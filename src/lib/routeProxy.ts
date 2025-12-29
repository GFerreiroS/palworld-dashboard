import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthFromCookies, setAuthCookie } from "@/lib/session";
import { palworldFetchWithAuth } from "@/lib/palworldClient";

export async function proxyPalworld(path: string, init: RequestInit = {}) {
  try {
    const jar = await cookies();
    const auth = getAuthFromCookies(jar);

    if (!auth) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const upstream = await palworldFetchWithAuth(auth, path, init);
    const text = await upstream.text();

    const res = new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });

    // Sliding expiration: only refresh cookie on successful authenticated calls
    if (upstream.ok) {
      setAuthCookie(res, auth);
    }

    return res;
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
