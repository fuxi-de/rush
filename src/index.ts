import Crawler from "./crawler";
const crawler = new Crawler(
  "https://www.google.de/maps/place",
  "22301",
  "supermarkt"
);

(async () => {
  try {
    await crawler.crawl();
  } catch (e) {
    console.log(e);
  }
})();
