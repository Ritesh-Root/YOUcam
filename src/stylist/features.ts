/*
 * Every AI feature in the AI Stylist menu, mapped to its real YouCam API
 * endpoint and request body. Request shapes follow the OpenAPI specs at
 * https://docs.perfectcorp.com (checked 2026-10-10).
 */

import type { Json, Template } from '../youcam'

export type FeatureCategory =
  | 'Skin, Face & Body'
  | 'Beauty'
  | 'Fashion'
  | 'Jewelry & Watches'
  | 'Hair & Beard'
  | 'Image'
  | 'Video'

export const FEATURE_CATEGORIES: { name: FeatureCategory; emoji: string }[] = [
  { name: 'Skin, Face & Body', emoji: '🧖‍♀️' },
  { name: 'Beauty', emoji: '💄' },
  { name: 'Fashion', emoji: '👗' },
  { name: 'Jewelry & Watches', emoji: '💍' },
  { name: 'Hair & Beard', emoji: '💇‍♀️' },
  { name: 'Image', emoji: '🖼️' },
  { name: 'Video', emoji: '🎬' },
]

/* ------------------------------------------------------------------ *
 * Sample inputs published in the YouCam API docs. Using one sends its
 * public URL as src_file_url / ref_file_url, so nothing is uploaded.
 * ------------------------------------------------------------------ */
const PM = 'https://plugins-media.makeupar.com/strapi/assets/'
const BCW = 'https://bcw-media.s3.ap-northeast-1.amazonaws.com/strapi/assets/'
export const SAMPLES = {
  selfie: { label: 'YouCam sample selfie', url: `${PM}sample_Image_1_202b6bf6e6.jpg` },
  selfie2: { label: 'YouCam sample selfie 2', url: `${PM}sample_Image_7_fa28b2618a.jpg` },
  portrait: { label: 'YouCam sample portrait', url: `${PM}face_reshape_01_85c8ffc055.jpg` },
  fullBody: { label: 'YouCam sample full body', url: `${PM}clothes_03_cccd5d4803.jpeg` },
  body: { label: 'YouCam sample body', url: `${PM}body_reshape_02_7777218379.jpg` },
  outfit: { label: 'YouCam sample outfit', url: `${PM}clothes_reference_full_body_01_5a000d999f.png` },
  hand: { label: 'YouCam sample hand', url: `${PM}nail_user_photo_01_27d4260646.jpg` },
  pressOn: { label: 'YouCam sample press-on nail', url: `${PM}press_on_nail_06_3_9ce2ddc47a.png` },
  ringHand: { label: 'YouCam sample hand', url: `${BCW}ring_user_01_6d9893abd0_c7427cdb78.jpg` },
  ring: { label: 'YouCam sample ring', url: `${BCW}ring_product_01_9a4d0680f2_b46afe9a53.jpg` },
  wrist: { label: 'YouCam sample wrist', url: `${BCW}watch_and_bracelet_user_01_09f16603cb_878dc89179.jpg` },
  watch: { label: 'YouCam sample watch', url: `${BCW}watch_product_01_aab8053028_50ab7fe9a5.jpg` },
  bracelet: { label: 'YouCam sample bracelet', url: `${BCW}bracelet_product_09_2cb9721d77_2f8d90ab9f.jpg` },
  earring: { label: 'YouCam sample earring', url: `${BCW}earring_product_01_41c943f9fc_037ffb1241.jpg` },
  necklace: { label: 'YouCam sample necklace', url: `${BCW}necklace_product_01_124206cfbe_3993a2128d.jpg` },
  shoes: { label: 'YouCam sample shoes', url: `${PM}small_Shoes_2_ec3578c5c2.jpg` },
} as const

export type Sample = { label: string; url: string }

/* ------------------------------------------------------------------ *
 * Spec types
 * ------------------------------------------------------------------ */
export type Slot = {
  key: string
  label: string
  kind: 'image' | 'video' | 'mask'
  hint: string
  optional?: boolean
  /** Offer the photo saved in the profile. */
  profile?: 'face' | 'body'
  samples?: Sample[]
  /** For masks: the slot whose image the mask is painted on. */
  maskOf?: string
  /** Upload endpoint when the feature has its own File API. */
  fileEndpoint?: string
  png?: boolean
  maxSide?: number
  /** Offer a generated contact-lens image from a colour. */
  lensGenerator?: boolean
}

type Option = { value: string; label: string }

export type Param =
  | { key: string; label: string; type: 'select'; options: Option[]; default: string; showIf?: (p: Params) => boolean }
  | { key: string; label: string; type: 'multi'; options: Option[]; default: string[]; min?: number; max?: number; showIf?: (p: Params) => boolean }
  | { key: string; label: string; type: 'slider'; min: number; max: number; step?: number; default: number; showIf?: (p: Params) => boolean }
  | { key: string; label: string; type: 'color'; default: string; showIf?: (p: Params) => boolean }
  | { key: string; label: string; type: 'text'; default: string; placeholder?: string; maxLength?: number; showIf?: (p: Params) => boolean }
  | { key: string; label: string; type: 'toggle'; default: boolean; showIf?: (p: Params) => boolean }
  | { key: string; label: string; type: 'template'; template: string; version?: string; default?: string; filter?: (t: Template) => boolean; showIf?: (p: Params) => boolean }

export type Params = Record<string, string | number | boolean | string[]>
export type FileRef = { id?: string; url?: string }
export type BuildCtx = { files: Record<string, FileRef>; params: Params; videoSeconds?: number }

export type AnalysisKind = 'skin' | 'tone' | 'fitzpatrick' | 'face' | 'hair'

export type AIFeature = {
  id: string
  name: string
  category: FeatureCategory
  emoji: string
  blurb: string
  kind: 'analysis' | 'tryon' | 'edit'
  /** e.g. 'v2.0/task/makeup-vto' */
  task: string
  slots: Slot[]
  params: Param[]
  build: (ctx: BuildCtx) => Json
  output: 'image' | 'images' | 'video' | 'analysis'
  analysis?: AnalysisKind
  /** Opens a dedicated screen instead of the generic runner. */
  screen?: 'tryon'
  timeoutMs?: number
  tips?: string
  /** Shown before running. Live prices also come from /credit/feature-cost. */
  costNote: string
  /** Returns a message when the current settings would be rejected. */
  validate?: (params: Params) => string | null
}

/* ------------------------------------------------------------------ *
 * Builders
 * ------------------------------------------------------------------ */
const src = (ctx: BuildCtx, key = 'src'): Json => {
  const f = ctx.files[key]
  return f?.id ? { src_file_id: f.id } : { src_file_url: f?.url }
}
const ref = (ctx: BuildCtx, key = 'ref'): Json => {
  const f = ctx.files[key]
  return f?.id ? { ref_file_id: f.id } : { ref_file_url: f?.url }
}
const refs = (ctx: BuildCtx, key = 'ref'): Json => {
  const f = ctx.files[key]
  return f?.id ? { ref_file_ids: [f.id] } : { ref_file_urls: [f?.url] }
}
const mask = (ctx: BuildCtx, key = 'mask'): Json => {
  const f = ctx.files[key]
  return f?.id ? { msk_file_id: f.id } : { msk_file_url: f?.url }
}
const nameOf = (ctx: BuildCtx, key: string) => ctx.files[key]?.id ?? ctx.files[key]?.url
const num = (p: Params, k: string) => Number(p[k])
const str = (p: Params, k: string) => String(p[k])
const list = (p: Params, k: string) => (Array.isArray(p[k]) ? (p[k] as string[]) : [])

/* Shared slot presets */
const selfieSlot = (hint = 'A clear, front-facing photo in even light.'): Slot => ({
  key: 'src', label: 'Your photo', kind: 'image', hint, profile: 'face', samples: [SAMPLES.selfie, SAMPLES.selfie2],
})
const fullBodySlot = (hint = 'Full body, facing the camera, plain background.'): Slot => ({
  key: 'src', label: 'Full-body photo', kind: 'image', hint, profile: 'body', samples: [SAMPLES.fullBody],
})
const genderParam: Param = {
  key: 'gender', label: 'Style for', type: 'select', default: 'female',
  options: [{ value: 'female', label: 'Women' }, { value: 'male', label: 'Men' }],
}
const options = (...values: [string, string][]): Option[] => values.map(([value, label]) => ({ value, label }))

const SKIN_CONCERNS = options(
  ['acne', 'Acne'], ['oiliness', 'Oiliness'], ['redness', 'Redness'], ['texture', 'Texture'],
  ['pore', 'Pores'], ['wrinkle', 'Wrinkles'], ['dark_circle_v2', 'Dark circles'], ['eye_bag', 'Eye bags'],
  ['age_spot', 'Age spots'], ['moisture', 'Moisture'], ['radiance', 'Radiance'], ['firmness', 'Firmness'],
  ['tear_trough', 'Tear trough'], ['droopy_upper_eyelid', 'Upper eyelid'], ['droopy_lower_eyelid', 'Lower eyelid'],
  ['skin_type', 'Skin type'],
)

const hdName = (c: string) => (c === 'dark_circle_v2' ? 'hd_dark_circle' : `hd_${c}`)

/* Makeup effect builders (makeup-vto schema) */
export type LipTexture = 'matte' | 'satin' | 'gloss'
export function lipEffect(color: string, texture: LipTexture = 'satin', intensity = 70): Json {
  const palette: Json = { color, texture, colorIntensity: intensity }
  if (texture === 'gloss') Object.assign(palette, { gloss: 60, transparencyIntensity: 30 })
  return { category: 'lip_color', shape: { name: 'original' }, palettes: [palette], style: { type: 'full' } }
}
export function blushEffect(color: string, intensity = 45, pattern = 'Oblique1'): Json {
  return { category: 'blush', pattern: { name: pattern }, palettes: [{ color, texture: 'matte', colorIntensity: intensity }] }
}
export function linerEffect(pattern: string, color = '#1a1a1a', intensity = 75): Json {
  return { category: 'eye_liner', pattern: { name: pattern }, palettes: [{ color, texture: 'matte', colorIntensity: intensity }] }
}
export function shadowEffect(color: string, intensity = 45, pattern = '1color9'): Json {
  return { category: 'eye_shadow', pattern: { name: pattern }, palettes: [{ color, texture: 'matte', colorIntensity: intensity }] }
}

const EYELINERS = options(
  ['none', 'None'], ['Upper1', 'Classic line'], ['OpenWings1', 'Winged'], ['Arabic3', 'Arabic kohl'],
  ['PandaSmudge1', 'Smudged kohl'], ['Smoke11', 'Smoky'],
)

/* Video length guard: YouCam bills by second and needs the exact length. */
const seconds = (ctx: BuildCtx) => Math.max(1, Math.min(10, Math.ceil(ctx.videoSeconds ?? 5)))
const videoSlot = (label = 'Your video', hint = 'MP4 or MOV, up to 10 seconds, 30 fps or less.'): Slot => ({
  key: 'src', label, kind: 'video', hint,
})

/* ------------------------------------------------------------------ *
 * The catalog
 * ------------------------------------------------------------------ */
export const AI_FEATURES: AIFeature[] = [
  /* ---------------- Skin, Face & Body ---------------- */
  {
    id: 'skin-analysis', name: 'AI Skin Analysis', category: 'Skin, Face & Body', emoji: '🔬', kind: 'analysis',
    blurb: 'Scores up to 16 skin concerns from one selfie.',
    task: 'v2.0/task/skin-analysis', output: 'analysis', analysis: 'skin',
    slots: [selfieSlot('Front-facing, no makeup, hair off the face, even light. At least 480 px (1080 px for HD).')],
    params: [
      { key: 'concerns', label: 'Concerns', type: 'multi', options: SKIN_CONCERNS, default: ['acne', 'oiliness', 'redness', 'texture'], min: 1, max: 16 },
      { key: 'quality', label: 'Detail', type: 'select', default: 'sd', options: options(['sd', 'Standard (SD)'], ['hd', 'High detail (HD)']) },
    ],
    build: (ctx) => ({
      ...src(ctx),
      dst_actions: list(ctx.params, 'concerns').map((c) => (ctx.params.quality === 'hd' ? hdName(c) : c)),
      format: 'json',
    }),
    costNote: 'SD: 9 units for 1–4 concerns, up to 16 for 13–16. HD: 12–22 units.',
  },
  {
    id: 'skin-simulation', name: 'AI Skin Simulation', category: 'Skin, Face & Body', emoji: '📈', kind: 'edit',
    blurb: 'A cosmetic illustration of reduced skin concerns. Not a prediction of results.',
    task: 'v2.0/task/skin-simulation', output: 'image',
    slots: [selfieSlot()],
    params: [
      { key: 'concerns', label: 'Concerns to soften', type: 'multi', default: ['acne', 'spots'], min: 1,
        options: options(['acne', 'Acne'], ['spots', 'Spots'], ['redness', 'Redness'], ['pores', 'Pores'], ['texture', 'Texture'], ['wrinkle', 'Wrinkles'], ['dark_circle', 'Dark circles'], ['eye_bags', 'Eye bags'], ['oiliness', 'Oiliness'], ['radiance', 'Radiance']) },
      { key: 'strength', label: 'Strength', type: 'slider', min: 10, max: 100, default: 60 },
    ],
    build: (ctx) => ({
      ...src(ctx),
      ...Object.fromEntries(list(ctx.params, 'concerns').map((c) => [c, num(ctx.params, 'strength') / 100])),
    }),
    costNote: '4 units for 1–4 concerns, 6 units for 5–10.',
  },
  {
    id: 'fitzpatrick', name: 'AI Fitzpatrick Skin Type', category: 'Skin, Face & Body', emoji: '🎚️', kind: 'analysis',
    blurb: 'Estimates Fitzpatrick type I–VI to guide sun-protection advice.',
    task: 'v2.0/task/fitzpatrick-scale-analyzer', output: 'analysis', analysis: 'fitzpatrick',
    slots: [selfieSlot()], params: [],
    build: (ctx) => ({ ...src(ctx), version: '1.0' }),
    costNote: '10 units per photo.',
  },
  {
    id: 'facial-tones', name: 'AI Facial Color Tones', category: 'Skin, Face & Body', emoji: '🎨', kind: 'analysis',
    blurb: 'Measures skin, eye, brow, lip and hair colour for your palette.',
    task: 'v2.0/task/skin-tone-analysis', output: 'analysis', analysis: 'tone',
    slots: [selfieSlot('Front-facing in daylight, no filters.')], params: [],
    build: (ctx) => ({ ...src(ctx), face_angle_strictness_level: 'medium' }),
    costNote: '20 units per photo. The result updates your palette.',
  },
  {
    id: 'face-ratio', name: 'AI Face Attributes & Ratio', category: 'Skin, Face & Body', emoji: '📐', kind: 'analysis',
    blurb: 'Face shape, eye shape, lip shape and facial proportions.',
    task: 'v2.0/task/face-attr-analysis', output: 'analysis', analysis: 'face',
    slots: [selfieSlot()],
    params: [{
      key: 'features', label: 'Attributes', type: 'multi', min: 1, max: 28,
      default: ['faceShape', 'eyeShape', 'lipShape', 'eyebrowShape', 'noseWidth'],
      options: options(['faceShape', 'Face shape'], ['eyeShape', 'Eye shape'], ['lipShape', 'Lip shape'], ['eyebrowShape', 'Brow shape'], ['noseWidth', 'Nose width'], ['noseLength', 'Nose length'], ['cheekbones', 'Cheekbones'], ['eyelid', 'Eyelid'], ['eyeSize', 'Eye size'], ['eyeAngle', 'Eye angle'], ['eyeDistance', 'Eye distance'], ['eyebrowThickness', 'Brow thickness'], ['horizontalThird', 'Facial thirds'], ['verticalFifth', 'Facial fifths'], ['faceAspectRatio', 'Face ratio']),
    }],
    build: (ctx) => ({ ...src(ctx), features: list(ctx.params, 'features'), face_angle_strictness_level: 'medium' }),
    costNote: '10 units for 1–5 attributes, 20 for 6–14, 30 for 15–28.',
  },
  {
    id: 'face-lift', name: 'AI Face Lift', category: 'Skin, Face & Body', emoji: '✨', kind: 'edit',
    blurb: 'Previews a subtle lift. Edits your photo.',
    task: 'v2.0/task/face-lift', output: 'image',
    slots: [selfieSlot()],
    params: [
      { key: 'mode', label: 'Mode', type: 'select', default: 'auto', options: options(['auto', 'Automatic'], ['custom', 'Custom']) },
      ...(['eye_bag', 'cheek', 'forehead', 'shape', 'mouth'] as const).map((k): Param => ({
        key: k, label: k.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()), type: 'slider', min: 0, max: 100, default: 40,
        showIf: (p) => p.mode === 'custom',
      })),
    ],
    build: (ctx) => ctx.params.mode === 'custom'
      ? { ...src(ctx), version: '1.0', type: 'custom', features: Object.fromEntries(['eye_bag', 'cheek', 'forehead', 'shape', 'mouth'].map((k) => [k, num(ctx.params, k)])) }
      : { ...src(ctx), version: '1.0', type: 'auto' },
    costNote: '1 unit per image.',
  },
  {
    id: 'face-reshape', name: 'AI Face Reshape', category: 'Skin, Face & Body', emoji: '🙂', kind: 'edit',
    blurb: 'Adjusts face width, chin, eyes, nose and lips. Edits your photo.',
    task: 'v2.0/task/face-reshape', output: 'image',
    slots: [selfieSlot()],
    params: (['face_width', 'chin_length', 'eye_size', 'nose_size', 'lip_size'] as const).map((k): Param => ({
      key: k, label: k.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()), type: 'slider', min: -100, max: 100,
      default: k === 'face_width' ? -15 : k === 'eye_size' ? 10 : 0,
    })),
    build: (ctx) => ({
      ...src(ctx), version: '1.0',
      features: Object.fromEntries(['face_width', 'chin_length', 'eye_size', 'nose_size', 'lip_size'].map((k) => [k, num(ctx.params, k)])),
      global: { skin_smooth_strength: 0, skin_smooth_color_intensity: 0 },
    }),
    validate: (p) => (['face_width', 'chin_length', 'eye_size', 'nose_size', 'lip_size'].some((k) => Number(p[k]) !== 0) ? null : 'Move at least one slider.'),
    costNote: '1 unit per image.',
  },
  {
    id: 'body-reshape', name: 'AI Body Reshape', category: 'Skin, Face & Body', emoji: '🧍', kind: 'edit',
    blurb: 'Adjusts proportions in a full-body photo. Edits your photo.',
    task: 'v2.0/task/body-reshape', output: 'image',
    slots: [{ ...fullBodySlot(), samples: [SAMPLES.body] }],
    params: (['slim', 'waist', 'leg', 'shoulder', 'taller'] as const).map((k): Param => ({
      key: k, label: k.replace(/^./, (c) => c.toUpperCase()), type: 'slider', min: k === 'taller' ? 0 : -100, max: 100,
      default: k === 'slim' || k === 'waist' ? 20 : 0,
    })),
    build: (ctx) => ({
      ...src(ctx), version: '1.0',
      features: Object.fromEntries(['slim', 'waist', 'leg', 'shoulder', 'taller'].map((k) => [k, num(ctx.params, k)])),
    }),
    validate: (p) => (['slim', 'waist', 'leg', 'shoulder', 'taller'].some((k) => Number(p[k]) !== 0) ? null : 'Move at least one slider.'),
    costNote: '1 unit per image.',
  },
  {
    id: 'aging', name: 'AI Aging Simulation', category: 'Skin, Face & Body', emoji: '⏳', kind: 'edit',
    blurb: 'A series of younger and older versions of your face.',
    task: 'v2.0/task/aging', output: 'images',
    slots: [selfieSlot()], params: [],
    build: (ctx) => src(ctx),
    costNote: '2 units per 16 images.',
  },
  {
    id: 'smile', name: 'AI Smile', category: 'Skin, Face & Body', emoji: '😊', kind: 'edit',
    blurb: 'Adds a natural smile to a neutral photo.',
    task: 'v2.0/task/ai-smile', output: 'image',
    slots: [selfieSlot()],
    params: [{ key: 'expression', label: 'Smile', type: 'select', default: 'closed_mouth_smile', options: options(['closed_mouth_smile', 'Closed mouth'], ['smile_with_teeth_visible', 'With teeth']) }],
    build: (ctx) => ({ ...src(ctx), expression_type: str(ctx.params, 'expression') }),
    costNote: '1 unit per image.',
  },
  {
    id: 'teeth', name: 'AI Teeth Whitening', category: 'Skin, Face & Body', emoji: '🦷', kind: 'edit',
    blurb: 'Brightens teeth in a smiling photo.',
    task: 'v2.0/task/teeth-whiten', output: 'image',
    slots: [selfieSlot('A smiling photo with teeth visible.')],
    params: [{ key: 'intensity', label: 'Whitening', type: 'slider', min: 0, max: 100, default: 60 }],
    build: (ctx) => ({ ...src(ctx), version: '1.0', effect: { whitening_intensity: num(ctx.params, 'intensity'), skin_smooth_strength: 0, skin_smooth_color_intensity: 0 } }),
    costNote: '1 unit per image.',
  },

  /* ---------------- Beauty ---------------- */
  {
    id: 'makeup-transfer', name: 'AI Makeup Transfer', category: 'Beauty', emoji: '💋', kind: 'tryon',
    blurb: 'Copies the makeup from a reference photo onto your face.',
    task: 'v2.0/task/mu-transfer', output: 'image',
    slots: [selfieSlot(), { key: 'ref', label: 'Makeup reference', kind: 'image', hint: 'A clear face photo wearing the look you want.', samples: [SAMPLES.portrait] }],
    params: [],
    build: (ctx) => ({ ...src(ctx), ...ref(ctx) }),
    costNote: '2 units per image.',
  },
  {
    id: 'makeup-tryon', name: 'AI Makeup Virtual Try-On', category: 'Beauty', emoji: '💄', kind: 'tryon',
    blurb: 'Lip colour, blush, liner and eyeshadow on your own photo.',
    task: 'v2.0/task/makeup-vto', output: 'image',
    slots: [selfieSlot()],
    params: [
      { key: 'lip', label: 'Lip colour', type: 'color', default: '#a0674b' },
      { key: 'lipTexture', label: 'Lip finish', type: 'select', default: 'satin', options: options(['matte', 'Matte'], ['satin', 'Satin'], ['gloss', 'Gloss']) },
      { key: 'blushOn', label: 'Blush', type: 'toggle', default: true },
      { key: 'blush', label: 'Blush colour', type: 'color', default: '#e07a7a', showIf: (p) => p.blushOn === true },
      { key: 'liner', label: 'Eyeliner', type: 'select', default: 'Upper1', options: EYELINERS },
      { key: 'shadowOn', label: 'Eyeshadow', type: 'toggle', default: false },
      { key: 'shadow', label: 'Eyeshadow colour', type: 'color', default: '#7a5a4a', showIf: (p) => p.shadowOn === true },
    ],
    build: (ctx) => {
      const p = ctx.params
      const effects: Json[] = [lipEffect(str(p, 'lip'), str(p, 'lipTexture') as LipTexture)]
      if (p.blushOn) effects.push(blushEffect(str(p, 'blush')))
      if (p.liner !== 'none') effects.push(linerEffect(str(p, 'liner')))
      if (p.shadowOn) effects.push(shadowEffect(str(p, 'shadow')))
      return { ...src(ctx), version: '1.0', effects }
    },
    costNote: '1 unit per image.',
  },
  {
    id: 'look-tryon', name: 'AI Look Virtual Try-On', category: 'Beauty', emoji: '🌟', kind: 'tryon',
    blurb: 'Applies a complete preset makeup look in one step.',
    task: 'v2.0/task/look-vto', output: 'image',
    slots: [selfieSlot()],
    params: [{ key: 'template', label: 'Look', type: 'template', template: 'look-vto' }],
    build: (ctx) => ({ ...src(ctx), template_id: str(ctx.params, 'template') }),
    costNote: '2 units per image.',
  },
  {
    id: 'nail-transfer', name: 'AI Nail Transfer', category: 'Beauty', emoji: '💅', kind: 'tryon',
    blurb: 'Copies a nail design from a reference photo onto your hand.',
    task: 'v2.0/task/ai-nail', output: 'image',
    slots: [
      { key: 'src', label: 'Your hand', kind: 'image', hint: 'Back of the hand, fingers spread, nails visible.', samples: [SAMPLES.hand] },
      { key: 'ref', label: 'Nail design', kind: 'image', hint: 'A photo of the nails you want.', samples: [SAMPLES.pressOn] },
    ],
    params: [],
    build: (ctx) => ({ ...src(ctx), ...ref(ctx) }),
    costNote: '1 unit per image.',
  },
  {
    id: 'nail-tryon', name: 'AI Nail Virtual Try-On', category: 'Beauty', emoji: '💅', kind: 'tryon',
    blurb: 'Paints all five nails in any colour and finish.',
    task: 'v2.0/task/nail-vto', output: 'image',
    slots: [{ key: 'src', label: 'Your hand', kind: 'image', hint: 'Back of the hand, fingers spread, nails visible.', samples: [SAMPLES.hand] }],
    params: [
      { key: 'color', label: 'Polish colour', type: 'color', default: '#8b1e3f' },
      { key: 'texture', label: 'Finish', type: 'select', default: 'cream', options: options(['cream', 'Cream'], ['matte', 'Matte'], ['jelly', 'Jelly'], ['sheer', 'Sheer'], ['metallic', 'Metallic']) },
    ],
    build: (ctx) => ({
      ...src(ctx), version: '1.0', effect_type: 'nail_polish',
      effects: ['thumb', 'index', 'middle', 'ring', 'pinky'].map((finger) => {
        const texture = str(ctx.params, 'texture')
        const e: Json = { sub_type: 'color', finger, color: str(ctx.params, 'color'), texture, reflection: 60, contrast: 50, roughness: 0 }
        if (texture !== 'metallic') e.transparency = texture === 'sheer' ? 50 : 0
        return e
      }),
    }),
    costNote: '1 unit per image.',
  },
  {
    id: 'lens-tryon', name: 'AI Eye Color Lens Try-On', category: 'Beauty', emoji: '👁️', kind: 'tryon',
    blurb: 'Previews coloured contact lenses.',
    task: 'v2.0/task/eye-color-vto', output: 'image',
    slots: [
      selfieSlot('Front-facing with eyes fully open.'),
      { key: 'ref', label: 'Lens design', kind: 'image', hint: 'A lens product image, or generate one from a colour.', lensGenerator: true, png: true },
    ],
    params: [
      { key: 'intensity', label: 'Opacity', type: 'slider', min: 1, max: 100, default: 70 },
      { key: 'enlargement', label: 'Enlargement', type: 'slider', min: 0, max: 100, default: 0 },
    ],
    build: (ctx) => ({ ...src(ctx), ...ref(ctx), version: '1.0', effect: { intensity: num(ctx.params, 'intensity'), enlargement: num(ctx.params, 'enlargement'), skin_smooth_strength: 0, skin_smooth_color_intensity: 0 } }),
    costNote: '1 unit per image.',
  },

  /* ---------------- Fashion ---------------- */
  {
    id: 'clothes-tryon', name: 'AI Clothes Virtual Try-On', category: 'Fashion', emoji: '👚', kind: 'tryon',
    blurb: 'YouCam outfits or your own garment photo, on your body.',
    task: 'v2.0/task/cloth-v4', output: 'image', screen: 'tryon',
    slots: [fullBodySlot()], params: [],
    build: (ctx) => ({ ...src(ctx), ...ref(ctx), garment_category: 'auto' }),
    costNote: '2 units per image.',
  },
  {
    id: 'fabric-tryon', name: 'AI Fabric Virtual Try-On', category: 'Fashion', emoji: '🧵', kind: 'tryon',
    blurb: 'Swaps the fabric of the outfit you are wearing.',
    task: 'v2.0/task/fabric', output: 'image',
    slots: [fullBodySlot()],
    params: [{ key: 'template', label: 'Fabric', type: 'template', template: 'fabric' }],
    build: (ctx) => ({ ...src(ctx), template_id: str(ctx.params, 'template') }),
    costNote: '2 units per image.',
  },
  ...(['bag', 'scarf', 'shoes', 'hat'] as const).map((item): AIFeature => {
    const meta = {
      bag: { name: 'AI Bag Virtual Try-On', emoji: '👜', blurb: 'Your photo carrying a bag from a product image.', styles: null, sample: null },
      scarf: { name: 'AI Scarf Virtual Try-On', emoji: '🧣', blurb: 'A scarf from a product image, styled on you.', styles: options(['random', 'Any'], ['style_french_elegance', 'French elegance'], ['style_light_luxury', 'Light luxury'], ['style_cottagecore', 'Cottagecore'], ['style_modern_chic', 'Modern chic'], ['style_bohemian', 'Bohemian']), sample: null },
      shoes: { name: 'AI Shoes Virtual Try-On', emoji: '👟', blurb: 'Shoes from a product image, on your feet.', styles: options(['random', 'Any'], ['style_minimalist', 'Minimalist'], ['style_bohemian', 'Bohemian'], ['style_cottagecore', 'Cottagecore'], ['style_french_elegance', 'French elegance'], ['style_retro_fashion', 'Retro']), sample: SAMPLES.shoes },
      hat: { name: 'AI Hat Virtual Try-On', emoji: '👒', blurb: 'A hat or headband from a product image, on you.', styles: options(['random', 'Any'], ['style_sporty_casual', 'Sporty'], ['style_urban_fashion', 'Urban'], ['style_vacation_casual', 'Vacation'], ['style_warm_cozy', 'Warm & cozy'], ['style_bohemian', 'Bohemian']), sample: null },
    }[item]
    return {
      id: `${item}-tryon`, name: meta.name, category: 'Fashion', emoji: meta.emoji, kind: 'tryon', blurb: meta.blurb,
      task: `v2.0/task/${item}`, output: 'image',
      slots: [
        { ...fullBodySlot(item === 'hat' ? 'Head and shoulders visible, facing the camera.' : 'Full body, facing the camera, plain background.'), samples: [SAMPLES.fullBody] },
        { key: 'ref', label: 'Product photo', kind: 'image', hint: `A clear product photo of the ${item === 'shoes' ? 'shoes' : item} on a plain background.`, samples: meta.sample ? [meta.sample] : [] },
      ],
      params: meta.styles ? [genderParam, { key: 'style', label: 'Styling', type: 'select', default: 'random', options: meta.styles }] : [genderParam],
      build: (ctx) => ({ ...src(ctx), ...ref(ctx), gender: str(ctx.params, 'gender'), ...(meta.styles ? { style: str(ctx.params, 'style') } : {}) }),
      costNote: '2 units per image.',
    }
  }),

  /* ---------------- Jewelry & Watches (2D VTO) ---------------- */
  ...(['ring', 'bracelet', 'earring', 'watch', 'necklace'] as const).map((item): AIFeature => {
    const meta = {
      ring: { id: 'ring-tryon', name: 'AI Ring Virtual Try-On', emoji: '💍', user: SAMPLES.ringHand, product: SAMPLES.ring, hint: 'Back of the hand, fingers spread.', productHint: 'Ring photographed at about 45°, plain background.' },
      bracelet: { id: 'bracelet-tryon', name: 'AI Bracelet Virtual Try-On', emoji: '📿', user: SAMPLES.wrist, product: SAMPLES.bracelet, hint: 'Wrist and back of the hand visible.', productHint: 'Bracelet on a plain background.' },
      earring: { id: 'earrings-tryon', name: 'AI Earrings Virtual Try-On', emoji: '👂', user: null, product: SAMPLES.earring, hint: 'Face the camera with hair tucked behind your ears so both earlobes show.', productHint: 'A single earring on a plain background.' },
      watch: { id: 'watch-tryon', name: 'AI Watch Virtual Try-On', emoji: '⌚', user: SAMPLES.wrist, product: SAMPLES.watch, hint: 'Wrist and back of the hand visible.', productHint: 'Watch face-on, plain background.' },
      necklace: { id: 'necklace-tryon', name: 'AI Necklace Virtual Try-On', emoji: '📿', user: null, product: SAMPLES.necklace, hint: 'Face the camera with your neck and collarbone clearly visible and centred.', productHint: 'Necklace laid flat on a plain background.' },
    }[item]
    const fileEndpoint = item === 'ring' ? '/s2s/v2.0/file/2d-vto/ring' : undefined
    const parameter = (ctx: BuildCtx): Json => {
      if (item === 'ring') return { ring_need_remove_background: true, ring_wearing_finger: Number(ctx.params.finger ?? 3) }
      if (item === 'earring') return { earring_need_remove_background: true, earring_is_right_ear: ctx.params.ear !== 'left' }
      return { [`${item}_need_remove_background`]: true }
    }
    const params: Param[] = item === 'ring'
      ? [{ key: 'finger', label: 'Finger', type: 'select', default: '3', options: options(['0', 'Thumb'], ['1', 'Index'], ['2', 'Middle'], ['3', 'Ring'], ['4', 'Little']) }]
      : item === 'earring'
        ? [{ key: 'ear', label: 'Ear', type: 'select', default: 'right', options: options(['right', 'Right ear'], ['left', 'Left ear']) }]
        : []
    return {
      id: meta.id, name: meta.name, category: 'Jewelry & Watches', emoji: meta.emoji, kind: 'tryon',
      blurb: `Places a ${item} from a product photo onto your photo.`,
      task: `v2.0/task/2d-vto/${item}`, output: 'image',
      slots: [
        { key: 'src', label: 'Your photo', kind: 'image', hint: meta.hint, samples: meta.user ? [meta.user] : [], fileEndpoint, profile: item === 'earring' || item === 'necklace' ? 'face' : undefined },
        { key: 'ref', label: 'Product photo', kind: 'image', hint: meta.productHint, samples: [meta.product], fileEndpoint },
      ],
      params,
      build: (ctx) => ({
        ...src(ctx), ...refs(ctx),
        source_info: { name: nameOf(ctx, 'src') },
        object_infos: [{ name: nameOf(ctx, 'ref'), parameter: parameter(ctx) }],
      }),
      costNote: '1 unit per image (2 for stacked items).',
    }
  }),

  /* ---------------- Hair & Beard ---------------- */
  {
    id: 'hair-color', name: 'AI Hair Color Try-On', category: 'Hair & Beard', emoji: '🎨', kind: 'tryon',
    blurb: 'Any hair colour, full or ombré.',
    task: 'v2.0/task/hair-color', output: 'image',
    slots: [selfieSlot('Face and hair visible, hair down.')],
    params: [
      { key: 'mode', label: 'Colour', type: 'select', default: 'preset', options: options(['preset', 'Preset'], ['custom', 'Custom colour']) },
      { key: 'preset', label: 'Preset', type: 'select', default: 'Burgundy', showIf: (p) => p.mode === 'preset',
        options: ['Jet Black', 'Chocolate Brown', 'Honey Blonde', 'Platinum Blonde', 'Ash Gray', 'Rose Gold', 'Burgundy', 'Copper Red', 'Lavender', 'Teal Blue', 'Dark Brown/Caramel Blonde', 'Burgundy/Magenta Pink', 'Plum Purple/Pastel Lilac', 'Copper Red/Golden Blonde'].map((v) => ({ value: v, label: v })) },
      { key: 'color', label: 'Custom colour', type: 'color', default: '#5a1e2c', showIf: (p) => p.mode === 'custom' },
      { key: 'intensity', label: 'Intensity', type: 'slider', min: 0, max: 100, default: 70, showIf: (p) => p.mode === 'custom' },
    ],
    build: (ctx) => ctx.params.mode === 'custom'
      ? { ...src(ctx), pattern: { name: 'full' }, palettes: [{ color: str(ctx.params, 'color'), color_intensity: num(ctx.params, 'intensity'), shine_intensity: 40 }] }
      : { ...src(ctx), preset: str(ctx.params, 'preset') },
    costNote: '1 unit per image.',
  },
  ...([
    ['hairstyle', 'AI Hairstyle Try-On', '💇‍♀️', 'From pixies to braids, on your own face.', 'hair-style', 1],
    ['hair-extension', 'AI Hair Extension Try-On', '💇', 'Previews longer hair.', 'hair-ext', 1],
    ['bangs', 'AI Bangs Filter Try-On', '💁‍♀️', 'See yourself with different bangs.', 'hair-bang', 1],
    ['hair-volume', 'AI Hair Volume Try-On', '🌀', 'Previews fuller hair.', 'hair-vol', 2],
    ['wavy-hair', 'AI Wavy Hair Try-On', '〰️', 'Waves and curls on your own hair.', 'hair-curl', 1],
    ['beard', 'AI Beard Style Generator', '🧔', 'Visualise beard shapes.', 'beard-style', 2],
  ] as const).map(([id, name, emoji, blurb, template, units]): AIFeature => ({
    id, name, category: 'Hair & Beard', emoji, kind: 'tryon', blurb,
    task: `v2.0/task/${template}`, output: 'image',
    slots: [selfieSlot('Face and hair visible, hair down.')],
    params: [{ key: 'template', label: 'Style', type: 'template', template }],
    build: (ctx) => ({ ...src(ctx), template_id: str(ctx.params, 'template') }),
    costNote: `${units} unit${units > 1 ? 's' : ''} per image.`,
  })),
  {
    id: 'hair-type', name: 'AI Hair Type Detection', category: 'Hair & Beard', emoji: '🔎', kind: 'analysis',
    blurb: 'Classifies curl pattern from three angles.',
    task: 'v2.0/task/hair-type-detection', output: 'analysis', analysis: 'hair',
    slots: [
      { key: 'front', label: 'Front', kind: 'image', hint: 'Face the camera, hair down.', profile: 'face' },
      { key: 'left', label: 'Turned left', kind: 'image', hint: 'Turn your head to the left.' },
      { key: 'right', label: 'Turned right', kind: 'image', hint: 'Turn your head to the right.' },
    ],
    params: [],
    build: (ctx) => {
      const keys = ['front', 'left', 'right']
      return keys.every((k) => ctx.files[k]?.id) ? { src_file_ids: keys.map((k) => ctx.files[k].id) } : { src_file_urls: keys.map((k) => nameOf(ctx, k)) }
    },
    costNote: '2 units per analysis.',
  },
  {
    id: 'hair-frizz', name: 'AI Hair Frizziness Detection', category: 'Hair & Beard', emoji: '🌫️', kind: 'analysis',
    blurb: 'Grades frizz from three angles.',
    task: 'v2.0/task/hair-frizziness-detection', output: 'analysis', analysis: 'hair',
    slots: [
      { key: 'front', label: 'Front', kind: 'image', hint: 'Face the camera, hair down.', profile: 'face' },
      { key: 'left', label: 'Turned left', kind: 'image', hint: 'Turn your head to the left.' },
      { key: 'right', label: 'Turned right', kind: 'image', hint: 'Turn your head to the right.' },
    ],
    params: [],
    build: (ctx) => {
      const keys = ['front', 'left', 'right']
      return keys.every((k) => ctx.files[k]?.id) ? { src_file_ids: keys.map((k) => ctx.files[k].id) } : { src_file_urls: keys.map((k) => nameOf(ctx, k)) }
    },
    costNote: '2 units per analysis.',
  },
  {
    id: 'hair-length', name: 'AI Hair Length Detection', category: 'Hair & Beard', emoji: '📏', kind: 'analysis',
    blurb: 'Measures hair length from a photo taken at a distance.',
    task: 'v2.0/task/hair-length-detection', output: 'analysis', analysis: 'hair',
    slots: [{ key: 'src', label: 'Your photo', kind: 'image', hint: 'Upper body with your whole face visible and the full hair length showing.', profile: 'face' }],
    params: [],
    build: (ctx) => src(ctx),
    costNote: '2 units per analysis.',
  },
  {
    id: 'hair-density', name: 'AI Hair Density Detection', category: 'Hair & Beard', emoji: '📊', kind: 'analysis',
    blurb: 'Grades scalp hair density.',
    task: 'v2.0/task/hair-density-detection', output: 'analysis', analysis: 'hair',
    slots: [{ key: 'src', label: 'Top of head', kind: 'image', hint: 'Tilt your head about 45° down so the crown is visible.' }],
    params: [],
    build: (ctx) => src(ctx),
    costNote: '1 unit per analysis.',
  },

  /* ---------------- Image ---------------- */
  {
    id: 'image-generator', name: 'AI Image Generator', category: 'Image', emoji: '🪄', kind: 'edit',
    blurb: 'Turns a text prompt into an image.',
    task: 'v2.0/task/text-to-image/youcam', output: 'image', slots: [],
    params: [
      { key: 'prompt', label: 'Prompt', type: 'text', default: 'An editorial photo of a pastel organza saree on a mannequin, soft daylight', maxLength: 500 },
      { key: 'size', label: 'Shape', type: 'select', default: '1104*1472', options: options(['1104*1472', 'Portrait'], ['1328*1328', 'Square'], ['1664*928', 'Landscape']) },
    ],
    build: (ctx) => ({ model: 'youcam-image-v2', prompt: str(ctx.params, 'prompt'), size: str(ctx.params, 'size'), prompt_extend: true }),
    costNote: '1 unit per image.',
  },
  {
    id: 'photo-enhance', name: 'AI Photo Enhance', category: 'Image', emoji: '✨', kind: 'edit',
    blurb: 'Sharpens and upscales a photo.',
    task: 'v2.0/task/enhance', output: 'image',
    slots: [{ key: 'src', label: 'Photo', kind: 'image', hint: 'Any photo.', profile: 'face' }],
    params: [{ key: 'scale', label: 'Upscale', type: 'select', default: '2', options: options(['1', 'Enhance only'], ['2', '2×'], ['4', '4×']) }],
    build: (ctx) => ({ ...src(ctx), scale: num(ctx.params, 'scale') }),
    costNote: '2 units per image.',
  },
  {
    id: 'ai-replace', name: 'AI Replace', category: 'Image', emoji: '🔁', kind: 'edit',
    blurb: 'Paint over an area and describe what should replace it.',
    task: 'v2.0/task/obj-replace', output: 'image',
    slots: [
      { key: 'src', label: 'Photo', kind: 'image', hint: 'Any photo.', profile: 'face' },
      { key: 'mask', label: 'Area to replace', kind: 'mask', hint: 'Paint over the area to change.', maskOf: 'src' },
    ],
    params: [{ key: 'prompt', label: 'Replace with', type: 'text', default: 'a gold statement necklace', maxLength: 200 }],
    build: (ctx) => ({ ...src(ctx), ...mask(ctx), prompt: str(ctx.params, 'prompt') }),
    costNote: '1 unit per image.',
  },
  {
    id: 'object-removal', name: 'AI Object Removal', category: 'Image', emoji: '🧽', kind: 'edit',
    blurb: 'Paint over something and it disappears.',
    task: 'v2.0/task/generative-fill', output: 'image',
    slots: [
      { key: 'src', label: 'Photo', kind: 'image', hint: 'Any photo.', profile: 'face' },
      { key: 'mask', label: 'Area to remove', kind: 'mask', hint: 'Paint over what should be removed.', maskOf: 'src' },
    ],
    params: [],
    build: (ctx) => ({ ...src(ctx), ...mask(ctx) }),
    costNote: '2 units per image.',
  },
  {
    id: 'colorize', name: 'AI Photo Colorize', category: 'Image', emoji: '🌈', kind: 'edit',
    blurb: 'Adds colour to black-and-white photos.',
    task: 'v2.0/task/colorize', output: 'images',
    slots: [{ key: 'src', label: 'Photo', kind: 'image', hint: 'A black-and-white or faded photo.' }],
    params: [],
    build: (ctx) => src(ctx),
    costNote: '2 units per image.',
  },
  {
    id: 'bg-removal', name: 'AI Background Removal', category: 'Image', emoji: '✂️', kind: 'edit',
    blurb: 'Cuts out the subject on a transparent background.',
    task: 'v2.0/task/sod', output: 'image',
    slots: [{ key: 'src', label: 'Photo', kind: 'image', hint: 'Any photo with a clear subject.', profile: 'body' }],
    params: [],
    build: (ctx) => src(ctx),
    costNote: '1 unit per image.',
  },
  {
    id: 'bg-change', name: 'AI Background Change', category: 'Image', emoji: '🏞️', kind: 'edit',
    blurb: 'A new background from a preset or a prompt.',
    task: 'v2.0/task/bg-replace', output: 'image',
    slots: [{ key: 'src', label: 'Photo', kind: 'image', hint: 'Any photo of a person.', profile: 'body' }],
    params: [
      { key: 'type', label: 'Background from', type: 'select', default: 'template', options: options(['template', 'Preset'], ['prompt', 'Prompt']) },
      { key: 'template', label: 'Preset', type: 'template', template: 'bg-replace', showIf: (p) => p.type === 'template' },
      { key: 'prompt', label: 'Describe it', type: 'text', default: 'A courtyard decorated with marigolds and fairy lights at dusk', maxLength: 300, showIf: (p) => p.type === 'prompt' },
    ],
    build: (ctx) => ctx.params.type === 'prompt'
      ? { ...src(ctx), type: 'prompt', prompt: str(ctx.params, 'prompt') }
      : { ...src(ctx), type: 'template', template_id: str(ctx.params, 'template') },
    costNote: '4 units per image.',
  },
  {
    id: 'headshot', name: 'AI Headshot Generator', category: 'Image', emoji: '🧑‍💼', kind: 'edit',
    blurb: 'Professional headshots from one selfie.',
    task: 'v2.0/task/headshot', output: 'images',
    slots: [selfieSlot()],
    params: [
      { key: 'template', label: 'Style', type: 'template', template: 'headshot' },
      { key: 'count', label: 'Images', type: 'select', default: '2', options: options(['2', '2'], ['4', '4']) },
    ],
    build: (ctx) => ({ ...src(ctx), template_id: str(ctx.params, 'template'), output_count: num(ctx.params, 'count') }),
    costNote: '1 unit per 2 images.',
  },
  {
    id: 'avatar', name: 'AI Avatar Generator', category: 'Image', emoji: '🧑‍🎨', kind: 'edit',
    blurb: 'Stylised profile avatars.',
    task: 'v2.0/task/ai-avatar', output: 'images',
    slots: [selfieSlot()],
    params: [{ key: 'template', label: 'Style', type: 'template', template: 'ai-avatar' }],
    build: (ctx) => ({ ...src(ctx), template_id: str(ctx.params, 'template'), output_count: 4 }),
    costNote: '1 unit per 4 images.',
  },

  /* ---------------- Video ---------------- */
  {
    id: 'video-generator', name: 'AI Video Generator', category: 'Video', emoji: '🎬', kind: 'edit',
    blurb: 'Turns a photo into a short video clip.',
    task: 'v2.0/task/image-to-video/youcam', output: 'video', timeoutMs: 600_000,
    slots: [{ key: 'src', label: 'Photo', kind: 'image', hint: 'A photo to animate.', profile: 'body', samples: [SAMPLES.fullBody] }],
    params: [
      { key: 'prompt', label: 'Motion', type: 'text', default: 'She turns slowly to show the outfit and smiles at the camera', maxLength: 300 },
      { key: 'duration', label: 'Length', type: 'select', default: '5', options: options(['5', '5 seconds'], ['10', '10 seconds']) },
    ],
    build: (ctx) => ({ ...src(ctx), model: 'youcam-video-v2', resolution: '480', dst_duration: num(ctx.params, 'duration'), prompt: str(ctx.params, 'prompt') }),
    costNote: '1 unit per second at 480p (5 or 10 units).',
  },
  {
    id: 'video-enhance', name: 'AI Video Enhancer', category: 'Video', emoji: '📹', kind: 'edit',
    blurb: 'Sharpens and upscales a short video.',
    task: 'v2.0/task/video-sr', output: 'video', timeoutMs: 600_000,
    slots: [videoSlot()], params: [],
    build: (ctx) => ({ ...src(ctx), dst_duration: seconds(ctx) }),
    costNote: '1 unit per 2 seconds (up to 5 units).',
  },
  {
    id: 'video-face-swap', name: 'AI Video Face Swap', category: 'Video', emoji: '🔄', kind: 'edit',
    blurb: 'Puts a face from a photo into a video. Use only faces you have permission to use.',
    task: 'v2.0/task/face-swap-vid', output: 'video', timeoutMs: 600_000,
    slots: [videoSlot('Video', 'One clearly visible face, up to 10 seconds.'), { ...selfieSlot('The face to swap in. Use your own face or one you have permission to use.'), key: 'ref', label: 'Face photo' }],
    params: [],
    build: (ctx) => ({ ...src(ctx), ...ref(ctx), dst_duration: seconds(ctx) }),
    costNote: '1 unit per 5 seconds.',
  },
  {
    id: 'video-style', name: 'AI Video Style Transfer', category: 'Video', emoji: '🎨', kind: 'edit',
    blurb: 'Restyles a short video.',
    task: 'v2.0/task/video-trans', output: 'video', timeoutMs: 600_000,
    slots: [videoSlot('Video', 'Up to 10 seconds. Costs 4 units per second.')],
    params: [{ key: 'template', label: 'Style', type: 'template', template: 'video-trans' }],
    build: (ctx) => ({ ...src(ctx), template_id: str(ctx.params, 'template'), dst_duration: seconds(ctx) }),
    costNote: '4 units per second (up to 40 units).',
  },
  {
    id: 'video-bg', name: 'AI Video Background Replace', category: 'Video', emoji: '🌆', kind: 'edit',
    blurb: 'Swaps a video’s background for an image.',
    task: 'v2.0/task/bg-replace-vid', output: 'video', timeoutMs: 600_000,
    slots: [videoSlot('Video', 'A person in frame, up to 10 seconds.'), { key: 'ref', label: 'Background image', kind: 'image', hint: 'Any landscape photo.' }],
    params: [{ key: 'mode', label: 'Fit', type: 'select', default: 'crop', options: options(['crop', 'Crop to fill'], ['stretch', 'Stretch']) }],
    build: (ctx) => ({ ...src(ctx), ...ref(ctx), background_mode: str(ctx.params, 'mode') }),
    costNote: '2 units per second.',
  },
  {
    id: 'video-object-removal', name: 'AI Video Object Removal', category: 'Video', emoji: '🧽', kind: 'edit',
    blurb: 'Paint over an object on the first frame and it is removed throughout.',
    task: 'v2.0/task/obj-rem-vid', output: 'video', timeoutMs: 600_000,
    slots: [
      { ...videoSlot('Video', 'Up to 10 seconds.'), fileEndpoint: '/s2s/v2.0/file/obj-rem-vid' },
      { key: 'mask', label: 'Object to remove', kind: 'mask', hint: 'Paint over the object on the first frame.', maskOf: 'src' },
    ],
    params: [],
    build: (ctx) => ({ ...src(ctx), ...mask(ctx), frame_idx: 0 }),
    costNote: '2 units per second.',
  },
]

export function getFeature(id: string): AIFeature | undefined {
  return AI_FEATURES.find((x) => x.id === id)
}

/** Default values for a feature's parameters. */
export function defaultParams(feature: AIFeature): Params {
  return Object.fromEntries(
    feature.params.filter((p) => p.type !== 'template' || p.default).map((p) => [p.key, p.default as Params[string]]),
  )
}
