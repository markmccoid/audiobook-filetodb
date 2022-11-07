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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAggrMetaData = exports.walkAndAggrMetadata = exports.walkAndTagDirs = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const parsers_1 = require("./parsers");
const fetchData_1 = require("./fetchData");
//-- Local contants
const AUDIOFORMATS = [".mp3", ".mb4", ".mp4"];
const IMAGEFORMATS = [".jpg", ".png"];
/**
 * Convert the passed dirPath to use the passed pathSep
 * @param {*} dirPath
 * @param {*} pathSep
 * @returns
 */
function formatPath(dirPath, pathSep = "/") {
    const pathArray = dirPath.split(path_1.default.sep);
    return pathArray.join(pathSep);
}
function walkAndTagDirs(dir, queryGoogle = "no", dirArray = [], folderMetadataArray = []) {
    return __awaiter(this, void 0, void 0, function* () {
        // Read the directory passed (probably need a check or error handling if not a dir passed)
        const files = fs_1.default.readdirSync(dir);
        let terminalDirFlag = false;
        const directDirName = formatPath(dir);
        const baseName = path_1.default.basename(dir);
        const currentMetadata = { googleData: undefined, wasGoogleQueried: false };
        const { id: folderId, author: folderBookAuthor, title: folderBookTitle, category: folderBookCategory, year: folderBookYear, } = (0, parsers_1.parseFolderName)(path_1.default.basename(dir));
        //-- First loop does NOT recurse, but builds info
        //-- and sets terminalDirFlag (no more recursing)
        let firstPassObj = {
            basePath: directDirName,
            baseName: baseName,
            dirCount: 0,
            audioFileCount: 0,
            textFileCount: 0,
            folderImages: [],
            dirArray: [],
            bookInfo: {},
        };
        //~ ---------------------------------
        //~ First Pass Start  ---------------
        //~ ---------------------------------
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const dirPath = path_1.default.join(dir, files[i]);
            const isDir = fs_1.default.statSync(dirPath).isDirectory();
            const ext = path_1.default.extname(files[i]);
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
                fs_1.default.unlinkSync(dirPath);
            }
            //-- if txt file and has part of the author extracted from folder then process as info file
            if (ext === ".txt" &&
                fileName
                    .toLowerCase()
                    .includes(folderBookAuthor.toLowerCase().slice(0, 4))) {
                firstPassObj.textFileCount = firstPassObj.textFileCount + 1;
                firstPassObj.bookInfo = (0, parsers_1.parseBookInfoText)(dirPath);
            }
            if (ext === ".json" && fileName.toLowerCase().includes("-metadata")) {
                currentMetadata.googleData = (0, parsers_1.getMetadataFromFile)(dirPath);
            }
            //-- store images in file
            if (IMAGEFORMATS.some((el) => el === ext)) {
                firstPassObj.folderImages.push(fileName);
            }
        }
        //~ ---------------------------------
        //~ First Pass END ------------------
        //~ ---------------------------------
        // console.log("firstPassObj", firstPassObj);
        // Is the directory we just read an Audio book directory?
        // dirCount is zero OR audiobook file count > 0 OR bookInfo is populated
        // If so :
        // 1. Set "terminalDirFlag" so that we don't recurse even if directories in the dirArray
        // 2. Create Object with info about book in directory
        // 3. Push that onto the fileArray (will build a final array of books)
        // 4. Create/Write a json book metadata file in the current directory
        //    filename - {bookTitle}-{bookAuthor}-metadata.json
        if (firstPassObj.dirCount === 0 ||
            firstPassObj.audioFileCount > 0 ||
            Object.keys(firstPassObj.bookInfo).length > 0) {
            terminalDirFlag = true;
            let googleData;
            // if query flag true AND we didn't already find populated google data, then query
            // else keep same
            if ((queryGoogle === "yes" && !currentMetadata.googleData) ||
                queryGoogle === "force") {
                googleData = yield (0, fetchData_1.getBookData)(folderBookAuthor, folderBookTitle);
                currentMetadata.wasGoogleQueried = true;
            }
            else {
                googleData = currentMetadata.googleData || {};
                currentMetadata.wasGoogleQueried = false;
            }
            // console.log("IN FILE Array - Terminal Dir Flag", terminalDirFlag);
            // This file will be written to the title-author-metadata.json file in the
            // audio book directory
            const folderMetadata = {
                id: folderId,
                folderName: firstPassObj.baseName,
                fullPath: firstPassObj.basePath,
                audioFileCount: firstPassObj.audioFileCount,
                textFileCount: firstPassObj.textFileCount,
                infoFileData: firstPassObj.bookInfo,
                dirCount: firstPassObj.dirCount,
                folderImages: firstPassObj.folderImages,
                folderNameData: {
                    title: folderBookTitle,
                    publishedYear: folderBookYear,
                    author: folderBookAuthor,
                    category: folderBookCategory,
                },
                googleAPIData: googleData,
            };
            folderMetadataArray.push(folderMetadata);
            // Construct filename for metadata
            const outTitle = folderBookTitle;
            const outAuthor = firstPassObj.bookInfo.author === "" || !firstPassObj.bookInfo.author
                ? folderBookAuthor
                : firstPassObj.bookInfo.author;
            const tempFilename = `${outTitle}-${outAuthor}`;
            // Sanitize filename
            const re = /^[ .]|[/<>:\"\\|?*]+|[ .]$/;
            const outFilename = tempFilename.replace(re, "_");
            fs_1.default.writeFileSync(`${firstPassObj.basePath}/${outTitle}-${outAuthor}-metadata.json`, JSON.stringify(folderMetadata));
            // Console output the status
            console.log(chalk_1.default.cyan(outFilename), " - Processed ", chalk_1.default.bgCyan(currentMetadata.wasGoogleQueried ? " !Google Queried!" : ""));
        }
        if (terminalDirFlag) {
            return { queryGoogle, dirArray, folderMetadataArray };
        }
        //! Loop only using the FirstPassObj
        const firstPassDirs = firstPassObj.dirArray;
        for (let i = 0; i < firstPassDirs.length; i++) {
            if (firstPassDirs[i]) {
                const dirPath = firstPassDirs[i];
                // dirArray.push({
                //   path: formatPath(dirPath),
                //   dirCount: firstPassObj.dirCount,
                //   baseDir: firstPassObj.baseName,
                // });
                // dirLog = { ...dirLog, dirObj };
                dirArray.push(formatPath(dirPath));
                yield walkAndTagDirs(dirPath, queryGoogle, dirArray, folderMetadataArray);
            }
        }
        return { queryGoogle, dirArray, folderMetadataArray };
        //! END FIRST PASS RECURSE LOOP
    });
}
exports.walkAndTagDirs = walkAndTagDirs;
function walkAndAggrMetadata(dir, dirArray = [], folderMetadataArray = []) {
    const files = fs_1.default.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const dirPath = path_1.default.join(dir, files[i]);
        const isDir = fs_1.default.statSync(dirPath).isDirectory();
        const ext = path_1.default.extname(files[i]);
        if (isDir) {
            walkAndAggrMetadata(dirPath, dirArray, folderMetadataArray);
        }
        if (ext === ".json" && fileName.toLowerCase().includes("-metadata")) {
            const metadata = JSON.parse(fs_1.default.readFileSync(dirPath, "utf8"));
            folderMetadataArray.push(metadata);
        }
    }
    return { dirArray, folderMetadataArray };
}
exports.walkAndAggrMetadata = walkAndAggrMetadata;
function writeAggrMetaData(dir, outputPath, outputFilename = "audioBookMetadata.json") {
    const res = walkAndAggrMetadata(dir);
    fs_1.default.writeFileSync(path_1.default.join(outputPath || dir, outputFilename), JSON.stringify(res.folderMetadataArray));
    return "Success";
}
exports.writeAggrMetaData = writeAggrMetaData;
