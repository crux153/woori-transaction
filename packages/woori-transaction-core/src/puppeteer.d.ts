import type { Browser as PuppeteerBrowser } from "puppeteer";
import type {
  Browser as PuppeteerCoreBrowser,
  Page as PuppeteerCorePage,
} from "puppeteer-core";

// eslint-disable-next-line @typescript-eslint/ban-types
type IsAny<T> = unknown extends T ? (T extends {} ? T : never) : never;
type NotAny<T> = T extends IsAny<T> ? never : T;

declare namespace Puppeteer {
  export type Browser = NotAny<PuppeteerBrowser> | NotAny<PuppeteerCoreBrowser>;
  export type Page = PuppeteerCorePage;
}

export default Puppeteer;
