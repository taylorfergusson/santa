# Fergusson Extended Universe – Family Santa Wishlist 2026

Nov 15, 2026 · @Taylor

## Overview

Fergusson Extended Universe is a private Christmas wish list app for one family, hosted at `santa.taylorfergusson.com`. Each person keeps a wish list, and everyone else can see it and claim items without the owner ever finding out what was claimed. The site title is "Fergusson Extended Universe – Family Santa Wishlist 2026," with the year updated each Christmas.

**Users:** Taylor, Steph, Laura, Jenn, Jordan, Jadyn, Jaisley, Eric, Nick. Jaisley is a baby, so she has no login. Jenn and Jordan manage her list (see Managed profiles). Taylor creates every account. There is no signup.

**Scope rule:** keep it as simple as possible. People do exactly two things:

1. Manage their own wish list, including importing items from an Amazon wish list or a screenshot, and answering questions on their profile
2. View other people's lists, claim items, check their own shopping list, and ask anonymous questions

No profile editing, settings, messaging, feeds or notifications beyond what is described here. Profile photos and names are set by Taylor and cannot be changed by users.

**Audience:** the family mostly uses phones and tablets and knows Facebook's tablet interface well, especially Marketplace. Layouts and flows should feel like a simplified version of Facebook Marketplace.

## Core concepts

### Item types

Every item is either **Exact** or **Flexible**. The owner picks the type first when adding an item.

| Field | Exact | Flexible | Required |
| --- | --- | --- | --- |
| Name | Yes | Yes | Yes |
| Priority | Yes | Yes | Yes |
| Photos (one or more) | Yes | Yes | No |
| Notes | Yes | Yes | No |
| Product links (one or more) | Yes | No | Yes for Exact, unless it came from a screenshot |
| Size, colour, variant | Yes | No | No |
| Example links or brands | No | Yes | No |
| What I like about it | No | Yes | No |

Example Exact item: specific underwear from Simons, with the product link, size and colour. Example Flexible item: beard oil, with a couple of example brands and "woodsy scents, not too oily."

No price field.

### Priority

Three fixed levels, shown in this order on every list:

1. **NEED SO BAD**
2. **want**
3. **nice to have**

Keep the labels exactly as written, including capitalization.

### Claims

Anyone except the owner can claim an item. A claim has two stages:

- **Planning to buy:** reserved, not purchased yet
- **Bought:** purchased

The claimer can move from Planning to Bought, or release the claim entirely.

|  | Exact item | Flexible item |
| --- | --- | --- |
| Claims allowed | One | Unlimited |
| After a claim | Greyed out for other givers, can't be claimed | Stays available, shows "Someone's getting one, more welcome" |
| Claimer sees | "You're getting this" with their stage | "You're getting one" with their stage |

Claims are **anonymous**. Other givers only see that an item is claimed and its stage, never who claimed it. The database still records the claimer so they can update or release it.

### Secret suggestions

A giver can add an item idea to someone else's list. Suggestions use the same Exact or Flexible fields. They are visible to and claimable by everyone **except the list owner**, and appear in a separate "Ideas from family" section.

### Managed profiles

Jaisley is a baby, so she has a profile and a wish list but no login. Jenn and Jordan are her managers.

- Jaisley appears on everyone's Family screen like anyone else, but not on the login screen
- Jenn and Jordan can add, edit and delete items on Jaisley's list, including importing from Amazon
- Jenn and Jordan **can** see claims and suggestions on Jaisley's list, and can claim items on it themselves. Hiding exists to protect surprises, and a baby doesn't need that. Seeing claims also stops parents from buying duplicates
- Any person can manage any number of profiles, so the setup works for future babies too

### Amazon import

Anyone can paste the link to their public Amazon wish list to fill their list quickly.

1. Paste the Amazon wish list URL
2. The app reads the list and shows every item it found: name, photo and product link
3. Items already on your list are left out (matched by Amazon product ID, then by name)
4. For each item, you **must** pick a priority and Exact or Flexible before it can be added. Everything else is optional and editable
5. Tap "Add to my list." Unfinished items are skipped, with a count shown

Imported Exact items keep the Amazon link as their product link. Imported Flexible items keep it as an example link.

### Screenshot autofill

Anyone adding an item can upload a screenshot from any shopping site, and the form fills itself in.

1. Tap "Fill from screenshot" at the top of the add item form and pick an image
2. The app reads the screenshot and fills in whatever it can find: name, store, size, colour, variant, notes. It also suggests Exact or Flexible
3. The screenshot is attached as the item's first photo (removable)
4. The person reviews everything and still **must** pick a priority and confirm Exact or Flexible before saving

Screenshots rarely show a link, so an Exact item from a screenshot doesn't require a product link. The form prompts "Paste the product link if you have it." If the screenshot can't be read, the form stays empty with a short message. This works for secret suggestions too.

### Anonymous questions

Every profile has a public Q&A section, shown FAQ-style at the bottom of their list.

- Anyone except the profile owner can ask a question, with optional photos
- Questions are anonymous to **everyone**, including the owner. Nobody can see who asked
- The owner answers, with optional photos. Managers answer for Jaisley
- Everyone, including the owner, sees all questions and answers
- Unanswered questions are visible to givers, marked "Waiting for an answer"
- The owner can edit their answer or delete a question. The asker can delete their own question
- Example: "Which of these two scarves do you like more?" with two photos attached

### Hiding rules

The list owner must never see claims or suggestions on their own list. The one exception is managers viewing a managed profile's list. This must be enforced in the database (row-level security), not only in the interface, so it can't be uncovered through browser dev tools.

Known limit: with a shared family passcode, anyone could log in as someone else. This is accepted. The family runs on the honour system.

## Screens and flows

Design for phones and tablets first, then make it responsive up to desktop. Borrow Facebook Marketplace patterns: a two-column photo card grid, a big photo carousel on detail pages, one large primary action button, a back arrow at the top left, and a persistent bottom tab bar.

### Navigation

The bottom tab bar has three tabs only:

- **Family:** everyone else's lists
- **Shopping list:** everything you've claimed
- **My list:** your own list (and Jaisley's, for Jenn and Jordan)

### 1. Log in

1. Grid of profile photos with names (like Facebook's saved-accounts screen). Managed profiles like Jaisley don't appear here
2. Tap your photo, then enter the 4-digit family passcode on a large number pad
3. Name and passcode are not case sensitive
4. Stay logged in on that device until logout. Put logout somewhere low-key, like the bottom of My list

### 2. Family (home)

- Grid of everyone except you: profile photo and name
- A quiet banner at the top for notices, e.g. "Laura removed an item you'd claimed" (see Edge cases)

### 3. Someone's list (giver view)

- Header: their photo and name
- Items grouped by priority: NEED SO BAD, want, nice to have
- Each group is a two-column card grid: first photo (or a grey placeholder), name, Exact or Flexible tag, and claim status
- Claimed Exact items are greyed out and sort to the end of their group
- "Ideas from family" section at the bottom for secret suggestions
- "+ Suggest an idea" button, then a "Questions" section at the very bottom (see screen 9)

### 4. Item detail (giver view)

- Photo carousel, name, type tag, priority
- Exact: product links as large buttons, then size, colour, variant
- Flexible: "What they like about it," then example links or brands
- Notes
- One primary action button, which changes with state:

| State | Primary button | Secondary action |
| --- | --- | --- |
| Available | I'll get this | None |
| You're planning | Mark as bought | Release |
| You bought it | None (shows "You got this") | Undo |
| Exact, claimed by someone else | Disabled: "Someone's getting this" | None |
| Flexible, others claimed | I'll get one too | None |

### 5. My list (owner view)

- Same card grid, grouped by priority. Managers see a simple toggle at the top to switch between their own list and Jaisley's. Jaisley's list shows claims and suggestions, like a giver view
- No claim status anywhere, and no suggestions section
- Large "+ Add item" button, styled like Marketplace's "Sell" button, with a smaller "Import from Amazon" button beside it
- Tap an item to view it, with an Edit button

### 6. Add or edit item

1. Choose: **Exact** ("a specific thing") or **Flexible** ("something like this")
2. Fill in fields for that type (see Core concepts), on a single scrolling form
3. Add photos (optional, multiple)
4. Save

A "Fill from screenshot" button sits at the top of the form on every add screen. After it runs, filled fields are briefly highlighted so the person knows to check them.

Delete sits at the bottom of the edit screen, with a confirmation. The same form is used for secret suggestions, without the owner seeing them.

### 7. Import from Amazon

1. Paste field for the wish list URL, with a one-line hint: "Your Amazon list must be set to public or shared"
2. Loading state while the list is read
3. Review screen: one card per new item, with photo, name, a priority picker and an Exact/Flexible picker. A note shows how many duplicates were skipped
4. "Add to my list" button, which stays disabled until at least one item is complete

### 8. Shopping list

- Everything you've claimed, grouped by person, with their photo as the group header
- Each row: item photo, name, stage (Planning or Bought)
- Tap the stage to move from Planning to Bought. Tap the row to open the item
- Top line shows a simple count, e.g. "6 gifts: 4 bought, 2 to buy"
- Items the owner removed or edited show their notice here too

### 9. Questions (on every profile)

- FAQ-style list at the bottom of each person's list, newest first, answered and unanswered together
- Each entry: the question, its photos, then the answer and its photos underneath
- Givers see an "Ask a question" button: a text box, "Add photos," and a reminder that "Your name won't be shown"
- On My list, the owner sees the same section with an "Answer" button on each unanswered question, and a count at the top of My list, e.g. "2 questions waiting"
- Photos open full screen when tapped, like Facebook

## Visual direction (v1)

The first build is completely grayscale and minimal. The focus is simple flows and clean layouts. Taylor will style it later (planned direction: festive but tasteful).

- Grayscale only: no colour anywhere, including links and buttons
- One system font stack for now
- Put every colour, font, radius and spacing value in CSS variables or a single theme file, so restyling later means editing one place
- Large tap targets (at least 48px) and large, readable text for tablet users
- Claimed and greyed-out states must still be clear without colour: use opacity plus a text label
- Grey placeholder boxes where photos are missing

**Layout by screen size:**

| Screen | Card grid | Navigation |
| --- | --- | --- |
| Phone | 2 columns | Bottom tab bar |
| Tablet | 3 columns | Bottom tab bar |
| Desktop | 4 to 5 columns, content width capped | Left sidebar, like Facebook on desktop |

## Tech stack, hosting and auth

| Part | Choice | Notes |
| --- | --- | --- |
| Frontend | React + JavaScript, built with Vite | Same language as Taylor's portfolio. Keep code simple and easy to edit |
| Backend | Supabase (free tier) | Postgres database, auth, row-level security, storage for photos |
| Hosting | GitHub Pages, its own repo | Custom domain `santa.taylorfergusson.com` via a CNAME file and DNS record |
| Routing | Hash routing or the GitHub Pages 404 redirect trick | GitHub Pages has no server-side routing |

### Auth approach

The interface is "tap your photo, enter the family passcode," but each person needs a real Supabase user so row-level security knows who is asking.

- Each family member is a Supabase auth user with a placeholder email, e.g. `taylor@feu.local`
- Every user's password is built from the family passcode: a fixed app prefix plus the passcode, e.g. \`feu-\` + the 4 digits
- At login, the app lowercases the name, adds the prefix to the passcode, then calls `signInWithPassword`, which makes login case-insensitive
- The prefix exists because Supabase requires passwords of at least 6 characters, and the family passcode is 4 digits. The passcode itself never goes in the repo; Taylor sets it with \`npm run set-passcode\`
- Disable public signups and email confirmation in Supabase settings
- Never put the Supabase service role key in the frontend. Only the public anon key goes in the app

### Amazon import

The import runs in a **Supabase Edge Function**, since it needs a secret API key and can't run in the browser.

1. The app sends the wish list URL to the Edge Function
2. The function fetches the public list page
3. It sends the page content to the **Claude API** (a small, cheap model like Claude Haiku) and asks for structured JSON: name, product URL, Amazon product ID (ASIN), image URL
4. The function removes items already on the user's list and returns the rest

The Anthropic API key is stored as a Supabase secret, never in the frontend. Expected cost is a few cents per import.

**Risks to test early:**

- Amazon often blocks automated requests, so the fetch may fail from Supabase's servers. Build a clear error state ("Couldn't read that list. Try again later, or add items by hand")
- Long lists load in pages, so the first fetch may only return part of the list. Check how many items come back for a long list
- Amazon's terms discourage automated reading of its pages. This is low risk for a private family tool, but it's a reason not to feature it in the portfolio

### Screenshot autofill

Also runs in a Supabase Edge Function using the Claude API. The app uploads the screenshot to storage and sends its path to the function. The function sends the image to Claude (vision) and asks for structured JSON matching the item fields, plus a suggested type. Nothing is saved until the person reviews and taps Save. This is more reliable than the Amazon import, since nothing has to be fetched from another site.

### Home screen app

The site must work as an installable web app (PWA), so family members can tap "Add to Home Screen" and open it full screen with no browser bar.

- Web app manifest with name "Fergusson Extended Universe," short name "FEU," standalone display mode, grayscale theme colour
- Placeholder grayscale icon at all required sizes, including the Apple touch icon. Taylor will replace it when styling
- Respect phone safe areas (notch, home bar) in full-screen mode
- Keep sessions alive so people stay logged in when reopening from the home screen
- No offline mode needed

## Data model and security

A suggested starting schema. Claude Code can adjust names and types.

| Table | Key columns |
| --- | --- |
| `people` | id, auth\_user\_id (empty for managed profiles), name, slug, photo\_url, sort\_order, managed\_by (list of people ids) |
| `items` | id, owner\_id, created\_by, is\_suggestion, type (exact or flexible), name, priority (1 to 3), notes, links (text array), size, colour, variant, likes, example\_links (text array), photos (text array), amazon\_asin, deleted\_at, edited\_at, created\_at |
| `claims` | id, item\_id, claimer\_id, stage (planning or bought), created\_at, updated\_at |
| `notices` | id, recipient\_id, item\_id, message, seen\_at, created\_at |

Add a `questions` table: id, profile\_id, asker\_id, body, photos (text array), answer, answer\_photos (text array), answered\_at, created\_at, deleted\_at.

Photos live in a Supabase storage bucket. Profile photos are uploaded by Taylor; item photos are uploaded by whoever creates the item.

### Row-level security rules

- **items, owner's own:** the owner can read, create, edit and soft-delete items where `owner_id` is them and `is_suggestion` is false
- **items, others':** a user can read any non-deleted item where `owner_id` is not them, including suggestions
- **suggestions:** a user can create an item on someone else's list only with `is_suggestion` true and `created_by` set to themselves. Only the suggester can edit or delete it
- **claims:** readable only when the item's owner is not the current user. A user can create, update and delete only their own claims
- **claim limits:** a database constraint or trigger blocks a second claim on an Exact item, and blocks claiming your own items
- **notices:** readable and markable as seen only by the recipient
- **people:** readable by all logged-in users, writable by nobody through the app

**Managed profiles:** a manager has the same edit rights as the owner on a managed profile's items. Unlike a regular owner, a manager can also read and create claims and suggestions on that list. Write these as helper functions (e.g. `can_edit_list(owner_id)`, `can_see_claims(owner_id)`) so the policies stay readable.

**Questions:** `asker_id` must never reach any client. Expose questions only through a database view or function that leaves that column out. Any logged-in user can read questions. Anyone except the profile owner can ask. Only the owner (or a manager) can write the answer or delete a question; the asker can delete their own question through a function that checks `asker_id` server-side.

Test this directly: logged in as an owner, query `claims` and suggestions for your own items and confirm nothing comes back.

## Admin

Taylor manages everything through a config file and scripts. There is no admin screen in the app.

### Family config file

A `family.json` file (kept out of the public build) lists each person:

```json
[
  { "name": "Taylor", "photo": "photos/taylor.jpg" },
  { "name": "Jenn", "photo": "photos/jenn.jpg" },
  { "name": "Jordan", "photo": "photos/jordan.jpg" },
  { "name": "Jaisley", "photo": "photos/jaisley.jpg", "login": false, "managedBy": ["Jenn", "Jordan"] }
]
```

Starting family: Taylor, Steph, Laura, Jenn, Jordan, Jadyn, Jaisley, Eric, Nick. Jaisley has no login and is managed by Jenn and Jordan.

### Scripts

Node scripts run locally with the Supabase service role key from a `.env` file that is never committed.

| Command | What it does |
| --- | --- |
| `npm run sync-family` | Creates or updates a Supabase user and `people` row for everyone in `family.json`, and uploads their profile photo. Removes anyone no longer listed, after a confirmation prompt |
| `npm run set-passcode` | Prompts for the 4-digit family passcode and sets every login user's password to the prefix plus that passcode |
| `npm run reset-christmas` | Run each January. Clears all claims, suggestions and notices, and permanently removes soft-deleted items. Asks whether to also clear bought items from each list, and updates the year in the site title. Prompts for confirmation first |

A short README should explain each command in plain language.

## Edge cases and scope

### Edge cases

| Situation | Behaviour |
| --- | --- |
| Owner deletes an item someone claimed | Soft delete. It disappears for everyone except claimers, who get a notice: "\[Name\] removed \[item\] from their list. You'd already claimed it." The owner never learns it was claimed |
| Owner edits an item someone claimed | Save the change and set `edited_at`. Claimers see "Updated after you claimed it" on the item and a notice on the Family screen |
| Suggester deletes a claimed suggestion | Same as owner delete: claimers get a notice |
| Two people tap "I'll get this" on an Exact item at once | The database constraint lets the first through. The second sees "Someone just claimed this" |
| Item has no photo | Grey placeholder on cards and detail page |
| Someone opens their own list from a link or URL | Always shows the owner view, with no claim data |

### Out of scope for v1

- Self signup, profile editing, password changes by users
- Price or budget fields
- Group gifts and splitting costs
- Occasions other than Christmas (birthdays, etc.)
- Email or push notifications
- Multiple family groups
- Colour, branding and festive styling

### Decided

- Family passcode: 4 digits. Taylor has it; it's set by script and never written in the repo
- Givers get a Shopping list tab of everything they've claimed

## Instructions for Claude Code

Build in this order, and check in with Taylor after each step:

**Launch today (target: a few hours).** Taylor wants the family using it today, so build the core first and deploy as soon as it works:

1. Repo setup: Vite + React, theme file, routing, responsive layout shell, home screen app manifest and icons, GitHub Pages deploy with the `santa.taylorfergusson.com` CNAME
2. Supabase: full schema, row-level security for everything (including managed profiles and questions, so later features need no migration), storage bucket, constraints. Test that owners can't see claims on their own items and managers can on Jaisley's
3. Admin scripts and `family.json`
4. Login screen
5. My list, the add/edit item form, and the manager toggle
6. Family screen, someone's list, item detail and claiming
7. Shopping list
8. Deploy and check on a phone and a tablet

**Add next, in this order:**

9. Secret suggestions
10. Anonymous questions and answers
11. Notices and edge cases
12. Screenshot autofill (needs the Anthropic API key)
13. Amazon import, tested against a real public list early

Working rules:

- Don't edit Taylor's existing code without asking first
- Keep the code simple and readable. Taylor will modify it later
- Grayscale only for now, with all styling values in one theme file
- Ask before adding any feature not in this brief
