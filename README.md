# Fergusson Extended Universe – Family Santa Wishlist

Private Christmas wish list app for the family, at [santa.taylorfergusson.com](https://santa.taylorfergusson.com).
React + Vite on GitHub Pages, with Supabase for the database, logins and photos.

## Running it locally

```sh
npm install
npm run dev
```

## Deploying

GitHub Pages serves the `docs/` folder on `main`.

```sh
npm run build   # rebuilds docs/
```

Then commit `docs/` along with your changes and push.

## Admin commands

These run on your computer and use the Supabase secret key in `.env`
(see `.env.example`). Never commit `.env`.

| Command | What it does |
| --- | --- |
| `npm run sync-family` | Makes Supabase match `family.json`. Adds anyone new (with a login, unless `"login": false`), updates names and photos, sets who manages whom, and asks before removing anyone who's no longer listed. Removing someone deletes their list too. Safe to run as often as you like. |
| `npm run set-passcode` | Asks for the 4-digit family passcode and sets it for everyone. Run it after adding someone new, or to change the passcode. The passcode is never saved in the repo. |
| `npm run reset-christmas` | Run each January. Clears all claims, secret suggestions and notices, permanently removes deleted items, optionally removes bought items, and updates the year in the site title. Asks before doing anything. Afterwards, build, commit and push. |

### family.json

Lists everyone, in the order they appear in the app. Kept out of git.

```json
[
  { "name": "Taylor", "photo": "photos/taylor.png" },
  { "name": "Jaisley", "photo": "photos/jaisley.png", "login": false, "managedBy": ["Jenn", "Jordan"] }
]
```

- `photo`: path to a photo in the `photos/` folder (also kept out of git). It gets cropped to a square.
- `"login": false`: no login and not on the login screen (for babies).
- `managedBy`: who can edit this person's list. Managers also see claims on it.

Each person logs in as `<name>@feu.local` behind the scenes, so changing someone's
name in `family.json` counts as removing them and adding a new person.

## Database

`supabase/schema.sql` sets up everything: tables, security rules and the photo bucket.
Paste it into Supabase → SQL Editor and run it. It's safe to run again after changes.

`supabase/test_rls.sql` checks the security rules (for example, that nobody can see
claims on their own list). Run it the same way. It cleans up after itself and should end
with "All tests passed".
