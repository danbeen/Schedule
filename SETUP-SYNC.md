# Remote sync setup (optional)

Parent and child devices stay in sync when you use Supabase. **The app does not use OneDrive or your repo for storage**—each device uses its own browser storage (localStorage) until you enable sync. To use the app on **separate devices** (e.g. parent phone + child tablet), you need:

1. **Host the app from one place** so every device opens the same URL (e.g. GitHub Pages, Netlify, or any web server). Opening files from OneDrive or different copies of the repo on each device means each has its own localStorage and they won’t share data unless you turn on sync.
2. **Set up Supabase** (below) and add the config so the app can save/load state in the cloud.
3. **Pair devices** with the same household code so they read/write the same synced state.

Then when the child claims a reward or marks tasks done, the parent app (open or when reopened) sees the updates. When the parent changes tasks or rewards, the child’s app updates too.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account/project.
2. In the SQL Editor, run:

```sql
create table if not exists household_sync (
  id text primary key,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Enable realtime for this table
alter publication supabase_realtime add table household_sync;
```

If you get "table already in publication", you can ignore that.

3. In Project Settings > API, copy your **Project URL** and **anon public** key.

## 2. Add config to the app

Create a file `Schedule/js/config.js` (don’t commit real keys to git) with:

```js
window.MORNING_V2_SUPABASE = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_ANON_KEY'
};
```

In both **child.html** and **parent.html**, add this script **before** `sync.js`:

```html
<script src="js/config.js"></script>
```

(Use `config.example.js` as a template; the example file is safe to commit.)

## 3. Pair devices

- Open **parent.html** on your phone (or parent device). Note the **Household code** (e.g. `abc123`).
- Open **child.html** on the child’s device. Enter the same code and tap **Join**. Both devices now share the same data.
- When the parent rates the morning, adds a bonus, or changes settings/tasks/rewards, the child’s view updates automatically. When the child marks tasks done, the parent dashboard updates too.

## Without sync

If you don’t set up Supabase or `config.js`, the app still works: each device uses its own localStorage. No remote sync.

## Hosting so all devices use the same data

- **GitHub Pages:** Push this repo to GitHub, enable Pages (Settings → Pages → source: main). Everyone opens the same URL (e.g. `https://yourusername.github.io/RepoName/`). Then set up Supabase and the household code.
- **Netlify / Vercel:** Upload or connect the repo; everyone uses the same site URL and Supabase config.
- Avoid opening the HTML files directly from OneDrive or different folders on each device—each has its own localStorage; sync only works when every device loads the app from the same origin.
