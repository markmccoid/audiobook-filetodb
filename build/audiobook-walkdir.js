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
 */
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
const audiobook_createCleanFile_1 = require("./audiobook-createCleanFile");
//-- Local contants
const AUDIOFORMATS = [".mp3", ".mb4", ".mp4", ".m4a"];
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
async function walkAndTagDirs(dir, queryGoogle = "no", mongoDBUpdateFlag = true, dirArray = [], folderMetadataArray = []) {
    var _a;
    // Read the directory passed (probably need a check or error handling if not a dir passed)
    // Exclude any files or directories that have "_ignore" in them.
    const files = fs_1.default
        .readdirSync(dir)
        .filter((file) => !file.toLowerCase().includes("_ignore"));
    let terminalDirFlag = false;
    const directDirName = formatPath(dir);
    const baseName = path_1.default.basename(dir);
    const currentMetadata = {
        googleData: undefined,
        wasGoogleQueried: false,
        mongoDBId: undefined,
        forceMongoUpdate: false,
    };
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
        // if (fileName.includes("Other_")) {
        //   console.log("Other found", fileName, dirPath);
        //   terminalDirFlag = true;
        //   break;
        // }
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
            // if metadata json file exists pull some data to determine if we need to
            // query google and/or upload to mongoDB
            const { googleData, mongoDBId, forceMongoUpdate } = (0, parsers_1.getMetadataFromFile)(dirPath);
            currentMetadata.googleData = googleData;
            currentMetadata.mongoDBId = mongoDBId;
            currentMetadata.forceMongoUpdate = forceMongoUpdate; // if true, we will update mongo
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
        Object.keys(firstPassObj.bookInfo).length > 0 ||
        ((_a = firstPassObj.bookInfo) === null || _a === void 0 ? void 0 : _a.stopFlag) // Allows you to create a stopFlag field in the folder .txt file to stop processing
    ) {
        terminalDirFlag = true;
        let googleData;
        // if query flag true AND we didn't already find populated google data, then query
        // else keep same
        if ((queryGoogle === "yes" && !currentMetadata.googleData) ||
            queryGoogle === "force") {
            googleData = await (0, fetchData_1.getBookData)(folderBookAuthor, folderBookTitle);
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
            mongoDBId: currentMetadata.mongoDBId,
            forceMongoUpdate: currentMetadata.forceMongoUpdate,
        };
        // Will add book to mongo if not already there and update the mongoDBId on the folderMetadata record at same time.
        // passing object so it will update in function
        if (mongoDBUpdateFlag) {
            await (0, parsers_1.updateMongoDb)(folderMetadata);
        }
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
            await walkAndTagDirs(dirPath, queryGoogle, mongoDBUpdateFlag, dirArray, folderMetadataArray);
        }
    }
    return { queryGoogle, dirArray, folderMetadataArray };
    //! END FIRST PASS RECURSE LOOP
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
function writeAggrMetaData(dir, outputPath, outputFilename = "audioBookMetadata.json", createCleanFileFlag = false, depthToCategory = undefined) {
    const res = walkAndAggrMetadata(dir);
    fs_1.default.writeFileSync(path_1.default.join(outputPath || dir, outputFilename), JSON.stringify(res.folderMetadataArray));
    if (createCleanFileFlag) {
        const cleanFile = (0, audiobook_createCleanFile_1.createCleanFile)(res.folderMetadataArray, depthToCategory);
        fs_1.default.writeFileSync(path_1.default.join(outputPath || dir, `clean-${outputFilename}`), JSON.stringify(cleanFile));
    }
    return "Success";
}
exports.writeAggrMetaData = writeAggrMetaData;
