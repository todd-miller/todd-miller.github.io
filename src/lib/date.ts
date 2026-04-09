const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export interface ParsedMonth {
    year: number;
    month: number;
    label: string;
}

/** Parse a "YYYY-MM" string into year, month, and a "Mon YYYY" label. */
export function parseMonth(d: string): ParsedMonth {
    const [y, m] = d.split("-").map(Number);
    return { year: y, month: m, label: `${MONTHS[m - 1]} ${y}` };
}

export function parseMonthOrNull(d: string | null): ParsedMonth | null {
    return d ? parseMonth(d) : null;
}

export interface Period {
    start: string;
    end: string | null;
}

/** Mobile/1-col: full range, e.g. "Feb 2025 — now". */
export function formatPeriodRange(period: Period): string {
    const s = parseMonth(period.start);
    const e = parseMonthOrNull(period.end);
    return `${s.label} — ${e?.label ?? "now"}`;
}

/** Desktop/2-col: just the end (or "now"). */
export function formatPeriodEnd(period: Period): string {
    return parseMonthOrNull(period.end)?.label ?? "now";
}
