import { describe, it, expect, beforeEach } from "vitest";
import { SessionStore, SessionNotFoundError } from "../session-store.js";

// Fresh store per test — prevents state bleed between cases
let store: SessionStore;

beforeEach(() => {
  store = new SessionStore();
});

describe("createSession", () => {
  it("returns a session with a UUID id", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(s.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("sets status to active", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(s.status).toBe("active");
  });

  it("sets playerId to the email", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(s.playerId).toBe("kwame@example.com");
  });

  it("sets createdAt and updatedAt to valid ISO timestamps", () => {
    const before = Date.now();
    const s = store.createSession("Kwame", "kwame@example.com");
    const after = Date.now();
    const created = new Date(s.createdAt).getTime();
    expect(created).toBeGreaterThanOrEqual(before);
    expect(created).toBeLessThanOrEqual(after);
  });

  it("initialises worldState with capital 10000", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.capital).toBe(10_000);
  });

  it("initialises worldState with layer 0", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.layer).toBe(0);
  });

  it("initialises worldState with isComplete false", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.isComplete).toBe(false);
  });

  it("defaults sector to tech", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.sector).toBe("tech");
  });

  it("produces unique ids for successive sessions", () => {
    const s1 = store.createSession("Kwame", "kwame@example.com");
    const s2 = store.createSession("Ama", "ama@example.com");
    expect(s1.id).not.toBe(s2.id);
  });

  it("produces different seeds for successive sessions", () => {
    const s1 = store.createSession("Kwame", "kwame@example.com");
    const s2 = store.createSession("Ama", "ama@example.com");
    expect(s1.worldState.seed).not.toBe(s2.worldState.seed);
  });
});

describe("getSession", () => {
  it("returns a session that was created", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    expect(store.getSession(s.id)).toEqual(s);
  });

  it("returns undefined for unknown id", () => {
    expect(store.getSession("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });
});

describe("updateSession", () => {
  it("merges partial update and returns updated session", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    const updated = store.updateSession(s.id, { status: "complete" });
    expect(updated.status).toBe("complete");
    expect(updated.playerId).toBe("kwame@example.com");
  });

  it("bumps updatedAt", async () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    await new Promise((r) => setTimeout(r, 2));
    const updated = store.updateSession(s.id, { status: "complete" });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(s.updatedAt).getTime()
    );
  });

  it("persists so getSession reflects the update", () => {
    const s = store.createSession("Kwame", "kwame@example.com");
    store.updateSession(s.id, { status: "complete" });
    expect(store.getSession(s.id)?.status).toBe("complete");
  });

  it("throws SessionNotFoundError for unknown id", () => {
    expect(() =>
      store.updateSession("00000000-0000-0000-0000-000000000000", { status: "expired" })
    ).toThrow(SessionNotFoundError);
  });

  it("error message includes the missing id", () => {
    const id = "00000000-0000-0000-0000-000000000000";
    expect(() => store.updateSession(id, {})).toThrow(id);
  });
});

describe("isolation", () => {
  it("mutating one session does not affect another", () => {
    const s1 = store.createSession("Kwame", "kwame@example.com");
    const s2 = store.createSession("Ama", "ama@example.com");
    store.updateSession(s1.id, { worldState: { ...s1.worldState, capital: 5000 } });
    expect(store.getSession(s2.id)?.worldState.capital).toBe(10_000);
  });
});
