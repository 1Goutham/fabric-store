"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/client/cn";
import type { ReviewDTO } from "@/types";
import { api, ApiClientError, messageOf } from "@/lib/client/api";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { formatDate } from "@/lib/client/format";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Rating, Skeleton } from "@/components/ui/primitives";

export function Reviews({ productId, initialAverage, initialCount }: { productId: string; initialAverage: number; initialCount: number }) {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const [reviews, setReviews] = useState<ReviewDTO[] | null>(null);
  const [canReview, setCanReview] = useState<{ eligible: boolean; verified: boolean }>({ eligible: false, verified: false });
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: "", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const d = await api.get<{ reviews: ReviewDTO[]; canReview: { eligible: boolean; verified: boolean } }>(`/api/products/${productId}/reviews`);
      setReviews(d.reviews);
      setCanReview(d.canReview);
    } catch {
      setReviews([]);
    }
  };
  useEffect(() => {
    void load();
  }, [productId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = reviews?.find((r) => r.isMine);

  const startWriting = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}#reviews`);
      return;
    }
    if (mine) setForm({ rating: mine.rating, title: mine.title ?? "", body: mine.body });
    setWriting(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.post(`/api/products/${productId}/reviews`, { rating: form.rating, title: form.title, body: form.body });
      toast({ title: mine ? "Review updated" : "Thanks for your review", tone: "success" });
      setWriting(false);
      setForm({ rating: 0, title: "", body: "" });
      await load();
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast({ title: "Couldn't save your review", description: messageOf(err), tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/reviews/${id}`);
      toast({ title: "Review removed" });
      await load();
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't remove review", description: messageOf(err), tone: "danger" });
    }
  };

  const average = reviews && reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : initialAverage;
  const count = reviews ? reviews.length : initialCount;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">Reviews</p>
          <h2 id="reviews-heading" className="headline text-[26px]">
            {count > 0 ? `${average.toFixed(1)} from ${count} ${count === 1 ? "review" : "reviews"}` : "No reviews yet"}
          </h2>
          {count > 0 && <Rating value={average} className="mt-2" />}
        </div>
        {!writing && (
          <Button variant="secondary" onClick={startWriting}>
            {mine ? "Edit your review" : "Write a review"}
          </Button>
        )}
      </div>

      {writing && (
        <form onSubmit={submit} className="mt-8 rounded-[var(--r-xl)] border border-line p-5 md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-fg-soft">{canReview.verified ? <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-ok" /> Verified purchase</span> : "Share how it wears."}</p>
            <button type="button" onClick={() => setWriting(false)} className="text-[13px] text-fg-muted hover:text-fg">
              Cancel
            </button>
          </div>
          <div className="mt-5 flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={form.rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setForm({ ...form, rating: n })} className="tactile p-1">
                <svg width="26" height="26" viewBox="0 0 24 24" className={cn("transition-colors", n <= form.rating ? "text-accent" : "text-fg/20")}>
                  <path fill="currentColor" d="M12 2.5l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.6 5.9 21l1.4-6.8L2.2 9.5l6.9-.7z" />
                </svg>
              </button>
            ))}
            {errors.rating && <span className="ml-2 text-[12px] text-danger">{errors.rating}</span>}
          </div>
          <div className="mt-5 grid gap-4">
            <Input label="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} error={errors.title} />
            <Textarea label="Review" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={1200} error={errors.body} placeholder="Fit, fabric, how it held up." />
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" loading={saving}>
              {mine ? "Update review" : "Post review"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 divide-y divide-line">
        {reviews === null ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="py-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <p className="py-8 text-[15px] text-fg-muted">Be the first to say how it wears.</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Rating value={r.rating} />
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[12px] text-ok">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                    </span>
                  )}
                </div>
                {r.isMine && (
                  <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-danger" aria-label="Delete your review">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
              {r.title && <h3 className="mt-3 text-[15px] font-medium text-fg">{r.title}</h3>}
              <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-fg-soft">{r.body}</p>
              <p className="meta mt-3">
                {r.author.name} · {formatDate(r.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
