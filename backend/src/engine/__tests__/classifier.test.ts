import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { EOPoleDistribution } from "@hatchquest/shared";
import {
  assessLayer0,
  buildLayer0Assessment,
  classify,
  inferSectorFromText,
  keywordClassify,
  scorePoles,
  seedEOProfileFromDistribution,
  selectLayer1NodeFromDistribution,
  generateQ2,
  extractPlayerContext,
  classifyFromBothResponses,
} from "../classifier.js";

const VALID_L1_NODES = new Set([
  "L1-node-1",
  "L1-node-2",
  "L1-node-3",
  "L1-node-4",
  "L1-node-5",
]);

const neutral: EOPoleDistribution = {
  values: { peopleFocused: 0.5, profitFocused: 0.5 },
  risk: { tolerant: 0.5, averse: 0.5 },
  orientation: { proactive: 0.5, reactive: 0.5 },
  agency: { autonomous: 0.5, collaborative: 0.5 },
  competitive: { aggressive: 0.5, measured: 0.5 },
};

describe("scorePoles", () => {
  it("returns 0.5 when no signals match", () => {
    expect(scorePoles("completely unrelated text", ["bold"], ["safe"])).toBe(0.5);
  });

  it("returns > 0.5 when only positive signals match", () => {
    expect(scorePoles("bold venture", ["bold", "venture"], [])).toBeGreaterThan(0.5);
  });

  it("returns < 0.5 when only negative signals match", () => {
    expect(scorePoles("safe careful", [], ["safe", "careful"])).toBeLessThan(0.5);
  });

  it("clamps to 0.9 with many positive signals", () => {
    const signals = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    expect(scorePoles(signals.join(" "), signals, [])).toBeLessThanOrEqual(0.9);
  });

  it("clamps to 0.1 with many negative signals", () => {
    const signals = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    expect(scorePoles(signals.join(" "), [], signals)).toBeGreaterThanOrEqual(0.1);
  });

  it("returns 0.5 when equal positive and negative signals cancel out", () => {
    expect(scorePoles("bold safe", ["bold"], ["safe"])).toBe(0.5);
  });
});

describe("keywordClassify", () => {
  it("returns an object with all 5 EO dimensions", () => {
    const dist = keywordClassify("I want to start a business.");
    expect(dist).toHaveProperty("values");
    expect(dist).toHaveProperty("risk");
    expect(dist).toHaveProperty("orientation");
    expect(dist).toHaveProperty("agency");
    expect(dist).toHaveProperty("competitive");
  });

  it("each pole pair sums to 1.0", () => {
    const dist = keywordClassify("build a bold venture to dominate the market");
    expect(dist.values.peopleFocused + dist.values.profitFocused).toBeCloseTo(1);
    expect(dist.risk.tolerant + dist.risk.averse).toBeCloseTo(1);
    expect(dist.orientation.proactive + dist.orientation.reactive).toBeCloseTo(1);
    expect(dist.agency.autonomous + dist.agency.collaborative).toBeCloseTo(1);
    expect(dist.competitive.aggressive + dist.competitive.measured).toBeCloseTo(1);
  });

  it("neutral text returns 0.5 on all poles", () => {
    const dist = keywordClassify("xyz xyz xyz");
    expect(dist.risk.tolerant).toBe(0.5);
    expect(dist.values.peopleFocused).toBe(0.5);
    expect(dist.agency.autonomous).toBe(0.5);
    expect(dist.orientation.proactive).toBe(0.5);
    expect(dist.competitive.aggressive).toBe(0.5);
  });

  it("bold/risk language pushes risk.tolerant above 0.5", () => {
    expect(
      keywordClassify("I want to take big risks and venture boldly.").risk.tolerant
    ).toBeGreaterThan(0.5);
  });

  it("safe/stable language pushes risk.averse above 0.5", () => {
    expect(
      keywordClassify("I prefer a safe, stable, sustainable path.").risk.averse
    ).toBeGreaterThan(0.5);
  });

  it("community/impact language pushes peopleFocused above 0.5", () => {
    expect(
      keywordClassify("help the community and empower people through inclusion.")
        .values.peopleFocused
    ).toBeGreaterThan(0.5);
  });

  it("all output values stay inside the clamped range", () => {
    const dist = keywordClassify(
      "bold risk venture invest disrupt ambitious compete dominate"
    );
    const values = [
      dist.risk.tolerant,
      dist.risk.averse,
      dist.values.peopleFocused,
      dist.values.profitFocused,
      dist.orientation.proactive,
      dist.orientation.reactive,
      dist.agency.autonomous,
      dist.agency.collaborative,
      dist.competitive.aggressive,
      dist.competitive.measured,
    ];

    for (const value of values) {
      expect(value).toBeGreaterThan(0.09);
      expect(value).toBeLessThanOrEqual(0.9);
    }
  });
});

describe("inferSectorFromText", () => {
  it("infers tech from digital product language", () => {
    expect(
      inferSectorFromText("I am building a fintech app for market women.")
    ).toBe("tech");
  });

  it("infers food from kitchen and meal language", () => {
    expect(
      inferSectorFromText("I want to run a food business that sells healthy meals.")
    ).toBe("food");
  });

  it("infers agri from farmer and crop language", () => {
    expect(
      inferSectorFromText("We connect cassava farmers to urban buyers.")
    ).toBe("agri");
  });

  it("defaults to 'other' when no strong sector signal exists", () => {
    expect(inferSectorFromText("I want to build something meaningful.")).toBe(
      "other"
    );
  });
});

describe("seedEOProfileFromDistribution", () => {
  it("maps pole strengths to a bounded EO profile", () => {
    const profile = seedEOProfileFromDistribution({
      values: { peopleFocused: 0.8, profitFocused: 0.2 },
      risk: { tolerant: 0.7, averse: 0.3 },
      orientation: { proactive: 0.9, reactive: 0.1 },
      agency: { autonomous: 0.6, collaborative: 0.4 },
      competitive: { aggressive: 0.2, measured: 0.8 },
    });

    expect(profile.autonomy).toBe(6);
    expect(profile.riskTaking).toBe(7);
    expect(profile.proactiveness).toBe(9);
    expect(profile.competitiveAggressiveness).toBe(2);
    expect(profile.innovativeness).toBeCloseTo(7.3, 1);
  });

  it("keeps all seeded values inside [0, 10]", () => {
    const profile = seedEOProfileFromDistribution(neutral);
    for (const value of Object.values(profile)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
  });
});

describe("selectLayer1NodeFromDistribution", () => {
  it("always returns a valid L1 node id", () => {
    expect(VALID_L1_NODES).toContain(selectLayer1NodeFromDistribution(neutral));
  });

  it("selects L1-node-1 for dominant risk.tolerant + competitive.aggressive", () => {
    const dist: EOPoleDistribution = {
      ...neutral,
      risk: { tolerant: 0.9, averse: 0.1 },
      competitive: { aggressive: 0.9, measured: 0.1 },
    };
    expect(selectLayer1NodeFromDistribution(dist)).toBe("L1-node-1");
  });

  it("selects L1-node-2 for dominant orientation.proactive + risk.averse", () => {
    const dist: EOPoleDistribution = {
      ...neutral,
      orientation: { proactive: 0.9, reactive: 0.1 },
      risk: { tolerant: 0.1, averse: 0.9 },
    };
    expect(selectLayer1NodeFromDistribution(dist)).toBe("L1-node-2");
  });

  it("selects L1-node-3 for dominant values.peopleFocused + agency.autonomous", () => {
    const dist: EOPoleDistribution = {
      ...neutral,
      values: { peopleFocused: 0.9, profitFocused: 0.1 },
      agency: { autonomous: 0.9, collaborative: 0.1 },
    };
    expect(selectLayer1NodeFromDistribution(dist)).toBe("L1-node-3");
  });

  it("selects L1-node-4 for dominant values.profitFocused + competitive.aggressive", () => {
    const dist: EOPoleDistribution = {
      ...neutral,
      values: { peopleFocused: 0.1, profitFocused: 0.9 },
      competitive: { aggressive: 0.9, measured: 0.1 },
    };
    expect(selectLayer1NodeFromDistribution(dist)).toBe("L1-node-4");
  });
});

describe("buildLayer0Assessment", () => {
  it("bundles sector, seeded profile, distribution, and node id", () => {
    const assessment = buildLayer0Assessment(
      "I am building a logistics service for cassava farmers.",
      neutral
    );

    expect(assessment.sector).toBe("agri");
    expect(assessment.layer1NodeId).toMatch(/^L1-node-[1-5]$/);
    expect(assessment.distribution).toEqual(neutral);
    expect(assessment.initialEOProfile).toBeDefined();
  });
});

describe("classify / assessLayer0", () => {
  const savedApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (savedApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = savedApiKey;
    }
  });

  it("classify returns a valid L1 node id", async () => {
    const result = await classify("I want to build a solar kiosk network.");
    expect(VALID_L1_NODES).toContain(result);
  });

  it("assessLayer0 returns seeded sector and EO profile with fallback heuristic", async () => {
    const result = await assessLayer0(
      "1) I am building a food business for office workers. 2) I see a gap in affordable lunch delivery. 3) I would launch with a backup supplier. 4) I would move first and outwork the competitor."
    );

    expect(result.sector).toBe("food");
    expect(result.layer1NodeId).toMatch(/^L1-node-[1-5]$/);
    expect(result.initialEOProfile.proactiveness).toBeGreaterThan(5);
  });

  it("bold + competitive text routes to L1-node-1", async () => {
    const result = await classify(
      "I will take bold risks, invest aggressively, compete hard, and dominate the market."
    );
    expect(result).toBe("L1-node-1");
  });

  it("proactive + careful text routes to L1-node-2", async () => {
    const result = await classify(
      "I will build and launch new innovations steadily and safely without taking undue risks."
    );
    expect(result).toBe("L1-node-2");
  });

  it("people-first + independent text routes to L1-node-3", async () => {
    const result = await classify(
      "I will independently help the community, empower people through social impact and inclusion."
    );
    expect(result).toBe("L1-node-3");
  });
});

describe("generateQ2", () => {
  it("returns fallback Q2 when ANTHROPIC_API_KEY is not set", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await generateQ2("I want to build a mobile tailoring business in Kumasi.");
    expect(result.length).toBeGreaterThan(20);

    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  });
});

describe("extractPlayerContext", () => {
  it("splits Q1 into businessDescription and motivation", () => {
    const ctx = extractPlayerContext(
      "I want to build a solar panel installation company. My goal is to make clean energy affordable.",
      "I would call my vendors immediately and negotiate.",
      "Your supplier cancelled. What do you do?"
    );
    expect(ctx.businessDescription).toBe("I want to build a solar panel installation company");
    expect(ctx.motivation).toBe("My goal is to make clean energy affordable");
    expect(ctx.rawQ1Response).toContain("solar");
    expect(ctx.rawQ2Response).toContain("vendors");
    expect(ctx.q2Prompt).toContain("supplier");
  });

  it("uses full Q1 as businessDescription when only one sentence", () => {
    const ctx = extractPlayerContext("Mobile food delivery", "I would improvise", "Test Q2");
    expect(ctx.businessDescription).toBe("Mobile food delivery");
    expect(ctx.motivation).toBe("To build something meaningful in Accra.");
  });
});
