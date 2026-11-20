import test from "node:test";
import assert from "node:assert/strict";
import {
  PHASE1_NEW_YUME_BRAND_COLORS,
  CANONICAL_YUME_BRAND_PALETTE_ITEMS,
  BRAND_COLOR_GROUP_ORDER,
  validateAndNormalizeHex,
  isForbiddenLegacyDesertOrGoldHex,
  getRelativeLuminance,
  getContrastRatio,
  isLightColor,
  getContrastSafeForeground,
  createDefaultBrandIdentityConfig,
  getEnabledColors,
  canRemoveOrDisableColor,
  addColorToGroup,
  updateColorInGroup,
  removeColorFromGroup,
  reorderColorInGroup,
  updateGroupRotation,
  resolveGroupActiveColor,
  resolveAllGroupsState,
  computeFooterGradientCSS,
  sanitizeBrandIdentityConfig,
} from "./brandIdentityColorSystem";

test("Phase 1: Canonical YUME palette contains all 5 new colors and excludes desert/golden/brown tones", () => {
  const requiredFive = ["#F9FBF4", "#4D4040", "#A64B45", "#A66F78", "#806477"];
  const paletteHexes = CANONICAL_YUME_BRAND_PALETTE_ITEMS.map((c) => c.hex.toUpperCase());

  for (const hex of requiredFive) {
    assert.equal(
      paletteHexes.includes(hex),
      true,
      `Expected ${hex} to be present in CANONICAL_YUME_BRAND_PALETTE_ITEMS`
    );
  }

  assert.equal(PHASE1_NEW_YUME_BRAND_COLORS.length, 5);

  // Verify legacy desert/terracotta/gold colors are excluded
  const forbidden = ["#744210", "#78350F", "#EAB308"];
  for (const badHex of forbidden) {
    assert.equal(
      paletteHexes.includes(badHex),
      false,
      `Expected forbidden legacy color ${badHex} to be removed from palette`
    );
    assert.equal(isForbiddenLegacyDesertOrGoldHex(badHex), true);
  }
});

test("Phase 2: HEX validation accepts standard formats and rejects invalid HEX inputs", () => {
  const valid1 = validateAndNormalizeHex("#F9FBF4");
  assert.equal(valid1.valid, true);
  assert.equal(valid1.hex, "#F9FBF4");

  const valid2 = validateAndNormalizeHex("#4d4040");
  assert.equal(valid2.valid, true);
  assert.equal(valid2.hex, "#4D4040");

  const valid3 = validateAndNormalizeHex("a64b45");
  assert.equal(valid3.valid, true);
  assert.equal(valid3.hex, "#A64B45");

  const invalid1 = validateAndNormalizeHex("#GGGGGG");
  assert.equal(invalid1.valid, false);
  assert.ok(invalid1.error);

  const invalid2 = validateAndNormalizeHex("#12345");
  assert.equal(invalid2.valid, false);

  const invalid3 = validateAndNormalizeHex("");
  assert.equal(invalid3.valid, false);
});

test("Phase 2 & 3: All 7 color-management groups exist with independent configurations and rotation modes", () => {
  const config = createDefaultBrandIdentityConfig();

  assert.deepEqual(Object.keys(config.groups), [
    "header",
    "footer",
    "buttons",
    "links",
    "backgrounds",
    "accents",
    "additional",
  ]);
  assert.equal(BRAND_COLOR_GROUP_ORDER.length, 7);

  // Verify default independent rotation modes from specification example
  assert.equal(config.groups.header.rotation.mode, "refresh");
  assert.equal(config.groups.footer.rotation.syncWithHeader, true);
  assert.equal(config.groups.buttons.rotation.mode, "static");
  assert.equal(config.groups.links.rotation.mode, "interval");
  assert.equal(config.groups.links.rotation.intervalSeconds, 30);
  assert.equal(config.groups.backgrounds.rotation.mode, "static");

  // Changing Links rotation to 15s must not affect Header, Footer, Buttons, or Backgrounds
  const updated = updateGroupRotation(config, "links", {
    mode: "interval",
    intervalSeconds: 15,
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.config.groups.links.rotation.intervalSeconds, 15);
  assert.equal(updated.config.groups.header.rotation.mode, "refresh");
  assert.equal(updated.config.groups.buttons.rotation.mode, "static");
  assert.equal(updated.config.groups.backgrounds.rotation.mode, "static");
});

test("Phase 2: CRUD operations and safety guard preventing deletion/disabling of last enabled color", () => {
  let config = createDefaultBrandIdentityConfig();

  // Add a custom color to buttons group
  const added = addColorToGroup(config, "buttons", {
    hex: "#806477",
    name: "Custom Velvet Plum",
  });
  assert.equal(added.ok, true);
  assert.ok(added.addedColor);
  config = added.config;

  // Reject adding invalid HEX
  const badAdd = addColorToGroup(config, "buttons", {
    hex: "not-a-hex",
    name: "Invalid",
  });
  assert.equal(badAdd.ok, false);

  // Reorder color up
  const lastColor = config.groups.buttons.colors[config.groups.buttons.colors.length - 1];
  const reordered = reorderColorInGroup(config, "buttons", lastColor.id, "up");
  const movedIdx = reordered.groups.buttons.colors.findIndex((c) => c.id === lastColor.id);
  assert.equal(movedIdx, config.groups.buttons.colors.length - 2);

  // Disable all except one color in backgrounds group, then verify last one cannot be disabled or removed
  let bgConfig = createDefaultBrandIdentityConfig();
  const bgIds = bgConfig.groups.backgrounds.colors.map((c) => c.id);
  for (let i = 1; i < bgIds.length; i++) {
    const res = updateColorInGroup(bgConfig, "backgrounds", bgIds[i], { enabled: false });
    assert.equal(res.ok, true);
    bgConfig = res.config;
  }

  // Only bgIds[0] remains enabled
  assert.equal(getEnabledColors(bgConfig.groups.backgrounds).length, 1);

  const disableLast = updateColorInGroup(bgConfig, "backgrounds", bgIds[0], {
    enabled: false,
  });
  assert.equal(disableLast.ok, false);
  assert.ok(disableLast.error?.includes("last enabled color"));

  const removeLast = removeColorFromGroup(bgConfig, "backgrounds", bgIds[0]);
  assert.equal(removeLast.ok, false);
  assert.ok(removeLast.error?.includes("last enabled color"));

  // Check canRemoveOrDisableColor directly
  const guard = canRemoveOrDisableColor(bgConfig.groups.backgrounds, bgIds[0]);
  assert.equal(guard.allowed, false);
});

test("Phase 3 & 5: Group color resolution and Footer synchronization with Header", () => {
  const config = createDefaultBrandIdentityConfig();
  const cursors = {
    header: 2, // #A64B45 Crimson Terracotta Rose
    footer: 0,
    buttons: 0,
    links: 1,
    backgrounds: 0,
    accents: 0,
    additional: 0,
  };

  const resolvedSynced = resolveAllGroupsState(config, cursors, false);
  assert.equal(resolvedSynced.header.effectiveHex, "#A64B45");
  // Because footer.rotation.syncWithHeader is true by default, footer matches header (#A64B45)
  assert.equal(resolvedSynced.footer.effectiveHex, "#A64B45");

  // When footer syncWithHeader is turned off and footer is set to static #806477
  const plumFooterColor = config.groups.footer.colors.find((c) => c.hex === "#806477")!;
  const unsyncedRes = updateGroupRotation(config, "footer", {
    syncWithHeader: false,
    mode: "static",
    staticColorId: plumFooterColor.id,
  });
  const resolvedIndependent = resolveAllGroupsState(unsyncedRes.config, cursors, false);
  assert.equal(resolvedIndependent.header.effectiveHex, "#A64B45");
  assert.equal(resolvedIndependent.footer.effectiveHex, "#806477");
});

test("Phase 5: computeFooterGradientCSS preserves exact Light and Dark Mode color-mix formulas", () => {
  const lightGrad = computeFooterGradientCSS("#A64B45", false);
  assert.equal(
    lightGrad.background,
    "linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, #A64B45 6%, #ffffff) 45%, color-mix(in srgb, #A64B45 18%, #ffffff) 80%, color-mix(in srgb, #A64B45 30%, #ffffff) 100%)"
  );
  assert.equal(lightGrad.borderTop, "1px solid color-mix(in srgb, #A64B45 14%, #e2e8f0)");

  const darkGrad = computeFooterGradientCSS("#A64B45", true);
  assert.equal(
    darkGrad.background,
    "linear-gradient(180deg, #0f172a 0%, color-mix(in srgb, #A64B45 16%, #0f172a) 55%, color-mix(in srgb, #A64B45 36%, #0f172a) 100%)"
  );
  assert.equal(darkGrad.borderTop, "1px solid rgba(255, 255, 255, 0.08)");
});

test("Phase 8: WCAG luminance and automatic contrast adaptation for #F9FBF4 vs deep brand tones", () => {
  // #F9FBF4 is very light (luminance > 0.9) and requires dark foreground (#0F172A)
  assert.equal(isLightColor("#F9FBF4"), true);
  assert.equal(getContrastSafeForeground("#F9FBF4"), "#0F172A");
  assert.ok(getContrastRatio("#F9FBF4", "#0F172A") >= 15);

  // #4D4040, #A64B45, #A66F78, #806477 are darker tones requiring #FFFFFF foreground
  for (const hex of ["#4D4040", "#A64B45", "#A66F78", "#806477"]) {
    assert.equal(isLightColor(hex), false);
    assert.equal(getContrastSafeForeground(hex), "#FFFFFF");
  }
});

test("Sanitizer strips legacy desert/gold colors from old snapshots and ensures at least 1 enabled color", () => {
  const dirtySnapshot = {
    version: 3,
    groups: {
      header: {
        colors: [
          { id: "bad_1", hex: "#744210", name: "Old Terracotta", enabled: true, order: 0 },
          { id: "bad_2", hex: "#78350f", name: "Old Gold", enabled: true, order: 1 },
          { id: "good_1", hex: "#4D4040", name: "Deep Espresso", enabled: false, order: 2 },
        ],
        rotation: { mode: "refresh", intervalSeconds: 30, staticColorId: "bad_1" },
      },
    },
  };

  const sanitized = sanitizeBrandIdentityConfig(dirtySnapshot);
  assert.equal(sanitized.groups.header.colors.length, 1);
  assert.equal(sanitized.groups.header.colors[0].hex, "#4D4040");
  // Automatically enabled because it is the only remaining valid color
  assert.equal(sanitized.groups.header.colors[0].enabled, true);
  assert.equal(
    resolveGroupActiveColor(sanitized.groups.header, 0).hex,
    "#4D4040"
  );
});
