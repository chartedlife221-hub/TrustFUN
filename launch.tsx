import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateToken, getListTokensQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SafetyBadge } from "@/components/SafetyBadge";
import { Rocket, Info, Shield, Lock, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { computeScoreBreakdown } from "@/lib/safetyScore";

const CATEGORIES = ["meme", "defi", "gaming", "ai", "dao", "utility", "other"];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1).max(10, "Max 10 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  creatorWallet: z.string().min(10, "Enter a valid Solana wallet address"),
  totalSupply: z.coerce.number().positive("Must be positive"),
  liquidityAmount: z.coerce.number().min(0),
  liquidityLocked: z.boolean(),
  liquidityLockDays: z.coerce.number().min(0),
  mintAuthorityRevoked: z.boolean(),
  freezeAuthorityRevoked: z.boolean(),
  teamWalletPercent: z.coerce.number().min(0).max(100),
  status: z.enum(["live", "upcoming", "ended"]),
  category: z.string(),
  contractAddress: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

function ScoreFactorBar({
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
    <div className={`px-3 py-2 border space-y-1.5 ${passes ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {passes
            ? <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
            : <XCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
          <span className={`text-xs font-mono ${passes ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
        </div>
        <span className={`text-xs font-mono tabular-nums ${passes ? "text-primary" : "text-muted-foreground"}`}>
          {earned}/{max}
        </span>
      </div>
      <div className="h-1 bg-border">
        <div
          className={`h-1 transition-all duration-500 ${passes ? "bg-primary" : earned > 0 ? "bg-yellow-400" : "bg-border"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] font-mono text-muted-foreground">{detail}</div>
    </div>
  );
}

export default function Launch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createToken = useCreateToken();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      creatorWallet: "",
      totalSupply: 1_000_000_000,
      liquidityAmount: 0,
      liquidityLocked: false,
      liquidityLockDays: 0,
      mintAuthorityRevoked: false,
      freezeAuthorityRevoked: false,
      teamWalletPercent: 10,
      status: "upcoming",
      category: "meme",
      contractAddress: "",
      imageUrl: "",
    },
  });

  const watchedValues = form.watch();
  const breakdown = computeScoreBreakdown(watchedValues);
  const previewScore = breakdown.total;

  async function onSubmit(values: FormValues) {
    createToken.mutate(
      {
        data: {
          ...values,
          imageUrl: values.imageUrl || undefined,
          contractAddress: values.contractAddress || undefined,
        },
      },
      {
        onSuccess: (token) => {
          queryClient.invalidateQueries({ queryKey: getListTokensQueryKey() });
          toast({ title: "Token launched!", description: `${token.name} is now live.` });
          setLocation(`/token/${token.id}`);
        },
        onError: () => {
          toast({ title: "Launch failed", description: "Please check your inputs.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border pb-4 flex items-center gap-3">
        <div className="text-primary">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-mono uppercase tracking-widest">Launch Token</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Configure safety settings to build trust with your community
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="border border-border p-4 space-y-4">
                <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest pb-2 border-b border-border">
                  Token Info
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. DogeCoin 2.0" data-testid="input-name" className="bg-card border-border font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Symbol</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DOGE2" maxLength={10} data-testid="input-symbol" className="bg-card border-border font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="What makes your token special?" rows={3} data-testid="input-description" className="bg-card border-border font-mono resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Category</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            data-testid="select-category"
                            className="w-full bg-card border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary h-10"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c.toUpperCase()}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Status</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            data-testid="select-status"
                            className="w-full bg-card border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary h-10"
                          >
                            <option value="upcoming">UPCOMING</option>
                            <option value="live">LIVE</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-image-url" className="bg-card border-border font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border border-border p-4 space-y-4">
                <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest pb-2 border-b border-border">
                  Tokenomics
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="totalSupply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Total Supply</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-total-supply" className="bg-card border-border font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teamWalletPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Team Wallet %</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0} max={100} step={0.1} data-testid="input-team-wallet" className="bg-card border-border font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="creatorWallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Creator Wallet Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Solana address..." data-testid="input-creator-wallet" className="bg-card border-border font-mono text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Contract Address (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Token mint address..." data-testid="input-contract-address" className="bg-card border-border font-mono text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border border-primary/30 p-4 space-y-4 bg-primary/5">
                <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono uppercase text-primary tracking-widest">Safety Configuration</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="liquidityAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Liquidity Amount (USD)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0} data-testid="input-liquidity-amount" className="bg-card border-border font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="liquidityLockDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Lock Duration (days)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0} data-testid="input-lock-days" className="bg-card border-border font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="liquidityLocked"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border border-border px-3 py-2 bg-card">
                        <div>
                          <FormLabel className="text-sm font-mono text-foreground cursor-pointer flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-primary" />
                            Liquidity Locked
                          </FormLabel>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            +25 safety points
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-liquidity-locked"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mintAuthorityRevoked"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border border-border px-3 py-2 bg-card">
                        <div>
                          <FormLabel className="text-sm font-mono text-foreground cursor-pointer flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            Mint Authority Revoked
                          </FormLabel>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            +20 safety points — no new tokens can be created
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-mint-authority"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="freezeAuthorityRevoked"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border border-border px-3 py-2 bg-card">
                        <div>
                          <FormLabel className="text-sm font-mono text-foreground cursor-pointer flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-primary" />
                            Freeze Authority Revoked
                          </FormLabel>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            +15 safety points — wallets cannot be frozen
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-freeze-authority"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createToken.isPending}
                className="w-full bg-primary text-primary-foreground py-3 font-mono uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-glow"
                data-testid="button-submit"
              >
                <Rocket className="w-4 h-4" />
                {createToken.isPending ? "Launching..." : "Launch Token"}
              </button>
            </form>
          </Form>
        </div>

        <div className="space-y-4">
          <div className="border border-border p-4 sticky top-20 space-y-4">
            <div className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
              Safety Preview
            </div>

            <div className="flex flex-col items-center py-4 border border-border bg-card">
              <SafetyBadge score={previewScore} size="lg" />
              <div className="text-xs font-mono text-muted-foreground mt-3 text-center">
                Your token will launch with a safety score of
                <span className={`font-bold ml-1 ${
                  previewScore >= 70 ? "text-primary" : previewScore >= 40 ? "text-yellow-400" : "text-destructive"
                }`}>
                  {previewScore}/100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {breakdown.factors.map((f) => (
                <ScoreFactorBar
                  key={f.label}
                  label={f.label}
                  earned={f.earned}
                  max={f.max}
                  detail={f.detail}
                  passes={f.passes}
                />
              ))}
              {breakdown.penalties.reasons.length > 0 && (
                <div className="border border-destructive/40 bg-destructive/5 px-3 py-2 space-y-0.5">
                  {breakdown.penalties.reasons.map((r) => (
                    <div key={r} className="text-[10px] font-mono text-destructive">{r}</div>
                  ))}
                </div>
              )}
              {breakdown.bonus.value > 0 && (
                <div className="border border-primary/40 bg-primary/5 px-3 py-2">
                  <div className="text-[10px] font-mono text-primary">{breakdown.bonus.reason}</div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs font-mono text-muted-foreground border border-border p-3 bg-card">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
              <span>Higher safety scores build trust and attract serious investors. Aim for 70+ to appear in the safe filter.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
