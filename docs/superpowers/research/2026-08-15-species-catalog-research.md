# Species Catalog Research — 35 species

Research date: 2026-08-15.

## Notes on methodology and data quality (read before using this data)

- **Wholesale pricing is NOT direct Mercamadrid data.** There is no public, per-species Mercamadrid or Madrid-market price list. As instructed, Dutch flower auction (Royal FloraHolland) data is used as a European wholesale proxy where available.
- **Royal FloraHolland does not publish public per-stem prices.** Its per-species clock/Floriday price data sits behind a member/buyer login (the wholeblossoms.com source found during scoping confirms this: "the search results do not contain specific wholesale price information per stem from Royal FloraHolland... you would need to access their official marketplace directly"). Because of this, most `wholesaleEUR` figures in this file are **not** literal Dutch-auction clearing prices — they are drawn from public EU/US wholesale florist-supply sites (Mayesh, FiftyFlowers, Wholeblossoms, Bloomsbythebox, Florabundance, Sierra Flower Finder, etc.), which themselves source heavily from Dutch/Colombian/Ecuadorian grower auctions and republish per-stem or per-bunch pricing publicly. This is a **second-order proxy**, not first-order auction data, and is disclosed per-row via the `priceBasis` field below.
- **`priceBasis` field** (added beyond the original spec, to keep the proxy honest) — one of:
  - `NL-auction` — a genuine Dutch auction average/clock price was found and cited.
  - `EU-wholesaler` — price from a European wholesale florist-supply source (EUR native).
  - `US-wholesaler-USD` — price from a US wholesale florist-supply site, originally in USD. Converted to EUR at an approximate rate of **1 USD ≈ 0.92 EUR** (rounded, indicative only — not a specific date-stamped FX rate; treat as order-of-magnitude, not precise). Where the source price is per-bunch, the per-stem figure is a division by the stated bunch count and is explicitly flagged as such — that division manufactures precision the source doesn't actually offer at the single-stem level.
  - `no-source` — no confident wholesale figure was found; a placeholder-free gap is flagged explicitly rather than a fabricated number.
- **`headMm` for foliage/green-role species** is not a standard published horticultural measurement (foliage isn't sold by "head diameter"). For the `green` role, this field is repurposed as the approximate visual *spread width* of a stem/frond, per the task instructions, and is generally an estimate from commercial product photos/listings rather than a formal citation — flagged where so.
- **Rosa inglesa / `Rosa × centifolia`**: this Latin binomial is technically the historic Provence/cabbage rose, not modern David Austin-type English garden roses (which are complex modern hybrids sold simply as `Rosa` cultivars, no clean single binomial exists). The Spanish/UI name and role are kept as specified by the brief; this mismatch is flagged rather than silently "fixed" with a citation that wouldn't actually support the binomial.
- **`colorHex` is always an editorial estimate, never a cited value** — no botanical or wholesale source publishes hex codes. Every `colorHex` below is derived by the compiler from qualitative color descriptions in the cited sources, not sourced directly itself. Treat as a design starting point, not a verified fact.
- **US-wholesaler prices, especially for greenery, run well above Dutch-auction/Madrid-market reality** — plausibly 3-5x for foliage specifically (a €3.20/stem US-sourced eucalyptus price is a real cited figure but not a realistic Madrid input cost). Treat all `US-wholesaler-USD` prices in this file as **relative ordering between species, not absolute Madrid cost** — useful for "which species is pricier than which," not for bouquet-cost math, until real Mercamadrid or NL-auction figures replace them.
- **Bunch-tier convention**: where a source prices in volume tiers (e.g. 5 vs 30 bunches), the entry/smallest tier is used throughout, as the closer proxy to what an individual florist buys (not bulk-discount pricing).
- Every other numeric claim below has a source URL. Fields the research could not confidently source are marked **LOW CONFIDENCE / no source found** rather than filled with a guessed number.
- **`lengthCm` and `headMm` are reported as ranges** (reflecting genuine source spread/variance), not single numbers. The app schema wants one integer per field — whoever transcribes into `lib/species.ts` should **take the midpoint of the given range, rounded to the nearest integer**, unless a row explicitly calls out a single more-representative figure. Ranges are preserved here deliberately, to keep the sourcing honest rather than manufacture false precision. **Exception**: for `limonium`, `solidago`, `astilbe`, and `genista` (filler role), `headMm` reports the size of an **individual floret**, not the visible bloom/cluster unit — do NOT midpoint those into a design value directly (a 5-8mm floret is not the visual size of the stem). Use the cluster-spread note given in prose in those four rows instead.
- Shape values are constrained to exactly 8 categories: `peony`, `dahlia`, `ranun`, `tulip`, `umbel`, `spray`, `leaf`, `spike`.

## Role balance (target: ~9/9/9/8, total 35)

- focal: 9 (Peonía, Dalia, Rosa inglesa, Gerbera, Girasol, Lirio oriental, Amarilis, Protea, Orquídea cymbidium)
- secondary: 9 (Ranúnculo, Tulipán, Anémona, Alstroemeria, Clavel, Fresia, Lisianthus, Iris holandés, Zinnia)
- filler: 9 (Flor de cera, Paniculata, Aciano, Limonium, Solidago, Craspedia, Astilbe, Ammi majus, Genista/Retama)
- green: 8 (Eucalipto, Rusco, Cola de conejo, Helecho cuero, Salal, Pitosporo, Aspidistra, Espárrago plumoso)

Status key per species: **[REVISED]** = one of the 12 placeholder species needing corrected data. **[NEW]** = one of the 23 additions.

---

## FOCAL (9)

> Peonía is the **one species in the whole 35-species file with a genuine Dutch-auction (`NL-auction`) price citation** (via an AIPH/FloraCulture industry report summarizing Royal FloraHolland trading data) — everything else in this section is `US-wholesaler-USD`, converted at ≈0.92 EUR/USD, entry-tier bunch price ÷ stem count shown inline.

**peonia** — Peonía · *Paeonia lactiflora* · role focal [REVISED] · shape `peony` (exact match — this species literally defines the layered, rounded, densely-petalled reference form)
colorHex `#F2AFC7` (blush pink, e.g. 'Sarah Bernhardt') · lengthCm 50–60 (commercial wholesale grading) · headMm 80–160 (8–16cm, midpoint ~120mm typical) · wholesaleEUR **€0.52/stem is a whole-market season average across all grades/cultivars traded (weeks 18-27, 2022, Royal FloraHolland auction) — NOT a florist-grade figure**, since it blends in low-grade/bulk lots; priceBasis `NL-auction`, the one genuine Dutch-auction figure in this file, but treat it as a market-floor reference rather than "what a Madrid florist pays." The named-variety figure — 'Coral Sunset' at **€1.50/stem in 2022** (up from €0.80 in 2020) — is the closer proxy for florist-grade product and should be preferred for bouquet-cost purposes over the €0.52 average · seasonMonths [4,5,6,7,8] (peak trading weeks 18–27 ≈ early May–early July per Royal FloraHolland; field season broadly April–August with early/late cultivars — LOW CONFIDENCE on exact edge months beyond the cited weeks) · vaseDays 5–7 (up to 10–14 for modern hybrids cut at "marshmallow" bud stage) · dry **true** (LOW CONFIDENCE — general florist practice, no dedicated citation found)
priceSource: https://aiph.org/floraculture/news/peony-continues-its-rise-to-prominence/
botanySource: https://en.wikipedia.org/wiki/Paeonia_lactiflora · https://www.floraldesigninstitute.com/blogs/resources-flower-library/peony

**dalia** — Dalia · *Dahlia pinnata* · role focal [REVISED] · shape `dahlia` (exact/native match)
colorHex `#E63979` (vivid magenta-pink, iconic decorative/pompom color) · lengthCm 40–55 (sources disagree: 35-40cm per one supplier, 50-63cm per American Dahlia Society for top cutting varieties — reporting the overlapping middle) · headMm 64–127 (up to 150mm+ for "dinnerplate" types) · wholesaleEUR ≈€4.31/stem ($468/100-stem box ÷ 100 × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [5,6,7,8,9,10] (May–October, genuinely seasonal field crop) · vaseDays 3–5 (7–12 for select long-lasting varieties) · dry **false** (soft/moist petals generally poor drying candidates)
priceSource: https://www.bloomsbythebox.com/wholesale-dahlias-flowers/assorted-dahlias-10-bunch-10-stem-box_7696/
botanySource: https://www.dahlia.org/growing/the-dahlia-as-a-cut-flower-2/ · https://www.gardenia.net/guide/best-dahlias-for-cutting

**rosa-inglesa** — Rosa inglesa (English/David Austin-type garden rose) · *Rosa × centifolia* · role focal [REVISED] · shape `peony` (David Austin-type garden roses are specifically bred for a dense, quartered, layered rosette nearly identical in structure to peonies — this is their defining trait vs. hybrid-tea roses, and a better fit than the smaller-cup `ranun`)
**Binomial mismatch flagged per methodology note above** — *Rosa × centifolia* is historically the Provence/cabbage rose, not modern David Austin hybrids (no clean single binomial exists for these; they're sold as `Rosa` cultivars). Label/role kept as specified by the brief.
colorHex `#F4C6D6` (soft blush pink, e.g. 'Constance Spry'/'Olivia Rose Austin') · lengthCm 38–50 (15-20") · headMm 70–120 (cultivar-specific: 'Constance Spry' ~100mm, 'Sophy's Rose' ~120mm, 'Carding Mill' ~70mm) · wholesaleEUR ≈€8.43/stem ($219.99/24-stem case ÷ 24 × 0.92; priceBasis `US-wholesaler-USD` — notably the priciest stem in the whole catalog, consistent with garden roses' premium positioning) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (year-round via equatorial greenhouse production, Colombia/Ecuador) · vaseDays 5–10 (minimum 5, premium varieties to ~10) · dry **true** (LOW CONFIDENCE — general floristry knowledge, not independently re-confirmed for garden-rose type specifically)
priceSource: https://fiftyflowers.com/products/assorted-david-austin-garden-roses
botanySource: https://www.gardenia.net/guide/david-austin-roses-bringing-english-garden-charm-to-your-home · https://dailyflowermarket.com/blogs/blog/the-secret-behind-ecuador-s-perfect-roses-nature-s-ideal-greenhouse

**gerbera** — Gerbera · *Gerbera jamesonii* · role focal [NEW] · shape `dahlia` (flat single ring of radiating ray-petals around a disc — a starburst pattern, the closest of the 8 categories to a true composite daisy form)
colorHex `#F4661B` (vivid orange) · lengthCm 45–61 (18-24"; MEDIUM CONFIDENCE — no single page directly fetched successfully, composite of wholesale listings) · headMm 70–100 (mixed figures 76-100mm across sources) · wholesaleEUR ≈€4.13/stem (standard size, $4.36–4.62/stem × 0.92; priceBasis `US-wholesaler-USD`; mini variety runs lower, ≈€2.61–2.77/stem) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (year-round via greenhouse cultivation) · vaseDays 8–10 (minimum 5) · dry **true** (listed among flowers suitable for air-drying)
priceSource: https://www.bloomsbythebox.com/gerbera-daisy-flowers/
botanySource: https://www.rhs.org.uk/plants/gerbera/growing-guide (general growing guide, not a dedicated commercial spec sheet)

**girasol** — Girasol (sunflower) · *Helianthus annuus* · role focal [NEW] · shape `dahlia` (flat radiating ray-petal disc, differing from gerbera mainly by its large dark central disc)
colorHex `#FFC72C` (bright golden yellow with dark center) · lengthCm ~61 typical (24" is the wholesale grading floor/minimum, cited as the typical commercial figure) · headMm 75–250 depending on grade (small/bunching type 75-150mm, large single-stem up to 180-250mm, medium wholesale grade ≈127mm) · wholesaleEUR ≈€0.73/stem ($3.95/bunch of 5 stems ÷ 5 × 0.92, entry tier; priceBasis `US-wholesaler-USD`; general market range cited $0.50-3/stem depending on grade) · seasonMonths **[6,7,8,9,10]** — **documented override**: the source material markets sunflowers as "available almost year-round via import/greenhouse," but that reflects import availability, not Spain/Northern-Hemisphere field season. Natural field bloom is June–October (peak mid-July–August in NW Europe, from June in Spain/S. Europe per Euroflorist/Verbeek & Bol growing-season sources); using the field season here since it's more representative of a Madrid seasonality model, with import extending it noted explicitly rather than silently adopted · vaseDays ~8 average, up to 14 for single-stem sunflowers; positively correlated with stem length (5 days @ 50cm vs 9 days @ 70cm per a postharvest study) · dry **true** (classic whole-flower drying subject)
priceSource: https://fiftyflowers.com/collections/sunflowers
botanySource: https://www.harrisseeds.com/blogs/from-the-ground-up/complete-sunflower-sales-guide · https://www.sciencedirect.com/org/science/article/abs/pii/S0008422023000052

**lirio-oriental** — Lirio oriental · *Lilium* (Oriental hybrid, e.g. 'Casablanca') · role focal [NEW] · shape `dahlia` (fully open Oriental lily has 6 broad recurved tepals radiating from center in a star pattern; the closed-cup `tulip` shape does not fit an open bloom)
colorHex `#FFFFFF` (pure white — 'Casablanca' is the archetypal white Oriental lily) · lengthCm 50–61 (20-24") · headMm 150–200 (one outlier source claimed 254-305mm/"10-12 inches," flagged as likely erroneous and not used) · wholesaleEUR ≈€7.36/stem ($159.99/20-stem case ÷ 20 × 0.92, entry tier; priceBasis `US-wholesaler-USD`; bulk 100-stem pricing runs lower, ≈€4.10/stem) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (genuinely a global greenhouse/forced-bulb commodity year-round, unlike the true seasonal species in this set) · vaseDays 8–14 (minimum 8, commonly 10-14) · dry **LOW CONFIDENCE / false pending better source** — not confirmed either way
priceSource: https://fiftyflowers.com/products/white-oriental-lilies
botanySource: https://fiftyflowers.com/products/white-oriental-lilies · https://www.dutchbulbs.com/products/_casa_blanca_oriental_lily

**amarilis** — Amarilis (amaryllis) · *Hippeastrum hybridum* · role focal [NEW] · shape `umbel` (2–4 large trumpet flowers arranged umbellately atop a single leafless stalk — a genuine umbel structure, best fit of the 8)
colorHex `#C8102E` (classic deep red, dominant commercial/Christmas-season color) · lengthCm 45–70 (LOW-MODERATE CONFIDENCE — no fixed commercial figure found, only that stems are "very long and can be cut to fit") · headMm 100–250 depending on type (standard singles ~100-150mm, giant "Double Flowering" types up to 200-250mm) · wholesaleEUR priceBasis `no-source` (LOW CONFIDENCE) — a $7–15/stem (≈€6.44–13.80/stem) figure exists in a general consumer-facing pricing article, but that is NOT a dedicated wholesale-supplier citation; no FiftyFlowers/Blooms By The Box per-stem number was successfully retrieved despite attempts, so this range is reported only as a weak directional signal, not a sourced wholesale price · seasonMonths [10,11,12,1,2,3,4] (October–April, forced-bulb winter/Christmas-season commodity — sources slightly disagree on the exact tail end, Mar vs Apr) · vaseDays **wide spread, MEDIUM CONFIDENCE**: ~5 days per one source, up to 10-14 days/"three weeks" per others · dry **false** (moist/fleshy stem, generally unsuitable for drying)
priceSource: no confident dedicated wholesale source found (see gap above) — recommend re-checking Mayesh/FiftyFlowers amaryllis product pages directly
botanySource: https://fiftyflowers.com/collections/amaryllis · https://plantura.garden/uk/flowers-perennials/amaryllis/amaryllis-cut-flowers

**protea** — Protea (king protea) · *Protea cynaroides* · role focal [NEW] · shape `peony` (dense, overlapping, pointed bracts form a large rounded/layered crown — closer to `peony`'s layered-rounded definition than any sharper starburst category)
colorHex `#D96C93` (pink, most iconic king protea color) · lengthCm 25–40 (10-16") · headMm 120–180 (LOW CONFIDENCE — one source claimed "10-12 inches"/254-305mm, flagged as implausibly large for a single stem and not used) · wholesaleEUR **wide spread reported**: ≈€34.50/stem ($374.99/10-stem case ÷ 10 × 0.92, entry tier) vs. a second source citing ≈€15.63/stem ($16.99/stem × 0.92) — both `US-wholesaler-USD`, genuine supplier variance not reconciled to a single number · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] ("available year-round" per supplier — plausible since protea is a South Africa/Australia import exotic not grown in Spain, so import availability genuinely is the relevant Madrid-market season here, unlike Spain-grown field species) · vaseDays 7–20+ (minimum 7, commonly 10-20+; protea is renowned for exceptional vase life) · dry **true** (one of the best-known "everlasting"/dried flowers; MEDIUM-HIGH CONFIDENCE, general floristry knowledge not independently re-cited this pass)
priceSource: https://fiftyflowers.com/products/king-protea-flower
botanySource: https://fiftyflowers.com/products/king-protea-flower

**orquidea-cymbidium** — Orquídea cymbidium · *Cymbidium hybridum* · role focal [NEW] · shape `spike` (many individual flowers along a tall arching raceme — a textbook match for vertical spike/plume)
colorHex `#A9C25D` (green, one of cymbidium's most iconic/distinctive commercial colors, widely used in corsages) · lengthCm 41–61 (16-24") · headMm 50–100 per individual flower (6-12 blooms per stem) · wholesaleEUR ≈€36.75/stem ($39.95/stem × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [10,11,12,1,2,3,4,5] (October–May; cymbidiums require a cool-night/warm-day differential starting in autumn to trigger winter-spring flowering — genuinely seasonal, not year-round) · vaseDays 10–14 (up to 3-6 weeks under good/ethylene-protected conditions) · dry **LOW CONFIDENCE / false pending better source** — blooms are fleshy/waxy, not a standard category in general dried-flower guides encountered
priceSource: https://metroflowermarket.com/products/orchid-cymbidium-red-stem
botanySource: https://www.aos.org/orchid-care/care-sheets/cymbidium-culture-sheet · https://floralife.com/flowers/orchid-cymbidium/

## SECONDARY (9)

> Royal FloraHolland's per-species price-statistics tool is not publicly accessible (paywalled/member-only). One tulip figure surfaced during research (€0.10/flower, attributed to a general Aalsmeer-auction travel article) is inconsistent with every other price point found and is treated as unverified — not used as the headline figure. All `wholesaleEUR` below are `US-wholesaler-USD` (Blooms By The Box primarily), converted at ≈0.92 EUR/USD, entry-tier bunch price ÷ stem count shown inline.

**ranunculo** — Ranúnculo · *Ranunculus asiaticus* · role secondary [REVISED] · shape `ranun` (exact/native match — layered paper-thin ruffled petals are the archetype for this category)
colorHex `#F5A3B3` (soft coral-pink, most common commercial/wedding color) · lengthCm 25–30 (some sources cite a wider 20–36cm range) · headMm 25–50 (jumbo varieties up to 100mm) · wholesaleEUR ≈€4.10/stem ($42.51–46.87/10-stem bunch ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`; a separate general-wholesale search found lower figures of $1.90–3.00/stem, ≈€1.75–2.76, reported for contrast) · seasonMonths [1,2,3,4,5,11,12] (peak Jan–May; Almería, Spain greenhouse production plus Italian/Israeli imports extend into shoulder months — genuinely Spain-relevant sourcing) · vaseDays 5–7 (up to 10 reported) · dry **true** (confirmed suitable for silica-gel drying)
priceSource: https://www.bloomsbythebox.com/ranunculus-flowers/ranunculus-pink_1933/
botanySource: https://floristsreview.com/in-season-ranunculus/ · https://floralife.com/flowers/ranunculus/

**tulipan** — Tulipán · *Tulipa gesneriana* · role secondary [REVISED] · shape `tulip` (exact/native match)
colorHex `#E63946` (classic red, most iconic commercial color) · lengthCm 25–36 (10–14") · headMm 50–76 (some sources describe oversized varieties to 100–150mm — flagged conflict, not used as headline) · wholesaleEUR ≈€3.44/stem ($36.44–38.43/10-stem bunch ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`); a €0.10/flower Royal FloraHolland figure surfaced separately but is **flagged LOW CONFIDENCE / unverified** — inconsistent with all other pricing found, not used · seasonMonths [1,2,3,4,5,11,12] (explicitly "Jan–May and Nov–Dec" per supplier — genuinely seasonal, not year-round) · vaseDays 5–7 (up to 14 if harvested tight-budded) · dry **false** (high water content, does not dry well by standard methods)
priceSource: https://www.bloomsbythebox.com/tulip-flowers/tulip-red_7916/
botanySource: https://www.bloomsbythebox.com/tulip-flowers/tulip-red_7916/ · https://www.gardenia.net/guide/how-long-do-tulips-last

**anemona** — Anémona · *Anemone coronaria* · role secondary [REVISED] · shape `ranun` (**imperfect fit, flagged**: single flat-to-cupped bloom on a bare stem, but petals are smooth not ruffled and it lacks `ranun`'s layered density — closest available category, not a true native match; worth a design review)
colorHex `#D6293E` (classic poppy-red with dark center, archetypal De Caen coloring) · lengthCm 25–40 (10–16") · headMm 50–70 (some varieties to 127mm) · wholesaleEUR ≈€2.75/stem ($130–175.50/50-stem box ÷ 50 × 0.92, midpoint of white/green-eye and burgundy/pink variants; priceBasis `US-wholesaler-USD`) · seasonMonths [10,11,12,1,2,3,4,5] (florist-sourceable Oct–May, peak Nov–Apr — genuinely seasonal, not summer-available) · vaseDays 5–8 (**genuine source conflict**: one source states 2-3 weeks, another 3-5 days; reporting the commercially-realistic middle estimate, needs florist verification before treating as authoritative) · dry **true** (explicitly listed among flowers that dry well)
priceSource: https://www.bloomsbythebox.com/anemone-flowers/anemone-white-green-eye_7925/ · https://www.bloomsbythebox.com/anemone-flowers/anemone-burgundy_7921/
botanySource: https://www.gardenia.net/genus/anemone-coronaria-poppy-anemone

**alstroemeria** — Alstroemeria (Peruvian lily) · *Alstroemeria hybrida* · role secondary [NEW] · shape `spray` (multiple small lily-like blooms on branching stems at varied heights, not flat-topped like a true umbel — alternate `umbel` mapping considered and rejected)
colorHex `#E8779C` (salmon-pink; commercial stock spans a very wide color range) · lengthCm 45–60 (a Blooms By The Box figure of 61–91cm is flagged as a likely outlier, possibly including foliage) · headMm 38–51 (up to 100mm reported elsewhere) · wholesaleEUR ≈€2.33/stem ($24.17–26.40/10-stem bunch ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (genuinely year-round via Colombia/Ecuador/Netherlands greenhouse commodity production, confirmed by multiple commercial sources — unlike the true seasonal bulbs in this set) · vaseDays 7–12 (up to 14-20 with proper processing) · dry **LOW CONFIDENCE / false pending better source** — no explicit confirmation found either way; thin petals not typically marketed as a drying flower
priceSource: https://www.bloomsbythebox.com/alstroemeria-flowers/alstroemeria-red_353/
botanySource: https://www.bloomsbythebox.com/alstroemeria-flowers/alstroemeria-red_353/ · https://www.trianglenursery.co.uk/flower-guides/alstromaria-guide

**clavel** — Clavel (carnation) · *Dianthus caryophyllus* · role secondary [NEW] · shape `ranun` (supplier-described "frilly, ruffled look" matches the compact-ruffled-cup category)
colorHex `#EC7FA9` (classic carnation pink) · lengthCm 46–61 (18-24"; broader grade range 30-91cm exists) · headMm 51–76 · wholesaleEUR ≈€1.27/stem ($1.29–1.47/stem, tiered by volume × 0.92; priceBasis `US-wholesaler-USD` — this is one of the more plausible figures in the file since carnation is a genuine cheap commodity flower even at true wholesale) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (confirmed year-round commodity availability) · vaseDays 8–10 (other general sources claim up to 2-3 weeks) · dry **true** ("outstanding cut or dried flower," also used in potpourri/sachets)
priceSource: https://www.bloomsbythebox.com/carnation-flowers/carnations-green-fancy_1850/
botanySource: https://www.bloomsbythebox.com/carnation-flowers/carnations-green-fancy_1850/ · https://pfaf.org/user/Plant.aspx?LatinName=Dianthus+caryophyllus

**fresia** — Fresia · *Freesia × hybrida* · role secondary [NEW] · shape `spike` (florets arranged along one side of an arching stem, classic raceme habit)
colorHex `#F6C445` (yellow, classic color alongside white/purple) · lengthCm 25–30 (10–12") · headMm 13–38 (individual floret) · wholesaleEUR ≈€3.30/stem ($33.35–38.43/10-stem bunch ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,10,11,12] (natural peak Jan–Mar with Apr–May tail; excluded peak summer despite one supplier's blanket year-round marketing claim, since the more specific seasonal source is more Spain-field-relevant) · vaseDays 7–10 (minimum 6 cited) · dry **true** (retains fragrance when dried)
priceSource: https://www.bloomsbythebox.com/freesia-flowers/freesia-white_35/
botanySource: https://avanote.net/when-is-freesia-in-season/ · https://www.bloomsbythebox.com/freesia-flowers/freesia-white_35/

**lisianthus** — Lisianthus · *Eustoma grandiflorum* · role secondary [NEW] · shape `peony` (double-form lisianthus, the dominant commercial type, is routinely marketed/compared as a "mini peony" — layered rounded structure)
colorHex `#B399D4` (lavender-purple, iconic alongside white) · lengthCm 41–51 (16-20") · headMm 25–51 · wholesaleEUR ≈€5.98/stem ($61.44–69.12/10-stem bunch ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`; an older extension-source figure of $1-1.50/stem is flagged as likely outdated/early-2000s data, not used) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (commercial greenhouse production genuinely dominates supply year-round, unlike true seasonal bulbs — a UK field-grown source notes a Nov-Mar alternate window, flagged as a minor conflict) · vaseDays 10–14 (one supplier states a more conservative 5-7 days — reporting the more widely corroborated figure) · dry **true** (explicitly marketed/confirmed for air-drying)
priceSource: https://www.bloomsbythebox.com/lisianthus-flowers/lisianthus-white_61/
botanySource: https://www.bloomsbythebox.com/lisianthus-flowers/lisianthus-white_61/ · https://www.calyxflowers.com/floral-library/lisianthus/

**iris-holandes** — Iris holandés (Dutch iris) · *Iris × hollandica* · role secondary [NEW] · shape `spike` (**imperfect fit, flagged**: iris is usually a single terminal bloom, not a true multi-flowered spike, but standard floral-design taxonomy groups Dutch iris as a "line flower" alongside gladiolus/liatris/delphinium — all mapping to `spike` in this 8-value schema; worth a design review)
colorHex `#4B4E9E` (classic Dutch-iris blue-purple, e.g. 'Blue Magic') · lengthCm 45–60 (18-24") · headMm **LOW CONFIDENCE / no source found** — no numeric bloom-diameter figure located; primary botanical source (Gardenia.net) returned HTTP 403 on direct fetch · wholesaleEUR ≈€1.95/stem (estimated: $21.14–22.65/bunch ÷ assumed 10 stems × 0.92 — **stem count per bunch was not confirmed by the source**, flagged as an estimate) · seasonMonths [1,2,3,4,5] (blooming window "early January into May" per growers; no strong evidence of greenhouse extension into summer/fall for cut-flower trade) · vaseDays 5–7 (source conflict: one states 3-7 days, another vaguely claims "well known for long vase life" with no number) · dry **LOW CONFIDENCE / false pending better source** — no source found either way
priceSource: https://www.bloomsbythebox.com/wholesale-iris-flowers/
botanySource: https://www.longfield-gardens.com/blogs/all-about-fall-planted-bulbs/all-about-dutch-iris

**zinnia** — Zinnia · *Zinnia elegans* · role secondary [NEW] · shape `dahlia` (fully double cultivars — Benary's Giant, Oklahoma, Queen series, the dominant cut-flower types — are routinely compared to dahlia pom-poms/starbursts in the trade)
colorHex `#E8552A` (vibrant orange-red, classic scarlet) · lengthCm 46–90 (a cited 100-127cm figure for Benary's Giant likely reflects overall plant height, not cut-stem length — excluded) · headMm 90–130 (Benary's Giant up to 150mm) · wholesaleEUR **weakest-sourced price in the file**: ≈€0.69–2.30/stem ($0.75–2.50/stem range across multiple small-farm listings × 0.92; priceBasis `US-wholesaler-USD`/farm-direct — zinnia is not a significant Dutch-auction commodity, being largely domestic/local field-grown, so no auction-equivalent figure exists at all) · seasonMonths [6,7,8,9,10] (Northern-Hemisphere summer through first frost — genuinely seasonal field annual, NOT greenhouse-forced) · vaseDays 7–12 at the "gritty stage" harvest (compact bedding types like Profusion/Zahara, not cut-flower grade, only manage 4-7 days) · dry **true** (dries in 2-3 weeks via hanging/silica gel, holds color ~1 year)
priceSource: https://shiftingroots.com/practical-guide-for-pricing-bouquets/ (general pricing-guide synthesis — no single canonical wholesale citation, flagged as the weakest price source in this file)
botanySource: https://extension.msstate.edu/publications/zinnias-zinnia-elegans-for-the-farmer-florist

## FILLER (9)

> No public Royal FloraHolland per-stem price was found for any of these 9 despite targeted searches — all `wholesaleEUR` figures are `US-wholesaler-USD` proxies (Blooms By The Box, FiftyFlowers, Florabundance), converted at ≈0.92 EUR/USD, entry-tier bunch price ÷ stem count shown inline. `headMm` for clustered/airy fillers reports **individual floret size**, not overall spray spread, except where noted.

**flor-de-cera** — Flor de cera · *Chamelaucium uncinatum* · role filler [REVISED] · shape `umbel` (explicitly the task's own umbel example species)
colorHex `#E8A6C4` (pink/magenta, most common commercial color alongside white) · lengthCm 41–66 (16–26") · headMm 6–13 (individual floret) · wholesaleEUR ≈€4.10/stem ($41.86–47.84/10-stem bunch ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,11,12] (LOW-MODERATE confidence — inferred from South Africa/Israel import blend Nov–May per Royal FloraHolland's "365 Days of Flowers" program; exact Spain-market months not independently confirmed) · vaseDays 7–10 (some sources claim up to 3 weeks, unconfirmed) · dry **true** (LOW CONFIDENCE single-source — general floristry consensus, no strong primary citation)
priceSource: https://www.bloomsbythebox.com/filler-flowers/wax-flower-white_102/
botanySource: https://www.flowershopnetwork.com/blog/flower-dictionary/waxflower/ · https://www.rhs.org.uk/plants/62627/chamelaucium-uncinatum/details

**paniculata** — Paniculata (baby's breath) · *Gypsophila paniculata* · role filler [REVISED] · shape `spray` (explicitly the task's own spray example species)
colorHex `#F9F7F2` (near-white, dominant commercial color) · lengthCm 38–63 (15–25") · headMm 3–10 (individual floret; overall spray spread is much larger, effectively the whole stem) · wholesaleEUR ≈€2.30/stem ($25.06–28.64/bunch of 8-13 stems ÷ ~10 × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (greenhouse-grown, genuinely year-round per supplier) · vaseDays 7–10 (one source states 5–7) · dry **true**
priceSource: https://www.bloomsbythebox.com/filler-flowers/gypsophila-xlence_7926/
botanySource: https://postharvest.ucdavis.edu/produce-facts-sheets/babys-breath-gypsophilia · https://floralife.com/flowers/gypsophila/

**aciano** — Aciano (cornflower) · *Centaurea cyanus* · role filler [REVISED] · shape `dahlia` (frilly thistle-like starburst head, radiating narrow petals — closer to starburst than the smooth-cupped `ranun`)
colorHex `#6495ED` (classic "cornflower blue," the eponymous color) · lengthCm 25–30 (commercial short-stem product; one source lists a 50cm product — flagged conflict, primary figure is the shorter commercial norm) · headMm 30–50 · wholesaleEUR **conflicting figures reported, not reconciled**: €3.46/stem ($18.80/5-stem bunch ÷ 5 × 0.92) vs €1.66/stem ($180/100-stem pack ÷ 100 × 0.92) — both `US-wholesaler-USD`; genuine supplier variance, use the range €1.66–3.46/stem rather than a false-precision single number · seasonMonths [5,6,7,8,9] (field-grown, natural bloom June–August with shoulder months; NOT a greenhouse/import year-round flower) · vaseDays 4–5 (**LOW CONFIDENCE** — traced to an aggregated web-search synthesis, not a primary postharvest citation; re-verify before treating as authoritative) · dry **true**
priceSource: https://www.bloomsbythebox.com/assorted-flowers/cornflower-assorted-bulk_9343/ · https://petaldriven.com/products/cornflower-cyanus-blue-100-pack
botanySource: https://www.gardenia.net/plant/centaurea-cyanus-cornflower · https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid=277177

**limonium** — Limonium (statice) · *Limonium sinuatum* · role filler [NEW] · shape `spray`
colorHex `#8B7DC7` (purple/lavender, most iconic color; white/yellow/pink also common) · lengthCm 51–66 (20–26") · headMm **LOW CONFIDENCE** — individual florets only "a few mm," cluster spread ~15–30cm; no precise numeric source found · wholesaleEUR ≈€1.80/stem ($16.83–17.82/bunch of 8-10 stems ÷ 9 × 0.92; priceBasis `US-wholesaler-USD`; a 2022 Florabundance price list cites $8.50–12.50/bunch but is flagged as likely outdated) · seasonMonths [3,4,5,6,7,8] (natural field bloom late winter–summer; greenhouse/hormone-forced cultivation can extend toward year-round — flagging both rather than defaulting to [1..12]) · vaseDays 8 (indefinite if dried) · dry **true** ("one of the world's foremost everlasting flowers")
priceSource: https://www.bloomsbythebox.com/filler-flowers/limonium-misty-blue_1365/
botanySource: https://plants.ces.ncsu.edu/plants/limonium-sinuatum/ · https://en.jardineriaon.com/limonium-sinuatum.html

**solidago** — Solidago (goldenrod) · *Solidago canadensis* · role filler [NEW] · shape `spike`
colorHex `#DAA520` (goldenrod yellow) · lengthCm 38–58 (15–23") · headMm **LOW CONFIDENCE** — individual florets a few mm, plume length ~5–15cm; no precise numeric source found · wholesaleEUR ≈€1.30/stem ($13.30–15.20/bunch of 10 ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [6,7,8,9,10] (wild/field bloom July–October) · vaseDays 7–14 (commonly cited minimum 8) · dry **true** (well-documented hang-dry method)
priceSource: https://www.bloomsbythebox.com/filler-flowers/solidago_7622/
botanySource: https://floralife.com/flowers/solidago/

**craspedia** — Craspedia (billy balls) · *Craspedia globosa* · role filler [NEW] · shape `dahlia` (perfect spherical pom-pom on a bare stem — florist trade universally calls it a "pom-pom"/"drumstick" flower, matching the shape spec's own pom-pom example)
colorHex `#F4C430` (saffron/golden yellow, near-universal commercial color) · lengthCm 36–51 (14–20") · headMm ~25 (standard; "jumbo" variety reported up to ~50mm) · wholesaleEUR ≈€2.30/stem ($24.65–25.50/bunch of 10 ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`; a 2020 Florabundance price of $8.50/10-stem bunch was found but flagged as likely outdated, not used as headline) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (year-round per supplier) · vaseDays 7–10 (some sources claim 10+) · dry **true** (one of the best-known drying fillers)
priceSource: https://www.bloomsbythebox.com/novelty-flowers/craspedi_16/
botanySource: https://florabundance.com/flowers/craspedia/ · https://farmerbailey.com/pages/craspedia-growing-guide

**astilbe** — Astilbe · *Astilbe × arendsii* · role filler [NEW] · shape `spike` (consistently described as a "feathery plume")
colorHex `#E091B0` (soft pink, most commonly available color alongside white/red) · lengthCm ~38 (15" — notably shorter than most fillers in this set) · headMm **LOW CONFIDENCE** — individual florets tiny, plume itself ~10–20cm; no precise numeric floret source found · wholesaleEUR ≈€2.76/stem ($30.16–31.20/bunch of 10 ÷ 10 × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [5,6,7,8,9,10] (May–October) · vaseDays 5–7 (minimum 5 cited) · dry **true** ("very easy to dry," hang or screen-dry)
priceSource: https://www.bloomsbythebox.com/novelty-flowers/astilbe-pink_2/
botanySource: https://www.floraldesigninstitute.com/blogs/resources-flower-library/astilbe · https://fiftyflowers.com/products/assorted-astilbe-flower-may-to-october

**ammi-majus** — Ammi majus (bishop's flower) · *Ammi majus* · role filler [NEW] · shape `umbel` (flat-topped compound umbel of tiny white flowers — the task's own named "Queen Anne's lace type" example)
colorHex `#FAF8F2` (white; species is essentially always white) · lengthCm up to 90–120 (plant height figure — MODERATE confidence only, not confirmed as the specific commercial cut-stem length) · headMm 75–100 (moderate confidence — two conflicting figures found, 75mm vs. 100–150mm; using the lower/overlapping range) · wholesaleEUR ≈€2.85/stem ($154.99/5 bunches of 10 stems = $154.99÷50 = $3.10/stem × 0.92; priceBasis `US-wholesaler-USD`) · seasonMonths [5,6,7,8] (true Northern-Hemisphere field season is summer; marketed by some US suppliers as year-round via greenhouse/import — flagging that distinction explicitly rather than defaulting to [1..12], per the same reasoning applied to other field-grown annuals in this catalog) · vaseDays 7–10 (minimum 5 per one supplier) · dry **true** (explicitly one of the few Umbelliferae that dries well)
priceSource: https://fiftyflowers.com/products/queen-annes-lace-filler-flower
botanySource: https://plants.ces.ncsu.edu/plants/ammi-majus/

**genista** — Genista / Retama (broom) · *Genista* sp. / *Cytisus scoparius* · role filler [NEW] · shape `spray` (small pea-shaped flowers densely arranged along multiple airy branching laterals, not a single flat-topped disc)
colorHex `#F7D842` (bright yellow, dominant classic color; white/pink cultivars exist) · lengthCm ~41 (16"; a dried variant lists 58-64cm, longer, not used as the fresh headline figure) · headMm **LOW CONFIDENCE** — individual florets ~10–15mm pea-flower size, overall spray spread is the meaningful visual unit; no precise source found · wholesaleEUR **no confident fresh-stem figure found** (priceBasis `no-source` — the only price located, $84.99/5-8-stem bunch at FiftyFlowers, is for a **dried** product and must not be used as a fresh proxy; a UK trade listing at Triangle Nursery returned HTTP 403 and could not be confirmed) · seasonMonths [12,1,2,3] (Dutch/import-driven winter-wedding-season availability) · vaseDays 7–10 (minimum 5 per one source) · dry **true** (sold as a dedicated dried product line)
priceSource: no confident fresh-stem source found (see gap above); dried reference only: https://fiftyflowers.com/products/white-broom-bloom
botanySource: https://www.flowershopnetwork.com/blog/flower-dictionary/genista/ · https://www.calyxflowers.com/floral-library/broom/

## GREEN (8)

> Royal FloraHolland's per-stem price tool requires a registered supplier/buyer account (confirmed at https://www.royalfloraholland.com/en/supplying-3/marketplace/becoming-a-supplier/step-by-step-plan-for-suppliers/price-information) — no public per-stem NL-auction figure exists for any of these 8. All prices below are `US-wholesaler-USD` converted at ≈0.92 EUR/USD, normalized to per-stem with the bunch division shown. `headMm` (stem/frond spread) is LOW CONFIDENCE for all 8 — no source publishes a spread-in-mm metric; values are estimates from product-photo/qualitative descriptions, flagged individually.

**eucalipto** — Eucalipto · *Eucalyptus cinerea* · role green [REVISED] · shape `leaf`
colorHex `#8FA89C` (estimate from RHS "glaucous, greyish-blue" description) · lengthCm 38–64 (15–25") · headMm ~120–180 (LOW CONFIDENCE estimate) · wholesaleEUR ≈€3.20/stem (€29–32/bunch of 8-10 ÷ stems; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (year-round, evergreen/greenhouse) · vaseDays 7–10 (up to 10-12 per some sources) · dry **true**
priceSource: https://www.bloomsbythebox.com/greenery/eucalyptus-silver-dollar_110/ · https://fiftyflowers.com/collections/eucalyptus
botanySource: https://www.rhs.org.uk/plants/19957/eucalyptus-cinerea/details · https://www.steengreens.com/blog/eucalyptus-cinerea

**rusco** — Rusco · *Ruscus hypophyllum* · role green [REVISED] · shape `leaf`
colorHex `#2F5233` (estimate) · lengthCm ~60 (Israeli ruscus, 60cm stems as sold) · headMm ~40–60 (LOW CONFIDENCE estimate) · wholesaleEUR ≈€0.55/stem ($5.99/bunch of 10 stems ÷ 10 = $0.60/stem × 0.92; priceBasis `US-wholesaler-USD`; note: Italian ruscus/*R. aculeatus* runs far higher, ≈€3.75-4.00/stem — different species/product, reported for contrast only, not used as the headline figure since the app's Latin binomial is *R. hypophyllum*) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (year-round) · vaseDays 21–30 (Israeli *R. hypophyllum* specifically has notably longer vase life than Italian *R. aculeatus*, which runs only 7-10 days — do not conflate the two) · dry **true**
priceSource: https://flowerwholesale.com/israeli-ruscus-60cm/ · (Italian ruscus for contrast: https://www.bloomsbythebox.com/greenery/italian-ruscus-green_129/)
botanySource: https://www.steengreens.com/blog/ruscus-hypophyllum · https://www.rhs.org.uk/plants/137018/ruscus-hypophyllum/details

**cola-de-conejo** — Cola de conejo · *Lagurus ovatus* · role green [REVISED] · shape `spike` (confirmed: fluffy plume/spike inflorescence on a straight stem, not a flat leaf — matches the spec's explicit "bunny tail type" spike example)
colorHex `#D9CBB8` (pale ivory/blush-green, estimate — heads fade from chartreuse to blush-ivory per Epic Gardening) · lengthCm ~45 (LOW-MODERATE confidence, dried-stem figure; plant grows to ~61cm) · headMm ~15–25 (LOW CONFIDENCE, no explicit source, horticultural-knowledge estimate — flag for verification) · wholesaleEUR **no confident fresh figure found** (priceBasis `no-source`; dried retail-consumer prices exist but are not a wholesale-fresh proxy, not used) · seasonMonths [4,5,6,7,8,9,10] (genuinely seasonal field crop — the one non-year-round species in this group; do not treat as import-year-round) · vaseDays 10–14 · dry **true** (one of the most commonly dried florist grasses)
priceSource: https://florabundance.com/flowers/bunny-tail-grass/ (price not found on page, flagged)
botanySource: https://www.floraldesigninstitute.com/blogs/resources-flower-library/bunny-tail-grass · https://www.epicgardening.com/bunny-tails-grass/

**helecho-cuero** — Helecho cuero · *Rumohra adiantiformis* · role green [NEW] · shape `leaf`
colorHex `#1E3B24` (estimate) · lengthCm 41–51 (16–20") · headMm ~150–200 (LOW CONFIDENCE estimate) · wholesaleEUR ≈€1.25/stem (€14.50–15.50/bunch of 12 ÷ 12; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (year-round) · vaseDays 10–12 (range reported 7–21 across sources) · dry **true**
priceSource: https://www.bloomsbythebox.com/greenery/leather-leaf-fern_1070/
botanySource: https://www.floraldesigninstitute.com/blogs/resources-flower-library/leather-leaf-fern · https://www.rhs.org.uk/plants/21448/rumohra-adiantiformis/details

**salal** — Salal (Lemon leaf) · *Gaultheria shallon* · role green [NEW] · shape `leaf`
colorHex `#3A5F3A` (estimate) · lengthCm 41–51 (16–20") · headMm ~60–100 (LOW CONFIDENCE estimate) · wholesaleEUR ≈€1.15/stem (€22.30–24.20/bunch of 20 ÷ 20; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,9,10,11,12] — **flagged conflict**: commercial US supplier (BloomsByTheBox) lists year-round; a PNW-grower source states salal is not harvested June–August in its native wild-harvest supply chain. Used the more specific harvest-season figure here since the app targets real seasonality; if the catalog is modeling imported/greenhouse supply instead, [1..12] would be the source-consistent alternative — flagging the choice explicitly rather than silently picking one · vaseDays 10–12 (up to 21 decorative life per some sources) · dry **true**
priceSource: https://www.bloomsbythebox.com/greenery/lemon-leaf_990/
botanySource: https://www.floraldesigninstitute.com/blogs/resources-flower-library/salal-foliage · https://www.cfgreens.com/resources/hero-of-the-forest-floor

**pitosporo** — Pitosporo · *Pittosporum tenuifolium* · role green [NEW] · shape `leaf`
colorHex `#5C7A5C` (estimate) · lengthCm 18–23 (7–9", BloomsByTheBox) to 41–51 (16–20", FiftyFlowers sprays) — notable supplier variance, both reported · headMm ~80–120 (LOW CONFIDENCE estimate) · wholesaleEUR ≈€1.15/stem (€19.40–20.65/bunch of 15-20 ÷ midpoint 17.5; priceBasis `US-wholesaler-USD`) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (evergreen foliage cut year-round; flowering itself is late spring/early summer but that's not the cut product) · vaseDays 10–12 (min. 8 per FiftyFlowers) · dry **LOW CONFIDENCE / false pending better source** — no source confirmed drying suitability; typically used fresh
priceSource: https://www.bloomsbythebox.com/greenery/pittosporum_7649/ · https://fiftyflowers.com/products/pittosporum-greenery
botanySource: https://www.rhs.org.uk/plants/pittosporum/growing-guide

**aspidistra** — Aspidistra · *Aspidistra elatior* · role green [NEW] · shape `leaf`
colorHex `#1F4020` (estimate) · lengthCm 46–71 (18–28", FiftyFlowers; RHS confirms leaves reach up to 60cm) · headMm 100–150 (4–6" per FiftyFlowers — best-sourced spread figure of the 8 green species) · wholesaleEUR ≈€2.76/stem entry tier ($149.99 for the 5-bunch tier ÷ 5 bunches ÷ 10 leaves/bunch = $3.00/leaf × 0.92; priceBasis `US-wholesaler-USD`; bulk 30-bunch tier runs far lower, $244.99 ÷ 30 ÷ 10 = $0.82/leaf ≈ €0.75/stem — using the entry tier per the header convention, but flagging the ~4x spread between tiers as unusually wide for this file) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (evergreen, year-round) · vaseDays 8–16 (8 minimum per FiftyFlowers, up to 16 per other sources) · dry **true**
priceSource: https://fiftyflowers.com/products/aspidistra-leaf-greenery
botanySource: https://www.rhs.org.uk/plants/1715/aspidistra-elatior/details

**esparrago-plumoso** — Espárrago plumoso · *Asparagus setaceus* · role green [NEW] · shape `spray` (**editorial call, flagged**: research agent hedged between `spike` and `spray`; chosen `spray` because the fronds branch airily off wiry stems rather than forming one vertical plume like *Lagurus* — closer to "airy branching" than "vertical spike." Catalog owner should confirm against how the shape renderer visually distinguishes the two.)
colorHex `#3E6B4A` (estimate) · lengthCm ~61 (24", grower's bunch) · headMm ~150–250 (LOW CONFIDENCE estimate, "lacy branches" descriptions only) · wholesaleEUR **no confident figure found** — product listed at Florabundance/BloomsByTheBox but no price surfaced in fetches (priceBasis `no-source`, not invented) · seasonMonths [1,2,3,4,5,6,7,8,9,10,11,12] (year-round per source) · vaseDays ~14 (moderate confidence, search-synthesis not a single directly-fetched page) · dry **true**
priceSource: no confident source found (see gap above)
botanySource: https://florabundance.com/flowers/plumosa/ · https://www.floraldesigninstitute.com/blogs/resources-flower-library/asparagus-fern

---

## Open gaps / low-confidence flags (full list)

**No wholesale price found at all (`priceBasis: no-source`)** — do not fabricate, needs dedicated follow-up:
- `genista` — only a dried-product price was found; no fresh-stem figure
- `esparrago-plumoso` — product listed at two suppliers, no price surfaced in either fetch
- `cola-de-conejo` — fresh (non-dried) wholesale price not found
- `amarilis` — no dedicated wholesale-supplier page retrieved; the $7-15/stem figure is from a consumer pricing article, not a wholesale source

**Wholesale price found but with unreconciled wide spread or conflict:**
- `aciano` — €1.66/stem vs €3.46/stem across two suppliers, not reconciled to one number
- `protea` — €15.63/stem vs €34.50/stem across two suppliers, not reconciled
- `tulipan` — a €0.10/flower Royal FloraHolland figure surfaced but is inconsistent with all other pricing and was excluded as unverified
- `aspidistra` — ~4x spread between entry and bulk pricing tiers (wider than typical for this file)
- `iris-holandes` — price is an estimate; source bunch's stem count was not confirmed

**`headMm` LOW CONFIDENCE (no numeric spread/floret source found, estimated from qualitative descriptions or product photos):**
`eucalipto`, `rusco`, `cola-de-conejo`, `helecho-cuero`, `salal`, `pitosporo`, `esparrago-plumoso` (all green role — foliage "spread" isn't a published metric), plus `limonium`, `solidago`, `astilbe`, `genista` (filler role — individual floret size not published), plus `iris-holandes` (no source found at all), `ammi-majus` (moderate confidence, two conflicting figures 75mm vs 100-150mm), `lirio-oriental` and `protea` (each had one implausible outlier figure ~250-300mm that was identified and excluded in favor of a more plausible alternate)

**`vaseDays` genuine source conflicts, not fully resolved:**
- `anemona` — 3-5 days vs 2-3 weeks; reported 5-8 days as a compromise, needs florist verification
- `lisianthus` — 5-7 days (supplier) vs 10-14 days (multiple other sources); used the more corroborated figure
- `aciano` — single aggregated web-search synthesis, not a primary postharvest citation

**`dry` defaulted to `false` pending better sourcing (not confirmed either way):**
`alstroemeria`, `iris-holandes`, `lirio-oriental`, `orquidea-cymbidium`, `pitosporo`

**`dry` = `true` but only LOW-CONFIDENCE / general-knowledge sourcing (no dedicated citation found):**
`peonia`, `rosa-inglesa`, `flor-de-cera`

**`seasonMonths` documented overrides (import/greenhouse-marketing claim vs. field season used instead):**
- `girasol` — supplier claims near-year-round; field season [6,7,8,9,10] used instead (see inline note)
- `ammi-majus` — supplier claims year-round; field season [5,6,7,8] used instead (see inline note)
- `limonium` — natural field season used ([3-8]) rather than the greenhouse-extended claim, both noted inline
- `salal` — flagged both ways (commercial year-round vs. PNW June-Aug harvest gap), not resolved to one answer — catalog owner should pick based on which supply chain the app models

**Shape mapping is an imperfect/editorial fit, flagged for design review (not a native match to any of the 8 categories):**
- `anemona` → `ranun` (closest available, not a true match — smooth petals, not ruffled)
- `iris-holandes` → `spike` (closest available via "line flower" floral-design convention, not a literal multi-bloom spike)
- `esparrago-plumoso` → `spray` (compiler's editorial call over the research agent's `spike`/`spray` hedge; `leaf` is the safer fallback if the shape renderer draws blooms along `spray` branches)
- `alstroemeria` → `spray` (an alternate `umbel` mapping was considered and rejected)

**Binomial/naming caveat:**
- `rosa-inglesa` — *Rosa × centifolia* is technically the Provence/cabbage rose, not modern David Austin-type English roses (no clean single binomial exists for these). Label and role kept as specified by the brief; flagged rather than silently fixed.

**Systemic caveats (apply file-wide, not per-species):**
- `colorHex` is always a compiler estimate from qualitative color descriptions — no source publishes hex codes for any of the 35 species.
- US-wholesaler prices (the large majority of `wholesaleEUR` values in this file) are believed to run well above true Dutch-auction/Madrid wholesale cost, especially for greenery (plausibly 3-5x) — treat as relative ordering between species, not absolute Madrid input cost, until real Mercamadrid or NL-auction figures are available. `peonia` is the sole exception with a genuine `NL-auction` citation.
- USD→EUR conversion throughout uses an approximate, undated ≈0.92 rate — order-of-magnitude only, not a specific FX snapshot.

---

## Final counts

- **Total species: 35** (12 revised + 23 new)
- **Role balance:** focal 9 · secondary 9 · filler 9 · green 8 (target 9/9/9/8, met)
- **IDs (unique, ascii, kebab-case):** peonia, dalia, rosa-inglesa, gerbera, girasol, lirio-oriental, amarilis, protea, orquidea-cymbidium, ranunculo, tulipan, anemona, alstroemeria, clavel, fresia, lisianthus, iris-holandes, zinnia, flor-de-cera, paniculata, aciano, limonium, solidago, craspedia, astilbe, ammi-majus, genista, eucalipto, rusco, cola-de-conejo, helecho-cuero, salal, pitosporo, aspidistra, esparrago-plumoso
- **Shape usage across all 35** (recounted directly from the rows above): peony ×4 (peonia, rosa-inglesa, protea, lisianthus), dahlia ×7 (dalia, gerbera, girasol, lirio-oriental, zinnia, aciano, craspedia), ranun ×3 (ranunculo, anemona, clavel), tulip ×1 (tulipan), umbel ×3 (amarilis, flor-de-cera, ammi-majus), spray ×5 (alstroemeria, paniculata, limonium, genista, esparrago-plumoso), leaf ×6 (eucalipto, rusco, helecho-cuero, salal, pitosporo, aspidistra), spike ×6 (orquidea-cymbidium, fresia, iris-holandes, solidago, astilbe, cola-de-conejo) — sums to 35; shape balance was not a requirement, only the 8-category constraint, which is satisfied and no 9th category was invented anywhere
