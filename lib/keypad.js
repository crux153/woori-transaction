"use strict";

const path = require("path");
const resemble = require("node-resemble-js");
const crop = require("png-crop");
const streamToBuffer = require("stream-to-buffer");

const width = 44;
const height = 43;

const target = path.join(__dirname, "../", "assets", "target.png");
const coordinates = [
  { top: 73, left: 160 },
  { top: 73, left: 207 },
  { top: 119, left: 207 },
  { top: 165, left: 207 },
  { top: 211, left: 207 },
  { top: 211, left: 160 },
  { top: 211, left: 113 },
  { top: 211, left: 66 },
  { top: 165, left: 66 },
  { top: 119, left: 66 },
  { top: 73, left: 66 },
  { top: 73, left: 113 }
];

module.exports = async function keypad(image, password) {
  if (!/^[0-9]+$/.test(password)) {
    throw new Error("Password should be digits");
  }

  const numbers = [];

  for (const { top, left } of coordinates) {
    const result = await new Promise((resolve, reject) => {
      crop.cropToStream(image, { width, height, top, left }, (err, stream) => {
        if (err) return reject(err);
        streamToBuffer(stream, (err, buffer) => {
          if (err) return reject(err);
          resemble(target)
            .compareTo(buffer)
            .onComplete(resolve);
        });
      });
    });

    const match = result.misMatchPercentage < 1;
    if (!match) {
      numbers.push({
        x: left + 20,
        y: top + 20
      });
    }
  }

  return password.split("").map(char => numbers[char]);
};
