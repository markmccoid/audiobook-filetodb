"use strict";
/**
 * Function will read through a directory structure and return an object
 * of meta data.
 * Expects the directory structure to be formatted as follows if you pass in:
 * c:\hold\Fiction
 * - GenreOne
 * | - Author-Title
 * | - Author-Title
 * - GenreTwo
 * | - Author-Title
 * | - Author-Title
 *  ...
 *
 * This will save a json file in the format of:
 * {
 *  "GenreOne": {
 *    "basePath": "full path to genre folder",
 *    "genre": "GenreOne",
 *    "titles": [
 *      {
 *        "author": ,
 *        "title": ,
 *       }
 *     ]
 *  }
 * }
 */
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
exports.walkDir = void 0;
const { count } = require("console");
const fs = require("fs");
const path = require("path");
const { getBookData, fakeGetBookData } = require("./fetchData");
//-- Local contants
const AUDIOFORMATS = [".mp3", ".mb4", ".mp4"];
/**
 * Convert the passed dirPath to use the passed pathSep
 * @param {*} dirPath
 * @param {*} pathSep
 * @returns
 */
function formatPath(dirPath, pathSep = "/") {
    const pathArray = dirPath.split(path.sep);
    return pathArray.join(pathSep);
}
/**
 * parseDirName
 * - format 1 - Tim S. Grover - 2021 - Winning (Business)
 * - format 2 - Tim S. Grover-Winning
 * @param {*} dirName
 */
function parseFolderName(dirName) {
    let bookCategory = "";
    let bookTitle = "";
    let bookAuthor = "";
    let bookYear = "";
    // Create string without the category (if it exists)
    let sansCategory = dirName;
    let format = "format1";
    //-- Get the CATEGORY
    const startCategory = dirName.indexOf("(") !== -1 ? dirName.indexOf("(") + 1 : -1;
    const endCategory = dirName.indexOf(")");
    if (startCategory !== -1 && endCategory !== -1) {
        // assing a book category
        bookCategory = dirName.slice(startCategory, endCategory).trim();
        // used to extract the title of book
        sansCategory = dirName.slice(0, startCategory - 1);
    }
    // Check if format 1
    if (bookCategory === "") {
        format = "format2";
    }
    if ((format = "format1")) {
        //-- Get the YEAR
        const startYear = sansCategory.indexOf("-") !== -1 ? sansCategory.indexOf("-") + 1 : -1;
        const endYear = sansCategory.lastIndexOf("-") !== -1
            ? sansCategory.lastIndexOf("-") - 1
            : -1;
        if (startYear !== -1 && endYear !== -1) {
            bookYear = sansCategory.slice(startYear, endYear).trim();
            // Make sure we extracted a 4 digit number, if not blank out bookYear
            let isnum = /^\d\d\d\d$/.test(bookYear);
            if (!isnum) {
                bookYear = "";
            }
        }
        //-- Get the TITLE and AUTHOR
        const startTitle = sansCategory.lastIndexOf("-") !== -1
            ? sansCategory.lastIndexOf("-") + 1
            : -1;
        if (startTitle !== -1) {
            bookTitle = sansCategory.slice(startTitle).trim();
        }
        const endAuthor = dirName.indexOf("-") !== -1 ? dirName.indexOf("-") - 1 : -1;
        bookAuthor = dirName.slice(0, endAuthor).trim();
    }
    else {
        //! Format 2
        //-- Get the TITLE and AUTHOR
        const startTitle = dirName.indexOf("-") + 1;
        if (startTitle !== -1) {
            bookTitle = dirName.slice(startTitle).trim();
        }
        const endAuthor = dirName.indexOf("-") - 1;
        bookAuthor = dirName.slice(0, endAuthor).trim();
    }
    return {
        folderBookAuthor: bookAuthor,
        folderBookTitle: bookTitle,
        folderBookCategory: bookCategory,
        folderBookYear: bookYear,
    };
}
function parseBookInfoText(textFile) {
    const lines = fs.readFileSync(textFile).toString().split("\r\n");
    let foundSummaryFlag = false;
    let bookInfo = {};
    let summary = [];
    for (let line of lines) {
        // Since summary exists at the end of the file and is multiple line
        // We set a flag and once true, just push all lines into summary array
        // before returning, we join array elements
        if (foundSummaryFlag) {
            summary.push(line);
            continue;
        }
        const lowercaseLine = line.toLowerCase();
        //-- Length Of Book
        if (lowercaseLine.includes("length:")) {
            bookInfo.length = line
                .slice(line.toLowerCase().indexOf("length:") + 7)
                .trim();
            continue;
        }
        //-- Author and Narrator
        if (lowercaseLine.includes("by:")) {
            if (lowercaseLine.indexOf("by:") < 2) {
                bookInfo.author = line.substring(lowercaseLine.indexOf(":") + 1).trim();
            }
            if (lowercaseLine.indexOf("by:") > 2 &&
                lowercaseLine.includes("narrat")) {
                bookInfo.narratedBy = line
                    .substring(lowercaseLine.indexOf(":") + 1)
                    .trim();
            }
            continue;
        }
        //-- Release date
        if (lowercaseLine.includes("release")) {
            bookInfo.releaseDate = line
                .substring(lowercaseLine.indexOf(":") + 1)
                .trim();
        }
        //-- Other Categories
        if (lowercaseLine.includes("categor")) {
            bookInfo.otherCategories = line
                .substring(lowercaseLine.indexOf(":") + 1)
                .trim()
                .split(",")
                .map((el) => el.trim());
        }
        //-- Publisher Summary
        if (lowercaseLine.includes("publisher's summary") ||
            lowercaseLine.includes("summary")) {
            foundSummaryFlag = true;
            continue;
        }
    }
    bookInfo.summary = summary.join(" ").trim();
    return bookInfo;
    //console.log(lines);
}
//--======================================================
//-- Recursive Walk Function
//--======================================================
function walkDir(dir, dirArray = [], fileArray = []) {
    return __awaiter(this, void 0, void 0, function* () {
        // Read the directory passed (probably need a check or error handling if not a dir passed)
        const files = fs.readdirSync(dir);
        // setup Vars to accumulate stats
        let terminalDirFlag = false;
        let ext = "";
        // let fileName = "NOT FOUND"; //path.basename(files[i]);
        let directDirName = formatPath(dir);
        let baseName = path.basename(dir);
        let { folderBookAuthor, folderBookTitle, folderBookCategory, folderBookYear, } = parseFolderName(path.basename(dir));
        // let dirNameParsed = parseDirName(path.basename(dir));
        // const bookTitle = dirNameParsed.bookTitle;
        // const bookCategory = dirNameParsed.bookCategory;
        let bookInfo = {};
        // console.log("files", files);
        //-- First loop does NOT recurse, but builds info
        //-- and sets terminalDirFlag (no more recursing)
        let firstPassObj = {
            basePath: directDirName,
            baseName: baseName,
            dirCount: 0,
            audioFileCount: 0,
            textFileCount: 0,
            dirArray: [],
            bookInfo: {},
        };
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const dirPath = path.join(dir, files[i]);
            const isDir = fs.statSync(dirPath).isDirectory();
            ext = path.extname(files[i]);
            //--assign to dirArray if in directory
            if (isDir) {
                firstPassObj.dirCount = firstPassObj.dirCount + 1;
                firstPassObj.dirArray.push(dirPath);
            }
            //-- count audio files
            if (AUDIOFORMATS.some((el) => el === ext)) {
                firstPassObj.audioFileCount = firstPassObj.audioFileCount + 1;
            }
            //-- delete txt file if has the "downloaded from" in it
            if (ext === ".txt" && fileName.toLowerCase().includes("downloaded from")) {
                fs.unlinkSync(dirPath);
            }
            //-- if txt file and has title extracted from folder then process as info file
            if (ext === ".txt" &&
                fileName.toLowerCase().includes(folderBookTitle.toLowerCase())) {
                firstPassObj.textFileCount = firstPassObj.textFileCount + 1;
                firstPassObj.bookInfo = parseBookInfoText(dirPath);
            }
            if (ext === ".json" && fileName.toLowerCase().includes("-metadata")) {
                console.log("found Metadata", fileName);
            }
        }
        // console.log("firstPassObj", firstPassObj);
        // Is the directory we just read an Audio book directory?
        // dirCount is zero or audiobook file count > 0
        // If so :
        // 1. Set "terminalDirFlag" so that we don't recurse even if directories in the dirArray
        // 2. Create Object with info about book in directory
        // 3. Push that onto the fileArray (will build a final array of books)
        // 4. Create/Write a json book metadata file in the current directory
        //    filename - {bookTitle}-{bookAuthor}-metadata.json
        if (firstPassObj.dirCount === 0 || firstPassObj.audioFileCount > 0) {
            terminalDirFlag = true;
            const googleData = yield fakeGetBookData(folderBookAuthor, folderBookTitle);
            const googleISBNS = (googleData === null || googleData === void 0 ? void 0 : googleData.isbn) &&
                (googleData === null || googleData === void 0 ? void 0 : googleData.isbn.reduce((final, el) => {
                    return Object.assign(Object.assign({}, final), { [el.type]: el.identifier });
                }, {}));
            console.log("IN FILE Array - Terminal Dir Flag", terminalDirFlag);
            // This file will be written to the title-author-metadata.json file in the
            // audio book directory
            const folderMetaData = {
                folderName: firstPassObj.baseName,
                fullPath: firstPassObj.basePath,
                audioFileCount: firstPassObj.audioFileCount,
                textFileCount: firstPassObj.textFileCount,
                infoFileData: firstPassObj.bookInfo,
                folderNameData: {
                    title: folderBookTitle,
                    publishedYear: folderBookYear,
                    author: folderBookAuthor,
                    category: folderBookCategory,
                },
                googleAPIData: Object.assign(Object.assign({ query: googleData === null || googleData === void 0 ? void 0 : googleData.query, image: googleData === null || googleData === void 0 ? void 0 : googleData.imageURL, authors: googleData === null || googleData === void 0 ? void 0 : googleData.authors, title: googleData === null || googleData === void 0 ? void 0 : googleData.googleTitle, subtitle: googleData === null || googleData === void 0 ? void 0 : googleData.subTitle, description: googleData === null || googleData === void 0 ? void 0 : googleData.description, publisher: googleData === null || googleData === void 0 ? void 0 : googleData.publisher, publishedDate: googleData === null || googleData === void 0 ? void 0 : googleData.publishedDate }, googleISBNS), { pageCount: googleData === null || googleData === void 0 ? void 0 : googleData.pageCount, categories: googleData === null || googleData === void 0 ? void 0 : googleData.categories }),
            };
            const metaDataObj = Object.assign(Object.assign({ baseName: firstPassObj.baseName, fullPath: firstPassObj.basePath, audioFileCount: firstPassObj.audioFileCount, textFileCount: firstPassObj.textFileCount }, firstPassObj.bookInfo), { category: folderBookCategory, bookTitleDir: folderBookTitle, bookYearDir: folderBookYear, bookAuthorDir: folderBookAuthor });
            fileArray.push(metaDataObj);
            // Construct filename for metadata
            const outTitle = folderBookTitle;
            const outAuthor = firstPassObj.bookInfo.author === "" || !firstPassObj.bookInfo.author
                ? folderBookAuthor
                : firstPassObj.bookInfo.author;
            const tempFilename = `${outTitle}-${outAuthor}`;
            // Sanitize filename
            const re = /^[ .]|[/<>:\"\\|?*]+|[ .]$/;
            const outFilename = tempFilename.replace(re, "_");
            fs.writeFileSync(`${firstPassObj.basePath}/${outTitle}-${outAuthor}-metadata.json`, JSON.stringify(folderMetaData));
        }
        if (terminalDirFlag) {
            return { dirArray, fileArray };
        }
        //! Loop only using the FirstPassObj
        const firstPassDirs = firstPassObj.dirArray;
        for (let i = 0; i < firstPassDirs.length; i++) {
            if (firstPassDirs[i]) {
                // console.log("FirsPass DIR", firstPassDirs[i].dirPath);
                const dirPath = firstPassDirs[i];
                dirArray.push(formatPath(dirPath));
                walkDir(dirPath, dirArray, fileArray);
            }
        }
        return { dirArray, fileArray };
        //! END FIRST PASS RECURSE LOOP
    });
}
exports.walkDir = walkDir;
fakeGetBookData("Mark McCoid", "Millions with Crypto").then((res) => console.log(res));
// const dir = "C:/localStuff/demonoid/AudioBooks/Test";
const dir = "C:/localStuff/demonoid/AudioBooks/Test/SciFi";
const output = walkDir(dir);
fs.writeFileSync(`working.json`, JSON.stringify(output));
