import { songFixtures } from '../../songs/index.ts'
import { parseSongDocument } from '../score/schema.ts'
import type { SongDocument } from '../score/types.ts'

export type SongListItem = { id: string; title: string }

/**
 * Try to parse a raw fixture; on failure warn and return null (design-spec §4.4).
 */
function tryParseSong(entry: unknown): SongDocument | null {
  try {
    return parseSongDocument(entry)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`Skipping invalid song entry: ${message}`)
    return null
  }
}

/**
 * List built-in songs that pass validation. Invalid fixtures are warned and skipped.
 * Optional `entries` overrides the default `songFixtures` (useful in tests).
 */
export function listSongs(
  entries: readonly unknown[] = songFixtures,
): SongListItem[] {
  const items: SongListItem[] = []
  for (const entry of entries) {
    const doc = tryParseSong(entry)
    if (doc) {
      items.push({ id: doc.id, title: doc.title })
    }
  }
  return items
}

/**
 * Load one song by id. Returns null for unknown id or invalid matching entry
 * (warns on parse failure; does not throw).
 * Optional `entries` overrides the default `songFixtures` (useful in tests).
 */
export function getSongById(
  id: string,
  entries: readonly unknown[] = songFixtures,
): SongDocument | null {
  for (const entry of entries) {
    const doc = tryParseSong(entry)
    if (doc?.id === id) {
      return doc
    }
  }
  return null
}
