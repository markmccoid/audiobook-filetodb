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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicWalker = exports.musicWalkerWithSongs = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function musicWalkerWithSongs(dir, currDepth = 0, // If you want to start at different level you can send -1
artistsArray = [], 
// artistAlbums: { artist: string; albums: string[] }[] = [],
artistAlbums = [], currArtist = "", currAlbum = "", aggrAlbums = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = fs_1.default.readdirSync(dir);
        const baseName = path_1.default.basename(dir);
        // console.log("files", files);
        currDepth = currDepth + 1;
        // let aggrAlbums = [];
        let aggrSongs = [];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const dirPath = path_1.default.join(dir, files[i]);
            const isDir = fs_1.default.statSync(dirPath).isDirectory();
            const ext = path_1.default.extname(files[i]);
            //  console.log("filename", fileName, currDepth);
            if (currDepth > 3) {
                return { artists: artistsArray, albums: artistAlbums };
            }
            if (currDepth === 1 && isDir) {
                // Artist directory
                artistsArray.push(fileName);
                aggrAlbums = [];
                currArtist = fileName;
            }
            if (currDepth === 2 && isDir) {
                // Album directory
                aggrAlbums.push(fileName);
                currAlbum = fileName;
            }
            if (currDepth === 3 && ext === ".mp3") {
                // Song Directory
                aggrSongs.push(fileName);
            }
            // Only recurse if we are in the Artist or Album directory
            if (currDepth <= 2 && isDir) {
                musicWalkerWithSongs(dirPath, currDepth, artistsArray, artistAlbums, currArtist, currAlbum, aggrAlbums);
            }
        }
        // console.log("Before return", currArtist, aggrAlbums, aggrSongs);
        // artistAlbums.push({ artist: currArtist, albums: aggrAlbums });
        //~~ Only make changes if we are at the song depth
        //~~ At this point we will have the currArtist and the aggrAlbums is passed by reference
        //~~ so it will update
        if (currDepth === 3) {
            //-- Find the artist entry in the artistAlbums array
            //-- If it exists modify it's entry, otherwise create a new entry for artist
            const currentRecord = artistAlbums.find((el) => el.artist === currArtist);
            // if (currentRecord && currArtist.length > 0) {
            if (currentRecord) {
                currentRecord.albumsWithSongs = [
                    ...currentRecord.albumsWithSongs,
                    { album: currAlbum, songs: aggrSongs },
                ];
                currentRecord.albums = aggrAlbums; // Don't really need this as array is by reference and will update
            }
            else {
                // } else if (currArtist.length > 0) {
                artistAlbums.push({
                    artist: currArtist,
                    albums: aggrAlbums,
                    albumsWithSongs: [{ album: currAlbum, songs: aggrSongs }],
                });
            }
            console.log("ARTIST ALUBMS", artistAlbums, currDepth);
        }
        return {
            artists: artistsArray,
            albums: artistAlbums,
        };
    });
}
exports.musicWalkerWithSongs = musicWalkerWithSongs;
//~ ------------------------------------------------
//~ ------------------------------------------------
function musicWalker(dir, currDepth = 0, artistsArray = [], 
// artistAlbums: { artist: string; albums: string[] }[] = [],
artistAlbums = [], currArtist = "", currAlbum = "", currLevelZero = "") {
    return __awaiter(this, void 0, void 0, function* () {
        const files = fs_1.default.readdirSync(dir);
        const baseName = path_1.default.basename(dir);
        // console.log("files", files);
        currDepth = currDepth + 1;
        let aggrAlbums = [];
        console.log(`${"-".repeat(currDepth * 2)} Depth: ${currDepth} Folder: ${currLevelZero}-${currArtist}-${currAlbum}`);
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const dirPath = path_1.default.join(dir, files[i]);
            const isDir = fs_1.default.statSync(dirPath).isDirectory();
            const ext = path_1.default.extname(files[i]);
            // console.log("filename", fileName, currDepth);
            if (currDepth > 2) {
                return { artists: artistsArray, albums: artistAlbums };
            }
            if (currDepth === 0 && isDir) {
                currLevelZero = fileName;
            }
            if (currDepth === 1 && isDir) {
                // Artist directory
                artistsArray.push(fileName);
                currArtist = fileName;
            }
            if (currDepth === 2) {
                if (isDir) {
                    // Album directory
                    aggrAlbums.push(fileName);
                }
                else {
                    aggrAlbums.push(path_1.default.basename(fileName, ext));
                }
                currAlbum = fileName;
                // albums.push({ artist: currArtist, album: fileName });
            }
            // Only recurse if we are in the Artist or Album directory
            if (currDepth <= 2 && isDir) {
                musicWalker(dirPath, currDepth, artistsArray, artistAlbums, currArtist, currAlbum, currLevelZero);
            }
        }
        // console.log("Before return", aggrAlbums);
        // artistAlbums.push({ artist: currArtist, albums: aggrAlbums });
        if (currDepth === 2) {
            artistAlbums.push({
                levelZero: currLevelZero,
                artist: currArtist,
                albums: aggrAlbums,
            });
        }
        return {
            artists: artistsArray,
            albums: artistAlbums,
        };
    });
}
exports.musicWalker = musicWalker;
//C:/localStuff/musictest
//D:/Dropbox/Mark/myMusic/Ambient
// musicWalker("D:/Dropbox/Mark/myMusic/", -1).then((res) => {
//   fs.writeFileSync(
//     "C:/localStuff/musictest/music-data.json",
//     JSON.stringify(res)
//   );
//   console.log(res);
// });
//-- -=========================================
//-- Passing -1 for currDept so that we don't "start" until
//-- the second set of dirs.
//-- myMusic
//-- -> Epic Music
//--   -> Artist Dir 1
//--   -> Artist Dir 2
//-- -> Classical
//--   -> Artist Dir 1
//--   -> Artist Dir ...
//-- If we started at the Epic Music or Classical dir then
//-- currDepth would be 0 to get correct data.
//--
// musicWalkerWithSongs("C:/localStuff/musictest", -1).then((res) => {
//   fs.writeFileSync(
//     "C:/localStuff/musictest/music-data-filetest2.json",
//     JSON.stringify(res)
//   );
//   console.log(res);
// });
