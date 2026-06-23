# WoW Font Changer

**WoW Font Changer** is a lightweight cross-platform desktop app that replaces World of Warcraft's default UI fonts with your own `.ttf` or `.otf` files. Drop a font, preview it live, pick which slots to update, and apply — no addons, no manual file renaming.

Created by **Kkthnx** · **v2.1.0**

![WoW Font Changer](public/logo.png)

## Download

Grab the latest installer from [Releases](https://github.com/Kkthnx-Wow/WoW-Font-Changer/releases).

| Version | Notes |
|---------|-------|
| **2.1.0** | Multi-drive scan, all WoW flavors (PTR/beta/anniversary), macOS & Linux, 10 UI languages, Korean/Chinese locale fonts |
| **2.0.0** | Complete rewrite — Tauri + Rust, live preview, slug cache cleanup |
| 1.x | Legacy .NET app (archived in release history) |

**Requirements:**
- **Windows** 10 or 11 (WebView2 bundled by installer if needed)
- **macOS** 10.15+ (native `.dmg`)
- **Linux** with Wine/Proton for WoW (`.AppImage`; WoW itself still runs via Battle.net + Wine)

---

## Features

- **Drag-and-drop** — Drop a font file onto the window or browse for one
- **Live preview** — See combat, quest, and chat samples before applying
- **Granular slots** — Replace combat text, chat, mail/quest headers, quest/UI, or all at once
- **All WoW flavors** — Retail, PTR, Beta, Classic, Era, Anniversary, Titan, and more
- **Smart auto-detect** — Registry (Windows), Applications/volumes (macOS), Wine prefixes (Linux), multi-drive scan
- **10 UI languages** — English, Deutsch, Español, Français, Italiano, Português, Русский, 한국어, 简体中文, 繁體中文
- **Locale font packs** — Cyrillic, Korean, and Chinese client font slots
- **Safe backup & restore** — Original fonts saved to `Fonts/.backup/` before any change
- **Slug cache cleanup** — Clears stale `.slug` / `.slugo` GPU cache so fonts actually take effect
- **Compact widget** — Small fixed window (~460×580), fast startup

## Font Slots

WoW expects exact filenames (case-sensitive) with a `.ttf` extension — even when your source file is `.otf`.

| Slot | WoW filename | Used for |
|------|--------------|----------|
| Combat Text | `skurri.ttf` | Floating damage numbers |
| Chat | `ARIALN.ttf` | Chat and small info text |
| Mail & Quest Headers | `MORPHEUS.ttf` | Mail window and quest log titles |
| Quest & UI | `FRIZQT__.ttf` | Quest dialogs, buttons, names |

**Locale packs** (optional, in Settings):
- **Cyrillic** — `*_CYR.ttf` variants (`FRIZQT___CYR.ttf` uses three underscores)
- **Korean** — `2002.ttf`, `2002B.ttf`, `K_Damage.ttf`, `K_Pagetext.ttf`
- **Chinese** — `ARHei.ttf`, `ARKai_*.ttf`, `bHEI*.ttf`, and related slots

## How to Use

1. **Download and install** from [Releases](https://github.com/Kkthnx-Wow/WoW-Font-Changer/releases).
2. **Launch WoW Font Changer.** It will try to detect your WoW install automatically.
3. **Pick a game version** in the header dropdown (grouped by Retail / Classic / Era).
4. **Drop or browse** for a `.ttf` or `.otf` font file.
5. **Preview** the font in the live preview panel.
6. **Select slots** — Combat, Chat, Mail, Quest/UI, or Replace All.
7. **Apply** — Confirm when prompted. Original fonts are backed up first.
8. **Restart WoW** completely so the client reloads fonts and rebuilds its GPU cache.

To revert, click **Restore Defaults** in the footer. This copies fonts back from `.backup/` and removes any custom fonts that had no original backup.

## Settings

Open the gear icon in the header:

- **Language** — App interface language (auto-detected on first launch)
- **Auto-detect WoW** — Platform-specific install scanning
- **Manual WoW path** — Override auto-detection if needed
- **Locale font packs** — Cyrillic, Korean, Chinese slots
- **Compress backup** — Zip the backup folder after applying

## Platform Notes

| Platform | WoW install | Auto-detect looks for |
|----------|-------------|----------------------|
| Windows | Native Battle.net | Registry, Program Files, all drive letters |
| macOS | Native Battle.net | `/Applications`, `~/Applications`, external volumes |
| Linux | Wine/Proton/Lutris/Bottles | `~/Games`, Wine prefixes, Lutris, Bottles, Heroic |

On Linux, point manual browse at your Wine prefix's `drive_c/Program Files (x86)/World of Warcraft` folder if auto-detect misses it.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Font didn't change in-game | Close WoW fully, then relaunch. The app clears `.slug` / `.slugo` cache on apply/restore. |
| "Access denied" when applying | Close WoW — it locks font files while running. |
| Wrong game version | Select the correct flavor in the header dropdown. |
| WoW not detected (Linux) | Browse manually to your Wine prefix WoW folder. |
| Custom font looks wrong | Some fonts lack glyphs WoW needs; try a different font or fewer slots. |

### What are `.slug` and `.slugo` files?

Since Dragonflight, WoW caches font data in `Fonts/` as `.slug` (normal) and `.slugo` (outlined) files. They're regenerated on launch and safe to delete. Stale cache is a common reason custom fonts don't show up — WoW Font Changer removes them whenever you apply or restore.

## Building from Source

**Prerequisites:** [Node.js](https://nodejs.org/) 20+, [Rust](https://rustup.rs/), and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.

```bash
git clone https://github.com/Kkthnx-Wow/WoW-Font-Changer.git
cd WoW-Font-Changer
npm install
npm run icons          # generate public/logo.png + tauri icons (required once)
npm run tauri dev      # development
npm run tauri build    # release bundle for current OS
```

Regenerate app icons after logo changes:

```bash
npm run icons
```

## What's New in 2.1.0

- Multi-drive Windows install scanning
- All 12 Blizzard client flavors (PTR, beta, xptr, anniversary, titan, era ptr/beta, etc.)
- macOS and Linux support with platform-specific path detection
- 10-language UI (EN, DE, ES, FR, IT, PT-BR, RU, KO, ZH-CN, ZH-TW)
- Korean and Chinese locale font packs (in addition to Cyrillic)
- Improved path validation, restore for fonts without originals, settings migration

## What's New in 2.0.0

- Full rewrite from .NET to **Tauri 2 + Rust + React**
- Live font preview before applying
- Per-slot targeting with Replace All option
- Auto WoW path detection (registry + common install paths)
- Automatic backup, optional zip compression, one-click restore
- Slug GPU cache cleanup on apply/restore
- Cyrillic font slot support
- Smaller, faster native desktop app

## Show Your Support

Appreciate the work that goes into WoW Font Changer? Consider showing your support:

- **Gift Gametime / Blizzard Balance** — Kkthnx#1105 or JRussell20@gmail.com
- **PayPal** — [paypal.me/kkthnxtv](https://www.paypal.com/paypalme/kkthnxtv)
- **Ko-fi** — [ko-fi.com/kkthnx](https://ko-fi.com/kkthnx)
- **Buy Me a Coffee** — [buymeacoffee.com/kkthnx](https://buymeacoffee.com/kkthnx)
- **In-game gold** — Kkthnx on Area 52

## Contributing

Found a bug or want to contribute? [Open an issue](https://github.com/Kkthnx-Wow/WoW-Font-Changer/issues) or submit a pull request.

## License

MIT License — see [LICENSE](LICENSE).
