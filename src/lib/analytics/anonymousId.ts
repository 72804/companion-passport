const ANONYMOUS_ID_KEY = "cp-anonymous-id";

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "server";

  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}
