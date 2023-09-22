import { parseFile } from "music-metadata";
import { inspect } from "util";

(async () => {
  const file =
    "D:/Dropbox/Mark/myAudioBooks/Fiction/SciFi/N-Z/Andy Weir-The Egg and Other Stories/Andy Weir-The Egg and Other Stories.m4b";
  try {
    const metadata = await parseFile(file);
    console.log(inspect(metadata, { showHidden: false, depth: null }));
    console.log(metadata.native.iTunes);
    console.log(metadata);
  } catch (error) {
    console.error(error.message);
  }
})();
