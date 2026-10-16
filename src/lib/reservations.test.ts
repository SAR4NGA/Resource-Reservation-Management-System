import { describe, it, expect } from "vitest";
import { rangesOverlap } from "./reservations";

function dt(hhmm: string) {
  // Fixed date, only the time matters for these tests.
  return new Date(`2026-01-01T${hhmm}:00`);
}

describe("rangesOverlap", () => {
  it("detects a simple overlap", () => {
    // 09:00-10:00 vs 09:30-10:30 -> overlap
    expect(rangesOverlap(dt("09:00"), dt("10:00"), dt("09:30"), dt("10:30"))).toBe(true);
  });

  it("detects overlap the other direction", () => {
    expect(rangesOverlap(dt("09:30"), dt("10:30"), dt("09:00"), dt("10:00"))).toBe(true);
  });

  it("treats one range fully containing another as overlapping", () => {
    // 09:00-12:00 fully contains 10:00-11:00
    expect(rangesOverlap(dt("09:00"), dt("12:00"), dt("10:00"), dt("11:00"))).toBe(true);
    expect(rangesOverlap(dt("10:00"), dt("11:00"), dt("09:00"), dt("12:00"))).toBe(true);
  });

  it("treats identical ranges as overlapping", () => {
    expect(rangesOverlap(dt("09:00"), dt("10:00"), dt("09:00"), dt("10:00"))).toBe(true);
  });

  it("does NOT treat back-to-back adjacent bookings as overlapping", () => {
    // 09:00-10:00 and 10:00-11:00 share an endpoint but shouldn't conflict,
    // since ranges are half-open [start, end).
    expect(rangesOverlap(dt("09:00"), dt("10:00"), dt("10:00"), dt("11:00"))).toBe(false);
    expect(rangesOverlap(dt("10:00"), dt("11:00"), dt("09:00"), dt("10:00"))).toBe(false);
  });

  it("does NOT treat clearly separate ranges as overlapping", () => {
    expect(rangesOverlap(dt("09:00"), dt("10:00"), dt("14:00"), dt("15:00"))).toBe(false);
  });

  it("detects a partial overlap at the tail end", () => {
    // 09:00-10:00 vs 09:45-10:15 -> 15 min overlap
    expect(rangesOverlap(dt("09:00"), dt("10:00"), dt("09:45"), dt("10:15"))).toBe(true);
  });
});
