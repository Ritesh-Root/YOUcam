/*
 * Catalog of provider-backed AI capabilities (YouCam / MakeupAR AI API).
 * These require backend credentials to run live, so in this build they open a
 * generic feature screen that clearly marks them as "requires setup" and shows a
 * clearly-labeled demo preview — never an unlabeled or simulated live result.
 */

export type FeatureCategory =
  | 'Skin, Face & Body'
  | 'Beauty'
  | 'Fashion'
  | 'Jewelry & Watches'
  | 'Hair & Beard'
  | 'Image'
  | 'Video'

export type AIFeature = {
  id: string
  name: string
  category: FeatureCategory
  emoji: string
  blurb: string
  kind: 'analysis' | 'tryon' | 'edit'
}

export const FEATURE_CATEGORIES: { name: FeatureCategory; emoji: string }[] = [
  { name: 'Skin, Face & Body', emoji: '🧖‍♀️' },
  { name: 'Beauty', emoji: '💄' },
  { name: 'Fashion', emoji: '👗' },
  { name: 'Jewelry & Watches', emoji: '💍' },
  { name: 'Hair & Beard', emoji: '💇‍♀️' },
  { name: 'Image', emoji: '🖼️' },
  { name: 'Video', emoji: '🎬' },
]

const f = (
  id: string,
  name: string,
  category: FeatureCategory,
  emoji: string,
  blurb: string,
  kind: AIFeature['kind'],
): AIFeature => ({ id, name, category, emoji, blurb, kind })

export const AI_FEATURES: AIFeature[] = [
  // Skin, Face & Body
  f('skin-analysis', 'AI Skin Analysis', 'Skin, Face & Body', '🔬', 'Analyze skin concerns and get a tailored routine.', 'analysis'),
  f('skin-simulation', 'AI Skin Simulation', 'Skin, Face & Body', '📈', 'Before-and-after visuals of skincare over time.', 'analysis'),
  f('fitzpatrick', 'AI Fitzpatrick Skin Type', 'Skin, Face & Body', '🎚️', 'Estimate skin type across six tones.', 'analysis'),
  f('facial-tones', 'AI Facial Color Tones', 'Skin, Face & Body', '🎨', 'Detect skin, eye and hair tones for palettes.', 'analysis'),
  f('face-ratio', 'AI Face Attributes & Ratio', 'Skin, Face & Body', '📐', 'Analyze facial attributes and proportions.', 'analysis'),
  f('face-lift', 'AI Face Lift', 'Skin, Face & Body', '✨', 'Preview subtle lift transformations.', 'edit'),
  f('face-reshape', 'AI Face Reshape', 'Skin, Face & Body', '🙂', 'Preview natural face reshaping.', 'edit'),
  f('body-reshape', 'AI Body Reshape', 'Skin, Face & Body', '🧍', 'Preview natural body reshaping.', 'edit'),
  f('aging', 'AI Aging Simulation', 'Skin, Face & Body', '⏳', 'See how a look may age over time.', 'edit'),
  f('smile', 'AI Smile', 'Skin, Face & Body', '😊', 'Add natural, realistic smiles.', 'edit'),
  f('teeth', 'AI Teeth Whitening', 'Skin, Face & Body', '🦷', 'Brighten teeth for a camera-ready look.', 'edit'),

  // Beauty
  f('makeup-transfer', 'AI Makeup Transfer', 'Beauty', '💋', 'Copy makeup from a reference photo.', 'tryon'),
  f('makeup-tryon', 'AI Makeup Virtual Try-On', 'Beauty', '💄', 'Try 13+ makeup categories in real time.', 'tryon'),
  f('look-tryon', 'AI Look Virtual Try-On', 'Beauty', '🌟', 'Apply a full makeup look in one click.', 'tryon'),
  f('nail-transfer', 'AI Nail Transfer', 'Beauty', '💅', 'Apply nail designs from a reference.', 'tryon'),
  f('nail-tryon', 'AI Nail Virtual Try-On', 'Beauty', '💅', 'Preview nails in any color or texture.', 'tryon'),
  f('lens-tryon', 'AI Eye Color Lens Try-On', 'Beauty', '👁️', 'Preview contact-lens eye colors.', 'tryon'),

  // Fashion
  f('clothes-tryon', 'AI Clothes Virtual Try-On', 'Fashion', '👚', 'Try tops, bottoms and full outfits.', 'tryon'),
  f('fabric-tryon', 'AI Fabric Virtual Try-On', 'Fashion', '🧵', 'Swap fabrics and textures on outfits.', 'tryon'),
  f('bag-tryon', 'AI Bag Virtual Try-On', 'Fashion', '👜', 'Preview bags with true-to-life scaling.', 'tryon'),
  f('scarf-tryon', 'AI Scarf Virtual Try-On', 'Fashion', '🧣', 'Try scarves, styles and draping.', 'tryon'),
  f('shoes-tryon', 'AI Shoes Virtual Try-On', 'Fashion', '👟', 'Preview shoes on your feet.', 'tryon'),
  f('hat-tryon', 'AI Hat Virtual Try-On', 'Fashion', '👒', 'Try hats and headpieces.', 'tryon'),

  // Jewelry & Watches
  f('ring-tryon', 'AI Ring Virtual Try-On', 'Jewelry & Watches', '💍', 'Preview rings on your hand.', 'tryon'),
  f('bracelet-tryon', 'AI Bracelet Virtual Try-On', 'Jewelry & Watches', '📿', 'Preview bracelets on your wrist.', 'tryon'),
  f('earrings-tryon', 'AI Earrings Virtual Try-On', 'Jewelry & Watches', '👂', 'Preview earrings in real time.', 'tryon'),
  f('watch-tryon', 'AI Watch Virtual Try-On', 'Jewelry & Watches', '⌚', 'Preview watches on your wrist.', 'tryon'),
  f('necklace-tryon', 'AI Necklace Virtual Try-On', 'Jewelry & Watches', '📿', 'Preview necklaces on your neckline.', 'tryon'),

  // Hair & Beard
  f('hair-color', 'AI Hair Color Try-On', 'Hair & Beard', '🎨', 'Try unlimited hair colors.', 'tryon'),
  f('hairstyle', 'AI Hairstyle Try-On', 'Hair & Beard', '💇‍♀️', 'From pixies to wolf cuts, try it all.', 'tryon'),
  f('hair-extension', 'AI Hair Extension Try-On', 'Hair & Beard', '💇', 'Preview lengths, colors and bangs.', 'tryon'),
  f('bangs', 'AI Bangs Filter Try-On', 'Hair & Beard', '💁‍♀️', 'See yourself with different bangs.', 'tryon'),
  f('hair-volume', 'AI Hair Volume Try-On', 'Hair & Beard', '🌀', 'Preview fuller, voluminous hair.', 'tryon'),
  f('wavy-hair', 'AI Wavy Hair Try-On', 'Hair & Beard', '〰️', 'Try wavy and curly transformations.', 'tryon'),
  f('hair-type', 'AI Hair Type Detection', 'Hair & Beard', '🔎', 'Analyze curl pattern and hair type.', 'analysis'),
  f('hair-density', 'AI Hair Density Detection', 'Hair & Beard', '📊', 'Estimate hair density grades.', 'analysis'),
  f('beard', 'AI Beard Style Generator', 'Hair & Beard', '🧔', 'Visualize beard shapes and styles.', 'tryon'),

  // Image
  f('image-generator', 'AI Image Generator', 'Image', '🪄', 'Turn text and images into visuals.', 'edit'),
  f('photo-enhance', 'AI Photo Enhance', 'Image', '✨', 'Sharpen, upscale and fix colors.', 'edit'),
  f('ai-replace', 'AI Replace', 'Image', '🔁', 'Remove and replace objects with prompts.', 'edit'),
  f('object-removal', 'AI Object Removal', 'Image', '🧽', 'Remove unwanted objects precisely.', 'edit'),
  f('colorize', 'AI Photo Colorize', 'Image', '🌈', 'Colorize and repair old photos.', 'edit'),
  f('bg-removal', 'AI Background Removal', 'Image', '✂️', 'Remove photo backgrounds cleanly.', 'edit'),
  f('bg-change', 'AI Background Change', 'Image', '🏞️', 'Swap or generate new backgrounds.', 'edit'),
  f('headshot', 'AI Headshot Generator', 'Image', '🧑‍💼', 'Create professional headshots.', 'edit'),
  f('avatar', 'AI Avatar Generator', 'Image', '🧑‍🎨', 'Create stylized profile avatars.', 'edit'),

  // Video
  f('video-generator', 'AI Video Generator', 'Video', '🎬', 'Turn any image into a dynamic video.', 'edit'),
  f('video-enhance', 'AI Video Enhancer', 'Video', '📹', 'Fix blur and sharpen low-quality video.', 'edit'),
  f('video-face-swap', 'AI Video Face Swap', 'Video', '🔄', 'Swap faces in videos realistically.', 'edit'),
  f('video-style', 'AI Video Style Transfer', 'Video', '🎨', 'Transform footage into artistic styles.', 'edit'),
  f('video-bg', 'AI Video Background Replace', 'Video', '🌆', 'Generate and swap video backgrounds.', 'edit'),
  f('video-object-removal', 'AI Video Object Removal', 'Video', '🧽', 'Remove flaws and objects from video.', 'edit'),
]

export function getFeature(id: string): AIFeature | undefined {
  return AI_FEATURES.find((x) => x.id === id)
}
