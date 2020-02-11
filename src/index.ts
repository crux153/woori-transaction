import puppeteer from "puppeteer";
import keypad from "./keypad";

const WOORI_URL = "https://spib.wooribank.com/spd/Dream?withyou=CMSPD0010";

class DialogError extends Error {}
class PageError extends Error {}
class RangeError extends Error {}

export interface Result {
  name: string;
  account: string;
  branch: string;
  balance: number;
  withdrawable: number;
  transactions: Transaction[];
}

export interface Transaction {
  timestamp: string;
  type: string;
  branch: string;
  name: string;
  withdrawal: number;
  deposit: number;
  balance: number;
}

export default async function woori(
  account: string,
  password: string,
  birthday: string,
  rangeStr: string = "1W"
): Promise<Result> {
  // Parse range
  const range = parseRange(rangeStr);

  // Launch puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on("dialog", dialog => {
    const message = dialog.message();

    if (message.includes("보안로그 수집기")) {
      return dialog.dismiss();
    }

    browser.close();
    throw new DialogError(message);
  });

  // Go to page
  await page.goto(WOORI_URL);

  const $account = await page.$("#pup01");
  if (!$account) {
    throw new Error("Failed to find account input element");
  }

  await $account.type(account.replace(/-/g, ""));

  await handleKeypad(page, "pup02", password);
  await handleKeypad(page, "pup03", birthday);

  await page.evaluate(() => {
    window.doSubmit();
  });

  await page.waitForNavigation();

  // Check error message on page
  const errorMessage = await page.evaluate(() => {
    const $error = document.querySelector(
      "#error-area-TopLayer .error-area .mb10"
    );
    if (!$error) {
      return null;
    } else {
      return $error.textContent;
    }
  });

  if (errorMessage !== null) {
    await browser.close();
    throw new PageError(errorMessage);
  }

  // Set range
  await page.evaluate(range => {
    window.setToday();
    window.setCalTerm(
      true,
      "INQ_END_DT",
      "INQ_STA_DT",
      range.unit,
      range.amount
    );
    window.doSubmit();
  }, range);

  await page.waitForNavigation();

  const result = await fetchResult(page);

  await browser.close();
  return result;
}

function parseRange(range: string) {
  const matches = range.match(/^([0-9]+)([DWM])$/);
  if (!matches) {
    throw new RangeError("Not valid range");
  }

  const amount = Number(matches[1]);
  const unit = matches[2];

  if (!amount) {
    throw new RangeError("Range should be more than 1D, 1W, or 1M");
  }

  return { amount, unit };
}

async function handleKeypad(
  page: puppeteer.Page,
  selector: string,
  key: string
) {
  const $el = await page.$("#" + selector);
  if (!$el) {
    throw new Error("Failed to find input element");
  }

  await $el.focus();

  const hash = await page.evaluate(async selector => {
    const $img = document.querySelector<HTMLImageElement>(
      `#Tk_${selector}_layout img`
    );

    if (!$img) {
      throw new Error("Failed to find keypad image");
    }

    // Wait until image loads
    await new Promise(resolve => {
      $img.addEventListener("load", resolve);
    });

    const response = await fetch($img.src);
    if (!response.ok) {
      throw new Error("Could not fetch keypad image");
    }

    const data = await response.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

    return hash.substring(0, 6);
  }, selector);

  const $img = await page.$(`#Tk_${selector}_layout img`);
  if (!$img) {
    throw new Error("Failed to find keypad image");
  }

  const coords = await keypad(hash, key);
  const box = await $img.boundingBox();

  if (!box) {
    throw new Error("Image bounding box not visible");
  }

  for (const { x, y } of coords) {
    await page.mouse.click(box.x + x, box.y + y);
  }
}

async function fetchResult(page: puppeteer.Page): Promise<Result> {
  const result = await page.evaluate(() => {
    const convertNumber = (number: string) =>
      parseInt(number.replace(/,/g, ""), 10) || 0;

    const replaceFullWidth = (str: string) =>
      str.replace(/[\uFF01-\uFF5E]/g, (char: string) =>
        String.fromCharCode(char.charCodeAt(0) - 0xfee0)
      );

    const meta =
      document.querySelector(".tbl-type tbody")?.querySelectorAll("tr td") ||
      [];

    const [name, account, balance, withdrawable, branch] = [
      ...new Array(5)
    ].map((_, index) => meta[index]?.textContent || "");

    const transactions: Transaction[] = Array.from(
      document.querySelectorAll("table.tbl-type-1 tbody tr")
    )
      .map(el =>
        Array.from(el.children).map(el => el?.textContent?.trim() || "")
      )
      .filter(el => el.length === 7) // filter rows without data
      .map(([timestamp, type, name, withdrawal, deposit, balance, branch]) => ({
        timestamp,
        type,
        branch,
        name: replaceFullWidth(name),
        withdrawal: convertNumber(withdrawal),
        deposit: convertNumber(deposit),
        balance: convertNumber(balance)
      }));

    return {
      name,
      account,
      branch,
      transactions,
      balance: convertNumber(balance.replace(" 원", "")),
      withdrawable: convertNumber(withdrawable.replace(" 원", ""))
    };
  });

  return result;
}
