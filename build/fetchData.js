var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const axios = require("axios");
function fakeGetBookData(author, title) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    author,
                    title,
                    googleTitle: "gt" + title,
                });
            }, 200);
        });
    });
}
function sanitizeTitle(title) {
    const regex = /[&,-,/,\\]/gi;
    return title.replace(regex, "");
}
function getBookData(author, title) {
    let baseURL = "https://www.googleapis.com/books/v1/volumes";
    let query = `${baseURL}?q=${sanitizeTitle(title)}+inauthor:${author}`;
    let id = `${author.replace(/\s/g, "")}-${title.replace(/\s/g, "")}`;
    return axios
        .get(query)
        .then((resp) => {
        let bookInfo = resp.data.items[0].volumeInfo;
        console.log("----------------");
        console.log(baseURL + query);
        console.log("----------------");
        let googleTitle = bookInfo.title;
        let authors = bookInfo.authors;
        let subTitle = bookInfo.subtitle;
        let description = bookInfo.description;
        let publisher = bookInfo.publisher;
        let publishedDate = bookInfo.publishedDate;
        let pageCount = bookInfo.pageCount;
        let categories = bookInfo.categories;
        let imageURL = bookInfo.imageLinks ? bookInfo.imageLinks.thumbnail : "";
        let bookDetailsURL = bookInfo.infoLink;
        let isbn = bookInfo.industryIdentifiers || [];
        return {
            id,
            author,
            title,
            subTitle,
            googleTitle,
            authors,
            description,
            publisher,
            publishedDate,
            pageCount,
            categories,
            imageURL,
            bookDetailsURL,
            isbn,
            query,
        };
    })
        .catch((e) => {
        //console.log("ERROR", e.response.status);
        return { id, author, title, error: e };
    });
}
module.exports = {
    getBookData,
    fakeGetBookData,
};
