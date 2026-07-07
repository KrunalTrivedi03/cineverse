const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Generates a randomized but realistic cinema seat layout:
 * front rows = Classic (more, narrower seats), middle = Premium, back = Recliner (fewer, wider).
 */
function generateRandomSeatLayout() {
  const totalRows = randInt(8, 12);
  const reclinerRows = randInt(2, 3);
  const classicRows  = randInt(3, 4);
  const premiumRows  = totalRows - reclinerRows - classicRows;

  const rows = [];
  let i = 0;

  for (let r = 0; r < classicRows; r++)
    rows.push({ row: ROW_LETTERS[i++], seats: randInt(12, 18), category: "Classic" });

  for (let r = 0; r < premiumRows; r++)
    rows.push({ row: ROW_LETTERS[i++], seats: randInt(10, 16), category: "Premium" });

  for (let r = 0; r < reclinerRows; r++)
    rows.push({ row: ROW_LETTERS[i++], seats: randInt(6, 10), category: "Recliner" });

  return rows;
}

module.exports = { generateRandomSeatLayout };