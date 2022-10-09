import puppeteer from "puppeteer";
import wooriCore, { Result, Transaction } from "woori-transaction-core";

export { Result, Transaction };

export default async function woori(
  account: string,
  password: string,
  birthday: string,
  rangeStr: string = "1W"
): Promise<Result> {
  // Launch puppeteer
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1080, height: 1080 },
  });

  return wooriCore(browser, account, password, birthday, rangeStr);
}
