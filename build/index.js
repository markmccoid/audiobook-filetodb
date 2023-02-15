"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const audiobook_walkdir_1 = require("./audiobook-walkdir");
const prisma_1 = require("./data/prisma");
const dirToTest = "D:/Dropbox/Mark/myAudioBooks";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const { queryGoogle, dirArray, folderMetadataArray } = yield (0, audiobook_walkdir_1.walkAndTagDirs)(dirToTest, "yes");
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
    });
}
main()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.$disconnect();
}))
    .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(e);
    yield prisma_1.prisma.$disconnect();
    process.exit(1);
}));
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
