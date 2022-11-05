import fs from "fs";
import path from "path";

async function musicWalkerWithSongs(
  dir: string,
  currDepth: number = 0, // If you want to start at different level you can send -1
  artistsArray: string[] = [],
  // artistAlbums: { artist: string; albums: string[] }[] = [],
  artistAlbums: {
    artist: string;
    albums: string[];
    albumsWithSongs: { album: string; songs: string[] }[];
  }[] = [],
  currArtist: string = "",
  currAlbum: string = "",
  aggrAlbums: string[] = []
) {
  const files = fs.readdirSync(dir);
  const baseName = path.basename(dir);
  // console.log("files", files);

  currDepth = currDepth + 1;
  // let aggrAlbums = [];
  let aggrSongs = [];
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const dirPath = path.join(dir, files[i]);
    const isDir = fs.statSync(dirPath).isDirectory();
    const ext = path.extname(files[i]);
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
      musicWalkerWithSongs(
        dirPath,
        currDepth,
        artistsArray,
        artistAlbums,
        currArtist,
        currAlbum,
        aggrAlbums
      );
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
    } else {
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
}
//~ ------------------------------------------------
//~ ------------------------------------------------
async function musicWalker(
  dir: string,
  currDepth: number = 0,
  artistsArray: string[] = [],
  // artistAlbums: { artist: string; albums: string[] }[] = [],
  artistAlbums: {
    artist: string;
    albums: string[];
  }[] = [],
  currArtist: string = "",
  currAlbum: string = ""
) {
  const files = fs.readdirSync(dir);
  const baseName = path.basename(dir);
  // console.log("files", files);

  currDepth = currDepth + 1;
  let aggrAlbums = [];
  let aggrSongs = [];
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const dirPath = path.join(dir, files[i]);
    const isDir = fs.statSync(dirPath).isDirectory();
    const ext = path.extname(files[i]);
    //  console.log("filename", fileName, currDepth);
    if (currDepth > 2) {
      return { artists: artistsArray, albums: artistAlbums };
    }
    if (currDepth === 1 && isDir) {
      // Artist directory
      artistsArray.push(fileName);
      currArtist = fileName;
    }
    if (currDepth === 2 && isDir) {
      // Album directory
      aggrAlbums.push(fileName);
      currAlbum = fileName;
      // albums.push({ artist: currArtist, album: fileName });
    }

    // Only recurse if we are in the Artist or Album directory
    if (currDepth <= 2 && isDir) {
      musicWalker(
        dirPath,
        currDepth,
        artistsArray,
        artistAlbums,
        currArtist,
        currAlbum
      );
    }
  }
  // console.log("Before return", aggrAlbums);
  // artistAlbums.push({ artist: currArtist, albums: aggrAlbums });
  if (currDepth === 2) {
    artistAlbums.push({
      artist: currArtist,
      albums: aggrAlbums,
    });
  }

  return {
    artists: artistsArray,
    albums: artistAlbums,
  };
}

//C:/localStuff/musictest
//D:/Dropbox/Mark/myMusic/Ambient
musicWalker("D:/Dropbox/Mark/myMusic/", -1).then((res) => {
  fs.writeFileSync(
    "C:/localStuff/musictest/music-data.json",
    JSON.stringify(res)
  );
  console.log(res);
});

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
