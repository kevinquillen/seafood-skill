---
name: seafood
description: Used to retrieve todays seafood offering and price from Beach n Seafood in Virginia Beach. Run this skill when the user asks for it or phrases like "what does Eric have today?"
---

**IMPORTANT: This is a silent-execution skill. Do not narrate any
intermediate actions. Begin executing immediately and produce no
user-visible text until the final result is ready.**

# Beach N Seafood Menu

Extract today's seafood menu from the Beach N Seafood Facebook page using Playwright:

https://www.facebook.com/beachnseafood/

The purpose of this skill is to inspect today's Facebook menu-board image and return an accurate terminal-friendly table of the seafood currently available.

Accuracy is more important than completeness.

Never guess.

# Browser workflow

Use Playwright to open:

https://www.facebook.com/beachnseafood/

Do not rely on HTTP requests, search-engine snippets, cached results, third-party websites, or previously extracted menu data.

## Initial page handling

1. Open the Facebook page using Playwright.
2. Wait for the page to become usable.
3. Detect any visible modal, dialog, login prompt, cookie overlay, signup overlay, or other obstruction.
4. Close or dismiss the obstruction when possible.
5. Do not authenticate or log into Facebook.
6. Verify that the page content is visible before attempting to inspect posts.

Facebook may display overlays after initial page load. If another dismissible modal appears while navigating posts or images, close it before continuing.

# Date and operating-day rules

Determine the current date and day of week using:

`America/New_York`

The menu must come from the current calendar date.

## Monday and Tuesday

Beach N Seafood is normally closed Monday and Tuesday.

If today is Monday or Tuesday and there is no current-day Facebook content clearly indicating that Beach N Seafood is open and offering seafood today, return only:

Eric is most likely closed today.

Do not inspect or return an older menu as today's menu.

If a current-day post clearly establishes that the business is open and contains today's menu, extract it normally.

## Wednesday through Sunday

Look for a menu-board post from the current calendar date.

If no current-day menu has been posted, return only:

Eric has not updated the menu yet.

Never substitute yesterday's menu or any older menu.

# Facebook post selection

Do not assume that the newest Facebook post is necessarily the menu post.

Starting with the newest visible post:

1. Inspect posts from the current calendar date.
2. Look for a post containing one or more photographs of the seafood menu board.
3. If the newest post is an announcement, photograph, sold-out update, holiday notice, or other non-menu post, continue examining other posts made today.
4. Stop when today's menu-board post has been identified.
5. Never fall back to a menu post from a previous calendar date.

If the latest visible Facebook post itself predates the current date, treat the menu as not updated and return:

Eric has not updated the menu yet.

If a current-day post explicitly states that the business is closed, respect that statement and do not use an older menu.

If a current-day post explicitly states that all seafood is sold out, do not present an older menu as currently available.

If the user asks "what did they have last?" or "what did Eric have previously?" locate the previous menu, the first one you find - all other rules of this skill apply still.

# Multiple images

A menu post may contain multiple images.

Inspect every image attached to today's menu post.

Identify every image containing menu-board content.

Do not stop after successfully reading the first menu board.

Seafood items may be distributed across multiple boards or images.

Combine valid menu entries from all current-day menu-board images into the final table.

Do not duplicate an item merely because the same board appears in more than one photograph.

# Source of truth

The photographed menu board in the current-day Facebook post is the ONLY source of truth for:

* seafood items
* quantities
* units
* prices
* availability

Never use any of the following to supplement, correct, interpret, or disambiguate the current board:

* beachnseafood.com
* Google
* Bing
* search-engine results
* Google Maps
* Yelp
* restaurant/menu websites
* third-party websites
* previous Facebook posts
* cached Facebook posts
* previous skill executions
* remembered prices
* previously observed menu layouts
* seafood pricing conventions
* assumptions about how seafood is normally sold

Do not use outside knowledge to resolve unclear handwriting.

If something cannot be determined from the current menu board itself, use `null` where applicable rather than guessing.

# Board versus Facebook caption

The photographed menu board is authoritative for menu extraction.

Facebook post captions may be used to determine contextual information such as:

* whether the business is open
* whether the business is closed
* whether something has sold out
* whether the post represents today's menu

Do not create menu rows from caption text alone.

If a caption says something such as:

`Fresh tuna today!`

but tuna cannot be identified on the menu board, do not create a Tuna entry.

# Extraction rules

Extract visible menu-board text only.

Follow these rules strictly:

* No interpretation.
* No normalization.
* No inferred units.
* No inferred quantities.
* No inferred prices.
* No inferred item names.
* Do not correct spelling.
* Do not expand abbreviations.
* Do not rewrite product names.
* Do not normalize capitalization unnecessarily.
* Do not invent punctuation.
* Preserve written units exactly.
* Preserve visible prices exactly.
* Preserve item names as written as closely as possible.
* If something is genuinely unclear, return `null` for that field.
* If multiple prices are listed for one item, return multiple rows.
* Ignore crossed-out prices unless they are explicitly visible as still valid.
* Ignore decorative text.
* Ignore background signage.
* Ignore brand signage behind the menu board.
* Ignore the words `Rapp River`.

Do not convert:

`qt`

to:

`pint`

Do not convert:

`/lb`

to:

`per lb`

If you see '/lb' just output it as 'lb'.

Do not convert or normalize any other visible unit.

If `$` is visibly written, preserve `$`.

If `$` is not visibly written, do not add it.

# Unavailable items

If a multi-line item contains a line marked:

`NA`

that particular offering is not available.

Skip that line.

Do not output an `NA` line as a purchasable menu item.

If other quantities or variants of the same seafood item have valid prices, output those valid entries normally.

# Handwriting rule

Nothing on the menu board is intentionally written in cursive.

When a handwritten character could plausibly be either a lowercase `a` or the number `2`, prefer:

`2`

Use this rule only when the character is genuinely ambiguous.

If surrounding text clearly establishes that the character is a letter, use the letter.

Do not use this rule to override clearly readable text.

# Shrimp rule

Shrimp may include size/count notation such as:

`16-20ct`

This describes the approximate number or size classification of shrimp per pound.

It is NOT the purchase quantity for purposes of the output table.

Do not place shrimp sizing such as:

`16-20ct`

in the `Unit` column.

Focus on the actual visible selling unit and price.

Do not infer a selling unit merely because shrimp is commonly sold by weight.

If the selling unit is not visibly stated, use:

`null`

Do not include the shrimp-per-pound count elsewhere in the output.

# Clams and oysters

Pay special attention to clams and oysters.

These frequently contain multiple quantities and prices and must NOT be collapsed into a single row.

Clams may contain columns such as:

`50ct`

and:

`100ct`

Oysters may contain a separate quantity/count and price on each line.

Extract every clearly visible quantity/price combination.

Each distinct quantity/price combination must produce a separate output row.

# Multi-column layout rule

When a sign contains column headers such as:

`50ct` and `100ct`

treat each header as applying vertically to the prices directly beneath it.

Use the actual visual layout.

Consider:

* horizontal position
* vertical position
* column alignment
* row alignment
* spacing
* indentation
* divider lines
* grouping
* nearest labels

Do NOT mix values between columns.

If a price visually appears beneath the `50ct` column, it must not be paired with `100ct`.

If a price visually appears beneath the `100ct` column, it must not be paired with `50ct`.

Each row must produce separate entries for each populated column.

Do not assume every seafood row uses the same quantities.

Do not fill in missing column values.

Do not shift a price into another column simply because that association appears more economically plausible.

Visual position is authoritative.

# Multiple quantity rule

If multiple purchase quantities are visible, such as:

* `100ct`
* `50ct`
* `dozen`

output separate rows for every unique visible quantity/price pairing.

Never merge multiple quantities into one row.

Never combine multiple prices into one `Price` field.

Never duplicate the same quantity merely to account for nearby prices unless the visual layout clearly establishes separate entries.

Each price must map to exactly one purchase quantity when a purchase quantity is visibly associated with it.

# Spatial association rule

Associate prices using visual position.

A price belongs to:

1. the nearest applicable seafood item label; and
2. the nearest applicable purchase-quantity label

based primarily on horizontal and vertical alignment.

Use spatial relationships rather than semantic assumptions.

Pay particular attention to:

* rows
* columns
* headers
* indentation
* horizontal alignment
* vertical alignment
* gaps between groups
* divider lines
* repeated labels

Do not infer pairings based on seafood pricing conventions.

Do not infer pairings based on previous menu boards.

Do not infer pairings because two seafood products are normally sold using the same quantity.

Do not reuse a quantity label for multiple prices unless visual alignment establishes that the quantity applies to each of those prices.

If spatial association remains genuinely ambiguous after careful inspection, use `null` rather than guessing.

# Definition of Unit

The `Unit` column represents the purchase quantity or selling unit visibly associated with the price.

Examples may include:

`50ct`

`100ct`

`dozen`

`qt`

`/lb`

These are examples only.

Do not assume any of these units unless actually visible.

Preserve the unit EXACTLY as written.

Shrimp sizing such as `16-20ct` is not considered a selling unit for this output.

# Exact transcription

For every extracted row:

## Item

`Item` must match the visible seafood item wording as closely as possible.

Do not improve or normalize the name.

## Unit

`Unit` must match the visible purchase quantity or selling unit exactly.

If no unit is visibly associated with the price, use:

`null`

## Price

`Price` must match the visible price exactly.

If the price is genuinely unreadable, use:

`null`

Do not manufacture missing characters.

# Output format

The final successful response is intended for display directly.

Return a Markdown table containing exactly these columns:

| Item | Unit | Price |
| ---- | ---- | ----- |

For example, the structural format is:

| Item | Unit | Price |
| ---- | ---- | ----- |
| ITEM | UNIT | PRICE |
| ITEM | UNIT | PRICE |

The example above demonstrates structure only. Never use example data as menu data.

# Table rules

* One purchasable item/quantity/price combination per row.
* Use exactly three columns.
* Do not add additional columns.
* Do not include Facebook URLs.
* Do not include post dates.
* Do not include confidence scores.
* Do not include notes.
* Do not include explanations.
* Do not include shrimp size/count information.
* Preserve the menu's visual ordering as closely as practical.
* When an item has multiple valid quantities/prices, repeat the item name on each row.
* Never merge multiple quantities or prices into one table cell.

# Successful response

When a current-day seafood menu is available and at least one valid menu item has been extracted, output ONLY:

1. The Markdown table.
2. One blank line.
3. The following exact statement:

Call and reserve at 757-689-8413 - Eric runs out of stock fast.

For example, the response structure must be:

| Item | Unit | Price |
| ---- | ---- | ----- |
| ...  | ...  | ...   |

Call and reserve at 757-689-8413 - Eric runs out of stock fast.

Do not put the output inside a Markdown code fence.

Do not add an introduction.

Do not say:

* "Here is today's menu"
* "I found the following"
* "According to Facebook"
* "The menu appears to show"

Do not explain the extraction process.

# No current menu

If today's menu has not been posted, return ONLY:

Eric has not updated the menu yet.

Do not return a table.

Do not return yesterday's menu.

Do not return the reservation statement.

# Monday or Tuesday closure

If today is Monday or Tuesday and there is no current-day evidence that Beach N Seafood is open and offering seafood, return ONLY:

Eric is most likely closed today.

Do not return a table.

Do not return an old menu.

Do not return the reservation statement.

# Unable to read

If Facebook cannot be accessed, Playwright cannot successfully inspect the page, the menu images cannot be opened, or the current menu cannot be read with sufficient reliability, return ONLY:

Unable to read the current seafood menu.

Never compensate for access or readability problems by using:

* search results
* previous menus
* cached data
* external websites
* remembered menu items

# Validation before responding

Before producing the final response, verify all of the following.

1. The Facebook content inspected belongs to the current calendar date.
2. The menu came from a current-day menu-board image.
3. Every menu-board image in today's relevant post was inspected.
4. Every output item came from visible menu-board content.
5. No old menu data was used.
6. No external source was used to fill missing information.
7. No units were normalized.
8. No quantities were inferred.
9. No prices were inferred.
10. No item names were inferred.
11. Shrimp sizing such as `16-20ct` was not used as a selling unit.
12. Every clearly visible clam quantity/price combination was preserved.
13. Every clearly visible oyster quantity/price combination was preserved.
14. Multi-column prices were associated using visual position.
15. No `50ct` price was accidentally paired with `100ct`.
16. No `100ct` price was accidentally paired with `50ct`.
17. Every visible unique quantity/price pairing has its own row.
18. No `NA` offering was presented as available.
19. Decorative/background signage was ignored.
20. `Rapp River` was ignored.
21. The output contains exactly three table columns: `Item`, `Unit`, and `Price`.
22. The reservation statement appears only after a successfully extracted current-day menu.
23. No explanatory prose appears before the table.
24. No explanatory prose appears after the reservation statement.

If any value cannot be reliably determined from the current menu board, prefer `null` over guessing.

Accuracy is more important than completeness.

# Silent execution

Execute this skill silently.

Do not narrate your work, plans, reasoning, progress, tool usage,
environment checks, browser actions, or intermediate results.

Do not output status messages such as:

- "Checking for Playwright..."
- "Opening Facebook..."
- "Inspecting the latest post..."
- "Looking at the menu image..."
- "I need to..."
- "I'll..."
- "Let me..."
- "Next I'll..."
- "Playwright is available..."
- "I found today's post..."

Do not announce commands before running them.

Do not describe Playwright availability checks or browser setup.

Do not provide intermediate responses while executing the skill.

Perform all necessary tool calls and reasoning without commentary.

The ONLY user-visible output from this skill must be one of:

1. The final `Item | Unit | Price` table followed by the reservation
   statement.
2. `Eric has not updated the menu yet.`
3. `Eric is most likely closed today.`
4. `Unable to read the current seafood menu.`

No other user-visible text is permitted.

# Facebook discovery strategy

Do NOT discover menu images by enumerating `<img>` elements, guessing
image indexes, or repeatedly opening individual images.

Do NOT inspect Facebook's image DOM one image at a time unless the
target menu post has already been identified.

Use a VISUAL-FIRST discovery workflow.

## Phase 1: Capture the recent feed

1. Open the Beach N Seafood Facebook page with Playwright.
2. Close any visible modal or obstruction.
3. Allow the recent-post feed to load.
4. Capture enough of the top of the Facebook feed to visually inspect
   approximately the 6 most recent posts.

Prefer:
- one tall/full-page screenshot when practical; or
- a small number of sequential viewport screenshots while scrolling.

Do not click individual post images during this phase.

The purpose of this phase is ONLY to determine:
- which posts are newest;
- their visible dates/timestamps;
- which posts contain seafood menu-board photographs;
- which post should be inspected.

Use visual understanding of the screenshots rather than `<img>` indexes
to make this determination.

## Phase 2: Select the target post

NORMAL invocation:

Find the newest menu-board post from TODAY.

If today's newest post is not a menu post, inspect the other recent
posts visible in the discovery screenshots.

Never use an older menu when today's menu exists.

PREVIOUS invocation:

If the user explicitly asks for the "previous", "last", or most recent
previous menu, find the newest menu-board post regardless of whether it
is from today.

This is intentionally allowed to return an older menu.

For PREVIOUS mode:
- ignore the normal requirement that the menu must be from today;
- search the recent posts newest-to-oldest;
- select the first actual menu-board post found;
- do not reject it merely because Eric is closed today;
- do not return "Eric has not updated the menu yet";
- do not return "Eric is most likely closed today" merely because today
  is Monday or Tuesday.

The purpose of PREVIOUS mode is specifically to answer:
"What was the most recent menu Eric posted?"

## Phase 3: Inspect the selected menu

ONLY AFTER identifying the target post:

1. Open the selected post or its menu-board image.
2. Dismiss any Facebook modal that obstructs the image.
3. Capture the menu board at the highest practical readable resolution.
4. If the post contains multiple menu-board images, inspect all of them.
5. Extract the menu according to the remainder of this skill.

Once the target post has been identified, do not restart feed discovery
unless the selected image proves not to be a menu board.

# Prohibited discovery behavior

Do NOT:

- enumerate every `<img>` on the Facebook page;
- guess that `img[20]`, `img[21]`, etc. correspond to menu images;
- repeatedly reload Facebook to inspect adjacent image indexes;
- click arbitrary images until a menu appears;
- use image-index position as evidence of post recency;
- repeatedly restart Playwright for every candidate image;
- enter an open-ended image-inspection loop.

The feed screenshot is the primary discovery mechanism.

DOM inspection may be used AFTER visual discovery to locate or click
the already-identified target post/image(s).

# Browser discovery

The browser helper is already installed and tested.

Do not check for Playwright.
Do not install Playwright.
Do not generate Playwright code.
Do not use `node -e`.
Do not inspect arbitrary Facebook DOM images.
Do not modify or troubleshoot the browser helper.

Run:

node ~/.claude/skills/seafood/scripts/menu.js discover

This produces up to six screenshots:

/tmp/beach-n-seafood/post-01.png
/tmp/beach-n-seafood/post-02.png
...
/tmp/beach-n-seafood/post-06.png

View these screenshots directly.

Use visual inspection to determine which screenshot represents the
desired menu post.

CURRENT mode:
Select today's menu-board post.

PREVIOUS mode:
Select the newest menu-board post regardless of date.

Once the target post number N has been identified, run:

node ~/.claude/skills/seafood/scripts/menu.js inspect N

Then view the returned menu image screenshots and extract the menu.

Do not perform additional Facebook discovery after the target post
has been identified.
