export interface SafetyInput {
  liquidityLocked: boolean;
  liquidityLockDays: number;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  contractVerified: boolean;
  teamWalletPercent: number;
  liquidityAmount: number;
}

export interface ScoreBreakdown {
  liquidityLock: { earned: number; max: number; detail: string };
  mintAuthority: { earned: number; max: number; detail: string };
  freezeAuthority: { earned: number; max: number; detail: string };
  contractVerified: { earned: number; max: number; detail: string };
  teamWallet: { earned: number; max: number; detail: string };
  liquidityDepth: { earned: number; max: number; detail: string };
  penalties: { value: number; reasons: string[] };
  bonus: { value: number; reason: string };
  total: number;
}

export function computeScoreBreakdown(input: SafetyInput): ScoreBreakdown {
  // 1. Liquidity Lock (max 30)
  let liqLockPts = 0;
  let liqLockDetail = "Not locked — high rug risk";
  if (input.liquidityLocked) {
    liqLockPts = 18;
    liqLockDetail = "Locked";
    if (input.liquidityLockDays >= 730) {
      liqLockPts += 12;
      liqLockDetail = `Locked ${input.liquidityLockDays}d — excellent commitment`;
    } else if (input.liquidityLockDays >= 365) {
      liqLockPts += 9;
      liqLockDetail = `Locked ${input.liquidityLockDays}d — strong commitment`;
    } else if (input.liquidityLockDays >= 180) {
      liqLockPts += 6;
      liqLockDetail = `Locked ${input.liquidityLockDays}d — solid`;
    } else if (input.liquidityLockDays >= 90) {
      liqLockPts += 3;
      liqLockDetail = `Locked ${input.liquidityLockDays}d — moderate`;
    } else if (input.liquidityLockDays >= 30) {
      liqLockPts += 1;
      liqLockDetail = `Locked ${input.liquidityLockDays}d — short term`;
    } else {
      liqLockDetail = `Locked ${input.liquidityLockDays}d — very short`;
    }
  }

  // 2. Mint Authority (max 20)
  const mintPts = input.mintAuthorityRevoked ? 20 : 0;
  const mintDetail = input.mintAuthorityRevoked
    ? "Revoked — supply is fixed forever"
    : "Not revoked — new tokens can be minted";

  // 3. Freeze Authority (max 15)
  const freezePts = input.freezeAuthorityRevoked ? 15 : 0;
  const freezeDetail = input.freezeAuthorityRevoked
    ? "Revoked — wallets cannot be frozen"
    : "Not revoked — wallets can be frozen by creator";

  // 4. Contract Verified (max 10)
  const verifiedPts = input.contractVerified ? 10 : 0;
  const verifiedDetail = input.contractVerified
    ? "Source code public and verified"
    : "Contract is unverified — code is unknown";

  // 5. Team Wallet % (max 15)
  let teamPts = 0;
  let teamDetail = "";
  const t = input.teamWalletPercent;
  if (t === 0) {
    teamPts = 15;
    teamDetail = "0% — fully community owned";
  } else if (t <= 1) {
    teamPts = 14;
    teamDetail = `${t}% — minimal team share`;
  } else if (t <= 2) {
    teamPts = 12;
    teamDetail = `${t}% — very low team share`;
  } else if (t <= 5) {
    teamPts = 9;
    teamDetail = `${t}% — low team share`;
  } else if (t <= 10) {
    teamPts = 5;
    teamDetail = `${t}% — moderate team share`;
  } else if (t <= 15) {
    teamPts = 2;
    teamDetail = `${t}% — high team share, exercise caution`;
  } else if (t <= 20) {
    teamPts = 1;
    teamDetail = `${t}% — very high team share`;
  } else {
    teamPts = 0;
    teamDetail = `${t}% — excessive team share, major red flag`;
  }

  // 6. Liquidity Depth (max 15)
  let liqDepthPts = 0;
  let liqDepthDetail = "";
  const liq = input.liquidityAmount;
  if (liq >= 1_000_000) {
    liqDepthPts = 15;
    liqDepthDetail = `$${(liq / 1_000_000).toFixed(1)}M — deep liquidity`;
  } else if (liq >= 500_000) {
    liqDepthPts = 12;
    liqDepthDetail = `$${(liq / 1_000).toFixed(0)}K — strong liquidity`;
  } else if (liq >= 100_000) {
    liqDepthPts = 9;
    liqDepthDetail = `$${(liq / 1_000).toFixed(0)}K — good liquidity`;
  } else if (liq >= 50_000) {
    liqDepthPts = 7;
    liqDepthDetail = `$${(liq / 1_000).toFixed(0)}K — decent liquidity`;
  } else if (liq >= 10_000) {
    liqDepthPts = 4;
    liqDepthDetail = `$${(liq / 1_000).toFixed(0)}K — low liquidity`;
  } else if (liq >= 1_000) {
    liqDepthPts = 2;
    liqDepthDetail = `$${liq.toFixed(0)} — very low liquidity`;
  } else {
    liqDepthDetail = `$${liq.toFixed(0)} — insufficient liquidity`;
  }

  // Penalties for dangerous combinations
  const penaltyReasons: string[] = [];
  let penaltyTotal = 0;
  if (!input.liquidityLocked && !input.mintAuthorityRevoked) {
    penaltyTotal -= 5;
    penaltyReasons.push("No lock + mint active = high rug vector (-5)");
  }
  if (input.teamWalletPercent > 30) {
    penaltyTotal -= 10;
    penaltyReasons.push("Team wallet >30% — severe concentration (-10)");
  } else if (input.teamWalletPercent > 20) {
    penaltyTotal -= 5;
    penaltyReasons.push("Team wallet >20% — high concentration (-5)");
  }

  // Bonus: all 4 core safety flags pass
  let bonusPts = 0;
  let bonusReason = "";
  if (
    input.liquidityLocked &&
    input.mintAuthorityRevoked &&
    input.freezeAuthorityRevoked &&
    input.contractVerified
  ) {
    bonusPts = 5;
    bonusReason = "All core safety checks pass (+5 trust bonus)";
  }

  const rawTotal =
    liqLockPts +
    mintPts +
    freezePts +
    verifiedPts +
    teamPts +
    liqDepthPts +
    penaltyTotal +
    bonusPts;

  const total = Math.max(0, Math.min(100, rawTotal));

  return {
    liquidityLock: { earned: liqLockPts, max: 30, detail: liqLockDetail },
    mintAuthority: { earned: mintPts, max: 20, detail: mintDetail },
    freezeAuthority: { earned: freezePts, max: 15, detail: freezeDetail },
    contractVerified: { earned: verifiedPts, max: 10, detail: verifiedDetail },
    teamWallet: { earned: teamPts, max: 15, detail: teamDetail },
    liquidityDepth: { earned: liqDepthPts, max: 15, detail: liqDepthDetail },
    penalties: { value: penaltyTotal, reasons: penaltyReasons },
    bonus: { value: bonusPts, reason: bonusReason },
    total,
  };
}

export function computeSafetyScore(input: SafetyInput): number {
  return computeScoreBreakdown(input).total;
}
