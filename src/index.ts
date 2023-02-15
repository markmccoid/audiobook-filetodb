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

const dirToTest = "D:/Dropbox/Mark/myAudioBooks";
async function main() {
  const { queryGoogle, dirArray, folderMetadataArray } = await walkAndTagDirs(
    dirToTest,
    "yes"
  );

  console.log("Done Processing", folderMetadataArray.length);

  // const result = await prisma.books.findRaw({
  //   filter: { _id: { $eq: { $oid: "63c8c4183e2f12c0e4b0cce0" } } },
  //   options: { projection: { _id: true, showRecordId: true } },
  // });
  // //const newRes: Test[] = result;
  // return result[0];

  // const createdBook = await prisma.books.create({
  //   data: {
  //     primaryCategory: "primaryCategory",
  //     secondaryCategory: "secondaryCategory",
  //     title: "title",
  //     author: "author",
  //     description: "description",
  //     imageURL: "imageURL",
  //     bookLengthMinutes: 100, // find conversion is seed function
  //     bookLengthText: "1 hr 40min", // find conversion is seed function
  //     dropboxLocation: "dropboxLocation",
  //     genres: "genres",
  //     narratedBy: "narratedBy",
  //     pageCount: 100,
  //     publishedYear: 1970,
  //     releaseDate: new Date(),
  //     source: "test",
  //   },
  // });
  // return createdBook;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
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
