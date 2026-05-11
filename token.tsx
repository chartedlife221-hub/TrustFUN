import { useParams } from "wouter";
import {
  useGetToken,
  useGetTokenComments,
  useCreateComment,
  getGetTokenQueryKey,
  getGetTokenCommentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SafetyBadge, safetyColor } from "@/components/SafetyBadge";
import { computeScoreBreakdown } from "@/lib/safetyScore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Droplets,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(6)}`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function SafetyFactorBar({
  label,
  earned,
  max,
  detail,
  passes,
}: {
  label: string;
  earned: number;
  max: number;
  detail: string;
  passes: boolean;
}) {
  const pct = max > 0 ? (earned / max) * 100 : 0;
  return (
    <div
      className={`px-4 py-3 border space-y-1.5 ${passes ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
      data-testid={`safety-factor-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {passes
            ? <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <span className={`text-sm font-mono ${passes ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
        </div>
        <span className={`text-xs font-mono tabular-nums ${passes ? "text-primary" : "text-muted-foreground"}`}>
          {earned}/{max} pts
        </span>
      </div>
      <div className="h-1.5 bg-border mx-6">
        <div
          className={`h-1.5 transition-all duration-700 ${passes ? "bg-primary" : earned > 0 ? "bg-yellow-400" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs font-mono text-muted-foreground ml-6">{detail}</div>
    </div>
  );
}

function copyToClipboard(text: string, toast: (opts: { title: string }) => void) {
  navigator.clipboard.writeText(text).then(() => toast({ title: "Copied!" }));
}

function truncateAddr(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const tokenId = parseInt(id ?? "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: token, isLoading } = useGetToken(tokenId, {
    query: { enabled: !!tokenId, queryKey: getGetTokenQueryKey(tokenId) },
  });

  const { data: comments, isLoading: commentsLoading } = useGetTokenComments(tokenId, {
    query: { enabled: !!tokenId, queryKey: getGetTokenCommentsQueryKey(tokenId) },
  });

  const createComment = useCreateComment();
  const [commentWallet, setCommentWallet] = useState("");
  const [commentMessage, setCommentMessage] = useState("");

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentWallet.trim() || !commentMessage.trim()) return;
    createComment.mutate(
      { params: { id: tokenId }, data: { walletAddress: commentWallet.trim(), message: commentMessage.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTokenCommentsQueryKey(tokenId) });
          setCommentMessage("");
          toast({ title: "Comment posted" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="token-loading">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="border border-dashed border-border p-12 text-center" data-testid="token-not-found">
        <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-mono text-muted-foreground uppercase">Token not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid={`token-detail-${tokenId}`}>
      <div className="border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {token.imageUrl ? (
              <img
                src={token.imageUrl}
                alt={token.name}
                className="w-16 h-16 object-cover bg-muted flex-shrink-0"
                data-testid="img-token"
              />
            ) : (
              <div className="w-16 h-16 bg-muted flex items-center justify-center flex-shrink-0">
                <span className="font-mono text-lg text-muted-foreground">
                  {token.symbol.slice(0, 2)}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-mono font-bold text-foreground" data-testid="text-token-name">
                  {token.name}
                </h1>
                <span className="text-muted-foreground font-mono text-lg">${token.symbol}</span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 border ${
                    token.status === "live"
                      ? "text-primary border-primary/30 bg-primary/10"
                      : token.status === "upcoming"
                      ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
                      : "text-muted-foreground border-border"
                  }`}
                >
                  {token.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-2 max-w-xl" data-testid="text-token-description">
                {token.description}
              </p>
              <div className="text-xs text-muted-foreground font-mono mt-1">{token.category}</div>
            </div>
          </div>
          <SafetyBadge score={token.safetyScore} size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Price", value: fmt(token.price), icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Market Cap", value: fmt(token.marketCap), icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Volume 24h", value: fmt(token.volume24h), icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Total Supply", value: fmtNum(token.totalSupply), icon: <Droplets className="w-4 h-4" /> },
        ].map((stat) => (
          <div key={stat.label} className="border border-border bg-card p-4" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="text-[10px] font-mono uppercase text-muted-foreground">{stat.label}</div>
            <div className="text-lg font-mono font-bold text-foreground mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary">Safety Breakdown</span>
            <span className={`ml-auto text-lg font-mono font-bold ${safetyColor(token.safetyScore)}`} data-testid="text-safety-score">
              {token.safetyScore}/100
            </span>
          </div>

          {(() => {
            const bd = computeScoreBreakdown({
              liquidityLocked: token.liquidityLocked,
              liquidityLockDays: token.liquidityLockDays,
              mintAuthorityRevoked: token.mintAuthorityRevoked,
              freezeAuthorityRevoked: token.freezeAuthorityRevoked,
              contractVerified: token.contractVerified,
              teamWalletPercent: token.teamWalletPercent,
              liquidityAmount: token.liquidityAmount,
            });
            return (
              <div className="space-y-1.5">
                {bd.factors.map((f) => (
                  <SafetyFactorBar
                    key={f.label}
                    label={f.label}
                    earned={f.earned}
                    max={f.max}
                    detail={f.detail}
                    passes={f.passes}
                  />
                ))}
                {bd.penalties.reasons.length > 0 && (
                  <div className="border border-destructive/40 bg-destructive/5 px-4 py-2 space-y-0.5">
                    {bd.penalties.reasons.map((r) => (
                      <div key={r} className="text-xs font-mono text-destructive">{r}</div>
                    ))}
                  </div>
                )}
                {bd.bonus.value > 0 && (
                  <div className="border border-primary/40 bg-primary/5 px-4 py-2">
                    <div className="text-xs font-mono text-primary">{bd.bonus.reason}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="border border-border bg-card p-4 space-y-4">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground pb-3 border-b border-border">
            On-Chain Info
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Creator Wallet</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono text-foreground" data-testid="text-creator-wallet">
                  {truncateAddr(token.creatorWallet)}
                </span>
                <button
                  onClick={() => copyToClipboard(token.creatorWallet, toast)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="btn-copy-creator"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {token.contractAddress && (
              <div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Contract Address</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-mono text-foreground" data-testid="text-contract-address">
                    {truncateAddr(token.contractAddress)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(token.contractAddress!, toast)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`https://solscan.io/token/${token.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-solscan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Launched</div>
              <div className="flex items-center gap-2 mt-1 text-sm font-mono text-foreground" data-testid="text-created-at">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {new Date(token.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div className={`flex items-center gap-2 text-xs font-mono ${token.liquidityLocked ? "text-primary" : "text-muted-foreground"}`}>
                {token.liquidityLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {token.liquidityLocked ? "Liq Locked" : "Liq Unlocked"}
              </div>
              <div className={`flex items-center gap-2 text-xs font-mono ${token.mintAuthorityRevoked ? "text-primary" : "text-muted-foreground"}`}>
                {token.mintAuthorityRevoked ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                Mint Revoked
              </div>
              <div className={`flex items-center gap-2 text-xs font-mono ${token.freezeAuthorityRevoked ? "text-primary" : "text-muted-foreground"}`}>
                {token.freezeAuthorityRevoked ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                Freeze Revoked
              </div>
              <div className={`flex items-center gap-2 text-xs font-mono ${token.contractVerified ? "text-primary" : "text-muted-foreground"}`}>
                {token.contractVerified ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                Contract Verified
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest">Community</span>
          {comments && (
            <span className="text-xs font-mono text-muted-foreground ml-1">
              ({comments.length})
            </span>
          )}
        </div>

        <form onSubmit={handleComment} className="flex gap-2" data-testid="form-comment">
          <input
            type="text"
            placeholder="Wallet address..."
            value={commentWallet}
            onChange={(e) => setCommentWallet(e.target.value)}
            className="w-40 bg-background border border-border px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            data-testid="input-comment-wallet"
          />
          <input
            type="text"
            placeholder="Your message..."
            value={commentMessage}
            onChange={(e) => setCommentMessage(e.target.value)}
            className="flex-1 bg-background border border-border px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            data-testid="input-comment-message"
          />
          <button
            type="submit"
            disabled={createComment.isPending || !commentWallet.trim() || !commentMessage.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-mono uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="btn-post-comment"
          >
            Post
          </button>
        </form>

        {commentsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-2" data-testid="comments-list">
            {comments.map((c) => (
              <div key={c.id} className="border border-border p-3" data-testid={`comment-${c.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-primary">{truncateAddr(c.walletAddress)}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-mono text-foreground">{c.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground font-mono text-sm" data-testid="comments-empty">
            No comments yet. Be the first.
          </div>
        )}
      </div>
    </div>
  );
}
