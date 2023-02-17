"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const readline = require("readline");
const audibleMaps_1 = require("./audibleMaps");
const fetchData_1 = require("./fetchData");
const audibleFetch_1 = require("./audibleFetch");
let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function processAudibleObjArr() {
    var _a;
    const bookData = JSON.parse(fs.readFileSync("../audibleBooks.json", {
        encoding: "utf-8",
    }));
    //~ ------------------------------------------------------------
    //console.log(bookData[0].author, bookData[0].title);
    const primaryCatList = [];
    const secondaryCatList = [];
    for (let book of bookData) {
        book.id = `audible-${book.Author}~${book.Title}`.replace(/\s/g, "_");
        book.googleAPIData = (await (0, fetchData_1.getBookData)(book.Author, book.Title)) || {};
        console.log("google", book.Title, (_a = book.googleAPIData) === null || _a === void 0 ? void 0 : _a.error);
        await sleep(1000);
    }
    // console.log("bookAray", bookData);
    const bookArray = bookData.map((book) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const author = book.Author || ((_a = book.googleAPIData) === null || _a === void 0 ? void 0 : _a.authors[0]);
        const title = book.Title ||
            `${(_b = book.googleAPIData) === null || _b === void 0 ? void 0 : _b.title}: ${(_c = book.googleAPIData) === null || _c === void 0 ? void 0 : _c.subTitle}`;
        const description = (_d = book.googleAPIData) === null || _d === void 0 ? void 0 : _d.description;
        const publishedYear = parseInt(book.Year) ||
            parseInt((_f = (_e = book.googleAPIData) === null || _e === void 0 ? void 0 : _e.publishedDate) === null || _f === void 0 ? void 0 : _f.slice(0, 4));
        const releaseDate = (_g = book.googleAPIData) === null || _g === void 0 ? void 0 : _g.publishedDate;
        const imageURL = (_h = book.googleAPIData) === null || _h === void 0 ? void 0 : _h.imageURL;
        // Concate all categories together and filter out blanks (we remove dups when assigning to object)
        const categories = [
            book.Genre,
            ...(((_j = book.googleAPIData) === null || _j === void 0 ? void 0 : _j.categories) || []),
        ].filter((el) => el);
        const genreArray = book.Genre.split(" - ");
        primaryCatList.push(genreArray[0]);
        secondaryCatList.push(genreArray[genreArray.length - 1]);
        return {
            id: book.id,
            fullPath: "Audible",
            audioFileCount: 1,
            title,
            description,
            author,
            authors: (_k = book.googleAPIData) === null || _k === void 0 ? void 0 : _k.authors,
            narratedBy: book.Narrator,
            publishedYear,
            releaseDate,
            publisher: (_l = book.googleAPIData) === null || _l === void 0 ? void 0 : _l.publisher,
            pageCount: parseInt((_m = book.googleAPIData) === null || _m === void 0 ? void 0 : _m.pageCount) || undefined,
            bookLength: book.Duration,
            imageURL,
            categories: Array.from(new Set(categories)),
            pathDirArray: undefined,
            pathPrimaryCat: audibleMaps_1.primaryCatMap[genreArray[0]],
            pathSecondaryCat: audibleMaps_1.secondaryCatMap[genreArray[genreArray.length - 1]],
        };
    });
    //~ ------------------------------------------------------------
    // Write Cat lists out to file
    fs.writeFileSync("CatLists.json", JSON.stringify({
        primaryCats: Array.from(new Set(primaryCatList)),
        secondaryCats: Array.from(new Set(secondaryCatList)),
    }));
    return bookArray;
}
///------------------------------------
function convertOriginalCSV() {
    const stream = fs.createReadStream("../audibleBookData.csv");
    const rl = readline.createInterface({ input: stream });
    let data = [];
    rl.on("line", (row) => {
        data.push(row.split(","));
    });
    rl.on("close", () => {
        processData(data);
    });
}
function processData(data) {
    const header = data.shift();
    console.log(header);
    const finalBookList = [];
    for (let el of data) {
        const bookEl = el.reduce((final, item, index) => {
            final = { ...final, [header[index]]: item.replace("|", ",") };
            return final;
        }, {});
        finalBookList.push(bookEl);
    }
    console.log(finalBookList);
    fs.writeFileSync(`audibleBooks.json`, JSON.stringify(finalBookList));
}
// convertOriginalCSV();
// processAudibleObjArr().then((cleanList) => {
//   fs.writeFileSync(`audibleBooks-Clean.json`, JSON.stringify(cleanList));
// });
// const bookData = fs.readFileSync("audibleBooks-enhanced.json", {
//   encoding: "utf-8",
// });
// const final = JSON.parse(bookData).map((book) => ({
//   id: `audible-${book.author}~${book.title}~${Math.floor(
//     Math.random() * 1000
//   )}`.replace(/\s/g, "_"),
//   ...book,
// }));
// fs.writeFileSync("audiblebooks-withid.json", JSON.stringify(final));
async function mergeAudibleData() {
    const bookData = JSON.parse(fs.readFileSync("audibleBooks.json", {
        encoding: "utf-8",
    }));
    for (let book of bookData) {
        const audibleData = await (0, audibleFetch_1.getAudibleData)(book.author, book.title);
        book.description = audibleData.description;
        book.imageURL = audibleData.imageURL;
        book.asin = audibleData.asin;
    }
    fs.writeFileSync("audibleBooks-enhanced.json", JSON.stringify(bookData));
}
mergeAudibleData();
