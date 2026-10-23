/** The columns of data/submissions.csv and data/rejected.csv. */
export const CSV_COLUMNS = [
  "language_id",
  "url",
  "note",
  "ui_locale",
  "decided_at",
  "issue",
] as const;

export type CsvRecord = Record<(typeof CSV_COLUMNS)[number], string>;

export const CSV_HEADER = CSV_COLUMNS.join(",");

/** Spreadsheets run text that starts with these as a formula, so a note
 * like `=HYPERLINK(...)` is defused with a leading apostrophe. */
function defuseFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** One CSV line (no trailing newline) in CSV_COLUMNS order. */
export function formatCsvRecord(record: CsvRecord): string {
  return CSV_COLUMNS.map((column) => {
    const value = column === "note" ? defuseFormula(record[column]) : record[column];
    return escapeField(value);
  }).join(",");
}

/** Adds records to the end of a decisions file's text, starting it with the
 * header when it is empty. */
export function appendCsvRecords(text: string, records: CsvRecord[]): string {
  const base = text.trim() === "" ? `${CSV_HEADER}\n` : text.endsWith("\n") ? text : `${text}\n`;
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
 * rows that don't have every column are ignored. */
export function parseCsvRecords(text: string): CsvRecord[] {
  const [, ...rows] = parseCsv(text);
  return rows
    .filter((row) => row.length >= CSV_COLUMNS.length)
    .map((row) => Object.fromEntries(CSV_COLUMNS.map((column, i) => [column, row[i]])) as CsvRecord);
}
