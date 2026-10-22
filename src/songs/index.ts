import openStringsJson from './open-strings.json';
import cAmSwitchJson from './c-am-switch.json';
import eightBarDrillJson from './eight-bar-drill.json';
import twinkleSnippetJson from './twinkle-snippet.json';
import gCdSwitchJson from './g-c-d-switch.json';

/** Raw built-in song fixtures (formatVersion 1). Validated via parseSongDocument. */
export const songFixtures = [
  openStringsJson,
  cAmSwitchJson,
  eightBarDrillJson,
  twinkleSnippetJson,
  gCdSwitchJson,
] as const;

export {
  openStringsJson,
  cAmSwitchJson,
  eightBarDrillJson,
  twinkleSnippetJson,
  gCdSwitchJson,
};
