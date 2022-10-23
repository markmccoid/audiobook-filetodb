import fs from "fs";
import path from "path";
import { walkAndAggrMetadata, walkAndTagDirs } from "./audiobook-walkdir";

const dir = "C:/localStuff/demonoid/AudioBooks/Test";
// const dir = "D:/Dropbox/Mark/myAudioBooks/Biographies";
//const res = walkAndAggrMetadata(dir);
// fs.writeFileSync(
//   path.join(dir, "testingFileMetadata.json"),
//   JSON.stringify(res.folderMetadataArray)
// );

// walkDir returns a promise, we must THEN it.
walkAndTagDirs(dir, "yes").then((res) => {
  // fs.writeFileSync(
  //   path.join(dir, "directoryArray.json"),
  //   JSON.stringify(res.dirArray)
  // );
  // fs.writeFileSync(
  //   path.join(dir, "AllAudioBooks.json"),
  //   JSON.stringify(res.folderMetadataArray)
  // );
});
