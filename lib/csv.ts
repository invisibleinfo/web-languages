/** The columns of data/accepted.csv and data/rejected.csv. */
export const CSV_COLUMNS = [
  "language_id",
  "url",
  "note",
  "ui_locale",
  "decided_at",
  "issue",
  "reason",
] as const;

/** Rows written before `reason` existed have only these columns. */
const LEGACY_COLUMNS = CSV_COLUMNS.slice(0, -1);
const LEGACY_HEADER = LEGACY_COLUMNS.join(",");

export type CsvRecord = Record<(typeof CSV_COLUMNS)[number], string>;

export const CSV_HEADER = CSV_COLUMNS.join(",");

/** Spreadsheets run text that starts with these as a formula, so a note or
 * reason like `=HYPERLINK(...)` is defused with a leading apostrophe. */
function defuseFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** One CSV line (no trailing newline) in CSV_COLUMNS order. */
export function formatCsvRecord(record: CsvRecord): string {
  return CSV_COLUMNS.map((column) => {
    const value = column === "note" || column === "reason" ? defuseFormula(record[column]) : record[column];
    return escapeField(value);
  }).join(",");
}

/** One CSV line from plain values, for files that aren't decision records.
 * Every value is defused, so a note can't run as a formula in a spreadsheet. */
export function formatCsvRow(values: string[]): string {
  return values.map((value) => escapeField(defuseFormula(value))).join(",");
}

/** Adds records to the end of a decisions file's text, starting it with the
 * header when it is empty. A header from before the `reason` column is
 * upgraded; the rows under it stay as they are. */
export function appendCsvRecords(text: string, records: CsvRecord[]): string {
  const [firstLine, ...rest] = text.split("\n");
  const current = firstLine.trim() === LEGACY_HEADER ? [CSV_HEADER, ...rest].join("\n") : text;
  const base = current.trim() === "" ? `${CSV_HEADER}\n` : current.endsWith("\n") ? current : `${current}\n`;
  return base + records.map((record) => `${formatCsvRecord(record)}\n`).join("");
}

/** Splits CSV text into rows of fields (RFC 4180: quoted fields may hold
 * commas, doubled quotes and line breaks). Blank lines are skipped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

/** Reads a decisions file back into records. The header row is skipped;
 * rows that don't have every column except `reason` are ignored, and a
 * missing `reason` reads as empty. */
export function parseCsvRecords(text: string): CsvRecord[] {
  const [, ...rows] = parseCsv(text);
  return rows
    .filter((row) => row.length >= LEGACY_COLUMNS.length)
    .map((row) => Object.fromEntries(CSV_COLUMNS.map((column, i) => [column, row[i] ?? ""])) as CsvRecord);
}
