/**
 * Business / margin model for Gamble AI–style credit + Claude apps.
 * Calibrate tokens & $/MTok against Anthropic usage + https://docs.anthropic.com/en/about-claude/pricing
 */

export const PRICING = {
  creditsPerUsdc: 100,
  usdPerCreditList: 1 / 100,
  signupBonusCredits: 50,
  tierCredits: { 1: 1, 2: 5, 3: 25 } as const,
  anthropicUsdPerMillion: {
    haiku: { input: 1, output: 5 },
    sonnet: { input: 3, output: 15 },
  } as const,
  tokens: {
    parse: { input: 400, output: 350 },
    judge: { input: 1800, output: 800 },
  },
} as const;

export type ModelPriceTier = keyof typeof PRICING.anthropicUsdPerMillion;

export function apiCostUsd(
  inputTok: number,
  outputTok: number,
  tier: ModelPriceTier,
  rates: Record<ModelPriceTier, { input: number; output: number }> = {
    haiku: { ...PRICING.anthropicUsdPerMillion.haiku },
    sonnet: { ...PRICING.anthropicUsdPerMillion.sonnet },
  },
): number {
  const p = rates[tier];
  return (inputTok / 1_000_000) * p.input + (outputTok / 1_000_000) * p.output;
}

export function revenueFromCredits(credits: number): number {
  return credits * PRICING.usdPerCreditList;
}

export function apiPriceTierForProductTier(productTier: 1 | 2 | 3): ModelPriceTier {
  return productTier === 1 ? "haiku" : "sonnet";
}

export interface PricingInputs {
  creditsPerUsdc: number;
  tier1Credits: number;
  tier2Credits: number;
  tier3Credits: number;
  signupBonusCredits: number;
  parseIn: number;
  parseOut: number;
  judgeIn: number;
  judgeOut: number;
  haikuInPerM: number;
  haikuOutPerM: number;
  sonnetInPerM: number;
  sonnetOutPerM: number;
  monthlyFixedUsd: number;
  scenarioUsers: number;
  scenarioParsesPerUser: number;
  scenarioJudgesPerUser: number;
  scenarioProductTier: 1 | 2 | 3;
}

export interface TierEconomicsRow {
  productTier: 1 | 2 | 3;
  creditsCharged: number;
  apiTier: ModelPriceTier;
  parseCogsUsd: number;
  judgeCogsUsd: number;
  parseRevUsd: number;
  judgeRevUsd: number;
  parseMarginPct: number;
  judgeMarginPct: number;
}

export interface PricingSnapshot {
  usdPerCredit: number;
  signupBonusListUsd: number;
  signupBurnHaikuParseUsd: number;
  tiers: TierEconomicsRow[];
  scenario: {
    totalParses: number;
    totalJudges: number;
    totalCogsUsd: number;
    totalListRevUsd: number;
    contributionUsd: number;
    profitAfterFixedUsd: number;
    breakEvenUsers: number | null;
  };
}

function ratesFromInputs(i: PricingInputs): Record<ModelPriceTier, { input: number; output: number }> {
  return {
    haiku: { input: i.haikuInPerM, output: i.haikuOutPerM },
    sonnet: { input: i.sonnetInPerM, output: i.sonnetOutPerM },
  };
}

function revCredits(credits: number, creditsPerUsdc: number): number {
  if (creditsPerUsdc <= 0) return 0;
  return credits / creditsPerUsdc;
}

export function defaultPricingInputs(): PricingInputs {
  return {
    creditsPerUsdc: PRICING.creditsPerUsdc,
    tier1Credits: PRICING.tierCredits[1],
    tier2Credits: PRICING.tierCredits[2],
    tier3Credits: PRICING.tierCredits[3],
    signupBonusCredits: PRICING.signupBonusCredits,
    parseIn: PRICING.tokens.parse.input,
    parseOut: PRICING.tokens.parse.output,
    judgeIn: PRICING.tokens.judge.input,
    judgeOut: PRICING.tokens.judge.output,
    haikuInPerM: PRICING.anthropicUsdPerMillion.haiku.input,
    haikuOutPerM: PRICING.anthropicUsdPerMillion.haiku.output,
    sonnetInPerM: PRICING.anthropicUsdPerMillion.sonnet.input,
    sonnetOutPerM: PRICING.anthropicUsdPerMillion.sonnet.output,
    monthlyFixedUsd: 500,
    scenarioUsers: 100,
    scenarioParsesPerUser: 4,
    scenarioJudgesPerUser: 2,
    scenarioProductTier: 1,
  };
}

export function computePricingSnapshot(i: PricingInputs): PricingSnapshot {
  const r = ratesFromInputs(i);
  const usdPerCredit = i.creditsPerUsdc > 0 ? 1 / i.creditsPerUsdc : 0;

  const rows: TierEconomicsRow[] = ([1, 2, 3] as const).map((productTier) => {
    const creditsCharged =
      productTier === 1 ? i.tier1Credits : productTier === 2 ? i.tier2Credits : i.tier3Credits;
    const apiTier = apiPriceTierForProductTier(productTier);
    const parseCogs = apiCostUsd(i.parseIn, i.parseOut, apiTier, r);
    const judgeCogs = apiCostUsd(i.judgeIn, i.judgeOut, apiTier, r);
    const parseRev = revCredits(creditsCharged, i.creditsPerUsdc);
    const judgeRev = revCredits(creditsCharged, i.creditsPerUsdc);
    const parseMarginPct = parseRev > 0 ? ((parseRev - parseCogs) / parseRev) * 100 : 0;
    const judgeMarginPct = judgeRev > 0 ? ((judgeRev - judgeCogs) / judgeRev) * 100 : 0;
    return {
      productTier,
      creditsCharged,
      apiTier,
      parseCogsUsd: parseCogs,
      judgeCogsUsd: judgeCogs,
      parseRevUsd: parseRev,
      judgeRevUsd: judgeRev,
      parseMarginPct,
      judgeMarginPct,
    };
  });

  const oneParseHaiku = apiCostUsd(i.parseIn, i.parseOut, "haiku", r);
  const signupBurnHaikuParseUsd = i.signupBonusCredits * oneParseHaiku;

  const pt = i.scenarioProductTier;
  const row = rows.find((x) => x.productTier === pt)!;
  const u = Math.max(0, i.scenarioUsers);
  const p = Math.max(0, i.scenarioParsesPerUser);
  const j = Math.max(0, i.scenarioJudgesPerUser);
  const totalParses = u * p;
  const totalJudges = u * j;
  const totalCogsUsd = totalParses * row.parseCogsUsd + totalJudges * row.judgeCogsUsd;
  const totalListRevUsd = totalParses * row.parseRevUsd + totalJudges * row.judgeRevUsd;
  const contributionUsd = totalListRevUsd - totalCogsUsd;
  const profitAfterFixedUsd = contributionUsd - Math.max(0, i.monthlyFixedUsd);

  let breakEvenUsers: number | null = null;
  const marginPerUser = p * row.parseRevUsd + j * row.judgeRevUsd - (p * row.parseCogsUsd + j * row.judgeCogsUsd);
  if (marginPerUser > 0 && i.monthlyFixedUsd > 0) {
    breakEvenUsers = Math.ceil(i.monthlyFixedUsd / marginPerUser);
  } else if (i.monthlyFixedUsd <= 0) {
    breakEvenUsers = 0;
  }

  return {
    usdPerCredit,
    signupBonusListUsd: revCredits(i.signupBonusCredits, i.creditsPerUsdc),
    signupBurnHaikuParseUsd,
    tiers: rows,
    scenario: {
      totalParses,
      totalJudges,
      totalCogsUsd,
      totalListRevUsd,
      contributionUsd,
      profitAfterFixedUsd,
      breakEvenUsers,
    },
  };
}
