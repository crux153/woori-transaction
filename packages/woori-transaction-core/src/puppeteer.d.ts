// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type puppeteer from "puppeteer";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type puppeteerCore from "puppeteer-core";

// eslint-disable-next-line @typescript-eslint/ban-types
type IsAny<T> = unknown extends T ? (T extends {} ? T : never) : never;
type NotAny<T> = T extends IsAny<T> ? never : T;

declare namespace Puppeteer {
  export type Browser =
    | NotAny<puppeteer.Browser>
    | NotAny<puppeteerCore.Browser>;
  export type Page = puppeteerCore.Page;
}

export default Puppeteer;
