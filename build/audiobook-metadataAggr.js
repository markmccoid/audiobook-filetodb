"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateMetadata = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function aggregateMetadata(inputPath, inputFile) {
    var _a;
    const bookData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(inputPath, inputFile), {
        encoding: "utf-8",
    }));
    const authors = new Set();
    const primaryCategories = new Set();
    const secondaryCategories = new Set();
    const categories = new Set();
    const categoryMap = {};
    for (let book of bookData) {
        book.author.split(",").forEach((el) => authors.add(el.trim()));
        (_a = book === null || book === void 0 ? void 0 : book.authors) === null || _a === void 0 ? void 0 : _a.forEach((author) => authors.add(author.trim()));
        primaryCategories.add(book.pathPrimaryCat);
        secondaryCategories.add(book.pathSecondaryCat);
        book.categories.forEach((cat) => categories.add(cat));
        // Build Category Map
        if (!book.pathPrimaryCat)
            continue;
        let existingCat = (categoryMap === null || categoryMap === void 0 ? void 0 : categoryMap[book.pathPrimaryCat]) || [];
        let catSet = new Set();
        existingCat.push(book.pathSecondaryCat);
        existingCat = existingCat.filter((el) => el);
        existingCat.forEach((el) => catSet.add(el));
        categoryMap[book.pathPrimaryCat] = Array.from(catSet);
    }
    return {
        authors: Array.from(authors).filter((el) => el),
        primaryCategories: Array.from(primaryCategories).filter((el) => el),
        secondaryCategories: Array.from(secondaryCategories).filter((el) => el),
        categories: Array.from(categories).filter((el) => el),
        categoryMap,
    };
}
exports.aggregateMetadata = aggregateMetadata;
