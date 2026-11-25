# Midnight Todo Reset

Obsidian plugin that automatically unchecks completed todo list items at midnight (or a time you choose) every night.

## What it does

- At the configured local time (default **00:00**), walks your vault and turns checked tasks into unchecked ones:
  - `- [x] Buy milk` → `- [ ] Buy milk`
  - Also supports `*`, `+`, and numbered lists (`1. [x]`)
- Skips fenced code blocks so example checklists in notes are left alone
- If Obsidian was closed overnight, it **catches up on next open** after the reset time has passed
- Optional include/exclude folders
- Command palette: **Midnight Todo Reset: Reset todos now**

## Install (manual)

1. Download the latest release assets from
   [Releases](https://github.com/WaffleStudioGit/ObsidianPublic/releases/tag/1.0.0)
   (or grab `midnight-todo-reset-1.0.0.zip`).
2. Create a folder in your vault:
   `YourVault/.obsidian/plugins/midnight-todo-reset/`
3. Copy these files into that folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`
4. In Obsidian: **Settings → Community plugins →** enable **Midnight Todo Reset**

Repo: https://github.com/WaffleStudioGit/ObsidianPublic

## Develop

```bash
npm install
npm run dev    # watch build
npm run build  # production main.js
```

For local testing, symlink or copy the plugin folder into a vault’s `.obsidian/plugins/midnight-todo-reset/`.

## Settings

| Setting | Description |
| --- | --- |
| Enable automatic reset | Turn the nightly job on/off |
| Reset hour / minute | Local time for the reset (default midnight) |
| Include folders | Limit to these vault paths (one per line); empty = whole vault |
| Exclude folders | Skip these paths |
| Show notice | Toast after each run |
| Reset todos now | Run immediately |

## Notes

- Uses your machine’s local timezone
- Only changes Obsidian/GFM task checkboxes (`[x]` / `[X]` → `[ ]`)
- Does not delete lines or change task text
