import { Link } from "wouter";
import { SafetyBadge } from "./SafetyBadge";
import { Lock, Unlock } from "lucide-react";

interface Token {
  id: number;
  name: string;
  symbol: string;
  imageUrl?: string | null;
  price: number;
  marketCap: number;
  volume24h: number;
  liquidityLocked: boolean;
  safetyScore: number;
  status: string;
  category: string;
  createdAt: string;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(4)}`;
}

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export function TokenCard({ token }: { token: Token }) {
  return (
    <Link
      href={`/token/${token.id}`}
      className="block border border-border bg-card hover:border-primary/60 hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(204,255,0,0.08)] transition-all duration-200 ease-out group"
      data-testid={`card-token-${token.id}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {token.imageUrl ? (
              <img
                src={token.imageUrl}
                alt={token.name}
                className="w-10 h-10 object-cover flex-shrink-0 bg-muted"
              />
            ) : (
              <div className="w-10 h-10 bg-muted flex items-center justify-center flex-shrink-0">
                <span className="font-mono text-xs text-muted-foreground">
                  {token.symbol.slice(0, 2)}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-mono font-bold text-foreground group-hover:text-primary transition-colors duration-200"
                  data-testid={`text-name-${token.id}`}
                >
                  {token.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ${token.symbol}
                </span>
                {isNew(token.createdAt) && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/20 text-primary border border-primary/30">
                    NEW
                  </span>
                )}
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 border ${
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
              <div className="text-xs text-muted-foreground font-mono mt-1">
                {token.category}
              </div>
            </div>
          </div>
          <SafetyBadge score={token.safetyScore} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div data-testid={`text-price-${token.id}`}>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">Price</div>
            <div className="text-sm font-mono text-foreground">{fmt(token.price)}</div>
          </div>
          <div data-testid={`text-mcap-${token.id}`}>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">Mkt Cap</div>
            <div className="text-sm font-mono text-foreground">{fmt(token.marketCap)}</div>
          </div>
          <div data-testid={`text-vol-${token.id}`}>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">Vol 24h</div>
            <div className="text-sm font-mono text-foreground">{fmt(token.volume24h)}</div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs font-mono">
          <div className={`flex items-center gap-1 ${token.liquidityLocked ? "text-primary" : "text-muted-foreground"}`}>
            {token.liquidityLocked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
            <span>{token.liquidityLocked ? "Liq Locked" : "Liq Unlocked"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
