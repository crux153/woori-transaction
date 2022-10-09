# woori-transaction

Inquiry Woori Bank transactions using Node.js.
Use [Puppeteer](https://pptr.dev/) under the hood.

You need to sign up [Speed Account Inquiry](https://spib.wooribank.com/spd/Dream?withyou=CMLGN0010) service before using this.

## Installation

```bash
npm install woori-transaction
```

## Usage

```js
const woori = require("woori-transaction").default;

woori("1234-123-123456", "1234", "0101").then(result => {
  console.log(result);
});
```

```ts
import woori from "woori-transaction";

main();

async function main() {
  const result = await woori("1234-123-123456", "1234", "0101");
  console.log(result);
}
```

```js
{ name: '홍길동',
  account: '1234-123-123456',
  branch: '지점',
  transactions:
   [ { timestamp: '2020.01.01 15:00:00',
       type: '인터넷',
       branch: '',
       name: '홍길동',
       withdrawal: 0,
       deposit: 10000,
       balance: 60000 },
     { timestamp: '2020.01.01 14:00:00',
       type: '모바일',
       branch: '',
       name: '이체',
       withdrawal: 50000,
       deposit: 0,
       balance: 50000 },
     { timestamp: '2020.01.01 13:00:00',
       type: '타행건별',
       branch: '',
       name: '홍길동',
       withdrawal: 0,
       deposit: 30000,
       balance: 100000 } ],
  balance: 60000,
  withdrawable: 60000 }
```

## CLI

```bash
npm install -g woori-tranaction
woori-transaction -h
```

```
Usage: cli [options]

Options:
  -a --account <value>   bank account number
  -p --password <value>  bank account password
  -b --birthday <value>  birthday of registered user
  -r --range <value>     date range to fetch [format: 1D, 15D, 1W, 1M]
  -j --json              output json
  -h, --help             output usage information
```

```bash
woori-transaction -a 1234-123-123456 -p 1234 -b 0101
```

![screenshot](https://user-images.githubusercontent.com/10908841/74246631-31566e80-4d28-11ea-8ec1-f7f44b76779b.png)

## License
Distributed under the MIT License. See `LICENSE` for more information.
