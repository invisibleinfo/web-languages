const MAX_LOOKUP_CHARS = 4000;

/** Splits URLs into batches whose combined length stays under
 * MAX_LOOKUP_CHARS (a single longer URL gets a batch of its own). */
export function chunkByLength(urls: string[], maxChars = MAX_LOOKUP_CHARS): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let length = 0;
  for (const url of urls) {
    if (current.length > 0 && length + url.length > maxChars) {
      batches.push(current);
      current = [];
      length = 0;
    }
    current.push(url);
    length += url.length;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}
