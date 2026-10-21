import openStringsJson from './open-strings.json';
import cAmSwitchJson from './c-am-switch.json';
import eightBarDrillJson from './eight-bar-drill.json';

/** Raw built-in song fixtures (formatVersion 1). Validated via parseSongDocument. */
export const songFixtures = [
  openStringsJson,
  cAmSwitchJson,
  eightBarDrillJson,
] as const;

export { openStringsJson, cAmSwitchJson, eightBarDrillJson };
