const coordinates = [
  { x: 180, y: 93 },
  { x: 227, y: 93 },
  { x: 227, y: 139 },
  { x: 227, y: 185 },
  { x: 227, y: 231 },
  { x: 180, y: 231 },
  { x: 133, y: 231 },
  { x: 86, y: 231 },
  { x: 86, y: 185 },
  { x: 86, y: 139 },
  { x: 86, y: 93 },
  { x: 133, y: 93 }
];

const hashes = ["713ff4", "d064da", "74d4c4", "8747a0", "8b22c9", "c01fd0"];

export default async function keypad(hash: string, password: string) {
  if (!/^[0-9]+$/.test(password)) {
    throw new Error("Password should be digits");
  }

  const match = hashes.indexOf(hash);
  if (match < 0) {
    throw new Error("Unknown hash");
  }

  const numbers = coordinates.filter(
    (_, index) => index !== match && index !== 11 - match
  );

  return password.split("").map((char: string) => numbers[parseInt(char, 10)]);
}
