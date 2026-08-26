#!/usr/bin/env node

const { execSync } = require("child_process");
const Module = require("module");

const globalNodeModules = execSync("npm root -g", {
  encoding: "utf8",
}).trim();

process.env.NODE_PATH = [
  globalNodeModules,
  process.env.NODE_PATH,
]
  .filter(Boolean)
  .join(":");

Module._initPaths();

const { chromium } = require("@playwright/test");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FACEBOOK_URL = "https://www.facebook.com/beachnseafood/";
const OUTPUT_DIR = path.join(os.tmpdir(), "beach-n-seafood");
const MAX_POSTS = 6;

const command = process.argv[2];
const postNumber = Number.parseInt(process.argv[3], 10);

/**
 * Silently attempt to dismiss common Facebook overlays.
 */
async function dismissOverlays(page) {
  const labels = [
    "Close",
    "Not now",
    "Not Now",
    "Decline optional cookies",
    "Allow all cookies",
    "Accept all",
  ];

  for (const label of labels) {
    try {
      const button = page.getByRole("button", {
        name: label,
        exact: true,
      }).first();

      if (await button.isVisible({ timeout: 300 })) {
        await button.click({ timeout: 1000 });
        await page.waitForTimeout(250);
      }
    } catch {
      // Ignore.
    }
  }

  // Escape sometimes closes Facebook's login/photo overlays.
  try {
    const dialog = page.locator('[role="dialog"]').first();

    if (await dialog.isVisible({ timeout: 300 })) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
    }
  } catch {
    // Ignore.
  }
}

/**
 * Open Facebook and get the page into a predictable state.
 */
async function openFacebook(browser) {
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 1800,
    },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  await page.goto(FACEBOOK_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForTimeout(5000);
  await dismissOverlays(page);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  return { context, page };
}

/**
 * Get visible Facebook posts.
 *
 * Facebook commonly represents feed posts using role="article".
 */
function getPosts(page) {
  return page.locator('[role="article"]');
}

/**
 * Scroll until we have enough posts loaded, or stop making progress.
 */
async function loadPosts(page, wanted = MAX_POSTS) {
  let previousCount = -1;
  let unchanged = 0;

  for (let attempt = 0; attempt < 10; attempt++) {
    await dismissOverlays(page);

    const posts = getPosts(page);
    const count = await posts.count();

    if (count >= wanted) {
      return count;
    }

    if (count === previousCount) {
      unchanged++;
    } else {
      unchanged = 0;
    }

    if (unchanged >= 2) {
      return count;
    }

    previousCount = count;

    await page.evaluate(() => {
      window.scrollBy(0, Math.floor(window.innerHeight * 0.9));
    });

    await page.waitForTimeout(1200);
  }

  return await getPosts(page).count();
}

/**
 * DISCOVER
 *
 * Capture up to six recent posts individually.
 *
 * Claude then visually examines these screenshots to decide which
 * post contains the desired menu.
 */
async function discover(browser) {
  fs.rmSync(OUTPUT_DIR, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true,
  });

  const { context, page } = await openFacebook(browser);

  try {
    const count = await loadPosts(page);
    const posts = getPosts(page);

    const limit = Math.min(count, MAX_POSTS);
    const screenshots = [];

    for (let i = 0; i < limit; i++) {
      const post = posts.nth(i);

      try {
        await post.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await dismissOverlays(page);

        const filename = path.join(
          OUTPUT_DIR,
          `post-${String(i + 1).padStart(2, "0")}.png`
        );

        await post.screenshot({
          path: filename,
          timeout: 15_000,
        });

        screenshots.push({
          post: i + 1,
          path: filename,
        });
      } catch {
        // Skip posts that disappeared or cannot be captured.
      }
    }

    return {
      success: true,
      operation: "discover",
      postsFound: count,
      postsCaptured: screenshots.length,
      screenshots,
    };
  } finally {
    await context.close();
  }
}

/**
 * INSPECT
 *
 * Reopen Facebook and locate the same numbered post.
 *
 * Save:
 *   selected-post.png
 *   image-01.png
 *   image-02.png
 *   ...
 *
 * The individual images are captured directly first. This often gives
 * Claude enough resolution without having to enter Facebook's viewer.
 */
async function inspect(browser, number) {
  if (!Number.isInteger(number) || number < 1) {
    throw new Error("inspect requires a post number, e.g. inspect 3");
  }

  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true,
  });

  const { context, page } = await openFacebook(browser);

  try {
    const count = await loadPosts(page, number);

    if (count < number) {
      throw new Error(
        `Requested post ${number}, but only ${count} posts were found`
      );
    }

    const post = getPosts(page).nth(number - 1);

    await post.scrollIntoViewIfNeeded();
    await page.waitForTimeout(750);
    await dismissOverlays(page);

    const selectedPostPath = path.join(
      OUTPUT_DIR,
      "selected-post.png"
    );

    await post.screenshot({
      path: selectedPostPath,
      timeout: 15_000,
    });

    /*
     * Capture substantial images inside the selected post.
     *
     * We intentionally do NOT inspect global page image indexes.
     * Images are scoped to the already-selected post.
     */
    const images = post.locator("img");
    const imageCount = await images.count();

    const capturedImages = [];

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);

      try {
        const box = await image.boundingBox();

        if (!box) {
          continue;
        }

        /*
         * Ignore avatars, icons, reaction graphics, etc.
         *
         * Keep this threshold relatively low because Facebook may
         * render menu thumbnails smaller than their source image.
         */
        if (box.width < 200 || box.height < 200) {
          continue;
        }

        const filename = path.join(
          OUTPUT_DIR,
          `image-${String(capturedImages.length + 1).padStart(2, "0")}.png`
        );

        await image.screenshot({
          path: filename,
          timeout: 15_000,
        });

        capturedImages.push({
          path: filename,
          width: Math.round(box.width),
          height: Math.round(box.height),
        });
      } catch {
        // Ignore individual images that cannot be captured.
      }
    }

    return {
      success: true,
      operation: "inspect",
      post: number,
      selectedPost: selectedPostPath,
      images: capturedImages,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  if (!["discover", "inspect"].includes(command)) {
    console.log(JSON.stringify({
      success: false,
      error: "Usage: facebook-menu.js discover | inspect <post-number>",
    }));

    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    let result;

    if (command === "discover") {
      result = await discover(browser);
    } else {
      result = await inspect(browser, postNumber);
    }

    /*
     * Only stdout produced by this program.
     * This makes its response easy for Claude to understand.
     */
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.log(JSON.stringify({
    success: false,
    error: error.message,
  }, null, 2));

  process.exit(1);
});
