// Client-side session + approval state.
// The session lives in a COOKIE (not just localStorage) so server-side
// middleware can enforce auth before a protected page is ever rendered.

export const DEMO_EMAIL = "ayesha@taleemabad.com";
export const DEMO_PASSWORD = "demo1234";

export const SESSION_COOKIE = "acc.session";
const APPROVED_KEY = "acc.approved";

function setSessionCookie(email: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(email)}; path=/; max-age=86400; samesite=lax`;
}

function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

function readSessionCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function login(email: string, password: string): { ok: boolean; error?: string } {
  if (!email.trim() || !password.trim()) {
    return { ok: false, error: "Please enter both email and password." };
  }
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return { ok: false, error: "Invalid credentials. Try the demo login shown below." };
  }
  setSessionCookie(email.trim());
  return { ok: true };
}

export function logout() {
  clearSessionCookie();
}

export function currentUser(): string | null {
  return readSessionCookie();
}

export function isLoggedIn(): boolean {
  return currentUser() !== null;
}

// Approval state persists across navigation so the calendar reflects approvals.
export function getApproved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(APPROVED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function approveConcept(eventId: string, conceptId: string) {
  if (typeof window === "undefined") return;
  const key = `${eventId}:${conceptId}`;
  const list = getApproved();
  if (!list.includes(key)) {
    list.push(key);
    window.localStorage.setItem(APPROVED_KEY, JSON.stringify(list));
  }
}

export function isEventApproved(eventId: string): boolean {
  return getApproved().some((k) => k.startsWith(`${eventId}:`));
}
