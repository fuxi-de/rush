import puppeteer from "puppeteer";
import shop from "./models/shop";

export default class Crawler {
  private baseUrl: string;
  private cityPath: string; //@TODO maybe this should be postcode or even ipaddress if available
  private searchString: string;
  private openPages = 0;
  private browser?: puppeteer.Browser;

  constructor(baseUrl: string, cityPath: string, searchString: string) {
    this.baseUrl = baseUrl;
    this.cityPath = cityPath;
    this.searchString = searchString;
    this.openPages;
  }

  async crawl() {
    // Wait for browser launching.
    this.browser = await puppeteer.launch();
    // Wait for creating the new page.
    const page = await this.browser.newPage();
    const itemList = await this.buildItemList(
      page,
      `${this.baseUrl}/${this.cityPath}`,
      "div.section-result"
    );
    const url = page.url();
    if (itemList !== undefined) {
      itemList.forEach(async (_item, index) => {
        try {
          if (this.browser) {
            const newPage = await this.browser.newPage();
            this.openPages++;
            console.log("upwards", this.openPages);
            await newPage.goto(url, {
              waitUntil: "networkidle2",
            });
            const currentItem = await newPage.$(
              `.section-result:nth-of-type(${index + 1})`
            );
            if (currentItem) {
              const shopItem = await this.resolveShopItem(currentItem, newPage);
              console.log(shopItem);
            }
            await newPage.close();
            this.openPages--;
            console.log("downwards", this.openPages);
            await this.tryDestruction();
          }
        } catch (e) {
          console.log(e);
        }
      });
    }
  }

  async tryDestruction() {
    if (this.openPages === 0) {
      console.log("destroying Browser");
      return await this.browser?.close();
    }
    console.log("continuing");
  }

  async buildItemList(
    page: puppeteer.Page,
    path: string,
    selector: string
  ): Promise<puppeteer.ElementHandle<Element>[]> {
    try {
      await page.goto(path, { waitUntil: "networkidle2" });
      const searchBar = await page.$("input#searchboxinput");
      const searchButton = await page.$("button#searchbox-searchbutton");
      await searchBar?.click({ clickCount: 3 });
      await searchBar?.type(this.searchString);
      await searchButton?.click();
      await page.waitForNavigation();
      await page.waitForSelector(selector);
      const itemList = await page.$$(selector);
      return itemList;
    } catch (error) {
      console.log("error while building itemList occured:", error);
      return error;
    }
  }

  async resolveShopItem(
    item: puppeteer.ElementHandle<Element>,
    page: puppeteer.Page
  ) {
    const popTimesSelector = "div.section-popular-times-live-description";
    const nameSelector = ".section-hero-header-title-title";
    const addressSelector = "button[data-item-id='address']";
    try {
      await item.click();
      await page.waitForSelector(nameSelector);
      const currentUtilization = await this.resolveItemText(
        popTimesSelector,
        page
      );
      const name = await this.resolveItemText(nameSelector, page);
      const address = await this.resolveItemText(addressSelector, page);
      const shopItem: shop = {
        name,
        address,
        currentUtilization,
      };
      return shopItem;
    } catch (error) {
      console.log("error while resolving shopItem occured:", error);
      return error;
    }
  }

  async resolveItemText(
    selector: string,
    page: puppeteer.Page
  ): Promise<string> {
    try {
      const element = await page.$(selector);
      const content = await page.evaluate((el) => el.textContent, element);
      return content.trim();
    } catch (e) {
      console.log("error while resolving item Text", e);
      return "";
    }
  }
}
