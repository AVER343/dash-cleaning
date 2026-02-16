import { describe, expect, it } from "vitest";
import {
  parseAppointment,
  parseDateText,
  parseTimeText
} from "@/lib/dates/parseAppointment";

describe("parseDateText", () => {
  it("parses ISO date", () => {
    expect(parseDateText("2026-02-17")).toBe("2026-02-17");
  });

  it("parses slash date", () => {
    expect(parseDateText("2/17/2026")).toBe("2026-02-17");
  });

  it("parses month name date", () => {
    expect(parseDateText("February 17, 2026")).toBe("2026-02-17");
  });

  it("returns null for invalid date", () => {
    expect(parseDateText("2026-02-31")).toBeNull();
  });
});

describe("parseTimeText", () => {
  it("parses 24-hour time", () => {
    expect(parseTimeText("14:30")).toBe("14:30:00");
  });

  it("parses 12-hour time", () => {
    expect(parseTimeText("2:30 PM")).toBe("14:30:00");
  });

  it("returns null for invalid time", () => {
    expect(parseTimeText("25:99")).toBeNull();
  });
});

describe("parseAppointment", () => {
  it("parses both fields", () => {
    expect(parseAppointment("2026-02-17", "2:30 PM")).toEqual({
      appointmentDate: "2026-02-17",
      appointmentTime: "14:30:00"
    });
  });
});
