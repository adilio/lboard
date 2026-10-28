import { writeFile, unlink } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { areas } from "../../src/model";
import type { Page } from "@playwright/test";
// Wait for the zoom and pop-in animations to finish so geometry is final.
async function settle(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) =>
          a.playState !== "running" ||
          a.effect?.getTiming().iterations === Infinity,
      ),
  );
}
async function openToy(page: Page, area: string, toy: string) {
  await page.getByRole("button", { name: "Layla Board playroom" }).click();
  await page.getByRole("button", { name: area, exact: false }).click();
  await page.getByRole("button", { name: toy, exact: false }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: toy, exact: true }),
  ).toBeVisible();
  await settle(page);
}
async function settings(page: Page) {
  await page.getByRole("button", { name: "Grown-ups" }).click();
  await page.getByRole("button", { name: "Hold for 3 seconds" }).press("Enter");
  const q = await page.getByRole("heading", { level: 3 }).textContent();
  const nums = q!.match(/\d+/g)!.map(Number);
  await page
    .getByRole("button", { name: String(nums[0] + nums[1]), exact: true })
    .click();
}
test("every initial activity mounts, responds, resets and returns to its shelf", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  for (const area of areas) {
    for (const toy of area.toys) {
      await openToy(page, area.name, toy);
      const controls = page.locator(".play-content button");
      await expect(controls.first()).toBeVisible();
      await controls.first().click();
      if (toy === "Finger Paint") page.once("dialog", (d) => d.accept());
      await page
        .getByRole("button", { name: `Reset ${toy}`, exact: true })
        .click();
      await page.getByRole("button", { name: `Back to ${area.name}` }).click();
      await expect(
        page.getByRole("heading", { name: area.name, exact: true }),
      ).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
test("switch states survive re-entry and reset independently", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Busy Board", "Switchboard");
  await page.getByRole("switch", { name: "Round lamp" }).click();
  await expect(page.getByRole("switch", { name: "Round lamp" })).toBeChecked();
  await page.getByRole("button", { name: "Back to Busy Board" }).click();
  await page.getByRole("button", { name: /Switchboard/ }).click();
  await expect(page.getByRole("switch", { name: "Round lamp" })).toBeChecked();
  await page
    .getByRole("button", { name: "Reset Switchboard", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Round lamp" }),
  ).not.toBeChecked();
});
test("colour mixing accepts two inputs and can be repeated", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Science Lab", "Colour Kitchen");
  await page.getByRole("button", { name: "red", exact: true }).click();
  await page
    .getByRole("button", { name: "Add selected colour to bowl" })
    .click();
  await page.getByRole("button", { name: "yellow", exact: true }).click();
  await page
    .getByRole("button", { name: "Add selected colour to bowl" })
    .click();
  await expect(
    page.getByRole("button", { name: "Bowl: orange. Empty to mix again." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Empty bowl", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add selected colour to bowl" }),
  ).toBeVisible();
});
test("parent gate cancels early hold and keyboard path saves settings", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Grown-ups" }).click();
  const hold = page.locator(".hold-button");
  const r = await hold.boundingBox();
  await page.mouse.move(r!.x + r!.width / 2, r!.y + r!.height / 2);
  await page.mouse.down();
  await expect(hold).toHaveText("Keep holding…");
  await hold.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await expect(hold).toHaveText("Hold for 3 seconds");
  await page.getByRole("button", { name: "Close parent controls" }).click();
  await settings(page);
  await page.getByRole("checkbox", { name: "Calm mode" }).check();
  await page.getByRole("button", { name: "Close parent controls" }).click();
  await expect(page.locator(".area-card")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Calm Corner/ })).toBeVisible();
  await page.reload();
  await expect(page.locator(".area-card")).toHaveCount(1);
});
test("paint has a keyboard stamp alternative, undo and confirmed clear", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Creative Studio", "Finger Paint");
  await page.getByRole("button", { name: "Stamp", exact: true }).click();
  await page
    .getByRole("button", { name: "Stamp in square 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Keep this one" }).click();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Clear paper", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled();
});
test("offline shell and toys work after completed precache", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await settings(page);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "This copy is prepared for offline play." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close parent controls" }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hello, little explorer." }),
  ).toBeVisible();
  await openToy(page, "Busy Board", "Switchboard");
  await page.getByRole("switch", { name: "Round lamp" }).click();
  await expect(page.getByRole("switch", { name: "Round lamp" })).toBeChecked();
  await context.setOffline(false);
});
test("phone layout shows every area on one map without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".area-card")).toHaveCount(areas.length);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await openToy(page, "Building Site", "Block Builder");
  await page
    .getByRole("button", { name: "Select block 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Place selected piece in row 2, column 2" })
    .click();
  await expect(
    page.getByRole("button", { name: "Move block 1", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("matching, planting, floating, and picnic mechanics change the visible scene", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Animal World", "Habitat Homes");
  await page.getByRole("button", { name: "Select Frog", exact: true }).click();
  await page.getByRole("button", { name: "Place animal in Pond" }).click();
  await expect(page.locator(".residents").first().locator("svg")).toHaveCount(
    1,
  );
  await openToy(page, "Science Lab", "Float or Sink");
  await page.getByRole("button", { name: "Stone", exact: true }).click();
  await page
    .getByRole("button", { name: "Put selected object in water" })
    .click();
  await expect(page.locator(".sunk")).toHaveText("●Stone");
  await openToy(page, "Pretend Play", "Garden Patch");
  await page.getByRole("button", { name: "Pot 1: plant seed" }).click();
  await page.getByRole("button", { name: "Pot 1: water seed" }).click();
  await expect(
    page.getByRole("button", { name: "Pot 1: pick flower" }),
  ).toBeVisible();
  await openToy(page, "Pretend Play", "Picnic Kitchen");
  await page.getByRole("button", { name: "Berry", exact: true }).click();
  await page
    .getByRole("button", { name: "Place selected food on plate" })
    .click();
  await expect(page.locator(".food-stack>span")).toHaveCount(1);
  await page.getByRole("button", { name: "Serve the picnic" }).click();
  await expect(page.getByRole("status")).toContainText("colourful");
  await openToy(page, "Little Discoveries", "Shape Sorter");
  await page.getByRole("button", { name: "Select Triangle" }).click();
  await page.getByRole("button", { name: "Circle space", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select Triangle" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Select Triangle" }).click();
  await page
    .getByRole("button", { name: "Triangle space", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Triangle space, filled" }),
  ).toBeVisible();
  await openToy(page, "Little Discoveries", "Counting Picnic");
  await page.getByRole("button", { name: "Select a berry" }).click();
  await page
    .getByRole("button", { name: "Plate 1, 0 berries. Add a berry." })
    .click();
  await expect(
    page.getByRole("button", { name: "Plate 1, 1 berries. Add a berry." }),
  ).toBeVisible();
});
test("drag placement commits and canceled drag leaves scene unchanged", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Creative Studio", "Sticker Stories");
  const piece = page.getByRole("button", {
    name: "Select sticker 1",
    exact: true,
  });
  const dest = page.getByRole("button", {
    name: "Place selected piece in row 2, column 2",
  });
  const a = (await piece.boundingBox())!,
    b = (await dest.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Move sticker 1", exact: true }),
  ).toBeVisible();
  const placed = page.getByRole("button", {
    name: "Move sticker 1",
    exact: true,
  });
  const before = await placed.getAttribute("style");
  const r = (await placed.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 120, r.y + 50);
  await placed.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await expect(placed).toHaveAttribute("style", before!);
});
test("offline indicator detects and repairs a missing cached asset", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const req of await cache.keys())
        if (req.url.endsWith("icon-512.png")) await cache.delete(req);
    }
  });
  await page.reload();
  await settings(page);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Offline preparation is not yet confirmed." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry offline preparation" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "This copy is prepared for offline play." }),
  ).toBeVisible();
});
test("prepared update waits during play and activates only on parent request", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await openToy(page, "Busy Board", "Switchboard");
  await page.getByRole("switch", { name: "Round lamp" }).click();
  const original = await (await page.request.get("sw.js")).text();
  const updateFile = `${process.env.APP_OUT_DIR || "dist"}/sw-test-update.js`;
  await writeFile(
    updateFile,
    original.replace(/const CACHE='([^']+)'/, "const CACHE='$1-test-update'"),
  );
  try {
    await page.evaluate(async () => {
      await navigator.serviceWorker.register(
        new URL("sw-test-update.js", location.href).href,
        { scope: new URL("./", location.href).pathname },
      );
    });
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.waiting,
        ),
      )
      .toBe(true);
    await expect(
      page.getByRole("switch", { name: "Round lamp" }),
    ).toBeChecked();
    await settings(page);
    await expect(
      page.getByRole("button", { name: "Update ready: restart" }),
    ).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Update ready: restart" }).click();
    await expect(
      page.getByRole("heading", { name: "Hello, little explorer." }),
    ).toBeVisible();
  } finally {
    await unlink(updateFile);
  }
});

test("published HTML points to real JavaScript, CSS, icons, and a correctly scoped manifest", async ({
  page,
}) => {
  const response = await page.goto("./");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Hello, little explorer." }),
  ).toBeVisible();
  const assets = await page
    .locator(
      'script[src],link[rel="stylesheet"],link[rel="icon"],link[rel="apple-touch-icon"],link[rel="manifest"]',
    )
    .evaluateAll((elements) =>
      elements.map((el) => ({
        url: el.getAttribute("src") || el.getAttribute("href") || "",
        tag: el.tagName,
        rel: el.getAttribute("rel"),
      })),
    );
  for (const asset of assets) {
    const res = await page.request.get(asset.url);
    expect(res.status(), asset.url).toBe(200);
    if (asset.tag === "SCRIPT")
      expect(res.headers()["content-type"]).toContain("javascript");
    if (asset.rel === "stylesheet")
      expect(res.headers()["content-type"]).toContain("text/css");
  }
  const manifest = await (
    await page.request.get("manifest.webmanifest")
  ).json();
  expect(manifest.start_url).toBe(process.env.APP_BASE || "/");
  expect(manifest.scope).toBe(process.env.APP_BASE || "/");
  const missing = await page.request.get("assets/missing-script.js");
  expect(missing.status()).toBe(404);
});
