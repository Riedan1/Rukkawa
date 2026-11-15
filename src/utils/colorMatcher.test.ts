import test from "node:test";
import assert from "node:assert/strict";
import { hexToRgb, getClosestColorName, CORE_8_COLOR_FAMILIES } from "./colorMatcher.ts";

test("CORE_8_COLOR_FAMILIES contains exactly 8 core color families", () => {
  assert.equal(CORE_8_COLOR_FAMILIES.length, 8);
  const names = CORE_8_COLOR_FAMILIES.map(f => f.name);
  assert.deepEqual(names, ["White", "Black", "Red", "Blue", "Green", "Yellow", "Brown", "Gray"]);
});

test("hexToRgb converts 6-digit and 3-digit hex correctly", () => {
  assert.deepEqual(hexToRgb("#ffffff"), { r: 255, g: 255, b: 255 });
  assert.deepEqual(hexToRgb("#000000"), { r: 0, g: 0, b: 0 });
  assert.deepEqual(hexToRgb("#3B82F6"), { r: 59, g: 130, b: 246 });
  assert.deepEqual(hexToRgb("#f00"), { r: 255, g: 0, b: 0 });
  assert.equal(hexToRgb("invalid"), null);
});

test("getClosestColorName detects close shades and root base names", () => {
  // Test #3B82F6 (Blue)
  const blueMatch = getClosestColorName("#3B82F6");
  assert.equal(blueMatch.baseName, "Blue");
  assert.match(blueMatch.name, /Blue/);

  // Test #10B981 (Green)
  const greenMatch = getClosestColorName("#10B981");
  assert.equal(greenMatch.baseName, "Green");
  assert.match(greenMatch.name, /Green/);

  // Test #EF4444 (Red)
  const redMatch = getClosestColorName("#EF4444");
  assert.equal(redMatch.baseName, "Red");
  assert.match(redMatch.name, /Red/);

  // Test #000000 (Black)
  const blackMatch = getClosestColorName("#000000");
  assert.equal(blackMatch.baseName, "Black");

  // Test #FFFFFF (White)
  const whiteMatch = getClosestColorName("#FFFFFF");
  assert.equal(whiteMatch.baseName, "White");
});
