import crypto from "node:crypto";

/**
 * Signed, time-boxed unsubscribe tokens used by the {{unsubscribe_link}}
 * merge field in outreach emails and verified by n8n Workflow 08's public
 * GET /webhook/unsubscribe endpoint. No login required; the signature and
 * expiry are the only protection, so keep UNSUBSCRIBE_SIGNING_SECRET
 * secret and never log it.
 */

export interface UnsubscribeTokenPayload {
  contact_id: string;
  email: string;
  iat: number;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signUnsubscribeToken(
  contactId: string,
  email: string,
  secret: string,
  ttlDays = 400,
  now: Date = new Date()
): string {
  const payload: UnsubscribeTokenPayload = {
    contact_id: contactId,
    email,
    iat: now.getTime(),
    exp: now.getTime() + ttlDays * 86_400_000,
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export interface VerifyResult {
  valid: boolean;
  payload: UnsubscribeTokenPayload | null;
  reason?: "malformed" | "bad_signature" | "expired";
}

export function verifyUnsubscribeToken(token: string, secret: string, now: Date = new Date()): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, payload: null, reason: "malformed" };
  const [payloadB64, sig] = parts;

  let expectedSig: string;
  try {
    expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  } catch {
    return { valid: false, payload: null, reason: "malformed" };
  }

  // Constant-time comparison to avoid timing side-channels.
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, payload: null, reason: "bad_signature" };
  }

  let payload: UnsubscribeTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, payload: null, reason: "malformed" };
  }

  if (payload.exp && now.getTime() > payload.exp) {
    return { valid: false, payload, reason: "expired" };
  }

  return { valid: true, payload };
}
