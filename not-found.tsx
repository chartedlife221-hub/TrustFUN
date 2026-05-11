import { Link } from "wouter";
import { Shield } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center border border-dashed border-border p-12">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <div className="text-4xl font-mono font-bold text-primary mb-2">404</div>
        <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm mb-6">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-mono text-primary border border-primary px-6 py-2 hover:bg-primary/10 transition-colors uppercase tracking-wider"
        >
          Back to Explorer
        </Link>
      </div>
    </div>
  );
}
