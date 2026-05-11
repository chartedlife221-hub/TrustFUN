import { Router, type IRouter } from "express";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, tokensTable, commentsTable } from "@workspace/db";
import {
  ListTokensQueryParams,
  CreateTokenBody,
  GetTokenParams,
  UpdateTokenBody,
  UpdateTokenParams,
  DeleteTokenParams,
  GetTokenCommentsParams,
  CreateCommentBody,
  CreateCommentParams,
} from "@workspace/api-zod";
import { computeSafetyScore } from "../lib/safetyScore";

const router: IRouter = Router();

router.get("/tokens", async (req, res): Promise<void> => {
  const parsed = ListTokensQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sort, status, search } = parsed.data;

  let query = db.select().from(tokensTable).$dynamic();

  if (status) {
    query = query.where(eq(tokensTable.status, status as "live" | "upcoming" | "ended"));
  }

  if (search) {
    query = query.where(
      or(
        ilike(tokensTable.name, `%${search}%`),
        ilike(tokensTable.symbol, `%${search}%`)
      )
    );
  }

  if (sort === "trending") {
    query = query.orderBy(desc(tokensTable.volume24h));
  } else if (sort === "safety") {
    query = query.orderBy(desc(tokensTable.safetyScore));
  } else if (sort === "marketcap") {
    query = query.orderBy(desc(tokensTable.marketCap));
  } else {
    query = query.orderBy(desc(tokensTable.createdAt));
  }

  const tokens = await query;
  res.json(tokens.map(formatToken));
});

router.post("/tokens", async (req, res): Promise<void> => {
  const parsed = CreateTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const safetyScore = computeSafetyScore({
    liquidityLocked: data.liquidityLocked,
    liquidityLockDays: data.liquidityLockDays,
    mintAuthorityRevoked: data.mintAuthorityRevoked,
    freezeAuthorityRevoked: data.freezeAuthorityRevoked,
    contractVerified: false,
    teamWalletPercent: data.teamWalletPercent,
    liquidityAmount: data.liquidityAmount,
  });

  const [token] = await db
    .insert(tokensTable)
    .values({
      ...data,
      status: data.status as "live" | "upcoming" | "ended",
      safetyScore,
      price: 0,
      marketCap: 0,
      volume24h: 0,
      contractVerified: false,
    })
    .returning();

  res.status(201).json(formatToken(token));
});

router.get("/tokens/trending", async (_req, res): Promise<void> => {
  const tokens = await db
    .select()
    .from(tokensTable)
    .orderBy(desc(tokensTable.volume24h))
    .limit(20);
  res.json(tokens.map(formatToken));
});

router.get("/tokens/stats", async (_req, res): Promise<void> => {
  const tokens = await db.select().from(tokensTable);

  const totalTokens = tokens.length;
  const totalLiquidity = tokens.reduce((s, t) => s + (t.liquidityAmount ?? 0), 0);
  const avgSafetyScore = totalTokens > 0
    ? tokens.reduce((s, t) => s + t.safetyScore, 0) / totalTokens
    : 0;
  const liveTokens = tokens.filter((t) => t.status === "live").length;
  const ruggedTokens = tokens.filter((t) => t.status === "ended").length;
  const totalVolume24h = tokens.reduce((s, t) => s + (t.volume24h ?? 0), 0);

  res.json({
    totalTokens,
    totalLiquidity,
    avgSafetyScore,
    liveTokens,
    ruggedTokens,
    totalVolume24h,
  });
});

router.get("/tokens/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetTokenParams.safeParse({ id: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [token] = await db
    .select()
    .from(tokensTable)
    .where(eq(tokensTable.id, parsed.data.id));

  if (!token) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  res.json(formatToken(token));
});

router.patch("/tokens/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTokenParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateTokenBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(tokensTable)
    .where(eq(tokensTable.id, params.data.id));

  if (!existing[0]) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  const updateData = body.data;
  const merged = { ...existing[0], ...updateData };

  const newScore = computeSafetyScore({
    liquidityLocked: merged.liquidityLocked,
    liquidityLockDays: merged.liquidityLockDays,
    mintAuthorityRevoked: merged.mintAuthorityRevoked,
    freezeAuthorityRevoked: merged.freezeAuthorityRevoked,
    contractVerified: merged.contractVerified,
    teamWalletPercent: merged.teamWalletPercent,
    liquidityAmount: merged.liquidityAmount,
  });

  const [token] = await db
    .update(tokensTable)
    .set({ ...updateData, safetyScore: newScore })
    .where(eq(tokensTable.id, params.data.id))
    .returning();

  res.json(formatToken(token));
});

router.delete("/tokens/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTokenParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [token] = await db
    .delete(tokensTable)
    .where(eq(tokensTable.id, params.data.id))
    .returning();

  if (!token) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/tokens/:id/comments", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTokenCommentsParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.tokenId, params.data.id))
    .orderBy(desc(commentsTable.createdAt));

  res.json(comments.map(formatComment));
});

router.post("/tokens/:id/comments", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateCommentParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CreateCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const tokenExists = await db
    .select({ id: tokensTable.id })
    .from(tokensTable)
    .where(eq(tokensTable.id, params.data.id));

  if (!tokenExists[0]) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({ tokenId: params.data.id, ...body.data })
    .returning();

  res.status(201).json(formatComment(comment));
});

function formatToken(token: typeof tokensTable.$inferSelect) {
  return {
    ...token,
    createdAt: token.createdAt.toISOString(),
    updatedAt: undefined,
  };
}

function formatComment(comment: typeof commentsTable.$inferSelect) {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  };
}

export default router;
