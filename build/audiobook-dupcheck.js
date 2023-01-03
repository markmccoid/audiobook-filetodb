"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
function dupCheck(inputPath, inputFile) {
    const bookData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(inputPath, inputFile), {
        encoding: "utf-8",
    }));
    const ids = bookData.map((el) => el.id).sort();
    let prevId = "";
    const dupIds = ids.reduce((dupList, currId) => {
        if (prevId === currId) {
            dupList = [...dupList, currId];
        }
        prevId = currId;
        return dupList;
    }, []);
    const finalList = bookData
        .filter((el) => dupIds.some((dup) => dup === el.id))
        .map((el) => ({ id: el.id, path: el.fullPath }));
    //console.log("dupIds", finalList);
    (0, fs_1.writeFileSync)(path_1.default.join(inputPath, "dupFiles.json"), JSON.stringify(finalList));
}
dupCheck("D:/Dropbox/Mark/myAudioBooks", "audiobooks.json");
