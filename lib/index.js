"use strict";

const puppeteer = require("puppeteer");
const keypad = require("./keypad");

const URL = "https://spib.wooribank.com/spd/Dream?withyou=CMSPD0010";

module.exports = async function(account, password, birthday, range = "1W") {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	await page.goto(URL);

	const $account = await page.$("#pup01");
	await $account.type(account.replace(/-/g, ""));

	const handleKeypad = async (selector, key) => {
		const $el = await page.$("#" + selector);
		await $el.focus();

		await page.evaluate(selector => {
			return new Promise(resolve => {
				document.querySelector(`#Tk_${ selector }_layout img`).addEventListener("load", resolve);
			});
		}, selector);

		const $img = await page.$(`#Tk_${ selector }_layout img`);
		const img = await $img.screenshot();

		const coords = await keypad(img, key);
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

	const $range = await page.$(`a[data-date-range="${ range }"]`);
	await $range.click();

	await page.evaluate(() => {
		window.doSubmit();
	});

	await page.waitForNavigation();

	const result = await page.evaluate(() => {
		const convertNumber = number => Number(number.replace(/,/g, ""));

		const [ name, account, balance, withdrawable, branch ] = Array.from(document.querySelector(".tbl-type tbody").querySelectorAll("tr td"))
			.map(el => el.textContent);

		const transactions = Array.from(document.querySelectorAll("table.tbl-type-1 tbody tr"))
			.map(el => Array.from(el.children)
			.map(el => el.textContent.trim()))
			.map(([ timestamp, type, name, withdrawal, deposit, balance, branch ]) => ({
				timestamp, type, name, branch,
				withdrawal: convertNumber(withdrawal),
				deposit: convertNumber(deposit),
				balance: convertNumber(balance)
			}));

		return {
			name, account, branch, transactions,
			balance: convertNumber(balance.replace(" 원", "")),
			withdrawable: convertNumber(withdrawable.replace(" 원", ""))
		};
	});

	await browser.close();

	return result;
};
