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
  const single = areas.find((a) => a.name === area)!.toys.length === 1;
  if (!single)
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
test("every Release 1 activity mounts, responds, resets and returns", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  for (const area of areas) {
    for (const toy of area.toys) {
      await openToy(page, area.name, toy);
      const controls = page.locator(".act button:not(:disabled)");
      await expect(controls.first()).toBeVisible();
      await controls.first().click();
      await page
        .getByRole("button", { name: `Reset ${toy}`, exact: true })
        .click();
      if (area.toys.length === 1) {
        await page.getByRole("button", { name: "Back to playroom" }).click();
        await expect(
          page.getByRole("heading", { name: "Hello, little explorer." }),
        ).toBeVisible();
      } else {
        await page
          .getByRole("button", { name: `Back to ${area.name}` })
          .click();
        await expect(
          page.getByRole("heading", { name: area.name, exact: true }),
        ).toBeVisible();
      }
    }
  }
  expect(errors).toEqual([]);
});
test("switch states survive re-entry and reset independently", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Workshop Wall", "Light Switch Wall");
  const rocker = page.getByRole("switch", { name: "Rocker switch" });
  await expect(rocker).toBeChecked();
  await rocker.click();
  await expect(rocker).not.toBeChecked();
  await page.getByRole("button", { name: "Back to Workshop Wall" }).click();
  await page.getByRole("button", { name: /Light Switch Wall/ }).click();
  await expect(rocker).not.toBeChecked();
  await page
    .getByRole("button", { name: "Reset Light Switch Wall", exact: true })
    .click();
  await expect(rocker).toBeChecked();
});
test("all lights off turns the house to night", async ({ page }) => {
  await page.goto("./");
  await openToy(page, "Workshop Wall", "Light Switch Wall");
  for (const name of [
    "Rocker switch",
    "Toggle switch",
    "Pull cord",
    "Push button",
  ])
    await page.getByRole("switch", { name }).click();
  await page.getByRole("slider", { name: "Dimmer" }).fill("0");
  await expect(page.locator(".act-lights")).toHaveClass(/is-night/);
  await expect(page.getByRole("button", { name: "Sleepy cat" })).toBeVisible();
});
test("colour mixing names the colour and shares it with Finger Paint", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Little Lab", "Colour Mixing Pots");
  await page.getByRole("button", { name: "Red paint jar" }).click();
  await page.getByRole("button", { name: "Yellow paint jar" }).click();
  await page.getByRole("button", { name: "Stir", exact: true }).click();
  await expect(page.locator(".act .sr-status")).toHaveText("It made orange.");
  await page.getByRole("button", { name: "Keep orange" }).click();
  await page.getByRole("button", { name: "Empty the bowl" }).click();
  await openToy(page, "Art Studio", "Finger Paint");
  await expect(
    page.getByRole("button", { name: "My orange paint" }),
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
  await page.getByRole("checkbox", { name: /Calm mode/ }).check();
  await page.getByRole("button", { name: "Close parent controls" }).click();
  await expect(page.locator(".area-card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Cozy Nook/ })).toBeVisible();
  await page.reload();
  await expect(page.locator(".area-card")).toHaveCount(3);
});
test("the child's name in settings drives Letter Friends", async ({ page }) => {
  await page.goto("./");
  await settings(page);
  const name = page.getByRole("textbox", { name: /Child’s name/ });
  await name.fill("Mia");
  await name.blur();
  await page.getByRole("button", { name: "Close parent controls" }).click();
  await openToy(page, "Thinking Treehouse", "Letter Friends");
  await page.getByRole("button", { name: "Spell Mia" }).click();
  for (const l of ["M", "I", "A"])
    await page
      .getByRole("button", { name: `Letter ${l}` })
      .first()
      .click();
  await expect(page.getByLabel("Mia: 3 of 3 letters")).toBeVisible();
});
test("paint undo and a two-step broom", async ({ page }) => {
  await page.goto("./");
  await openToy(page, "Art Studio", "Finger Paint");
  const paper = page.getByRole("img", { name: "Painting paper" });
  const r = (await paper.boundingBox())!;
  await page.mouse.move(r.x + 60, r.y + 60);
  await page.mouse.down();
  await page.mouse.move(r.x + 200, r.y + 120, { steps: 6 });
  await page.mouse.up();
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  await expect(undo).toBeEnabled();
  await page.getByRole("button", { name: "New page" }).click();
  await page.getByRole("button", { name: "Sweep it all away" }).click();
  await expect(undo).toBeDisabled();
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
  await openToy(page, "Workshop Wall", "Light Switch Wall");
  await page.getByRole("switch", { name: "Rocker switch" }).click();
  await expect(
    page.getByRole("switch", { name: "Rocker switch" }),
  ).not.toBeChecked();
  await context.setOffline(false);
});
test("phone layout shows every area on one map without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".area-card")).toHaveCount(areas.length);
  const noOverflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
  expect(await noOverflow()).toBe(true);
  for (const [area, toy] of [
    ["Pretend Town", "Little Kitchen"],
    ["Workshop Wall", "Gear Wall"],
    ["Art Studio", "Stamp Pad"],
  ]) {
    await openToy(page, area, toy);
    expect(await noOverflow()).toBe(true);
  }
});
test("predict-and-test activities respond to choices", async ({ page }) => {
  await page.goto("./");
  const status = page.locator(".act .sr-status");
  // Sink or float: guess, then see.
  await openToy(page, "Little Lab", "Sink or Float Tub");
  await page.getByRole("button", { name: "Rock", exact: true }).click();
  await page.getByRole("button", { name: "I think it sinks" }).click();
  await expect(status).toContainText("You guessed it");
  await page.getByRole("button", { name: "Cork", exact: true }).click();
  await page.getByRole("button", { name: "I think it sinks" }).click();
  await expect(status).toContainText("Oh, surprise!");
  // Feed the friends: favourites and "not for me".
  await openToy(page, "Animal Meadow", "Feed the Friends");
  await page.getByRole("button", { name: "Carrot", exact: true }).click();
  await page.getByRole("button", { name: "Feed the rabbit" }).click();
  await expect(status).toContainText("loves the carrot");
  await page.getByRole("button", { name: "Bone", exact: true }).click();
  await page.getByRole("button", { name: "Feed the horse" }).click();
  await expect(status).toContainText("Not for me");
  // Barn doors: listen, then open.
  await openToy(page, "Animal Meadow", "Barn Doors Peekaboo");
  await page.getByRole("button", { name: "Listen at door 1" }).click();
  await page.getByRole("button", { name: "Barn door 1", exact: true }).click();
  await expect(status).toContainText("It's a");
  // Door and latch: a latched door rattles; undo the latch to open it.
  await openToy(page, "Workshop Wall", "Door and Latch Panel");
  await page.getByRole("button", { name: "Door 1, latched" }).click();
  await expect(status).toContainText("latched");
  await page.getByRole("button", { name: /Slide the bolt/ }).click();
  await page.getByRole("button", { name: "Door 1", exact: true }).click();
  await expect(status).toContainText("Peekaboo");
});
test("counting, gears, kitchen, clinic and stars", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("./");
  const status = page.locator(".act .sr-status");
  await openToy(page, "Thinking Treehouse", "Counting Critters");
  const critters = page.locator(".count-critter");
  const n = await critters.count();
  for (let i = 0; i < n; i++) await critters.first().click();
  await expect(status).toHaveText(new RegExp(`^${n} .*!$`));
  await openToy(page, "Workshop Wall", "Gear Wall");
  for (let i = 1; i <= 5; i++) {
    await page
      .getByRole("button", { name: "Middle gear", exact: true })
      .click();
    await page.getByRole("button", { name: `Peg ${i}, empty` }).click();
  }
  await expect(status).toHaveText("The gears reach the toy. Turn the crank!");
  await openToy(page, "Pretend Town", "Little Kitchen");
  await page.getByRole("button", { name: "Open the fridge" }).click();
  await page.getByRole("button", { name: "Tomato", exact: true }).click();
  await page.getByRole("button", { name: "Cutting board" }).click();
  await page.getByRole("button", { name: "Chop", exact: true }).click();
  await page.getByRole("button", { name: "chopped tomato" }).click();
  await page.getByRole("button", { name: "Plate", exact: true }).click();
  await page.getByRole("button", { name: "Serve the bear" }).click();
  await expect(status).not.toBeEmpty();
  await openToy(page, "Pretend Town", "Teddy Care Clinic");
  await page.getByRole("button", { name: "Tissue", exact: true }).click();
  await page.getByRole("button", { name: "Teddy, the patient" }).click();
  await expect(status).toContainText("Teddy");
  await openToy(page, "Cozy Nook", "Starry Night");
  const sky = (await page
    .getByRole("button", { name: "Put a star in the sky" })
    .boundingBox())!;
  for (const [x, y] of [
    [0.3, 0.3],
    [0.42, 0.18],
    [0.45, 0.42],
    [0.3, 0.31],
  ])
    await page.mouse.click(sky.x + sky.width * x, sky.y + sky.height * y);
  await expect(status).toHaveText("The stars made a bird!");
});
test("tap-tap and drag both place shapes; a cancelled drag leaves no shape", async ({
  page,
}) => {
  await page.goto("./");
  await openToy(page, "Build Yard", "Shape Pictures");
  await page.getByRole("button", { name: "Blank page" }).click();
  await page.getByRole("button", { name: "circle shape", exact: true }).click();
  await page.getByRole("button", { name: "Put it here" }).click();
  await expect(
    page.getByRole("button", { name: "circle 1: change colour" }),
  ).toBeVisible();
  const piece = page.getByRole("button", { name: "star shape" });
  const canvas = page.getByRole("button", { name: "Picture", exact: true });
  const a = (await piece.boundingBox())!,
    b = (await canvas.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.4, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "star 2: change colour" }),
  ).toBeVisible();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.4, {
    steps: 8,
  });
  await piece.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await expect(page.locator(".placed-hit")).toHaveCount(2);
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
  await openToy(page, "Workshop Wall", "Light Switch Wall");
  await page.getByRole("switch", { name: "Rocker switch" }).click();
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
      page.getByRole("switch", { name: "Rocker switch" }),
    ).not.toBeChecked();
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
