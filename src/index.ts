import fs from "fs";
import path from "path";
import {
  walkAndAggrMetadata,
  walkAndTagDirs,
  writeAggrMetaData,
} from "./audiobook-walkdir";
import { prisma } from "./data/prisma";

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//~~ This is the entry point when testing
//~~ using the "npm run start"
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function main() {
  const result = prisma.books.findFirst({
    where: {
      author: {
        contains: "king",
        mode: "insensitive",
      },
      pageCount: {
        gt: 500,
      },
    },
  });
  return result;
}

main()
  .then((res) => {
    console.log("result", res);
  })
  .catch((e) => console.log("ERROR", e));
// const dir = "D:/Dropbox/Mark/myAudioBooks";
// const dir = "D:/Dropbox/Mark/myAudioBooks/NonFiction";
// walkAndTagDirs(dir, "yes");

//!
// writeAggrMetaData(dir, "c:/localProgramming", "myfiletest.json");

//const res = walkAndAggrMetadata(dir);
// fs.writeFileSync(
//   path.join(dir, "testingFileMetadata.json"),
//   JSON.stringify(res.folderMetadataArray)
// );
// walkDir returns a promise, we must THEN it.
// walkAndTagDirs(dir, "yes").then((res) => {
// fs.writeFileSync(
//   path.join(dir, "directoryArray.json"),
//   JSON.stringify(res.dirArray)
// );
// fs.writeFileSync(
//   path.join(dir, "AllAudioBooks.json"),
//   JSON.stringify(res.folderMetadataArray)
// );
//});
