import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submissionPayloadSchema } from "@/lib/validation";

/** The same address with and without a trailing slash, so
 * "https://a.com/x" and "https://a.com/x/" count as one link. */
function urlVariants(url: string): string[] {
  return url.endsWith("/") ? [url, url.slice(0, -1)] : [url, `${url}/`];
}

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
    return NextResponse.json({ ok: true, count: links.length, duplicates: 0 });
  }

  const supabase = createAdminClient();

  // Drop links this language already has: in the synced repo list, or in a
  // submission that wasn't rejected (rejected ones may be re-sent), plus
  // repeats within this same batch.
  const candidates = links.flatMap((link) => urlVariants(link.url));
  const [existingListed, existingSubmitted] = await Promise.all([
    supabase.from("repo_links").select("url").eq("language_id", languageId).in("url", candidates),
    supabase
      .from("submissions")
      .select("url")
      .eq("language_id", languageId)
      .in("status", ["pending", "approved", "duplicate"])
      .in("url", candidates),
  ]);
  const lookupError = existingListed.error ?? existingSubmitted.error;
  if (lookupError) {
    console.error("duplicate lookup failed", lookupError);
    return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
  }

  const taken = new Set(
    [...(existingListed.data ?? []), ...(existingSubmitted.data ?? [])].flatMap((row) =>
      urlVariants(row.url),
    ),
  );
  const fresh = links.filter((link) => {
    if (taken.has(link.url)) return false;
    for (const variant of urlVariants(link.url)) taken.add(variant);
    return true;
  });
  const duplicates = links.length - fresh.length;

  if (fresh.length === 0) {
    return NextResponse.json({ ok: true, count: 0, duplicates });
  }

  // Explicit column set — status is never taken from the request body, so
  // every row lands as the table's default 'pending' regardless of payload.
  const rows = fresh.map((link) => ({
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

  return NextResponse.json({ ok: true, count: rows.length, duplicates });
}
