import Crawler from "./crawler";
const crawler = new Crawler(
  "https://www.google.de/maps/place",
  "22301",
  "supermarkt"
);

crawler.crawl();
