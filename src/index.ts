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

type Test = {
  _id: string;
};
async function main() {
  const result = await prisma.books.findRaw({
    filter: { _id: { $eq: { $oid: "63c8c4183e2f12c0e4b0cce0" } } },
    options: { projection: { _id: true, showRecordId: true } },
  });
  //const newRes: Test[] = result;
  return result[0];
}

main()
  .then((res) => {
    console.log("result", Object.keys(res));
    console.log(res["_id"]["$oid"]);
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
