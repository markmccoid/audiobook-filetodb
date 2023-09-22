"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const music_metadata_1 = require("music-metadata");
const util_1 = require("util");
(async () => {
    const file = "D:/Dropbox/Mark/myAudioBooks/Fiction/SciFi/N-Z/Andy Weir-The Egg and Other Stories/Andy Weir-The Egg and Other Stories.m4b";
    try {
        const metadata = await (0, music_metadata_1.parseFile)(file);
        console.log((0, util_1.inspect)(metadata, { showHidden: false, depth: null }));
        console.log(metadata.native.iTunes);
    }
    catch (error) {
        console.error(error.message);
    }
})();
