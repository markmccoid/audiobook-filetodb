const axios = require("axios");
export async function fakeGetBookData(authors, title): Promise<GoogleData> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        authors,
        title,
      });
    }, 200);
  });
}

function sanitizeTitle(title) {
  const regex = /[&,-,/,\\]/gi;
  return title.replace(regex, "");
}

export type GoogleData = {
  id?: string;
  title?: string;
  subTitle?: string;
  authors?: string[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: string;
  categories?: string[];
  imageURL?: string;
  bookDetailsURL?: string;
  isbn?: { type: string; identifier: string }[];
  googleISBNS?: Record<string, string>;
  query?: string;
  queryDateString?: string;
};
export async function getBookData(authorIn, titleIn): Promise<GoogleData> {
  let baseURL = "https://www.googleapis.com/books/v1/volumes";
  let query = `${baseURL}?q=${sanitizeTitle(titleIn)}+inauthor:${authorIn}`;
  let id = `${authorIn.replace(/\s/g, "")}-${titleIn.replace(/\s/g, "")}`;
  const queryDateString = new Date()
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
  // console.log(query);
  return axios
    .get(query)
    .then((resp) => {
      if (resp.data.totalItems === 0) {
        return {
          query,
          queryDateString,
        };
      }
      let bookInfo = resp.data.items[0].volumeInfo;

      let title = bookInfo?.title;
      let authors = bookInfo?.authors;
      let subTitle = bookInfo?.subtitle;
      let description = bookInfo?.description;
      let publisher = bookInfo?.publisher;
      let publishedDate = bookInfo?.publishedDate;
      let pageCount = bookInfo?.pageCount;
      let categories = bookInfo?.categories;
      let imageURL = bookInfo?.imageLinks
        ? bookInfo?.imageLinks?.thumbnail
        : "";
      let bookDetailsURL = bookInfo?.infoLink;
      let isbn: Pick<GoogleData, "isbn"> = bookInfo?.industryIdentifiers;
      let googleISBNS = undefined;

      if (Array.isArray(isbn)) {
        googleISBNS =
          isbn &&
          isbn.reduce<Record<string, string>>((final, el) => {
            return { ...final, [el.type]: el.identifier };
          }, {});
      }
      return {
        id,
        subTitle,
        title,
        authors,
        description,
        publisher,
        publishedDate,
        pageCount,
        categories,
        imageURL,
        bookDetailsURL,
        googleISBNS,
        query,
        queryDateString,
      };
    })
    .catch((e) => {
      //console.log("ERROR", e.response.status);
      return { id, authorIn, titleIn, error: e };
    });
}

module.exports = {
  getBookData,
  fakeGetBookData,
};
