// Applied once on <ClerkProvider> in the root layout, so every Clerk
// component inherits it automatically — the sign-in/sign-up pages, and the
// UserButton/SignedIn/SignedOut controls in SiteHeader. Literal color
// values matching globals.css's luxury design tokens exactly (var()
// references aren't safe here: Clerk derives hover/focus shades from these
// at runtime, which needs real resolvable color values, not custom
// properties it can't introspect). `elements` is deliberately light-touch —
// `variables` alone gets the dark/gold/sharp-edged look consistently
// without pinning to Clerk's internal class names, which are more likely
// to shift between SDK versions.
//
// No explicit `Appearance` type annotation here — this SDK version doesn't
// export that type from a stable public import path (@clerk/types doesn't
// exist as a package in Core 3; @clerk/shared/types exports a differently
// shaped `ClerkAppearanceTheme`). TypeScript still checks this object's
// shape structurally wherever it's passed to `appearance={}`.
export const clerkAppearance = {
  variables: {
    colorPrimary: "hsl(38 62% 60%)", // --color-luxury-gold
    colorBackground: "hsl(210 5% 14%)", // --color-luxury-graphite
    colorInputBackground: "hsl(210 6% 17%)", // --color-luxury-input
    colorInputText: "hsl(0 0% 97%)", // --color-luxury-ivory
    colorText: "hsl(0 0% 97%)",
    colorTextSecondary: "hsl(210 8% 72%)", // --color-luxury-muted-foreground
    colorTextOnPrimaryBackground: "hsl(0 0% 5%)", // --color-luxury-black (text on gold buttons)
    colorDanger: "hsl(0 84.2% 60.2%)", // --color-luxury-destructive
    colorNeutral: "hsl(0 0% 97%)",
    borderRadius: "0px", // every control on this platform is sharp-edged, no exceptions
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    card: "border border-[hsl(210_6%_32%)] shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
    formButtonPrimary: "shadow-[0_8px_28px_rgba(201,162,74,0.3)] hover:brightness-110",
    footerActionLink: "text-[hsl(38_62%_60%)] hover:text-[hsl(38_62%_60%)]",
  },
};
