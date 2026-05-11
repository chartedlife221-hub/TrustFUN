import {
  useGetTrendingTokens,
  getGetTrendingTokensQueryKey,
} from "@workspace/api-client-react";
import { TokenCard } from "@/components/TokenCard";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame } from "lucide-react";

export default function Trending() {
  const { data: tokens, isLoading } = useGetTrendingTokens({
    query: { queryKey: getGetTrendingTokensQueryKey() },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-mono uppercase tracking-widest">Trending Tokens</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Ranked by 24-hour trading volume
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="trending-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : tokens && tokens.length > 0 ? (
        <div className="space-y-2" data-testid="trending-list">
          {tokens.map((token, i) => (
            <div key={token.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-border bg-card font-mono text-sm text-muted-foreground mt-1">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <TokenCard token={token} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border p-12 text-center" data-testid="trending-empty">
          <Flame className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-muted-foreground uppercase text-sm">
            No trending tokens yet
          </p>
        </div>
      )}
    </div>
  );
}
