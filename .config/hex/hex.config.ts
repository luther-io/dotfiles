import { defineHexConfig } from "@hex/commands"

// Hex runs this file itself and reloads it when you save. It is plain
// TypeScript or JavaScript with no npm packages: transformations return text.
// fetch and node:child_process are there once you allow them in Hex; see
// https://anoma.ly/hex/docs/transforms

// Whole-word filler sounds (um, umm, uh, uhh, er, erm, ah, ahh, hmm, ...) with
// an optional trailing comma or period and the space after it. Word boundaries
// keep real words like "summer", "there", and "around" intact.
const FILLERS = /\b(?:um+|uh+|erm|er|ah+|hmm+)\b[,.]?\s*/gi

export default defineHexConfig({
  // Transformations appear as optional final steps in every dictation mode.
  transformations: {
    "drop-fillers": {
      name: "Drop filler words",
      description: "Remove um, uh, er, ah, hmm and friends",
      transform: (text) => text.replace(FILLERS, ""),
    },
  },
})
