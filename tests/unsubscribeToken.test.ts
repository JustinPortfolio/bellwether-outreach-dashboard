import { describe, it, expect } from "vitest";
import { signUnsubscribeToken, verifyUnsubscribeToken } from "../lib/unsubscribeToken";

const SECRET = "test-signing-secret";

describe("unsubscribe token", () => {
  it("round-trips a valid token", () => {
    const token = signUnsubscribeToken("contact-1", "jane@acme.com", SECRET);
    const result = verifyUnsubscribeToken(token, SECRET);
    expect(result.valid).toBe(true);
    expect(result.payload?.contact_id).toBe("contact-1");
    expect(result.payload?.email).toBe("jane@acme.com");
  });

  it("rejects a token signed with a different secret", () => {
    const token = signUnsubscribeToken("contact-1", "jane@acme.com", SECRET);
    const result = verifyUnsubscribeToken(token, "wrong-secret");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("bad_signature");
  });

  it("rejects a tampered payload", () => {
    const token = signUnsubscribeToken("contact-1", "jane@acme.com", SECRET);
    const [, sig] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ contact_id: "contact-2", email: "attacker@evil.com", iat: 0, exp: 9999999999999 })).toString("base64url");
    const tampered = `${tamperedPayload}.${sig}`;
    const result = verifyUnsubscribeToken(tampered, SECRET);
    expect(result.valid).toBe(false);
  });

  it("rejects an expired token", () => {
    const past = new Date(Date.now() - 500 * 86400000);
    const token = signUnsubscribeToken("contact-1", "jane@acme.com", SECRET, 1, past);
    const result = verifyUnsubscribeToken(token, SECRET, new Date());
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("rejects a malformed token", () => {
    expect(verifyUnsubscribeToken("not-a-real-token", SECRET).valid).toBe(false);
    expect(verifyUnsubscribeToken("", SECRET).valid).toBe(false);
  });
});
