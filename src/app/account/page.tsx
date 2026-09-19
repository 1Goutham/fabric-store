import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getStyleProfile, describeStyle } from "@/lib/intelligence/preferences";
import { recentlyViewed } from "@/lib/intelligence/recommend";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { AccountNav } from "@/components/account/account-nav";
import { ProfileForm } from "@/components/account/profile-form";
import { StyleStrip } from "@/components/intelligence/style-strip";
import { ProductRail } from "@/components/commerce/product-rail";
import { SignOutButton } from "@/components/auth/sign-out";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const [profile, recent] = await Promise.all([getStyleProfile(user.id), recentlyViewed(user.id, 8)]);
  return (
    <>
      <PageShell>
        <AccountNav active="account" />
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">Account</p>
            <h1 className="display text-4xl md:text-5xl">{user.name}</h1>
            <p className="mt-2 text-[14px] text-fg-muted">{user.email}{user.role === "admin" ? " · Admin" : ""}</p>
          </div>
          <div className="flex gap-3">
            {user.role === "admin" && <a href="/admin" className="tactile inline-flex h-10 items-center rounded-full border border-line-strong px-5 text-sm text-fg hover:border-fg/40">Open admin</a>}
            <SignOutButton />
          </div>
        </header>

        <section id="style" className="scroll-mt-24 rounded-[var(--r-xl)] border border-line p-6 md:p-8">
          <p className="eyebrow mb-3">Your style</p>
          <h2 className="headline text-2xl">{profile.hasSignals ? describeStyle(profile).slice(0, 3).join(" · ") || "Taking shape." : "Still learning."}</h2>
          <p className="mt-2 max-w-lg text-[14px] text-fg-muted">We learn from what you look at, save and buy. You can also tell us directly. Nothing here is required.</p>
          <div className="mt-6">
            <StyleStrip derived={describeStyle(profile)} initialTags={profile.styleTags} />
          </div>
          {profile.priceBand && <p className="meta mt-4">Usual range: ₹{profile.priceBand.min.toLocaleString("en-IN")} – ₹{profile.priceBand.max.toLocaleString("en-IN")}</p>}
        </section>

        {recent.length > 0 && (
          <section className="mt-16">
            <div className="mb-8">
              <p className="eyebrow mb-3">Recently viewed</p>
              <h2 className="headline text-2xl">Pick up where you left off.</h2>
            </div>
            <ProductRail products={recent} />
          </section>
        )}

        <section className="mt-16">
          <ProfileForm user={user} />
        </section>
      </PageShell>
      <Footer />
    </>
  );
}
