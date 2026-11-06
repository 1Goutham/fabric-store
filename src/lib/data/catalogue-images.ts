/**
 * Curated catalogue photography, keyed by product and category slug. Shared by
 * the seed script and the storefront serializers.
 *
 * The storefront uses these photos whenever a catalogue product in the
 * database has no images, or only demo photos from an earlier seed (which
 * were mismatched, and one is dead). A deployed site therefore shows the right
 * photos without re-seeding. Images an admin adds from other sources are
 * always kept as they are.
 */
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const PRODUCT_PHOTOS: Record<string, string[]> = {
  "ash-linen-shirt": [u("photo-1596755094514-f87e34085b2c")],
  "studio-poplin-shirt": [u("photo-1603252109303-2751441dd157"), u("photo-1598033129183-c4f50c736f10")],
  "oxford-overshirt": [u("photo-1602810318383-e386cc2a3ccf")],
  "column-silk-shirt": [u("photo-1524504388940-b1c1722653e1")],
  "camp-collar-shirt": [u("photo-1626497764746-6dc36546b388")],
  "heavyweight-tee": [u("photo-1521572163474-6864f9cf17ab"), u("photo-1583743814966-8936f5b7be1a")],
  "long-sleeve-rib-tee": [u("photo-1503342217505-b0a15ec3261c")],
  "pocket-tee": [u("photo-1507003211169-0a1dd7228f2d"), u("photo-1564859228273-274232fdb516")],
  "boxy-cropped-tee": [u("photo-1618354691373-d851c5c3a990"), u("photo-1576871337622-98d48d1cf531")],
  "pleated-wool-trouser": [u("photo-1620012253295-c15cc3e65df4"), u("photo-1617137968427-85924c800a22")],
  "wide-leg-linen-trouser": [u("photo-1509631179647-0177331693ae"), u("photo-1506629082955-511b1aa562c8")],
  "tapered-cotton-chino": [u("photo-1473966968600-fa801b869a1a"), u("photo-1488161628813-04466f872be2")],
  "drawstring-easy-trouser": [u("photo-1594633312681-425c7b97ccd1")],
  "rigid-straight-jean": [u("photo-1624378439575-d8705ad7ae80"), u("photo-1516826957135-700dedea698c")],
  "washed-wide-jean": [u("photo-1582418702059-97ebafb35d09"), u("photo-1475178626620-a4d074967452")],
  "slim-black-jean": [u("photo-1542272604-787c3835535d"), u("photo-1541099649105-f69ad21f3246")],
  "bias-slip-dress": [u("photo-1595777457583-95e059d581b8")],
  "linen-shirt-dress": [u("photo-1496747611176-843222e1e57c")],
  "knit-column-dress": [u("photo-1572804013309-59a88b7e92f1")],
  "chore-jacket": [u("photo-1544022613-e87ca75a784a"), u("photo-1591047139829-d91aecb6caea")],
  "unstructured-blazer": [u("photo-1552374196-1ab2a1c593e8"), u("photo-1610652492500-ded49ceeb378")],
  "denim-trucker-jacket": [u("photo-1611312449408-fcece27cdbb7")],
  "wool-overcoat": [u("photo-1539533018447-63fcce2678e3"), u("photo-1539109136881-3be0616acf4b"), u("photo-1485968579580-b6d095142e6e")],
  "merino-crew-neck": [u("photo-1620799140408-edc6dcb6d633")],
  "cotton-rib-cardigan": [u("photo-1434389677669-e08b4cac3105")],
  "oversized-wool-hoodie": [u("photo-1556821840-3a63f95609a7"), u("photo-1548126032-079a0fb0099d")],
  "linen-co-ord-set": [u("photo-1490481651871-ab68de25d43d"), u("photo-1593030761757-71fae45fa0e7")],
  "knit-lounge-set": [u("photo-1515886657613-9f3515b0c78f")],
};

export const CATEGORY_PHOTOS: Record<string, string> = {
  "shirts": u("photo-1603252109303-2751441dd157"),
  "t-shirts": u("photo-1521572163474-6864f9cf17ab"),
  "trousers": u("photo-1473966968600-fa801b869a1a"),
  "denim": u("photo-1582418702059-97ebafb35d09"),
  "dresses": u("photo-1595777457583-95e059d581b8"),
  "outerwear": u("photo-1539533018447-63fcce2678e3"),
  "knitwear": u("photo-1620799140408-edc6dcb6d633"),
  "co-ords": u("photo-1515886657613-9f3515b0c78f"),
};

/** Every Unsplash photo id the demo seed has ever used, current and earlier. */
const SEED_PHOTO_IDS = new Set([
  "photo-1434389677669-e08b4cac3105",
  "photo-1469334031218-e382a71b716b",
  "photo-1473966968600-fa801b869a1a",
  "photo-1475178626620-a4d074967452",
  "photo-1483985988355-763728e1935b",
  "photo-1485968579580-b6d095142e6e",
  "photo-1487222477894-8943e31ef7b2",
  "photo-1488161628813-04466f872be2",
  "photo-1490481651871-ab68de25d43d",
  "photo-1496747611176-843222e1e57c",
  "photo-1503342217505-b0a15ec3261c",
  "photo-1506629082955-511b1aa562c8",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1509631179647-0177331693ae",
  "photo-1515886657613-9f3515b0c78f",
  "photo-1516826957135-700dedea698c",
  "photo-1520975954732-35dd22299614",
  "photo-1521572163474-6864f9cf17ab",
  "photo-1524504388940-b1c1722653e1",
  "photo-1529139574466-a303027c1d8b",
  "photo-1539109136881-3be0616acf4b",
  "photo-1539533018447-63fcce2678e3",
  "photo-1541099649105-f69ad21f3246",
  "photo-1542272604-787c3835535d",
  "photo-1544022613-e87ca75a784a",
  "photo-1548126032-079a0fb0099d",
  "photo-1551028719-00167b16eac5",
  "photo-1552374196-1ab2a1c593e8",
  "photo-1556821840-3a63f95609a7",
  "photo-1564859228273-274232fdb516",
  "photo-1572804013309-59a88b7e92f1",
  "photo-1576566588028-4147f3842f27",
  "photo-1576871337622-98d48d1cf531",
  "photo-1582418702059-97ebafb35d09",
  "photo-1583743814966-8936f5b7be1a",
  "photo-1591047139829-d91aecb6caea",
  "photo-1593030761757-71fae45fa0e7",
  "photo-1594633312681-425c7b97ccd1",
  "photo-1594938298603-c8148c4b3e2c",
  "photo-1595777457583-95e059d581b8",
  "photo-1596755094514-f87e34085b2c",
  "photo-1598033129183-c4f50c736f10",
  "photo-1602810318383-e386cc2a3ccf",
  "photo-1603252109303-2751441dd157",
  "photo-1610652492500-ded49ceeb378",
  "photo-1611312449408-fcece27cdbb7",
  "photo-1617127365659-c47fa864d8bc",
  "photo-1617137968427-85924c800a22",
  "photo-1618354691373-d851c5c3a990",
  "photo-1620012253295-c15cc3e65df4",
  "photo-1620799140408-edc6dcb6d633",
  "photo-1624378439575-d8705ad7ae80",
  "photo-1626497764746-6dc36546b388",
]);

/** True for an empty value or a photo that came from a demo seed. */
function isSeedPhoto(url: string | null | undefined): boolean {
  if (!url) return true;
  const m = /images\.unsplash\.com\/(photo-[0-9a-f-]+)/.exec(url);
  return Boolean(m && SEED_PHOTO_IDS.has(m[1]));
}

type Img = { url: string; alt?: string | null };

/** The images to show for a product: curated photos if the stored ones are missing or demo-seeded. */
export function productImages(slug: string, name: string, stored: Img[] | null | undefined): Img[] {
  const list = (stored ?? []).filter((i) => Boolean(i?.url));
  const curated = PRODUCT_PHOTOS[slug];
  if (!curated || !list.every((i) => isSeedPhoto(i.url))) return list;
  return curated.map((url, i) => ({ url, alt: `${name}${i ? ", alternate view" : ""}` }));
}

/** The cover image for a category, with the same rule. */
export function categoryImage(slug: string, stored: string | null | undefined): string | null {
  const curated = CATEGORY_PHOTOS[slug];
  if (curated && isSeedPhoto(stored)) return curated;
  return stored || null;
}

/** First image for a product slug, for snapshots (order lines) that stored a demo photo. */
export function lineImage(slug: string, stored: string | null | undefined): string {
  const curated = PRODUCT_PHOTOS[slug];
  if (curated && isSeedPhoto(stored)) return curated[0];
  return stored ?? "";
}
