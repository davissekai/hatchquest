import type { EODimension, EOProfile, EOPoleDistribution } from "@hatchquest/shared";

export interface EOPosterior {
  mean: number;
  variance: number;
}

export type EOPosteriors = Record<EODimension, EOPosterior>;

/**
 * Seeds initial posteriors from the Layer 0 classifier output.
 * Higher confidence → tighter variance.
 */
export function seedFromClassifier(poles: EOPoleDistribution): EOPosteriors {
  // Map each pole pair to a [0,10] mean: dominant pole drives mean away from neutral 5
  const autonomyConf = Math.abs(poles.agency.autonomous - poles.agency.collaborative);
  const innovConf = Math.abs(poles.values.peopleFocused - poles.values.profitFocused);
  const riskConf = Math.abs(poles.risk.tolerant - poles.risk.averse);
  const proactConf = Math.abs(poles.orientation.proactive - poles.orientation.reactive);
  const compConf = Math.abs(poles.competitive.aggressive - poles.competitive.measured);

  const toMean = (dominant: number, confidence: number): number =>
    5 + dominant * confidence * 5; // [0,10]

  return {
    autonomy: {
      mean: toMean(poles.agency.autonomous > 0.5 ? 1 : -1, autonomyConf),
      variance: 2.5 / Math.max(autonomyConf, 0.3),
    },
    innovativeness: {
      mean: toMean(poles.values.profitFocused > 0.5 ? 1 : -1, innovConf),
      variance: 2.5 / Math.max(innovConf, 0.3),
    },
    riskTaking: {
      mean: toMean(poles.risk.tolerant > 0.5 ? 1 : -1, riskConf),
      variance: 2.5 / Math.max(riskConf, 0.3),
    },
    proactiveness: {
      mean: toMean(poles.orientation.proactive > 0.5 ? 1 : -1, proactConf),
      variance: 2.5 / Math.max(proactConf, 0.3),
    },
    competitiveAggressiveness: {
      mean: toMean(poles.competitive.aggressive > 0.5 ? 1 : -1, compConf),
      variance: 2.5 / Math.max(compConf, 0.3),
    },
  };
}

/**
 * Computes a difficulty scalar [0,1] from the current world state.
 * capitalPressure = 1 - min(1, capital/5000)
 * competitorPressure = competitorAggression/100
 */
export function computeDifficulty(
  capital: number,
  competitorAggression: number,
  layer: number
): number {
  const capitalPressure = 1 - Math.min(1, capital / 5000);
  const competitorPressure = competitorAggression / 100;
  const raw = 0.4 * capitalPressure + 0.3 * competitorPressure + 0.3 * (layer / 10);
  return Math.max(0, Math.min(1, raw));
}

/**
 * Updates a single EO posterior given new evidence.
 * Higher difficulty → tighter observation weight (evidence matters more under pressure).
 */
export function updatePosterior(
  prior: EOPosterior,
  evidenceMean: number,
  difficulty: number
): EOPosterior {
  const tau = 1 + 4 * difficulty;
  const posteriorPrecision = 1 / prior.variance + tau;
  const posteriorMean = (prior.mean / prior.variance + evidenceMean * tau) / posteriorPrecision;
  return {
    mean: Math.max(0, Math.min(10, posteriorMean)),
    variance: 1 / posteriorPrecision,
  };
}

/**
 * Converts EOPosteriors to a flat EOProfile (mean values only).
 * Used for results display and Director AI EO affinity computations.
 */
export function posteriorsToProfile(posteriors: EOPosteriors): EOProfile {
  return {
    autonomy: posteriors.autonomy.mean,
    innovativeness: posteriors.innovativeness.mean,
    riskTaking: posteriors.riskTaking.mean,
    proactiveness: posteriors.proactiveness.mean,
    competitiveAggressiveness: posteriors.competitiveAggressiveness.mean,
  };
}
