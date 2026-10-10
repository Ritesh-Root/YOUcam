/*
 * Local trend snapshot. Each trend lists the dated public sources it comes
 * from, and maps to something YouCam can render: a cloth template ID (checked
 * against GET /s2s/v2.0/task/template/cloth on 2026-10-10) or makeup-vto
 * effects. Collected by hand on 2026-10-10. Refresh this file, or set
 * YOUTUBE_API_KEY for live creator signals alongside it.
 */

import type { Json } from '../youcam'
import { blushEffect, linerEffect, lipEffect, shadowEffect } from '../stylist/features'

export const SNAPSHOT_DATE = '2026-10-10'

export type Region = 'IN' | 'NG' | 'AE' | 'GB' | 'US' | 'KR'

export type City = {
  id: string
  name: string
  region: Region
  country: string
  lat: number
  lon: number
}

export const CITIES: City[] = [
  { id: 'mumbai', name: 'Mumbai', region: 'IN', country: 'India', lat: 19.076, lon: 72.8777 },
  { id: 'delhi', name: 'Delhi', region: 'IN', country: 'India', lat: 28.6139, lon: 77.209 },
  { id: 'bengaluru', name: 'Bengaluru', region: 'IN', country: 'India', lat: 12.9716, lon: 77.5946 },
  { id: 'lagos', name: 'Lagos', region: 'NG', country: 'Nigeria', lat: 6.5244, lon: 3.3792 },
  { id: 'dubai', name: 'Dubai', region: 'AE', country: 'UAE', lat: 25.2048, lon: 55.2708 },
  { id: 'london', name: 'London', region: 'GB', country: 'UK', lat: 51.5072, lon: -0.1276 },
  { id: 'new-york', name: 'New York', region: 'US', country: 'USA', lat: 40.7128, lon: -74.006 },
  { id: 'seoul', name: 'Seoul', region: 'KR', country: 'South Korea', lat: 37.5665, lon: 126.978 },
]

export function cityById(id: string | undefined): City | undefined {
  return CITIES.find((c) => c.id === id)
}

export type Occasion = 'wedding' | 'festival' | 'party' | 'work' | 'date' | 'casual'
export type Coverage = 'minimal' | 'moderate' | 'modest'
export type Warmth = 'light' | 'medium' | 'warm'

/** date is ISO; omitted when the page shows no publication date. */
export type Source = { publisher: string; title: string; url: string; date?: string }

export type Trend = {
  id: string
  region: Region
  kind: 'outfit' | 'makeup'
  title: string
  summary: string
  for: 'women' | 'men' | 'all'
  occasions: Occasion[]
  colors: string[]
  /** How warm the look is to wear. Compared with the event-day forecast. */
  warmth: Warmth
  coverage: Coverage
  sources: Source[]
  /** What YouCam can render for this trend. */
  tryon: {
    cloth?: { templateId: string; title: string; note?: string }
    makeup?: { effects: Json[]; label: string }
    /** Shown when no template matches, so the user can try a product photo instead. */
    uploadHint?: string
  }
  /** Search phrase for "Shop similar". */
  shop: string
}

/* ------------------------------------------------------------------ *
 * Sources (all accessed 2026-10-10)
 * ------------------------------------------------------------------ */
const S = {
  lakshita: { publisher: 'Lakshita', title: 'Festive Fashion Trends 2026: 10 Ethnic Wear Trends', url: 'https://www.lakshita.com/blogs/the-lk-journal/festive-fashion-trends-2026-10-ethnic-wear-trends-to-know-this-season', date: '2026-10-05' },
  rashikaWhatsIn: { publisher: 'Rashika Mittal', title: "Indian Fashion Trends 2026: What's In", url: 'https://rashikamittal.com/blogs/journal/indian-fashion-trends-2026-whats-in' },
  rashikaWedding: { publisher: 'Rashika Mittal', title: 'Indian Wedding Fashion Trends 2026', url: 'https://rashikamittal.com/blogs/journal/indian-wedding-fashion-trends-2026-summer', date: '2026-05-19' },
  etNavratri: { publisher: 'Economic Times', title: 'Navratri 2026 Outfit Guide', url: 'https://m.economictimes.com/astrology/others/navratri-2026-outfit-guide-what-to-wear-for-garba-dandiya-puja-family-events/amp_articleshow/134737067.cms', date: '2026-10-06' },
  toiLipstick: { publisher: 'Times of India', title: '5 lipstick shades to pair with your chaniya choli this Navratri', url: 'https://timesofindia.indiatimes.com/life-style/beauty/5-lipstick-shades-to-pair-with-your-chaniya-choli-this-navratri/photostory/134789081.cms', date: '2026-10-08' },
  htFestiveBeauty: { publisher: 'Hindustan Times', title: 'Festive beauty trends 2026', url: 'https://www.hindustantimes.com/lifestyle/fashion/festive-beauty-trends-2026-expert-reveals-what-s-in-what-s-out-and-how-to-make-your-makeup-last-for-hours-101790317143184.html', date: '2026-09-25' },
  ebyAsoEbi: { publisher: 'Ebyfashion', title: '40 Beautiful Aso Ebi Styles for Weddings', url: 'https://www.ebyfashion.com.ng/2026/07/40-beautiful-aso-ebi-styles-for.html', date: '2026-07-22' },
  naijasabi: { publisher: 'Naijasabi', title: 'Latest Aso-Ebi Styles 2026', url: 'https://naijasabi.com.ng/latest-aso-ebi-styles-2026', date: '2026-05-03' },
  asoEbiLogistics: { publisher: 'Aso Ebi Logistics', title: 'Aso Ebi Styles 2026: Most Popular Outfits', url: 'https://asoebilogistic.com/guides/aso-ebi-styles' },
  auntysWardrobe: { publisher: "Aunty's Wardrobe", title: 'Nigerian Wedding Style Trends 2026', url: 'https://auntyswardrobe.com/wedding-trends-2026' },
  bellaNaija: { publisher: 'BellaNaija', title: 'Iyabo Ojo makes a case for turquoise and purple aso ebi', url: 'https://www.bellanaija.com/tag/aso-ebi' },
  marieClaireNg: { publisher: 'Marie Claire Nigeria', title: 'The world is getting into these Nigerian fashion and beauty trends', url: 'https://marieclaire.ng/the-world-is-getting-into-these-nigerian-fashion-and-beauty-trends', date: '2026-09-04' },
  mariamAbaya: { publisher: "Mariam's Collection", title: '2026 Abaya Fashion Trends', url: 'https://mariam-col.com/en-eu/blogs/abaya/2026-abaya-fashion-trends-the-styles-every-modest-fashion-lover-needs-to-know', date: '2026-06-10' },
  kabayare: { publisher: 'Kabayare', title: 'Modest Fashion Trends 2026', url: 'https://www.kabayarefashion.com/blogs/news/modest-fashion-trends-2026-what-to-wear-this-year', date: '2026-04-05' },
  couture365: { publisher: 'couture365', title: 'Dubai Abaya Fashion Trends', url: 'https://www.couture365.net/blogs/365-blog/dubai-abaya-fashion-trends-and-modern-abaya-styles', date: '2026-04-04' },
  meInsider: { publisher: 'The Middle East Insider', title: 'Beauty Standards Across the Arab World 2026', url: 'https://themiddleeastinsider.com/2026/05/28/beauty-standards-arab-world-2026-egypt-saudi-lebanon-uae', date: '2026-05-28' },
  wwwColours: { publisher: 'Who What Wear UK', title: '7 Colours to Add To Your Capsule Wardrobe in Autumn 2026', url: 'https://www.whowhatwear.com/fashion/trends/colourful-capsule-wardrobe-autumn-2026', date: '2026-09-29' },
  wwwAW26: { publisher: 'Who What Wear UK', title: '17 Autumn/Winter 2026 Trends', url: 'https://www.whowhatwear.com/fashion/trends/autumn-winter-2026-trends', date: '2026-08-30' },
  vogueUkLfw: { publisher: 'British Vogue', title: 'London Fashion Week street-style trends', url: 'https://www.vogue.co.uk/article/spring-summer-2027-street-style-trends', date: '2026-09-21' },
  glamourUk: { publisher: 'Glamour UK', title: 'The 6 autumn makeup trends to know', url: 'https://www.glamourmagazine.co.uk/article/autumn-makeup-trends', date: '2026-08-06' },
  velvet: { publisher: 'Velvet Magazine', title: "Autumn/winter's top makeup trends", url: 'https://www.velvetmag.co.uk/fashion-and-beauty/beauty-autumn-winter-s-top-makeup-trends-9481435', date: '2026-09-04' },
  asosColour: { publisher: 'ASOS', title: 'Colour Trend Predictions For 2026', url: 'https://www.asos.com/women/fashion-feed/2026_01_05-mon/colour-trends-2026', date: '2026-01-05' },
  wwwMicro: { publisher: 'Who What Wear', title: '6 Fall Micro-Trends', url: 'https://www.whowhatwear.com/fashion/fall/fall-2026-microtrends', date: '2026-09-26' },
  vogueWeddingGuest: { publisher: 'Vogue', title: '4 Fall Wedding Guest Dress Trends', url: 'https://www.vogue.com/article/top-wedding-guest-dress-trends', date: '2026-05-01' },
  wwwFall: { publisher: 'Who What Wear', title: '9 Fall 2026 Trends to Add to Your Wardrobe', url: 'https://www.whowhatwear.com/fashion/runway/fall-trend-shopping', date: '2026-05-03' },
  dressedNyfw: { publisher: 'Dressed for My Day', title: 'Fall 2026 Preview from New York Fashion Week', url: 'https://dressedformyday.com/fall-2026-preview-from-new-york-fashion-week', date: '2026-09-15' },
  zoeMakeup: { publisher: 'The Zoe Report', title: "Fall 2026's Top Makeup Trends", url: 'https://www.thezoereport.com/beauty/fall-2026-makeup-trends', date: '2026-08-27' },
  wwwMakeup: { publisher: 'Who What Wear', title: 'MUAs Say These 5 Makeup Trends Will Dominate Autumn 2026', url: 'https://www.whowhatwear.com/beauty/makeup/autumn-makeup-trends-2026', date: '2026-09-08' },
  koreaHerald: { publisher: 'The Korea Herald', title: 'Korean fashion turns to 2000s K-drama for inspo this fall', url: 'https://www.koreaherald.com/article/10882253', date: '2026-09-25' },
  kbeautyContent: { publisher: 'K-Beauty Content', title: 'Korean Makeup Trends Right Now', url: 'https://kbeautycontent.com/korean-makeup-trends', date: '2026-07-27' },
  nssKbeauty: { publisher: 'nss G-Club', title: 'K-beauty makeup trends 2026', url: 'https://www.nssgclub.com/en/beauty/44540/kbeauty-makeup-trends-2026', date: '2026-05-05' },
  dailyMailKbeauty: { publisher: 'Daily Mail', title: 'The hottest new trends in K-Beauty', url: 'https://www.dailymail.com/lifestyle/beauty/article-15869073/k-beauty-seoul-insider-guide-biggest-skincare-makeup-trends-2026.html', date: '2026-06-09' },
} satisfies Record<string, Source>

/* ------------------------------------------------------------------ *
 * Trends
 * ------------------------------------------------------------------ */
export const TRENDS: Trend[] = [
  /* ---------------- India: Mumbai, Delhi, Bengaluru ---------------- */
  {
    id: 'in-red-gold-festive', region: 'IN', kind: 'outfit', for: 'women',
    title: 'Red and gold for Navratri and Dussehra',
    summary: 'Sharad Navratri runs 11–19 October with Dussehra on the 20th. Colourful chaniya cholis lead garba nights; sarees and lehengas lead family events.',
    occasions: ['festival', 'wedding'], colors: ['#b3141f', '#d4a437'], warmth: 'medium', coverage: 'moderate',
    sources: [S.etNavratri, S.toiLipstick],
    tryon: { cloth: { templateId: 'elegant_saree_feminine_cultural_attire', title: 'Elegant Saree (red and gold)' } },
    shop: 'red gold festive saree',
  },
  {
    id: 'in-jewel-kurta-sets', region: 'IN', kind: 'outfit', for: 'all',
    title: 'Jewel-toned, embroidered kurta sets for Diwali',
    summary: 'Jewel tones, detailed embroidery and Chanderi or silk kurta sets are the go-to for Diwali and family functions this season.',
    occasions: ['festival', 'work', 'casual'], colors: ['#6b1d5e', '#0f5c4d', '#8c1c3a'], warmth: 'light', coverage: 'modest',
    sources: [S.lakshita],
    tryon: {
      cloth: { templateId: 'blush_gold_kurta_masculine_cultural_attire', title: 'Blush Gold Kurta (menswear)', note: 'YouCam has no women’s kurta-set template. Upload a product photo to try one on.' },
      uploadHint: 'Upload a kurta-set product photo to try it on.',
    },
    shop: 'embroidered kurta set jewel tone',
  },
  {
    id: 'in-ivory-champagne', region: 'IN', kind: 'outfit', for: 'all',
    title: 'Ivory and champagne at celebrations',
    summary: 'The old rule against white at Indian celebrations has gone. Ivory kurta sets, champagne sarees and off-white anarkalis with gold embroidery are everywhere.',
    occasions: ['wedding', 'festival', 'party'], colors: ['#f3ead8', '#d9c39a'], warmth: 'light', coverage: 'moderate',
    sources: [S.rashikaWhatsIn],
    tryon: { cloth: { templateId: 'gold_midi_dress_feminine_modern', title: 'Gold Midi Dress (champagne pleats)', note: 'For menswear, try Floral Suit (ivory embroidery).' } },
    shop: 'ivory champagne anarkali gold embroidery',
  },
  {
    id: 'in-ivory-menswear', region: 'IN', kind: 'outfit', for: 'men',
    title: 'Ivory embroidered menswear for receptions',
    summary: 'Ivory with gold embroidery has crossed over into menswear for weddings and receptions.',
    occasions: ['wedding', 'party'], colors: ['#f3ead8', '#c79a4a'], warmth: 'medium', coverage: 'modest',
    sources: [S.rashikaWhatsIn],
    tryon: { cloth: { templateId: 'floral_suit_masculine_urban_classic', title: 'Floral Suit (ivory, embroidered)' } },
    shop: 'ivory embroidered bandhgala men',
  },
  {
    id: 'in-sharara-guests', region: 'IN', kind: 'outfit', for: 'women',
    title: 'Sharara sets for wedding guests',
    summary: 'Sharara sets are the guest outfit of the 2026 wedding season, often in sunset and earth tones.',
    occasions: ['wedding', 'festival'], colors: ['#c4572e', '#e2a65b', '#7a3b2e'], warmth: 'light', coverage: 'modest',
    sources: [S.rashikaWedding],
    tryon: { uploadHint: 'YouCam has no sharara template. Upload a sharara product photo to try it on.' },
    shop: 'sharara set wedding guest',
  },
  {
    id: 'in-red-lip-garba', region: 'IN', kind: 'makeup', for: 'women',
    title: 'Classic red lip with simple eyes for garba',
    summary: 'Red stays the festive lip, matched to undertone: brick or orange-red for warm skin, blue-red for cool. Keep eyes simple with ethnic jewellery.',
    occasions: ['festival', 'wedding'], colors: ['#b3001b'], warmth: 'medium', coverage: 'moderate',
    sources: [S.toiLipstick],
    tryon: { makeup: { label: 'Red satin lip, thin liner', effects: [lipEffect('#b3001b', 'satin', 75), linerEffect('Upper1', '#1a1a1a', 70)] } },
    shop: 'red lipstick satin',
  },
  {
    id: 'in-mocha-photo-ready', region: 'IN', kind: 'makeup', for: 'women',
    title: 'Mocha lips and makeup that photographs well',
    summary: 'Festive makeup is moving from more to better: pick elements that suit your features and hold up in photos. Mocha brown is one of the season’s lip shades.',
    occasions: ['festival', 'party', 'date', 'work'], colors: ['#8a5a44'], warmth: 'medium', coverage: 'moderate',
    sources: [S.htFestiveBeauty, S.toiLipstick],
    tryon: { makeup: { label: 'Mocha satin lip, soft blush, winged liner', effects: [lipEffect('#8a5a44', 'satin', 70), blushEffect('#c97b63', 35), linerEffect('OpenWings1', '#2a1a14', 65)] } },
    shop: 'mocha brown lipstick',
  },

  /* ---------------- Nigeria: Lagos ---------------- */
  {
    id: 'ng-corset-trumpet', region: 'NG', kind: 'outfit', for: 'women',
    title: 'Corset-bodice mermaid gowns for aso-ebi',
    summary: 'Structured corset bodices and fitted mermaid or trumpet gowns are the most requested aso-ebi styles this year.',
    occasions: ['wedding', 'party'], colors: ['#1c1c1c', '#c0c0c0'], warmth: 'medium', coverage: 'moderate',
    sources: [S.ebyAsoEbi, S.naijasabi, S.asoEbiLogistics],
    tryon: { cloth: { templateId: 'gilded_onyx_feminine_modern', title: 'Gilded Onyx (embellished mermaid gown)', note: 'Use your aso-ebi fabric colour when you shop.' } },
    shop: 'aso ebi corset mermaid gown',
  },
  {
    id: 'ng-feather-emerald', region: 'NG', kind: 'outfit', for: 'women',
    title: 'Feather details in emerald and ivory',
    summary: 'Feathers on sleeves and hems are one of the most glamorous details at Lagos weddings, and forest emerald with ivory is the year’s regal palette.',
    occasions: ['wedding', 'party'], colors: ['#0f4d3a', '#f3ead8'], warmth: 'medium', coverage: 'moderate',
    sources: [S.ebyAsoEbi, S.auntysWardrobe],
    tryon: { cloth: { templateId: 'peacock_majesty_feminine_modern', title: 'Peacock Majesty (emerald feather gown)' } },
    shop: 'emerald feather lace gown',
  },
  {
    id: 'ng-blush-gold', region: 'NG', kind: 'outfit', for: 'women',
    title: 'Blush lace over gold',
    summary: 'Blush Swiss lace over gold sequin underlay is the defining look of Lagos high-society weddings in 2026.',
    occasions: ['wedding', 'party'], colors: ['#e8b4b8', '#c9a14a'], warmth: 'medium', coverage: 'moderate',
    sources: [S.auntysWardrobe],
    tryon: { cloth: { templateId: 'golden_glow_midi_feminine_modern', title: 'Golden Glow Midi (gold satin, long sleeves)' } },
    shop: 'blush swiss lace gold sequin',
  },
  {
    id: 'ng-turquoise-purple', region: 'NG', kind: 'outfit', for: 'women',
    title: 'Turquoise and purple pairings',
    summary: 'Rich turquoise lace with deep purple velvet made the case for bold two-colour aso-ebi.',
    occasions: ['wedding', 'party'], colors: ['#1aa7a1', '#4b1f5c'], warmth: 'medium', coverage: 'moderate',
    sources: [S.bellaNaija],
    tryon: { cloth: { templateId: 'royal_peony_feminine_modern', title: 'Royal Peony (purple and pink)' } },
    shop: 'purple velvet turquoise lace',
  },
  {
    id: 'ng-soft-glam', region: 'NG', kind: 'makeup', for: 'women',
    title: 'Soft glam with a gele, full glam for the evening',
    summary: 'Soft glam is the standard finish for aso-ebi looks, and full glam keeps coming back for evening events.',
    occasions: ['wedding', 'party', 'festival'], colors: ['#7b3f2e'], warmth: 'medium', coverage: 'moderate',
    sources: [S.ebyAsoEbi, S.marieClaireNg],
    tryon: { makeup: { label: 'Nude-brown satin lip, warm blush, winged liner', effects: [lipEffect('#7b3f2e', 'satin', 70), blushEffect('#b5583f', 40), linerEffect('OpenWings1', '#111111', 80), shadowEffect('#6b3e2a', 35)] } },
    shop: 'soft glam makeup nude brown lip',
  },
  {
    id: 'ng-agbada', region: 'NG', kind: 'outfit', for: 'men',
    title: 'Agbada, kaftan and senator sets in aso-ebi fabric',
    summary: 'The agbada remains the standard for grooms and groomsmen. Kaftan and senator sets are the lighter option for engagements.',
    occasions: ['wedding', 'party', 'festival'], colors: ['#f3ead8', '#1f3b73'], warmth: 'medium', coverage: 'modest',
    sources: [S.asoEbiLogistics],
    tryon: { uploadHint: 'YouCam has no agbada template. Upload an agbada or senator product photo to try it on.' },
    shop: 'agbada senator wear men',
  },

  /* ---------------- UAE: Dubai ---------------- */
  {
    id: 'ae-tonal-white-abaya', region: 'AE', kind: 'outfit', for: 'women',
    title: 'Tonal white and ivory abayas',
    summary: 'White, ivory and cream tonal abayas are leading modest-fashion feeds, along with butterfly-sleeve and kimono cuts for weddings and Eid.',
    occasions: ['wedding', 'festival', 'party', 'work'], colors: ['#f7f4ee', '#efe6d6'], warmth: 'light', coverage: 'modest',
    sources: [S.mariamAbaya],
    tryon: { uploadHint: 'YouCam has no abaya template. Upload an abaya product photo to try it on.' },
    shop: 'white ivory abaya butterfly sleeve',
  },
  {
    id: 'ae-earth-satin', region: 'AE', kind: 'outfit', for: 'women',
    title: 'Earth-tone satin and matching sets',
    summary: 'Satin pieces and coordinated two-piece sets in sage, terracotta, olive and chocolate are the modest-fashion colours of the year.',
    occasions: ['party', 'date', 'work', 'casual'], colors: ['#8a9a5b', '#c96f4a', '#4b3621'], warmth: 'light', coverage: 'modest',
    sources: [S.kabayare],
    tryon: { cloth: { templateId: 'golden_glow_midi_feminine_modern', title: 'Golden Glow Midi (long-sleeve satin)', note: 'Closest long-sleeve satin template; colour differs.' } },
    shop: 'satin co-ord set modest earth tone',
  },
  {
    id: 'ae-breathable-minimal', region: 'AE', kind: 'outfit', for: 'all',
    title: 'Minimal cuts in breathable fabrics',
    summary: 'Clean, minimal silhouettes in linen, crepe and lightweight blends lead everyday Dubai dressing in the heat.',
    occasions: ['work', 'casual'], colors: ['#e9e2d4', '#b8a88a'], warmth: 'light', coverage: 'modest',
    sources: [S.couture365],
    tryon: { cloth: { templateId: 'oat_cream_set_feminine_modern', title: 'Oat Cream Set', note: 'Coverage is lighter than a modest look; layer accordingly.' } },
    shop: 'linen modest set',
  },
  {
    id: 'ae-khaleeji-glam', region: 'AE', kind: 'makeup', for: 'women',
    title: 'Khaleeji glam: kohl and a smoked brown eye',
    summary: 'Gulf glam centres on the eyes: essential kohl, a winged liner and deep brown smoke, with luminous skin.',
    occasions: ['wedding', 'party', 'festival', 'date'], colors: ['#3b2418', '#9c5b4b'], warmth: 'medium', coverage: 'modest',
    sources: [S.meInsider],
    tryon: { makeup: { label: 'Arabic kohl liner, smoked brown eye, rosy-nude lip', effects: [linerEffect('Arabic3', '#0d0d0d', 85), shadowEffect('#4a2e22', 50), lipEffect('#9c5b4b', 'satin', 60)] } },
    shop: 'kohl eyeliner brown eyeshadow',
  },

  /* ---------------- UK: London ---------------- */
  {
    id: 'gb-cobalt', region: 'GB', kind: 'outfit', for: 'women',
    title: 'Cobalt blue, still everywhere',
    summary: 'Cobalt is one of the most-worn colours of autumn 2026, from knits to evening wear.',
    occasions: ['party', 'wedding', 'date'], colors: ['#1f4fbf'], warmth: 'medium', coverage: 'moderate',
    sources: [S.wwwColours, S.asosColour],
    tryon: { cloth: { templateId: 'navy_gala_gown_feminine_modern', title: 'Navy Gala Gown (blue sequins)' } },
    shop: 'cobalt blue dress',
  },
  {
    id: 'gb-check', region: 'GB', kind: 'outfit', for: 'women',
    title: 'Checks and plaid',
    summary: '“Check, please” is a key autumn/winter 2026 theme, and plaid shirts were all over London Fashion Week street style.',
    occasions: ['casual', 'work'], colors: ['#7a1f1f', '#2f4f2f'], warmth: 'warm', coverage: 'moderate',
    sources: [S.wwwAW26, S.vogueUkLfw],
    tryon: { cloth: { templateId: 'tartan_crush_feminine_holiday', title: 'Tartan Crush' } },
    shop: 'tartan skirt plaid',
  },
  {
    id: 'gb-fresh-green', region: 'GB', kind: 'outfit', for: 'women',
    title: 'Fresh green',
    summary: 'A bright, balanced green that works with warm and cool shades is one of the season’s easiest colour updates.',
    occasions: ['party', 'work', 'date'], colors: ['#3fa66b'], warmth: 'light', coverage: 'moderate',
    sources: [S.wwwColours],
    tryon: { cloth: { templateId: 'pleated_green_dress_feminine_modern', title: 'Pleated Green Dress' } },
    shop: 'green pleated midi dress',
  },
  {
    id: 'gb-cloud-cream', region: 'GB', kind: 'outfit', for: 'women',
    title: 'Cloud Dancer cream',
    summary: 'Soft white “Cloud Dancer”, Pantone’s colour of 2026, closes the autumn/winter trend list.',
    occasions: ['work', 'casual', 'date'], colors: ['#f0ede4'], warmth: 'light', coverage: 'moderate',
    sources: [S.wwwAW26, S.asosColour],
    tryon: { cloth: { templateId: 'oat_cream_set_feminine_modern', title: 'Oat Cream Set' } },
    shop: 'cream co-ord set',
  },
  {
    id: 'gb-gothic-lip', region: 'GB', kind: 'makeup', for: 'women',
    title: 'Blurred burgundy lip, cold-girl flush, smudged kohl',
    summary: 'Brown and burgundy lips worn as sheer, blurred washes; blush placed high like frost-nipped skin; soft, smudged kohl instead of graphic liner.',
    occasions: ['party', 'date', 'casual', 'work'], colors: ['#6e1f2d', '#e59aa3'], warmth: 'medium', coverage: 'moderate',
    sources: [S.glamourUk, S.velvet],
    tryon: { makeup: { label: 'Sheer burgundy lip, high pink blush, smudged kohl', effects: [lipEffect('#6e1f2d', 'satin', 55), blushEffect('#e59aa3', 40), linerEffect('PandaSmudge1', '#2b2b2b', 55)] } },
    shop: 'burgundy lip tint',
  },

  /* ---------------- USA: New York ---------------- */
  {
    id: 'us-plum-deco', region: 'US', kind: 'outfit', for: 'women',
    title: 'Plum and Art Deco for fall weddings',
    summary: 'Sophisticated plum shades and Art Deco embellishment lead fall 2026 wedding-guest dresses.',
    occasions: ['wedding', 'party'], colors: ['#5b1a3a', '#a0466a'], warmth: 'medium', coverage: 'moderate',
    sources: [S.vogueWeddingGuest],
    tryon: { cloth: { templateId: 'ruby_shimmer_feminine_modern', title: 'Ruby Shimmer (burgundy sequin gown)' } },
    shop: 'plum sequin gown',
  },
  {
    id: 'us-rich-purple', region: 'US', kind: 'outfit', for: 'women',
    title: 'Rich purple, aubergine to amethyst',
    summary: 'Purple turns deep and regal for fall, worn head to toe or with tomato red and sky blue.',
    occasions: ['party', 'date', 'work'], colors: ['#4b1f5c', '#7d3c98'], warmth: 'medium', coverage: 'moderate',
    sources: [S.wwwMicro, S.wwwFall],
    tryon: { cloth: { templateId: 'royal_peony_feminine_modern', title: 'Royal Peony (purple top)' } },
    shop: 'aubergine purple knit',
  },
  {
    id: 'us-tuxedo', region: 'US', kind: 'outfit', for: 'all',
    title: 'Tuxedo dressing',
    summary: 'Tuxedo tailoring is one of fall 2026’s early-adopter trends, for evening and the office.',
    occasions: ['work', 'party', 'wedding'], colors: ['#1c2a44', '#111111'], warmth: 'warm', coverage: 'modest',
    sources: [S.wwwFall],
    tryon: { cloth: { templateId: 'tailored_trouble_feminine_edgy', title: 'Tailored Trouble (navy waistcoat suit)', note: 'For menswear, try Classic Black Suit.' } },
    shop: 'tuxedo suit',
  },
  {
    id: 'us-relaxed-shirt', region: 'US', kind: 'outfit', for: 'all',
    title: 'Relaxed button-up with straight-leg jeans',
    summary: 'The classic relaxed button-up was the most-styled shirt at NYFW, worn with straight or barrel-leg jeans and minimal jewellery.',
    occasions: ['casual', 'work'], colors: ['#f4f4f4', '#2f4a6d'], warmth: 'light', coverage: 'moderate',
    sources: [S.dressedNyfw],
    tryon: { cloth: { templateId: 'straight_leg_jeans_feminine_everyday', title: 'Straight-Leg Jeans', note: 'Upload a button-up shirt photo to complete the look.' } },
    shop: 'relaxed button up shirt',
  },
  {
    id: 'us-cocoa-smoky', region: 'US', kind: 'makeup', for: 'women',
    title: 'Diffused cocoa smoky eye and a glossy lip',
    summary: 'The smoky eye is back in soft cocoa, taupe and espresso, with lips that look hydrated, almost wet, instead of matte and lined.',
    occasions: ['party', 'date', 'wedding'], colors: ['#6b4a3a', '#9c6b63'], warmth: 'medium', coverage: 'moderate',
    sources: [S.zoeMakeup, S.wwwMakeup],
    tryon: { makeup: { label: 'Cocoa smoky eye, glossy rose-brown lip', effects: [shadowEffect('#6b4a3a', 55), lipEffect('#9c6b63', 'gloss', 60)] } },
    shop: 'cocoa eyeshadow glossy lip',
  },

  /* ---------------- South Korea: Seoul ---------------- */
  {
    id: 'kr-grown-woman', region: 'KR', kind: 'outfit', for: 'women',
    title: '“Grown woman” style: work jackets and long skirts',
    summary: 'Seoul shoppers have moved from kitsch Y2K to restraint: work jackets (+873% on Zigzag), midi and H-line long skirts (+38%), leather, cashmere and silk.',
    occasions: ['work', 'casual', 'date'], colors: ['#8c8c8c', '#5a3e2b'], warmth: 'medium', coverage: 'modest',
    sources: [S.koreaHerald],
    tryon: { cloth: { templateId: 'long_grey_skirt_feminine_everyday', title: 'Long Grey Skirt' } },
    shop: 'h-line long skirt work jacket',
  },
  {
    id: 'kr-leather-burgundy', region: 'KR', kind: 'outfit', for: 'women',
    title: 'Leather jackets with burgundy and purple accents',
    summary: 'Leather jackets and suede blousons are selling, with purple, burgundy and red as the season’s accent colours.',
    occasions: ['casual', 'date', 'party'], colors: ['#5a3e2b', '#6e1f2d'], warmth: 'warm', coverage: 'moderate',
    sources: [S.koreaHerald],
    tryon: { cloth: { templateId: 'brown_moto_chic_feminine_edgy', title: 'Brown Moto Chic (leather jacket)' } },
    shop: 'leather jacket brown women',
  },
  {
    id: 'kr-peanut-butter-lips', region: 'KR', kind: 'makeup', for: 'women',
    title: 'Peanut-butter lips, high blush, cloud-glow skin',
    summary: 'Warm brown-nude gradient lips are the breakout K-beauty look, with blush placed high under the eyes and softly luminous “cloud glow” skin instead of wet glass skin.',
    occasions: ['casual', 'date', 'work', 'party'], colors: ['#a0674b', '#f0a3a0'], warmth: 'light', coverage: 'moderate',
    sources: [S.kbeautyContent, S.nssKbeauty, S.dailyMailKbeauty],
    tryon: { makeup: { label: 'Peanut-butter gradient lip, high pink blush', effects: [{ category: 'lip_color', shape: { name: 'original' }, palettes: [{ color: '#8f5a40', texture: 'satin', colorIntensity: 70 }, { color: '#c48a6e', texture: 'satin', colorIntensity: 55 }], style: { type: 'ombre', innerColorRatio: 55, blendStrength: 60 } }, blushEffect('#f0a3a0', 40), { category: 'skin_smooth', skinSmoothStrength: 40, skinSmoothColorIntensity: 30 }] } },
    shop: 'brown nude lip tint gradient',
  },
]

export function trendsForRegion(region: Region): Trend[] {
  return TRENDS.filter((t) => t.region === region)
}

/** "Shop similar" link: a shopping search in the event's country, so it never points at a dead product page. */
export function shopUrl(trend: Trend): string {
  const gl = trend.region === 'GB' ? 'uk' : trend.region.toLowerCase()
  return `https://www.google.com/search?tbm=shop&gl=${gl}&q=${encodeURIComponent(trend.shop)}`
}
