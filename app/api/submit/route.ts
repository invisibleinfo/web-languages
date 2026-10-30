import { NextResponse } from "next/server";
import { createIssue } from "@/lib/github";
import { readKnownUrls, urlVariants } from "@/lib/known-links";
import { buildIssue } from "@/lib/submission-issue";
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
  const { languageId, links, uiLocale } = parsed.data;

  // Drop links this language already has (upstream list or an approved
  // submission), plus repeats within this same batch. Links in issues still
  // waiting for review aren't checked; approval skips any that slipped in.
  let taken: Set<string>;
  try {
    taken = await readKnownUrls(languageId);
  } catch (error) {
    console.error("known links lookup failed", error);
    return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
  }
  const fresh = links.filter((link) => {
    if (taken.has(link.url)) return false;
    for (const variant of urlVariants(link.url)) taken.add(variant);
    return true;
  });
  const duplicates = links.length - fresh.length;

  if (fresh.length === 0) {
    return NextResponse.json({ ok: true, count: 0, duplicates });
  }

  try {
    await createIssue(buildIssue(languageId, uiLocale, fresh));
  } catch (error) {
    console.error("issue creation failed", error);
    return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: fresh.length, duplicates });
}
