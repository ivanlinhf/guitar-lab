import openStringsJson from './open-strings.json';
import cAmSwitchJson from './c-am-switch.json';

/** Raw built-in song fixtures (formatVersion 1). Validated via parseSongDocument. */
export const songFixtures = [openStringsJson, cAmSwitchJson] as const;

export { openStringsJson, cAmSwitchJson };
