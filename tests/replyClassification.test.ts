import { describe, it, expect } from "vitest";
import { parseClassification, sanitizeHtml, REPLY_CLASSIFICATIONS } from "../lib/replyClassification";

describe("parseClassification", () => {
  it("accepts a valid classification", () => {
    const result = parseClassification({ classification: "interested", confidence: 0.95 });
    expect(result.classification).toBe("interested");
    expect(result.requiresHumanReview).toBe(false);
  });

  it("falls back to unclear for an invalid enum value", () => {
    const result = parseClassification({ classification: "banana", confidence: 0.9 });
    expect(result.classification).toBe("unclear");
    expect(result.requiresHumanReview).toBe(true);
  });

  it("falls back to unclear for malformed input", () => {
    const result = parseClassification(null);
    expect(result.classification).toBe("unclear");
    expect(result.confidence).toBe(0);
  });

  it("requires human review below the confidence floor even for a valid enum", () => {
    const result = parseClassification({ classification: "not_interested", confidence: 0.4 });
    expect(result.requiresHumanReview).toBe(true);
  });

  it("extracts a clearly-stated out-of-office return date", () => {
    const result = parseClassification({ classification: "out_of_office", confidence: 0.95, out_of_office_return_date: "2026-03-01" });
    expect(result.outOfOfficeReturnDate).toBe("2026-03-01");
  });

  it("does not fabricate a return date when none is given", () => {
    const result = parseClassification({ classification: "out_of_office", confidence: 0.95 });
    expect(result.outOfOfficeReturnDate).toBeNull();
  });

  it("covers all 11 required classification categories", () => {
    expect(REPLY_CLASSIFICATIONS).toHaveLength(11);
    for (const c of REPLY_CLASSIFICATIONS) {
      expect(parseClassification({ classification: c, confidence: 0.9 }).classification).toBe(c);
    }
  });
});

describe("sanitizeHtml", () => {
  it("strips script and style tags entirely (content included)", () => {
    const html = "<p>Hello</p><script>alert('x')</script><style>.a{}</style>";
    const clean = sanitizeHtml(html);
    expect(clean).not.toContain("alert");
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("Hello");
  });

  it("strips remaining tags", () => {
    expect(sanitizeHtml("<div><b>Bold</b> text</div>")).toBe("Bold text");
  });
});
