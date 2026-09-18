import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { SavedView } from "@/components/account/saved-view";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <>
      <PageShell wide>
        <SavedView />
      </PageShell>
      <Footer />
    </>
  );
}
