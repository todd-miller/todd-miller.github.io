import { describe, it, expect } from "vitest";
import { parseMonth, parseMonthOrNull, formatPeriodRange, formatPeriodEnd } from "./date";

describe("parseMonth", () => {
    it("parses single-digit months", () => {
        expect(parseMonth("2025-02")).toEqual({ year: 2025, month: 2, label: "Feb 2025" });
    });

    it("parses December (boundary)", () => {
        expect(parseMonth("2024-12")).toEqual({ year: 2024, month: 12, label: "Dec 2024" });
    });

    it("parses January (boundary)", () => {
        expect(parseMonth("2024-01").label).toBe("Jan 2024");
    });
});

describe("parseMonthOrNull", () => {
    it("returns null for null input", () => {
        expect(parseMonthOrNull(null)).toBeNull();
    });

    it("delegates to parseMonth for strings", () => {
        expect(parseMonthOrNull("2023-06")?.label).toBe("Jun 2023");
    });
});

describe("formatPeriodRange (mobile)", () => {
    it("renders start — end", () => {
        expect(formatPeriodRange({ start: "2023-06", end: "2025-02" })).toBe("Jun 2023 — Feb 2025");
    });

    it("renders 'now' when end is null", () => {
        expect(formatPeriodRange({ start: "2025-02", end: null })).toBe("Feb 2025 — now");
    });

    it("handles same-year ranges", () => {
        expect(formatPeriodRange({ start: "2024-01", end: "2024-12" })).toBe("Jan 2024 — Dec 2024");
    });
});

describe("formatPeriodEnd (desktop)", () => {
    it("returns end label when present", () => {
        expect(formatPeriodEnd({ start: "2023-06", end: "2025-02" })).toBe("Feb 2025");
    });

    it("returns 'now' when end is null", () => {
        expect(formatPeriodEnd({ start: "2025-02", end: null })).toBe("now");
    });
});
