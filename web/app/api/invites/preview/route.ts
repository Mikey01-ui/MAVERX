import { NextResponse } from "next/server";
import { previewInvite } from "@/lib/invites";

/** Public invite preview for the register wizard. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("invite") || url.searchParams.get("group") || "").trim();
  if (!token) {
    return NextResponse.json({ error: "Missing invite token." }, { status: 400 });
  }
  try {
    const preview = await previewInvite(token);
    return NextResponse.json({ ok: true, invite: preview });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid invite.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
