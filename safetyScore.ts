export interface SafetyInput {
  liquidityLocked: boolean;
  liquidityLockDays: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  contractVerified: boolean;
  teamWalletPercent: number;
  liquidityAmount: number;
}

export interface ScoreFactor {
  label: string;
  earned: number;
  max: number;
  detail: string;
  passes: boolean;
}

export interface ScoreBreakdown {
  factors: ScoreFactor[];
  penalties: { value: number; reasons: string[] };
  bonus: { value: number; reason: string };
  total: number;
}

export function computeScoreBreakdown(input: Partial<SafetyInput>): ScoreBreakdown {
  const liquidityLocked = input.liquidityLocked ?? false;
  const liquidityLockDays = Number(input.liquidityLockDays) || 0;
  const mintAuthorityRevoked = input.mintAuthorityRevoked ?? false;
  const freezeAuthorityRevoked = input.freezeAuthorityRevoked ?? false;
  const contractVerified = input.contractVerified ?? false;
  const teamWalletPercent = input.teamWalletPercent != null && input.teamWalletPercent !== ('' as unknown) ? Number(input.teamWalletPercent) : 100;
  const liquidityAmount = Number(input.liquidityAmount) || 0;

  // 1. Liquidity Lock (max 30)
  let liqLockPts = 0;
  let liqLockDetail = "Not locked — high rug risk";
  if (liquidityLocked) {
    liqLockPts = 18;
    liqLockDetail = "Locked";
    if (liquidityLockDays >= 730) { liqLockPts += 12; liqLockDetail = `Locked ${liquidityLockDays}d — excellent`; }
    else if (liquidityLockDays >= 365) { liqLockPts += 9; liqLockDetail = `Locked ${liquidityLockDays}d — strong`; }
    else if (liquidityLockDays >= 180) { liqLockPts += 6; liqLockDetail = `Locked ${liquidityLockDays}d — solid`; }
    else if (liquidityLockDays >= 90) { liqLockPts += 3; liqLockDetail = `Locked ${liquidityLockDays}d — moderate`; }
    else if (liquidityLockDays >= 30) { liqLockPts += 1; liqLockDetail = `Locked ${liquidityLockDays}d — short`; }
    else { liqLockDetail = `Locked ${liquidityLockDays}d — very short`; }
  }

  // 2. Mint Authority (max 20)
  const mintPts = mintAuthorityRevoked ? 20 : 0;
  const mintDetail = mintAuthorityRevoked
    ? "Revoked — supply is fixed forever"
    : "Not revoked — new tokens can be minted";

  // 3. Freeze Authority (max 15)
  const freezePts = freezeAuthorityRevoked ? 15 : 0;
  const freezeDetail = freezeAuthorityRevoked
    ? "Revoked — wallets cannot be frozen"
    : "Not revoked — wallets can be frozen";

  // 4. Contract Verified (max 10)
  const verifiedPts = contractVerified ? 10 : 0;
  const verifiedDetail = contractVerified
    ? "Source code public and verified"
    : "Unverified — code is unknown";

  // 5. Team Wallet % (max 15)
  let teamPts = 0;
  let teamDetail = "";
  const t = teamWalletPercent;
  if (t === 0) { teamPts = 15; teamDetail = "0% — fully community owned"; }
  else if (t <= 1) { teamPts = 14; teamDetail = `${t}% — minimal team share`; }
  else if (t <= 2) { teamPts = 12; teamDetail = `${t}% — very low team share`; }
  else if (t <= 5) { teamPts = 9; teamDetail = `${t}% — low team share`; }
  else if (t <= 10) { teamPts = 5; teamDetail = `${t}% — moderate team share`; }
  else if (t <= 15) { teamPts = 2; teamDetail = `${t}% — high team share`; }
  else if (t <= 20) { teamPts = 1; teamDetail = `${t}% — very high team share`; }
  else { teamPts = 0; teamDetail = `${t}% — excessive — major red flag`; }

  // 6. Liquidity Depth (max 15)
  let liqDepthPts = 0;
  let liqDepthDetail = `$${liquidityAmount.toFixed(0)} — insufficient`;
  const liq = liquidityAmount;
  if (liq >= 1_000_000) { liqDepthPts = 15; liqDepthDetail = `$${(liq/1_000_000).toFixed(1)}M — deep`; }
  else if (liq >= 500_000) { liqDepthPts = 12; liqDepthDetail = `$${(liq/1_000).toFixed(0)}K — strong`; }
  else if (liq >= 100_000) { liqDepthPts = 9; liqDepthDetail = `$${(liq/1_000).toFixed(0)}K — good`; }
  else if (liq >= 50_000) { liqDepthPts = 7; liqDepthDetail = `$${(liq/1_000).toFixed(0)}K — decent`; }
  else if (liq >= 10_000) { liqDepthPts = 4; liqDepthDetail = `$${(liq/1_000).toFixed(0)}K — low`; }
  else if (liq >= 1_000) { liqDepthPts = 2; liqDepthDetail = `$${liq.toFixed(0)} — very low`; }

  // Penalties
  const penaltyReasons: string[] = [];
  let penaltyTotal = 0;
  if (!liquidityLocked && !mintAuthorityRevoked) {
    penaltyTotal -= 5;
    penaltyReasons.push("No lock + mint active: high rug vector (−5)");
  }
  if (t > 30) {
    penaltyTotal -= 10;
    penaltyReasons.push("Team wallet >30%: severe concentration (−10)");
  } else if (t > 20) {
    penaltyTotal -= 5;
    penaltyReasons.push("Team wallet >20%: high concentration (−5)");
  }

  // Bonus: all 4 core flags
  let bonusPts = 0;
  let bonusReason = "";
  if (liquidityLocked && mintAuthorityRevoked && freezeAuthorityRevoked && contractVerified) {
    bonusPts = 5;
    bonusReason = "All core safety checks pass (+5 trust bonus)";
  }

  const rawTotal = liqLockPts + mintPts + freezePts + verifiedPts + teamPts + liqDepthPts + penaltyTotal + bonusPts;
  const total = Math.max(0, Math.min(100, rawTotal));

  return {
    factors: [
      { label: "Liquidity Lock", earned: liqLockPts, max: 30, detail: liqLockDetail, passes: liquidityLocked },
      { label: "Mint Authority", earned: mintPts, max: 20, detail: mintDetail, passes: mintAuthorityRevoked },
      { label: "Freeze Authority", earned: freezePts, max: 15, detail: freezeDetail, passes: freezeAuthorityRevoked },
      { label: "Contract Verified", earned: verifiedPts, max: 10, detail: verifiedDetail, passes: contractVerified },
      { label: "Team Wallet", earned: teamPts, max: 15, detail: teamDetail, passes: t <= 10 },
      { label: "Liquidity Depth", earned: liqDepthPts, max: 15, detail: liqDepthDetail, passes: liq >= 10_000 },
    ],
    penalties: { value: penaltyTotal, reasons: penaltyReasons },
    bonus: { value: bonusPts, reason: bonusReason },
    total,
  };
}

export function computeSafetyScore(input: Partial<SafetyInput>): number {
  return computeScoreBreakdown(input).total;
}
