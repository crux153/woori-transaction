// We must add @ts-ignore to make this work even when only puppeteer-core is installed

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { Browser as PuppeteerBrowser } from "puppeteer";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type {
  Browser as PuppeteerCoreBrowser,
  Page as PuppeteerCorePage,
} from "puppeteer-core";

type IsAny<T> = unknown extends T ? (T extends object ? T : never) : never;
type NotAny<T> = T extends IsAny<T> ? never : T;

export type Browser = NotAny<PuppeteerBrowser> | NotAny<PuppeteerCoreBrowser>;
export type Page = PuppeteerCorePage;
