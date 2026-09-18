import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { BagView } from "@/components/account/bag-view";

export const metadata: Metadata = { title: "Bag" };

export default function BagPage() {
  return (
    <>
      <PageShell>
        <BagView />
      </PageShell>
      <Footer />
    </>
  );
}
