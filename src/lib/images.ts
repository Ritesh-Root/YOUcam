/* Image helpers for photos kept on the device. */

/** Reads an image file, scales it to fit maxSide and returns a JPEG data URL. */
export function imageToDataUrl(file: Blob, maxSide = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Could not read that photo.'))
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that photo. Use a JPEG or PNG.'))
    }
    img.src = url
  })
}

/** Downloads a YouCam result (valid for 2 hours) and keeps a resized copy. */
export async function keepResult(url: string, maxSide = 1280): Promise<string | undefined> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // no-store avoids reusing a cached copy that was fetched without CORS headers.
      const res = await fetch(url, { cache: 'no-store', mode: 'cors' })
      if (res.ok) return await imageToDataUrl(await res.blob(), maxSide)
    } catch {
      /* retry once */
    }
  }
  return undefined
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',')
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}
