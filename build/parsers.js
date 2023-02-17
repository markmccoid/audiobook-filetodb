"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMongoDb = exports.getMetadataFromFile = exports.parseBookInfoText = exports.parseFolderName = void 0;
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("./data/prisma");
const audiobook_createCleanFile_1 = require("./audiobook-createCleanFile");
const chalk_1 = __importDefault(require("chalk"));
//--======================================================
//-- Extract Category from folder name
//--======================================================
/**
 * Expects name to be audio book Folder Name with a
 * category enclosed in parens.  If both opening and closing
 * parens not found, then the withoutCategory will be name unchanged
 * and category will be undefined
 *
 * @param name
 * @returns Object - { category: string | undefined;  withoutCategory: string; };
 */
function extractCategory(name) {
    const returnObj = {
        category: undefined,
        withoutCategory: name,
    };
    const startParen = name.indexOf("(") + 1;
    const endParen = name.indexOf(")");
    if (startParen !== -1 && endParen !== -1) {
        returnObj.category = name.slice(startParen, endParen);
        returnObj.withoutCategory = name.slice(0, startParen - 1).trim();
    }
    return returnObj;
}
//--======================================================
//-- isYear helper.  Just confirms string has only 4 numbers in it
//--======================================================
function isYear(yearCheck) {
    let isNum = /^\d\d\d\d$/.test(yearCheck);
    return isNum;
}
//--======================================================
//-- Parse Folder Name
//--======================================================
function parseFolderName(folderName) {
    const { category, withoutCategory } = extractCategory(folderName);
    let year = "";
    let authorArr = [];
    let titleArr = [];
    // Create an array splitting on the "-"
    const nameParseArray = withoutCategory.split("-");
    // Find the which element holds the year (this could be undefined)
    let yearIndex = nameParseArray
        .map((el, index) => (isYear(el.trim()) ? index : undefined))
        .filter((el) => el)[0];
    //-- Store the Year or empty
    year = yearIndex ? nameParseArray[yearIndex].trim() : "";
    // If there is no year, put a dummy element at year position
    // so that author and title code works the same for both with and w/o year
    !yearIndex && nameParseArray.splice(1, 0, "X");
    yearIndex = yearIndex ? yearIndex : 1;
    //-- Get Author up to yearIndex (or first hyphen)
    for (let i = 0; i < yearIndex; i++) {
        authorArr.push(nameParseArray[i]);
    }
    //-- Get title by grabbing all elements after the yearIndex
    for (let i = yearIndex + 1; i < nameParseArray.length; i++) {
        titleArr.push(nameParseArray[i]);
    }
    const rxSpecChars = /[,.']/g;
    const rxDoubleSpace = /\s\s/g;
    const folderIdAuth = authorArr
        .join("")
        .trim()
        .replace(rxSpecChars, "")
        .replace(rxDoubleSpace, " ");
    const folderIdTitle = titleArr
        .join("")
        .trim()
        .replace(rxSpecChars, "")
        .replace(rxDoubleSpace, " ");
    return {
        id: `${folderIdAuth}~${folderIdTitle}`.replace(/\s/g, "_"),
        year,
        author: authorArr.join("-").trim(),
        title: titleArr.join("-").trim(),
        category: category || "",
    };
}
exports.parseFolderName = parseFolderName;
function parseBookInfoText(textFile) {
    let lines = fs_1.default.readFileSync(textFile, "utf8").toString().split("\r\n");
    if (lines.length === 1) {
        lines = fs_1.default.readFileSync(textFile, "utf16le").toString().split("\r\n");
    }
    let foundSummaryFlag = false;
    let stopFlag = false;
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
        //-- Check if file indicates we should stop recuring
        if (lowercaseLine.includes("stop:")) {
            bookInfo.stopFlag = true;
        }
        //-- Title Of Book
        if (lowercaseLine.includes("title:")) {
            bookInfo.title = line
                .slice(line.toLowerCase().indexOf("title:") + 6)
                .trim();
            continue;
        }
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
}
exports.parseBookInfoText = parseBookInfoText;
//--======================================================
//-- Get info from existing Metadata JSON
//--======================================================
function getMetadataFromFile(dirPath) {
    var _a, _b, _c, _d, _e, _f, _g;
    const metadata = JSON.parse(fs_1.default.readFileSync(dirPath, "utf8"));
    const mongoDBId = metadata === null || metadata === void 0 ? void 0 : metadata.mongoDBId;
    const forceMongoUpdate = !!(metadata === null || metadata === void 0 ? void 0 : metadata.forceMongoUpdate);
    const queryDate = new Date(((_a = metadata === null || metadata === void 0 ? void 0 : metadata.googleAPIData) === null || _a === void 0 ? void 0 : _a.queryDateString) || "01/01/1970");
    const todaysDate = new Date();
    const daysSinceLastQuery = Math.floor(
    // @ts-ignore
    (todaysDate - queryDate) / (1000 * 60 * 60 * 24));
    // Check to make sure googleAPIData is populated with something
    // OR if it has only been 300 days since last query
    if ((((_c = (_b = metadata === null || metadata === void 0 ? void 0 : metadata.googleAPIData) === null || _b === void 0 ? void 0 : _b.title) === null || _c === void 0 ? void 0 : _c.length) > 1 &&
        ((_e = (_d = metadata === null || metadata === void 0 ? void 0 : metadata.googleAPIData) === null || _d === void 0 ? void 0 : _d.imageURL) === null || _e === void 0 ? void 0 : _e.length) > 1 &&
        ((_g = (_f = metadata === null || metadata === void 0 ? void 0 : metadata.googleAPIData) === null || _f === void 0 ? void 0 : _f.description) === null || _g === void 0 ? void 0 : _g.length) > 1) ||
        daysSinceLastQuery < 300) {
        return { googleData: metadata === null || metadata === void 0 ? void 0 : metadata.googleAPIData, mongoDBId, forceMongoUpdate };
    }
    return { googleData: undefined, mongoDBId, forceMongoUpdate };
}
exports.getMetadataFromFile = getMetadataFromFile;
// This may need to be called from the audiobook-createCleanFile.ts
async function updateMongoDb(folderMetadata) {
    // If book already has a populated mongo DB Id and we don't want to force an update, then return
    if (folderMetadata.mongoDBId && !(folderMetadata === null || folderMetadata === void 0 ? void 0 : folderMetadata.forceMongoUpdate))
        return;
    // If no mongoDBId passed, then we will do a lookup to make sure and if we can't
    // Not sure if this is even needed.
    //! Need to figure out how to do the lookup (Below is using mongoDBId, which is stupid),
    //! but good example of searching on _id
    //! The real lookup should be on bookID doesn't exist in model yet.
    //!
    // const result = await prisma.books.findRaw({
    //   filter: { _id: { $eq: { $oid: mongoDBId } } },
    // });
    // if (result.length !== 0) {
    //   return result[0]["_id"]["$oid"]
    // }
    // Below code will add a new record to the mongoDB books table and and MUTATE the passed folderMetadata record
    // adding the ObjectId of new record in the mongoDBId key
    const cleanBookData = (0, audiobook_createCleanFile_1.cleanOneBook)(folderMetadata);
    const { bookLengthMinutes, bookLengthText } = getDropboxBookLength(cleanBookData.bookLength);
    let createOrUpdate = "created";
    let createdBook;
    //~ Creating a new record in Mongo
    if (!folderMetadata.mongoDBId) {
        // Create the record in mongo
        createdBook = await prisma_1.prisma.books.create({
            data: {
                primaryCategory: cleanBookData.pathPrimaryCat || "Unknown",
                secondaryCategory: cleanBookData.pathSecondaryCat || "Unknown",
                title: cleanBookData.title,
                author: cleanBookData.author,
                description: cleanBookData.description || "",
                imageURL: cleanBookData.imageURL,
                bookLengthMinutes: bookLengthMinutes,
                bookLengthText: bookLengthText,
                dropboxLocation: cleanBookData.fullPath,
                genres: cleanBookData.categories.flatMap((cat) => cat.trim().toLowerCase() !== "self-help"
                    ? cat.split("-").map((el) => el.trim())
                    : cat.trim()),
                narratedBy: cleanBookData.narratedBy,
                pageCount: cleanBookData.pageCount,
                publishedYear: (cleanBookData === null || cleanBookData === void 0 ? void 0 : cleanBookData.publishedYear)
                    ? cleanBookData.publishedYear
                    : 0,
                releaseDate: (cleanBookData === null || cleanBookData === void 0 ? void 0 : cleanBookData.releaseDate)
                    ? new Date(cleanBookData.releaseDate)
                    : undefined,
                source: "dropbox",
            },
        });
    }
    //~ UPDATE book data.  Only update a few properties.
    //~ For example if they moved directories and renamed folder
    if (folderMetadata.mongoDBId && (folderMetadata === null || folderMetadata === void 0 ? void 0 : folderMetadata.forceMongoUpdate)) {
        createOrUpdate = "updated";
        createdBook = await prisma_1.prisma.books.update({
            where: {
                id: folderMetadata.mongoDBId,
            },
            data: {
                primaryCategory: cleanBookData.pathPrimaryCat || "Unknown",
                secondaryCategory: cleanBookData.pathSecondaryCat || "Unknown",
                // title: cleanBookData.title,
                // author: cleanBookData.author,
                dropboxLocation: cleanBookData.fullPath,
            },
        });
    }
    folderMetadata.mongoDBId = createdBook.id;
    folderMetadata.forceMongoUpdate = false;
    console.log(chalk_1.default.green("MONGO "), chalk_1.default.cyan(cleanBookData.title), " was", chalk_1.default.green(` ${createOrUpdate} in MongoDB`));
    return;
}
exports.updateMongoDb = updateMongoDb;
function getDropboxBookLength(bookLength) {
    if (!bookLength)
        return { bookLengthMinutes: undefined, bookLengthText: undefined };
    const timeArray = bookLength
        .replace(/\s/g, "")
        .replace("and", "")
        .replace("hrs", "-")
        .replace("mins", "")
        .replace("hr", "-")
        .replace("min", "")
        .split("-");
    const hours = parseInt(timeArray[0]);
    const min = parseInt(timeArray[1]) || 0;
    const bookLengthMinutes = hours * 60 + min;
    const bookLengthText = `${hours} hrs and ${min} mins`;
    return { bookLengthMinutes, bookLengthText };
}
