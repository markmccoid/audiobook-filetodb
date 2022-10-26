"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audiobook_walkdir_1 = require("./audiobook-walkdir");
const dir = "C:/localStuff/demonoid/AudioBooks/Test";
// const dir = "D:/Dropbox/Mark/myAudioBooks/Biographies";
//const res = walkAndAggrMetadata(dir);
// fs.writeFileSync(
//   path.join(dir, "testingFileMetadata.json"),
//   JSON.stringify(res.folderMetadataArray)
// );
// walkDir returns a promise, we must THEN it.
(0, audiobook_walkdir_1.walkAndTagDirs)(dir, "yes").then((res) => {
    // fs.writeFileSync(
    //   path.join(dir, "directoryArray.json"),
    //   JSON.stringify(res.dirArray)
    // );
    // fs.writeFileSync(
    //   path.join(dir, "AllAudioBooks.json"),
    //   JSON.stringify(res.folderMetadataArray)
    // );
});
