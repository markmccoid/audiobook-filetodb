"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanOneBook = exports.createCleanFile = void 0;
//--------------------------------------------
//-- Helper functino to extract directory names
//-- from path
//-- c:/nonfiction/weath/booktitle
//-- returns ["nonfiction", "wealth"]
//--------------------------------------------
function extractDirectories(dir, depthToCategory) {
    let extractedDirs = [];
    // Loop and extract directory one at time till end
    while (true) {
        let index = dir.indexOf("/");
        // Exit while loop if there is no more "/" or
        // No more "/" and the index above.  So, the first check is really unnecessary, but whatever
        // "books/booktitle" this will exist as the books was extracted on the previous interation
        // The loop extracts forward - > c:/nonfiction/weath/booktitle
        //                                    1         2      exit
        if (index === -1 || dir.slice(index + 1).indexOf("/") === -1) {
            break;
        }
        let nextIndex = dir.slice(index + 1).indexOf("/") + index + 1;
        // Exit loop when can no longer find "/"
        extractedDirs.push(dir.slice(index + 1, nextIndex));
        dir = dir.slice(index + 1); //dir.slice(dir.indexOf("/")+1).slice(dir.indexOf("/"))
    }
    return {
        allDirs: extractedDirs,
        primaryDirCat: extractedDirs[depthToCategory - 1],
        secondaryDirCat: extractedDirs[depthToCategory],
    };
}
function createCleanFile(baseData, depthToCategory) {
    return baseData.map((book, index) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
        // decide on data for fields that come from multiple sources
        // if infoFileData available use it for the following:
        const author = ((_a = book.infoFileData) === null || _a === void 0 ? void 0 : _a.author) ||
            ((_b = book.folderNameData) === null || _b === void 0 ? void 0 : _b.author) ||
            ((_c = book.googleAPIData) === null || _c === void 0 ? void 0 : _c.authors[0]);
        const title = ((_d = book.infoFileData) === null || _d === void 0 ? void 0 : _d.title) ||
            ((_e = book.folderNameData) === null || _e === void 0 ? void 0 : _e.title) ||
            `${(_f = book.googleAPIData) === null || _f === void 0 ? void 0 : _f.title}: ${(_g = book.googleAPIData) === null || _g === void 0 ? void 0 : _g.subTitle}`;
        const description = ((_h = book.infoFileData) === null || _h === void 0 ? void 0 : _h.summary) || ((_j = book.googleAPIData) === null || _j === void 0 ? void 0 : _j.description);
        const publishedYear = parseInt((_k = book.folderNameData) === null || _k === void 0 ? void 0 : _k.publishedYear) ||
            parseInt((_m = (_l = book.googleAPIData) === null || _l === void 0 ? void 0 : _l.publishedDate) === null || _m === void 0 ? void 0 : _m.slice(0, 4));
        const releaseDate = ((_o = book.infoFileData) === null || _o === void 0 ? void 0 : _o.releaseDate) || ((_p = book.googleAPIData) === null || _p === void 0 ? void 0 : _p.publishedDate);
        const imageURL = ((_q = book.googleAPIData) === null || _q === void 0 ? void 0 : _q.imageURL) || (book === null || book === void 0 ? void 0 : book.folderImages[0]);
        // Concate all categories together and filter out blanks (we remove dups when assigning to object)
        const categories = [
            (_r = book.folderNameData) === null || _r === void 0 ? void 0 : _r.category,
            ...(((_s = book.googleAPIData) === null || _s === void 0 ? void 0 : _s.categories) || []),
            ...(((_t = book.infoFileData) === null || _t === void 0 ? void 0 : _t.otherCategories) || []),
        ].filter((el) => el);
        const directories = extractDirectories(book.fullPath, depthToCategory);
        const bookLength = (_u = book.infoFileData) === null || _u === void 0 ? void 0 : _u.length;
        return {
            id: book.id,
            fullPath: book.fullPath,
            audioFileCount: book.audioFileCount,
            title,
            description,
            author,
            authors: (_v = book.googleAPIData) === null || _v === void 0 ? void 0 : _v.authors,
            narratedBy: (_w = book.infoFileData) === null || _w === void 0 ? void 0 : _w.narratedBy,
            publishedYear,
            releaseDate,
            publisher: (_x = book.googleAPIData) === null || _x === void 0 ? void 0 : _x.publisher,
            pageCount: parseInt((_y = book.googleAPIData) === null || _y === void 0 ? void 0 : _y.pageCount) || undefined,
            bookLength,
            imageURL,
            categories: Array.from(new Set(categories)),
            pathDirArray: directories.allDirs,
            pathPrimaryCat: directories.primaryDirCat,
            pathSecondaryCat: directories.secondaryDirCat,
        };
    });
}
exports.createCleanFile = createCleanFile;
function cleanOneBook(book, depthToCategory = 4) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    // decide on data for fields that come from multiple sources
    // if infoFileData available use it for the following:
    const author = ((_a = book.infoFileData) === null || _a === void 0 ? void 0 : _a.author) ||
        ((_b = book.folderNameData) === null || _b === void 0 ? void 0 : _b.author) ||
        ((_c = book.googleAPIData) === null || _c === void 0 ? void 0 : _c.authors[0]);
    const title = ((_d = book.infoFileData) === null || _d === void 0 ? void 0 : _d.title) ||
        ((_e = book.folderNameData) === null || _e === void 0 ? void 0 : _e.title) ||
        `${(_f = book.googleAPIData) === null || _f === void 0 ? void 0 : _f.title}: ${(_g = book.googleAPIData) === null || _g === void 0 ? void 0 : _g.subTitle}`;
    const description = ((_h = book.infoFileData) === null || _h === void 0 ? void 0 : _h.summary) || ((_j = book.googleAPIData) === null || _j === void 0 ? void 0 : _j.description);
    const publishedYear = parseInt((_k = book.folderNameData) === null || _k === void 0 ? void 0 : _k.publishedYear) ||
        parseInt((_m = (_l = book.googleAPIData) === null || _l === void 0 ? void 0 : _l.publishedDate) === null || _m === void 0 ? void 0 : _m.slice(0, 4));
    const releaseDate = ((_o = book.infoFileData) === null || _o === void 0 ? void 0 : _o.releaseDate) || ((_p = book.googleAPIData) === null || _p === void 0 ? void 0 : _p.publishedDate);
    const imageURL = ((_q = book.googleAPIData) === null || _q === void 0 ? void 0 : _q.imageURL) || (book === null || book === void 0 ? void 0 : book.folderImages[0]);
    // Concate all categories together and filter out blanks (we remove dups when assigning to object)
    const categories = [
        (_r = book.folderNameData) === null || _r === void 0 ? void 0 : _r.category,
        ...(((_s = book.googleAPIData) === null || _s === void 0 ? void 0 : _s.categories) || []),
        ...(((_t = book.infoFileData) === null || _t === void 0 ? void 0 : _t.otherCategories) || []),
    ].filter((el) => el);
    const directories = extractDirectories(book.fullPath, depthToCategory);
    const bookLength = (_u = book.infoFileData) === null || _u === void 0 ? void 0 : _u.length;
    return {
        id: book.id,
        fullPath: book.fullPath,
        audioFileCount: book.audioFileCount,
        title,
        description,
        author,
        authors: (_v = book.googleAPIData) === null || _v === void 0 ? void 0 : _v.authors,
        narratedBy: (_w = book.infoFileData) === null || _w === void 0 ? void 0 : _w.narratedBy,
        publishedYear,
        releaseDate,
        publisher: (_x = book.googleAPIData) === null || _x === void 0 ? void 0 : _x.publisher,
        pageCount: parseInt((_y = book.googleAPIData) === null || _y === void 0 ? void 0 : _y.pageCount) || undefined,
        bookLength,
        imageURL,
        categories: Array.from(new Set(categories)),
        pathDirArray: directories.allDirs,
        pathPrimaryCat: directories.primaryDirCat,
        pathSecondaryCat: directories.secondaryDirCat,
    };
}
exports.cleanOneBook = cleanOneBook;
