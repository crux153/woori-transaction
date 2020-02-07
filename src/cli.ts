#!/usr/bin/env node

import commander from "commander";
import chalk from "chalk";
import { table } from "table";

import transaction from ".";

commander
  .option("-a --account <value>", "bank account number")
  .option("-p --password <value>", "bank account password")
  .option("-b --birthday <value>", "birthday of registered user")
  .option("-r --range <value>", "date range to fetch [format: 1D, 15D, 1W, 1M]")
  .option("-j --json", "output json")
  .parse(process.argv);

if (!commander.account || !commander.password || !commander.birthday) {
  commander.help();
}

main();

async function main() {
  try {
    const result = await transaction(
      commander.account,
      commander.password,
      commander.birthday,
      commander.range
    );

    if (commander.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      return;
    }

    const numberWithCommas = (num: number) =>
      num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const formatNumber = (num: number, formatter: chalk.Chalk) =>
      num > 0 ? formatter(numberWithCommas(num)) : numberWithCommas(num);

    const output = table(
      [
        ["일시", "적용", "기재내용", "출금", "입금", "잔액", "취급점"].map(c =>
          chalk.cyan(c)
        ),
        ...result.transactions.map(
          ({ timestamp, type, name, withdrawal, deposit, balance, branch }) => [
            timestamp,
            type,
            name,
            formatNumber(withdrawal, chalk.magenta),
            formatNumber(deposit, chalk.green),
            formatNumber(balance, chalk.blue),
            branch
          ]
        )
      ],
      {
        columns: {
          3: {
            alignment: "right"
          },
          4: {
            alignment: "right"
          },
          5: {
            alignment: "right"
          }
        }
      }
    );

    console.log(output);
  } catch (error) {
    console.log(error);
  }
}
