import { z } from 'zod';
import type { SongDocument } from './types.ts';

const guitarStringSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

const noteEventSchema = z.object({
  type: z.literal('note'),
  beat: z.number().finite(),
  durationBeats: z.number().finite().positive(),
  string: guitarStringSchema,
  fret: z.number().int().nonnegative(),
});

const restEventSchema = z.object({
  type: z.literal('rest'),
  beat: z.number().finite(),
  durationBeats: z.number().finite().positive(),
});

const scoreEventSchema = z.discriminatedUnion('type', [
  noteEventSchema,
  restEventSchema,
]);

const measureSchema = z.object({
  index: z.number().int().positive(),
  chord: z.string().optional(),
  events: z.array(scoreEventSchema),
});

const timeSignatureSchema = z.object({
  numerator: z.number().finite().positive(),
  denominator: z.number().finite().positive(),
});

/** Compile-time coupled to SongDocument — drift from types.ts fails tsc. */
export const SongDocumentSchema: z.ZodType<SongDocument> = z
  .object({
    formatVersion: z.literal(1),
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    tuning: z.array(z.string()).length(6),
    bpm: z.number().finite().positive(),
    timeSignature: timeSignatureSchema,
    measures: z.array(measureSchema),
  })
  .superRefine((doc, ctx) => {
    for (let i = 0; i < doc.measures.length; i++) {
      const expected = i + 1;
      const actual = doc.measures[i]!.index;
      if (actual !== expected) {
        ctx.addIssue({
          code: 'custom',
          path: ['measures', i, 'index'],
          message: `measures[${i}].index must be ${expected} (consecutive from 1), got ${actual}`,
        });
      }
    }

    const numerator = doc.timeSignature.numerator;
    for (let mi = 0; mi < doc.measures.length; mi++) {
      const measure = doc.measures[mi]!;
      for (let ei = 0; ei < measure.events.length; ei++) {
        const event = measure.events[ei]!;
        const pathPrefix = ['measures', mi, 'events', ei] as const;

        if (event.beat < 0) {
          ctx.addIssue({
            code: 'custom',
            path: [...pathPrefix, 'beat'],
            message: `beat must be ≥ 0, got ${event.beat}`,
          });
        }

        const end = event.beat + event.durationBeats;
        if (end > numerator) {
          ctx.addIssue({
            code: 'custom',
            path: [...pathPrefix],
            message: `beat + durationBeats (${end}) must be ≤ timeSignature.numerator (${numerator})`,
          });
        }
      }
    }
  });

/** Format a Zod issue into a readable path + message string. */
function formatIssue(issue: z.ZodIssue): string {
  const path =
    issue.path.length > 0
      ? issue.path.map(String).join('.')
      : '(root)';
  return `${path}: ${issue.message}`;
}

/**
 * Parse and validate unknown JSON into a SongDocument.
 * On failure, throws an Error whose message lists path/field details.
 */
export function parseSongDocument(input: unknown): SongDocument {
  const result = SongDocumentSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map(formatIssue).join('; ');
    throw new Error(`Invalid SongDocument: ${details}`);
  }
  return result.data;
}
