import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submissionPayloadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submissionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { languageId, links, sessionId, honeypot } = parsed.data;

  // A filled honeypot means a bot. Pretend success so it doesn't learn to
  // look elsewhere, but never write the row.
  if (honeypot) {
    return NextResponse.json({ ok: true, count: links.length });
  }

  const supabase = createAdminClient();
  // Explicit column set — status is never taken from the request body, so
  // every row lands as the table's default 'pending' regardless of payload.
  const rows = links.map((link) => ({
    language_id: languageId,
    url: link.url,
    note: link.note || null,
    session_id: sessionId,
  }));
  const { error } = await supabase.from("submissions").insert(rows);
  if (error) {
    console.error("submissions insert failed", error);
    return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
