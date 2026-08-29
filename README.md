# WoW Font Changer

**WoW Font Changer** is a lightweight cross-platform desktop app that replaces World of Warcraft's default UI fonts with your own `.ttf` or `.otf` files. Drop a font, preview it live, pick which slots to update, and apply. No addons, no manual file renaming.

Created by **Kkthnx**, v2.1.3

![WoW Font Changer](public/logo.png)

## Download

Grab the latest installer from [Releases](https://github.com/Kkthnx-Wow/WoW-Font-Changer/releases).

| Version | Notes |
|---------|-------|
| **2.1.3** | Per-slot fonts (a different font per slot), guard against non-Tauri crash, clear npm advisories |
| **2.1.2** | Fix Apply on clean installs, accumulate the restore manifest across applies, tidier backup location |
| **2.1.1** | Fix font preview, CSP and asset protocol scope for `convertFileSrc` |
| **2.1.0** | Multi-drive scan, all WoW flavors (PTR, beta, anniversary), macOS and Linux, 10 UI languages, Korean and Chinese locale fonts |
| **2.0.0** | Complete rewrite, Tauri and Rust, live preview, slug cache cleanup |
| 1.x | Legacy .NET app (archived in release history) |

**Requirements**
- **Windows** 10 or 11 (WebView2 bundled by installer if needed)
- **macOS** 10.15+ (native `.dmg`)
- **Linux** with Wine or Proton for WoW (`.AppImage`, WoW itself still runs via Battle.net and Wine)

---

## Features

- **Drag and drop**, drop a font file onto the window or browse for one
- **Live preview**, see combat, quest, and chat samples before applying
- **Granular slots**, replace combat text, chat, mail and quest headers, quest and UI, or all at once
- **All WoW flavors**, Retail, PTR, Beta, Classic, Era, Anniversary, Titan, and more
- **Smart auto-detect**, registry on Windows, Applications and volumes on macOS, Wine prefixes on Linux, plus a multi-drive scan
- **10 UI languages**, English, Deutsch, Español, Français, Italiano, Português, Русский, 한국어, 简体中文, 繁體中文
- **Locale font packs**, Cyrillic, Korean, and Chinese client font slots
- **Safe backup and restore**, original fonts saved to `Fonts/.backup/` before any change
- **Slug cache cleanup**, clears stale `.slug` and `.slugo` GPU cache so fonts actually take effect
- **Compact widget**, small fixed window (about 460x580), fast startup

## Font Slots

WoW expects exact filenames (case-sensitive) with a `.ttf` extension, even when your source file is `.otf`.

| Slot | WoW filename | Used for |
|------|--------------|----------|
| Combat Text | `skurri.ttf` | Floating damage numbers |
| Chat | `ARIALN.ttf` | Chat and small info text |
| Mail and Quest Headers | `MORPHEUS.ttf` | Mail window and quest log titles |
| Quest and UI | `FRIZQT__.ttf` | Quest dialogs, buttons, names |

**Locale packs** (optional, in Settings)
- **Cyrillic**, the `*_CYR.ttf` variants (`FRIZQT___CYR.ttf` uses three underscores)
- **Korean**, `2002.ttf`, `2002B.ttf`, `K_Damage.ttf`, `K_Pagetext.ttf`
- **Chinese**, `ARHei.ttf`, `ARKai_*.ttf`, `bHEI*.ttf`, and related slots

## How to Use

1. **Download and install** from [Releases](https://github.com/Kkthnx-Wow/WoW-Font-Changer/releases).
2. **Launch WoW Font Changer.** It will try to detect your WoW install automatically.
3. **Pick a game version** in the header dropdown (grouped by Retail, Classic, Era).
4. **Drop or browse** for a `.ttf` or `.otf` font file.
5. **Preview** the font in the live preview panel.
6. **Select slots**, Combat, Chat, Mail, Quest and UI, or Replace All.
7. **Apply** and confirm when prompted. Original fonts are backed up first.
8. **Restart WoW** completely so the client reloads fonts and rebuilds its GPU cache.

To revert, click **Restore Defaults** in the footer. This copies fonts back from `.backup/` and removes any custom fonts that had no original backup.

## Settings

Open the gear icon in the header.

- **Language**, app interface language (auto-detected on first launch)
- **Auto-detect WoW**, platform-specific install scanning
- **Manual WoW path**, override auto-detection if needed
- **Locale font packs**, Cyrillic, Korean, Chinese slots
- **Compress backup**, zip the backup folder after applying

## Platform Notes

| Platform | WoW install | Auto-detect looks for |
|----------|-------------|----------------------|
| Windows | Native Battle.net | Registry, Program Files, all drive letters |
| macOS | Native Battle.net | `/Applications`, `~/Applications`, external volumes |
| Linux | Wine, Proton, Lutris, Bottles | `~/Games`, Wine prefixes, Lutris, Bottles, Heroic |

On Linux, point manual browse at your Wine prefix `drive_c/Program Files (x86)/World of Warcraft` folder if auto-detect misses it.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Font did not change in-game | Close WoW fully, then relaunch. The app clears `.slug` and `.slugo` cache on apply and restore. |
| "Access denied" when applying | Close WoW, it locks font files while running. |
| Wrong game version | Select the correct flavor in the header dropdown. |
| WoW not detected (Linux) | Browse manually to your Wine prefix WoW folder. |
| Custom font looks wrong | Some fonts lack glyphs WoW needs, try a different font or fewer slots. |

### What are `.slug` and `.slugo` files?

Since Dragonflight, WoW caches font data in `Fonts/` as `.slug` (normal) and `.slugo` (outlined) files. They are regenerated on launch and safe to delete. Stale cache is a common reason custom fonts do not show up, so WoW Font Changer removes them whenever you apply or restore.

## Building from Source

**Prerequisites**, [Node.js](https://nodejs.org/) 20+, [Rust](https://rustup.rs/), and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.

```bash
git clone https://github.com/Kkthnx-Wow/WoW-Font-Changer.git
cd WoW-Font-Changer
npm install
npm run icons          # generate public/logo.png and tauri icons (required once)
npm run tauri dev      # development
npm run tauri build    # release bundle for current OS
```

Regenerate app icons after logo changes:

```bash
npm run icons
```

## What's New in 2.1.0

- Multi-drive Windows install scanning
- All 12 Blizzard client flavors (PTR, beta, xptr, anniversary, titan, era ptr and beta, and so on)
- macOS and Linux support with platform-specific path detection
- 10-language UI (EN, DE, ES, FR, IT, PT-BR, RU, KO, ZH-CN, ZH-TW)
- Korean and Chinese locale font packs (in addition to Cyrillic)
- Improved path validation, restore for fonts without originals, settings migration

## What's New in 2.0.0

- Full rewrite from .NET to **Tauri 2, Rust, and React**
- Live font preview before applying
- Per-slot targeting with a Replace All option
- Auto WoW path detection (registry plus common install paths)
- Automatic backup, optional zip compression, one-click restore
- Slug GPU cache cleanup on apply and restore
- Cyrillic font slot support
- Smaller, faster native desktop app

## Show Your Support

Appreciate the work that goes into WoW Font Changer? Consider showing your support.

- **Gift Gametime or Blizzard Balance**, Kkthnx#1105 or JRussell20@gmail.com
- **PayPal**, [paypal.me/kkthnxtv](https://www.paypal.com/paypalme/kkthnxtv)
- **Ko-fi**, [ko-fi.com/kkthnx](https://ko-fi.com/kkthnx)
- **Buy Me a Coffee**, [buymeacoffee.com/kkthnx](https://buymeacoffee.com/kkthnx)
- **In-game gold**, Kkthnx on Area 52

## Feedback

Found a bug or have an idea? [Open an issue](https://github.com/Kkthnx-Wow/WoW-Font-Changer/issues). This project is source-available but not open for redistribution, see the license below.

## License

All Rights Reserved. Copyright (c) 2026 Kkthnx. See [LICENSE](LICENSE).

You can download and run the official released builds for personal use. The source is here for reference, not for redistribution or reuse without written permission.
