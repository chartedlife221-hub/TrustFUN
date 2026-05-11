import { useState } from "react";
import {
  useListTokens,
  useGetPlatformStats,
  getListTokensQueryKey,
} from "@workspace/api-client-react";
import { TokenCard } from "@/components/TokenCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Shield, TrendingUp, Droplets, Zap } from "lucide-react";
import { Link } from "wouter";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "safety", label: "Safest" },
  { value: "marketcap", label: "Market Cap" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border bg-card p-4 flex items-center gap-3" data-testid="stat-card">
      <div className="text-primary">{icon}</div>
      <div>
        <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
        <div className="text-lg font-mono font-bold text-foreground" data-testid={`stat-value-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("");

  const { data: stats } = useGetPlatformStats({
    query: { queryKey: getListTokensQueryKey() },
  });

  const params = {
    sort: sort || undefined,
    status: (status as "live" | "upcoming" | "ended") || undefined,
    search: search || undefined,
  };

  const { data: tokens, isLoading } = useListTokens(params, {
    query: { queryKey: getListTokensQueryKey(params) },
  });

  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-6 mb-2">
        <h1 className="text-3xl md:text-5xl font-mono font-bold tracking-tight text-foreground leading-tight">
          The Safer Meme Coin<br />
          <span className="text-primary">Launchpad on Solana</span>
        </h1>
        <p className="text-sm font-mono text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          TrustFUN helps creators launch transparent meme coins with anti-rug protection, liquidity locks, creator verification, and AI-powered trust scoring.
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Features</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: "🔒",
              title: "Anti-Rug Protection",
              desc: "Limit creator wallet ownership and reduce rug pull risks.",
            },
            {
              icon: "✅",
              title: "Creator Verification",
              desc: "Verified creators build more trust with communities.",
            },
            {
              icon: "🤖",
              title: "AI Risk Score",
              desc: "AI analyzes token safety, liquidity, and suspicious activity.",
            },
            {
              icon: "💧",
              title: "Liquidity Lock",
              desc: "Liquidity locking system improves transparency.",
            },
          ].map((f) => (
            <div key={f.title} className="border border-border bg-card p-5 space-y-3">
              <div className="text-2xl">{f.icon}</div>
              <div className="font-mono font-bold text-sm uppercase tracking-wide text-foreground">
                {f.title}
              </div>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">How TrustFUN Works</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              step: "1",
              title: "Launch Securely",
              desc: "Creators launch meme coins with built-in safety rules.",
            },
            {
              step: "2",
              title: "AI Risk Analysis",
              desc: "TrustFUN scans liquidity, wallets, and suspicious activity.",
            },
            {
              step: "3",
              title: "Community Trust",
              desc: "Verified creators and transparent tokenomics increase trust.",
            },
            {
              step: "4",
              title: "Trade Safer",
              desc: "Users explore meme coins with visible trust scores and risk levels.",
            },
          ].map((s) => (
            <div key={s.step} className="border border-border bg-card p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-9 h-9 border border-primary text-primary font-mono font-bold text-lg flex items-center justify-center">
                {s.step}
              </div>
              <div className="space-y-1">
                <div className="font-mono font-bold text-sm uppercase tracking-wide text-foreground">
                  {s.title}
                </div>
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-primary/30 bg-primary/5 p-6 space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Our Mission</div>
        <p className="font-mono text-foreground text-sm leading-relaxed max-w-3xl">
          TrustFUN aims to create a safer and more transparent future for meme coin communities by reducing rug pulls and improving trust in decentralized token launches.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-testid="platform-stats">
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            label="Total Tokens"
            value={stats.totalTokens.toString()}
          />
          <StatCard
            icon={<Droplets className="w-5 h-5" />}
            label="Total Liquidity"
            value={fmt(stats.totalLiquidity)}
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Avg Safety Score"
            value={stats.avgSafetyScore.toFixed(0) + "/100"}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Volume 24h"
            value={fmt(stats.totalVolume24h)}
          />
        </div>
      )}

      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-mono uppercase tracking-widest text-foreground">
            Token Explorer
          </h1>
          <Link
            href="/launch"
            className="text-sm font-mono uppercase text-primary border border-primary px-4 py-1.5 hover:bg-primary/10 transition-colors btn-glow"
            data-testid="link-launch"
          >
            + Launch Token
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border pl-10 pr-4 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              data-testid="input-search"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                  status === opt.value
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                data-testid={`filter-status-${opt.value || "all"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-card border border-border px-3 py-2 text-xs font-mono uppercase text-foreground focus:outline-none focus:border-primary transition-colors"
            data-testid="select-sort"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="tokens-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : tokens && tokens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="tokens-grid">
          {tokens.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border p-12 text-center" data-testid="tokens-empty">
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-muted-foreground uppercase text-sm">No tokens found</p>
          <Link
            href="/launch"
            className="inline-block mt-4 text-sm font-mono text-primary border border-primary px-4 py-2 hover:bg-primary/10 transition-colors"
          >
            Launch the first one
          </Link>
        </div>
      )}
    </div>
  );
}
