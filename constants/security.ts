// ─── constants/security.ts ───────────────────────────────────────────────────
// MyCafe Security Layer
// Provides: input sanitization, validation, password strength, XSS prevention
// ─────────────────────────────────────────────────────────────────────────────

// ── Field length limits (prevent oversized payloads) ─────────────────────────
export const LIMITS = {
  email:    { max: 254 },   // RFC 5321 max
  password: { min: 8, max: 128 },
  fullName: { min: 2, max: 60 },
  cafeName: { min: 3, max: 60 },
} as const;

// ── Common weak passwords to block ───────────────────────────────────────────
const COMMON_PASSWORDS = new Set([
  "password","password1","password123","12345678","123456789",
  "qwerty123","iloveyou","admin123","letmein1","welcome1",
  "monkey123","dragon123","master123","abc12345","pass1234",
  "sunshine","princess","football","baseball","shadow123",
  "mycafe123","cafe1234","coffee12","barista1",
]);

// ── Strip all HTML tags, script injections, null bytes, control chars ─────────
export function sanitizeText(raw: string): string {
  return raw
    // Remove null bytes and control characters (except tab/newline which users might paste)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Remove HTML/XML tags (XSS prevention)
    .replace(/<[^>]*>/g, "")
    // Remove common injection sequences
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:/gi, "")
    // Remove SQL injection patterns
    .replace(/(['";])\s*(OR|AND|DROP|SELECT|INSERT|UPDATE|DELETE|UNION|EXEC|DECLARE)\s/gi, "")
    // Trim leading/trailing whitespace
    .trim();
}

// ── Strict email validation (RFC 5322 simplified) ────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Disposable/temporary email domains to block
const BLOCKED_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","tempmail.com","throwam.com",
  "sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
  "spam4.me","yopmail.com","trashmail.com","dispostable.com",
  "fakeinbox.com","maildrop.cc","getairmail.com","discard.email",
]);

export function validateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return "Email is required.";
  if (email.length > LIMITS.email.max) return "Email address is too long.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address.";
  const domain = email.split("@")[1];
  if (BLOCKED_DOMAINS.has(domain)) return "Please use a real email address.";
  return null;
}

// ── Full name validation ──────────────────────────────────────────────────────
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF\s.\-']+$/;

export function validateFullName(raw: string): string | null {
  const name = sanitizeText(raw);
  if (!name) return "Full name is required.";
  if (name.length < LIMITS.fullName.min) return `Name must be at least ${LIMITS.fullName.min} characters.`;
  if (name.length > LIMITS.fullName.max) return "Name is too long.";
  if (!NAME_REGEX.test(name)) return "Name can only contain letters, spaces, hyphens, and apostrophes.";
  // Prevent names that are all spaces/dots
  if (name.replace(/[\s.\-']/g, "").length < 2) return "Enter a real full name.";
  return null;
}

// ── Cafe name validation ──────────────────────────────────────────────────────
const CAFE_NAME_REGEX = /^[a-zA-Z0-9À-ÿ\s.\-'&!,]+$/;

export function validateCafeName(raw: string): string | null {
  const name = sanitizeText(raw);
  if (!name) return "Cafe name is required.";
  if (name.length < LIMITS.cafeName.min) return `Cafe name must be at least ${LIMITS.cafeName.min} characters.`;
  if (name.length > LIMITS.cafeName.max) return "Cafe name is too long.";
  if (!CAFE_NAME_REGEX.test(name)) return "Cafe name contains invalid characters.";
  return null;
}

// ── Password strength ─────────────────────────────────────────────────────────
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;    // 0 = very weak, 4 = very strong
  label: "Too Short" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
  errors: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];

  if (password.length < LIMITS.password.min)
    errors.push(`At least ${LIMITS.password.min} characters`);
  if (!/[A-Z]/.test(password))
    errors.push("One uppercase letter (A–Z)");
  if (!/[a-z]/.test(password))
    errors.push("One lowercase letter (a–z)");
  if (!/[0-9]/.test(password))
    errors.push("One number (0–9)");
  if (!/[^A-Za-z0-9]/.test(password))
    errors.push("One special character (!@#$%...)");
  if (COMMON_PASSWORDS.has(password.toLowerCase()))
    errors.push("Password is too common — choose something unique");

  const passed = 5 - errors.length;

  if (password.length < LIMITS.password.min) {
    return { score: 0, label: "Too Short", color: "#E74C3C", errors };
  }
  if (passed <= 2) {
    return { score: 1, label: "Weak", color: "#E74C3C", errors };
  }
  if (passed === 3) {
    return { score: 2, label: "Fair", color: "#E67E22", errors };
  }
  if (passed === 4) {
    return { score: 3, label: "Strong", color: "#27AE60", errors };
  }
  return { score: 4, label: "Very Strong", color: "#1ABC9C", errors };
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length > LIMITS.password.max) return "Password is too long.";
  const strength = checkPasswordStrength(password);
  if (strength.errors.length > 0) {
    return "Password needs: " + strength.errors.join(", ") + ".";
  }
  return null;
}
