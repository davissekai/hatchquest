import { describe, it, expect, beforeEach } from "vitest";
import { SessionStore, SessionNotFoundError } from "../session-store.js";

// Fresh store per test — prevents state bleed between cases
let store: SessionStore;

beforeEach(() => {
  store = new SessionStore();
});

describe("createSession", () => {
  it("returns a session with a UUID id", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("sets status to active", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.status).toBe("active");
  });

  it("sets playerId to the email", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.playerId).toBe("kwame@example.com");
  });

  it("sets createdAt and updatedAt to valid ISO timestamps", async () => {
    const before = Date.now();
    const s = await store.createSession("Kwame", "kwame@example.com");
    const after = Date.now();
    const created = new Date(s.createdAt).getTime();
    expect(created).toBeGreaterThanOrEqual(before);
    expect(created).toBeLessThanOrEqual(after);
  });

  it("initialises worldState with capital 10000", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.capital).toBe(10_000);
  });

  it("initialises worldState with layer 0", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.layer).toBe(0);
  });

  it("initialises worldState with isComplete false", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.isComplete).toBe(false);
  });

  it("initialises worldState with null playerContext", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.worldState.playerContext).toBeNull();
  });

  it("initialises continuity cache fields as null", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(s.layer0Q1Response).toBeNull();
    expect(s.playerContext).toBeNull();
    expect(s.storyMemory).toBeNull();
    expect(s.generatedCurrentNode).toBeNull();
    expect(s.generatedCurrentNodeId).toBeNull();
    expect(s.narrationSource).toBeNull();
  });

  it("produces unique ids for successive sessions", async () => {
    const s1 = await store.createSession("Kwame", "kwame@example.com");
    const s2 = await store.createSession("Ama", "ama@example.com");
    expect(s1.id).not.toBe(s2.id);
  });

  it("produces different seeds for successive sessions", async () => {
    const s1 = await store.createSession("Kwame", "kwame@example.com");
    const s2 = await store.createSession("Ama", "ama@example.com");
    expect(s1.worldState.seed).not.toBe(s2.worldState.seed);
  });
});

describe("getSession", () => {
  it("returns a session that was created", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    expect(await store.getSession(s.id)).toEqual(s);
  });

  it("returns undefined for unknown id", async () => {
    expect(await store.getSession("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });
});

describe("updateSession", () => {
  it("merges partial update and returns updated session", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    const updated = await store.updateSession(s.id, { status: "complete" });
    expect(updated.status).toBe("complete");
    expect(updated.playerId).toBe("kwame@example.com");
  });

  it("bumps updatedAt", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    await new Promise((r) => setTimeout(r, 2));
    const updated = await store.updateSession(s.id, { status: "complete" });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(s.updatedAt).getTime()
    );
  });

  it("persists so getSession reflects the update", async () => {
    const s = await store.createSession("Kwame", "kwame@example.com");
    await store.updateSession(s.id, { status: "complete" });
    expect((await store.getSession(s.id))?.status).toBe("complete");
  });

  it("throws SessionNotFoundError for unknown id", async () => {
    await expect(
      store.updateSession("00000000-0000-0000-0000-000000000000", { status: "expired" })
    ).rejects.toThrow(SessionNotFoundError);
  });

  it("error message includes the missing id", async () => {
    const id = "00000000-0000-0000-0000-000000000000";
    await expect(store.updateSession(id, {})).rejects.toThrow(id);
  });
});

describe("isolation", () => {
  it("mutating one session does not affect another", async () => {
    const s1 = await store.createSession("Kwame", "kwame@example.com");
    const s2 = await store.createSession("Ama", "ama@example.com");
    await store.updateSession(s1.id, { worldState: { ...s1.worldState, capital: 5000 } });
    expect((await store.getSession(s2.id))?.worldState.capital).toBe(10_000);
  });
});
