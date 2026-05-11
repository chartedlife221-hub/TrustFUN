import { Link, useLocation } from "wouter";
import { Rocket, TrendingUp, Shield, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Explore" },
  { href: "/trending", label: "Trending" },
  { href: "/launch", label: "Launch Token" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-mono font-bold text-lg tracking-tight text-primary">
              TRUST<span className="text-foreground">FUN</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 text-sm font-mono uppercase tracking-wider transition-colors ${
                  location === link.href
                    ? "text-primary border border-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                }`}
                data-testid={`nav-link-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/launch"
              className="hidden md:flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 text-sm font-mono uppercase tracking-wider hover:bg-primary/90 transition-colors btn-glow"
              data-testid="btn-launch-header"
            >
              <Rocket className="w-3.5 h-3.5" />
              Launch
            </Link>
            <button
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="btn-mobile-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background" data-testid="nav-mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 text-sm font-mono uppercase tracking-wider border-b border-border ${
                  location === link.href ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center text-xs font-mono text-muted-foreground gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Built on Solana</span>
          <span className="text-border">•</span>
          <span>Powered by <span className="text-primary font-bold">TrustFUN</span></span>
        </div>
      </footer>
    </div>
  );
}
