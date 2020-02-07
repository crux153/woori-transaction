"use strict";

const puppeteer = require("puppeteer");
const keypad = require("./keypad");

const URL = "https://spib.wooribank.com/spd/Dream?withyou=CMSPD0010";

class DialogError extends Error {}
class PageError extends Error {}
class RangeError extends Error {}

function parseRange(range) {
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

module.exports = async function(account, password, birthday, range = "1W") {
  // Parse range
  range = parseRange(range);

  // Launch puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on("dialog", dialog => {
    const message = dialog.message();
    browser.close();

    throw new DialogError(message);
  });

  // Go to page
  await page.goto(URL);

  const $account = await page.$("#pup01");
  await $account.type(account.replace(/-/g, ""));

  // Handle keypad
  const handleKeypad = async (selector, key) => {
    const $el = await page.$("#" + selector);
    await $el.focus();

    const hash = await page.evaluate(async selector => {
      const $img = document.querySelector(`#Tk_${selector}_layout img`);

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
    const coords = await keypad(hash, key);
    const box = await $img.boundingBox();

    for (const { x, y } of coords) {
      await page.mouse.click(box.x + x, box.y + y);
    }
  };

  await handleKeypad("pup02", password);
  await handleKeypad("pup03", birthday);

  await page.evaluate(() => {
    window.doSubmit();
  });

  await page.waitForNavigation();

  // Check error message on page
  const error = await page.evaluate(() => {
    const $error = document.querySelector(
      "#error-area-TopLayer .error-area .mb10"
    );
    if (!$error) {
      return null;
    } else {
      return $error.textContent;
    }
  });

  if (error !== null) {
    browser.close();
    throw new PageError(error);
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

  // Render result
  const results = [];

  let totalPages = 1;
  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const result = await page.evaluate(() => {
      const convertNumber = number => Number(number.replace(/,/g, ""));
      const replaceFullWidth = str =>
        str.replace(/[\uFF01-\uFF5E]/g, ch =>
          String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
        );

      const pages = document.querySelector(".paginate").children.length;

      const [name, account, balance, withdrawable, branch] = Array.from(
        document.querySelector(".tbl-type tbody").querySelectorAll("tr td")
      ).map(el => el.textContent);

      const transactions = Array.from(
        document.querySelectorAll("table.tbl-type-1 tbody tr")
      )
        .map(el => Array.from(el.children).map(el => el.textContent.trim()))
        .filter(el => el.length === 7) // filter rows without data
        .map(
          ([timestamp, type, name, withdrawal, deposit, balance, branch]) => ({
            timestamp,
            type,
            branch,
            name: replaceFullWidth(name),
            withdrawal: convertNumber(withdrawal),
            deposit: convertNumber(deposit),
            balance: convertNumber(balance)
          })
        );

      return {
        name,
        account,
        branch,
        transactions,
        balance: convertNumber(balance.replace(" 원", "")),
        withdrawable: convertNumber(withdrawable.replace(" 원", "")),
        pages
      };
    });

    totalPages = result.pages;
    results.push(result);

    // Move to next page
    if (currentPage < totalPages) {
      await page.evaluate(nextPage => {
        document.frm.NEXT_ROWS.value = String(nextPage);
        window.doSubmit();
      }, currentPage + 1);

      await page.waitForNavigation();
    }
  }

  await browser.close();
  return results.reduce(
    (acc, value) => ({
      ...acc,
      ...value,
      transactions: [...acc.transactions, ...value.transactions]
    }),
    {
      transactions: []
    }
  );
};
