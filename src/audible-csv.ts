const fs = require("fs");
const readline = require("readline");
import { primaryCatMap, secondaryCatMap } from "./audibleMaps";
import { getBookData } from "./fetchData";
import { getAudibleData } from "./audibleFetch";
import type { CleanAudioBookData } from "./audiobook-createCleanFile";

let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processAudibleObjArr(): Promise<CleanAudioBookData[]> {
  const bookData = JSON.parse(
    fs.readFileSync("../audibleBooks.json", {
      encoding: "utf-8",
    })
  );

  //~ ------------------------------------------------------------
  //console.log(bookData[0].author, bookData[0].title);
  const primaryCatList = [];
  const secondaryCatList = [];
  for (let book of bookData) {
    book.id = `audible-${book.Author}~${book.Title}`.replace(/\s/g, "_");
    book.googleAPIData = (await getBookData(book.Author, book.Title)) || {};
    console.log("google", book.Title, book.googleAPIData?.error);
    await sleep(1000);
  }
  // console.log("bookAray", bookData);
  const bookArray = bookData.map((book) => {
    const author = book.Author || book.googleAPIData?.authors[0];
    const title =
      book.Title ||
      `${book.googleAPIData?.title}: ${book.googleAPIData?.subTitle}`;
    const description = book.googleAPIData?.description;
    const publishedYear =
      parseInt(book.Year) ||
      parseInt(book.googleAPIData?.publishedDate?.slice(0, 4));
    const releaseDate = book.googleAPIData?.publishedDate;
    const imageURL = book.googleAPIData?.imageURL;
    // Concate all categories together and filter out blanks (we remove dups when assigning to object)
    const categories = [
      book.Genre,
      ...(book.googleAPIData?.categories || []),
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
      authors: book.googleAPIData?.authors,
      narratedBy: book.Narrator,
      publishedYear,
      releaseDate,
      publisher: book.googleAPIData?.publisher,
      pageCount: parseInt(book.googleAPIData?.pageCount) || undefined,
      bookLength: book.Duration,
      imageURL,
      categories: Array.from(new Set(categories)),
      pathDirArray: undefined,
      pathPrimaryCat: primaryCatMap[genreArray[0]],
      pathSecondaryCat: secondaryCatMap[genreArray[genreArray.length - 1]],
    };
  });

  //~ ------------------------------------------------------------
  // Write Cat lists out to file
  fs.writeFileSync(
    "CatLists.json",
    JSON.stringify({
      primaryCats: Array.from(new Set(primaryCatList)),
      secondaryCats: Array.from(new Set(secondaryCatList)),
    })
  );
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
  const bookData = JSON.parse(
    fs.readFileSync("audibleBooks.json", {
      encoding: "utf-8",
    })
  );

  for (let book of bookData) {
    const audibleData = await getAudibleData(book.author, book.title);
    book.description = audibleData.description;
    book.imageURL = audibleData.imageURL;
    book.asin = audibleData.asin;
  }

  fs.writeFileSync("audibleBooks-enhanced.json", JSON.stringify(bookData));
}

mergeAudibleData();
