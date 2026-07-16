# PWA Installability 2026: Install Path Without Service Worker

Research into what a web app must ship in 2026 for PWA *install* on iOS Safari and Android Chrome, explicitly without a service worker.

## TL;DR

**Android Chrome / Chromium browsers:**
- Service worker is **not required** for install prompt or installation. (Dropped as a requirement; optional for offline/enhanced features.)
- **Required manifest fields:** `name` or `short_name`, `icons` (192px and 512px minimum), `start_url`, `display` (standalone/fullscreen/minimal-ui), `prefer_related_applications: false` (or omitted).
- **Icon spec:** 192×192 and 512×512 PNG at minimum. Separate `purpose: "maskable"` and `purpose: "any"` entries; maskable safe-zone is a 40%-radius circle at center (safe content must fit within center circle; 10% margin on all edges may be cropped). Do not combine purposes.
- **theme_color / background_color:** Static JSON values; `theme_color` controls browser UI bar. Meta tag `<meta name="theme-color" media="(prefers-color-scheme: dark)">` is supported (not baseline, limited availability per MDN), but **dynamically updating meta tags is not reliably supported**—if app applies theme via cookie (like genug-da does), theme-color will not react to JS updates.
- **Splash screens:** Automatically generated from `background_color` + icon + name on Android. `apple-touch-startup-image` is an iOS-only feature.

**iOS Safari (modern, iOS 11.3+):**
- Manifest `display` member **is supported** for Home Screen web apps (standalone/fullscreen/minimal-ui) — iOS opens the app in the specified display mode without the address bar.
- `apple-mobile-web-app-capable` meta tag is **now legacy**; the manifest `display` member supersedes it. Include both for backward compatibility with older iOS versions.
- **App name:** Manifest `name`/`short_name` is now used; `apple-mobile-web-app-title` is legacy but may still be honored on older iOS.
- **Icons:** Manifest `icons` are recognized; **`apple-touch-icon` (180×180, opaque) remains the iOS-preferred approach** and takes precedence when present. iOS falls back to manifest icons if no apple-touch-icon is provided.
- **Status bar:** `apple-mobile-web-app-status-bar-style` remains the iOS-only way to control the status bar appearance in standalone mode.
- **Splash screens:** `apple-touch-startup-image` (device media queries) is optional; iOS generates white/blank splash without it.
- Service worker is completely irrelevant to iOS install.
- Share-sheet install (iOS 16.4+) also respects manifest display mode.

## 1. Chrome/Android Installability Criteria (2026)

### Required Manifest Fields

Per MDN's "Making PWAs installable" guide (primary source):
- **`name` or `short_name`** (at least one; both recommended)
- **`icons`** with at least **192px and 512px sizes** in PNG format
- **`start_url`** (required for Chromium; some browsers fall back to the page linking manifest if absent)
- **`display`** set to `standalone`, `fullscreen`, `minimal-ui`, or `window-controls-overlay` (must not be default `browser`)
- **`prefer_related_applications`** must be `false` or omitted (if `true`, browser prefers native apps instead)

Optional but recommended:
- **`description`** (enhances install prompt on Android with additional context)
- **`screenshots`** (improves install prompt with app previews)
- **`scope`** (explicitly defining it prevents accidental prefix-match bugs; defaults to start_url's directory)

Sources:
- MDN: [Making PWAs installable](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) — lists required Chromium members
- web.dev: [Install criteria](https://web.dev/articles/install-criteria) — same list; last updated 2024-09-19

### Service Worker Requirement: DROPPED

**Service workers are NOT required for installation.** The MDN guide explicitly states: "While not required for installability, service workers enable offline functionality and are recommended for complete PWA experience."

Chrome removed the service worker requirement from the install criteria years ago. Service workers remain optional and control offline capability, performance caching, and background sync—features orthogonal to the install prompt itself.

Confidence: High. Stated clearly in both MDN and web.dev.

### The `id` Field

The `id` field is **optional** and not required for installability. It serves as a unique identifier allowing browsers to distinguish between app versions and update management. If omitted, the browser falls back to `start_url`.

Source: MDN [id](https://developer.mozilla.org/docs/Web/Manifest/id)

### The `scope` and `start_url` Relationship

- **`scope`** defines the URL prefix that keeps the app in "installed mode." Out-of-scope navigation still loads the app, but the browser shows its UI chrome.
- **`start_url`** must be same-origin with the manifest and within the `scope`. If `scope` is omitted, it defaults to `start_url`'s directory.
- Relative URLs in both are resolved against the manifest file's URL.

Icon `src` values in the manifest follow the same pattern—they resolve relative to the manifest URL (not the `start_url`).

Source: MDN [scope](https://developer.mozilla.org/docs/Web/Manifest/scope), [start_url](https://developer.mozilla.org/docs/Web/Manifest/start_url)

### `prefer_related_applications` Details

Setting this to `true` and populating `related_applications` tells Chromium browsers to prefer installing a native app (from Google Play, Microsoft Store, etc.) instead of the PWA. Must be `false` or omitted for PWA-first.

Source: MDN [prefer_related_applications](https://developer.mozilla.org/docs/Web/Manifest/prefer_related_applications)

---

## 2. iOS Safari Install Path (2026)

### Web App Manifest Support on iOS

**Modern iOS (11.3+) supports the Web App Manifest `display` member** for Home Screen web apps. When a site includes a manifest with `display: standalone` (or `fullscreen`/`minimal-ui`), iOS opens the home screen app in that display mode without the address bar, matching Chromium behavior.

However, **manifest support remains incomplete and iOS-specific metadata takes precedence**:
- The manifest's `name` and `short_name` are honored for the home screen label.
- The manifest's `icons` array is recognized, but `apple-touch-icon` (if present) overrides it.
- The manifest's `start_url` and `scope` are respected.

Sources:
- WebKit blog (circa iOS 11.3 / Safari 11.1): Web App Manifest `display` member support was added for Home Screen installations.
- Community consensus: the feature is stable but formally undocumented by Apple; MDN does not list iOS Safari in the manifest `display` compatibility table (confidence: high but undocumented).

### Apple-Specific Meta Tags (Legacy but Still Recommended for iOS)

iOS continues to recognize and prefer several Apple-specific meta tags, which complement (and in some cases supersede) manifest values:

#### `apple-mobile-web-app-capable`
```html
<meta name="apple-mobile-web-app-capable" content="yes">
```
Legacy way to enable Home Screen installation on older iOS versions. Modern iOS (11.3+) uses the manifest `display` member instead, but including this tag ensures compatibility with iOS versions that do not implement manifest support. **Include both manifest and this meta tag for backward compatibility.**

#### `apple-mobile-web-app-title`
```html
<meta name="apple-mobile-web-app-title" content="App Name">
```
Legacy way to specify the home screen label. Modern iOS reads manifest `name`/`short_name` instead, but this meta tag may still be used on older iOS versions. Recommended for compatibility.

#### `apple-mobile-web-app-status-bar-style`
```html
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```
Controls the iOS status bar (clock, battery, signal) appearance when the app runs in standalone mode:
- `default` — dark text on light background
- `black` — light text on dark background  
- `black-translucent` — light text, status bar blends with app (allows app to draw under it)

This **meta tag is iOS-specific** and has no manifest equivalent. It is still required to control status bar appearance on iOS.

#### `apple-touch-icon` (Icon Specification)
```html
<link rel="apple-touch-icon" href="/icon-180x180.png">
```
Specifies the home screen icon. **Required size: 180×180 pixels (standard iPad/phone).** iOS does not auto-scale icons from other sizes (unlike Android). Icon must be PNG, **fully opaque** (iOS composites any transparency onto black, which produces dark fringes around semi-transparent edges).

**Precedence:** If both `apple-touch-icon` and manifest `icons` are present, iOS prefers the `apple-touch-icon`. If only manifest icons are provided, iOS uses those. Including `apple-touch-icon` ensures the icon displays correctly on iOS.

### Share-sheet Install (iOS 16.4+)

iOS 16.4 added "Add to Home Screen" via the Share sheet (Share → Add to Home Screen). This installation path also respects the manifest `display` member and likely reads manifest name/icons, but it is not the primary discovery path. The traditional home screen menu option remains the main install route.

### Splash Screens (ios)

#### `apple-touch-startup-image`
```html
<link rel="apple-touch-startup-image" href="/startup-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)">
```
Specifies a custom startup image for when the app launches from home screen. Requires device-size media queries (iPhone XR, iPhone 12, etc.; every device has different dimensions and pixel ratios). If omitted, iOS shows a white or blank screen.

Alternative: Some developers omit startup images because the extra payload is large for a one-time experience, and users typically expect a brief blank screen during app boot.

#### Default Behavior Without `apple-touch-startup-image`
iOS displays white or blank (depending on Safari version) while the app loads. Unlike Android's manifest-based splash generation, iOS has no automatic splash from manifest `background_color`.

Viable in 2026? Yes, the feature still works. Worth the device-matrix complexity? Depends on UX priorities. For many apps, omitting it is acceptable.

### Service Worker and iOS
Service workers are **completely irrelevant** to iOS home screen install. iOS does not require, recognize, or interact with service workers for installation or home screen functionality. If the app implements a service worker for offline/caching, iOS will use it like any other browser—but it is not a prerequisite or gate for install.

---

## 3. Icon Matrix

### Manifest Icons (Android, Desktop, Chromium)

**Minimum required:**
- 192×192 PNG
- 512×512 PNG

Chrome automatically scales between them for display sizes; providing only these two is sufficient.

**Larger sets (recommended for quality):**
- 192×192 (required)
- 512×512 (required)
- 384×384 (optional; fills the gap on intermediate displays)
- 1024×1024 (optional; used for splash screens on some devices)

**Format:** PNG with transparency is standard; some Android devices support WebP.

### Maskable Icons (Adaptive Icons)

Maskable icons allow the system to crop icons into various shapes (circles, rounded squares, squircles) while preserving the essential content.

**Specification:**
```json
{
  "src": "icon-192-maskable.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "maskable"
},
{
  "src": "icon-192-any.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "any"
}
```

**Safe Zone:** The critical content must fit within a **circle centered in the icon with 40% radius** (i.e., safe content occupies an 80%-diameter circle; the outer 10% margin on all sides may be cropped on some platforms).

**Don't Combine:** web.dev explicitly advises against combining `purpose: "any maskable"` in a single entry. Maskable icons add padding for safe cropping, which makes `any` (standard) icons appear smaller. Keep them as separate entries.

Source: web.dev [maskable-icon](https://web.dev/articles/maskable-icon)

### Apple-touch-icon (iOS)

**Required size:** 180×180 PNG
**Transparency:** Must be fully opaque. iOS composites any transparent pixels onto black, causing dark fringes around semi-transparent edges.

iOS does not fall back to manifest icons or search for other sizes; the 180×180 link is the only path.

### Icon Mime Types

Standard values:
- `image/png` — recommended, widely supported
- `image/webp` — supported on modern Android/Chromium
- `image/svg+xml` — supported in some contexts (check browser-specific behavior)

---

## 4. theme_color and background_color Semantics

### What They Control

#### `theme_color` (Manifest)
```json
"theme_color": "#FF6B6B"
```
Controls the color of the **browser/app chrome** (status bar, toolbar, title bar) when the installed app is running. On Android, this is the toolbar background. On iOS, it is largely ignored (iOS does not use manifest theme_color for installed apps).

#### `background_color` (Manifest)
```json
"background_color": "#FFFFFF"
```
Specifies the **splash screen background color** during app load. Android generates a splash screen automatically using `background_color` + the app icon + the app name (from `name`/`short_name`). iOS ignores it unless a custom startup image is provided.

### Meta Tag Alternative: `<meta name="theme-color">`

```html
<!-- Light mode (default or media query) -->
<meta name="theme-color" content="#FF6B6B">

<!-- Dark mode variant (media query support limited) -->
<meta name="theme-color" content="#1A1A1A" media="(prefers-color-scheme: dark)">
```

The meta tag offers more flexibility than the static manifest value, including media query support for `prefers-color-scheme`.

#### Media Query Support
- **Chrome on Android:** Supports `media="(prefers-color-scheme: dark)"` — the browser respects the media query and updates the toolbar color.
- **Safari on iOS:** **Very limited or no support** for `media` queries on theme-color (not baseline per MDN).
- **Safari on macOS (17+):** May have better support; unclear.

#### Dynamic Updates via JavaScript
**Critical limitation:** Neither `theme-color` meta tags nor manifest values react to JavaScript updates. If an app changes the meta tag's content via:
```javascript
document.querySelector('meta[name="theme-color"]').setAttribute('content', '#NEW_COLOR');
```
…Chromium browsers may or may not respect the change in installed mode, and Safari does not. This is a platform limitation, not a bug.

Source: MDN [theme-color](https://developer.mozilla.org/docs/Web/HTML/Element/meta/name/theme-color)

### The Cookie Override Problem (genug-da specific)

genug-da applies theme via a `theme` cookie and server-side class rendering (ADR-0010: the `%theme%` placeholder in `src/app.html` is replaced with `dark` or `light` class by `handleTheme` hook). The app's CSS uses token values keyed to `.dark` / `.light` / `@media (prefers-color-scheme: dark)`.

**Constraint:** `prefers-color-scheme` media queries on the meta tag do **not** match the app's actual applied theme if the theme is overridden by cookie. Example:

1. User's OS preference is light (`prefers-color-scheme: light`)
2. User clicks "Dark" in the theme switcher → cookie writes `theme: dark`
3. Server renders `<html class="dark">`
4. But `<meta name="theme-color" media="(prefers-color-scheme: dark)">` is evaluated against OS preference (light), not the app's applied theme
5. Result: the meta tag shows light-mode color while the app displays dark

**Options:**
1. **Omit media queries on theme-color.** Use a single static value in the meta tag (and manifest). Acceptable if the app's theme and the status bar color are designed to be compatible across both light and dark.
2. **Dynamically update the meta tag with JavaScript** once the app has loaded and read the cookie. Not reliable in installed mode (browsers may not apply updates).
3. **Use only the manifest `theme_color`.** Static, no media queries. Treat it as a fixed accent color independent of the actual theme.
4. **Accept the mismatch.** The status bar color may not track the app theme on iOS anyway (it's often controlled by the OS or ignored in standalone mode).

For genug-da's cookie-override architecture, **option 3 (static manifest value)** is the most pragmatic.

---

## 5. iOS Splash Behavior

### Default (Without `apple-touch-startup-image`)

Without any custom startup image, iOS displays a **white or blank screen** while the app boots. The behavior varies slightly by Safari/iOS version (older versions may show a solid white, newer versions may show the default app background).

### With `apple-touch-startup-image`

Developers can specify a custom splash image using device-size media queries:

```html
<link rel="apple-touch-startup-image" href="/startup-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/startup-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
<!-- ... and many more device sizes ... -->
```

Every iOS device (iPhone XR, iPhone 12, iPhone 14 Pro Max, iPad Air, etc.) has unique dimensions and pixel ratios, requiring a separate media query per device. The maintenance cost is substantial.

### Is It Still Viable in 2026?

Yes, the feature works. However:
- **Payload cost:** A full matrix of startup images (one per device, accounting for different orientations) can add 500 KB–2 MB.
- **Maintenance:** Apple releases new devices regularly, requiring image updates.
- **UX trade-off:** The splash appears once per app launch; many apps find the brief white screen acceptable and skip startup images entirely.

For a budget app like genug-da, the splash images are typically not worth the cost unless the brand demands a branded first impression on every launch.

### Automatic Splash Generation (Not iOS)

Android's manifest-based splash generation (`background_color` + icon + name) is automatic. iOS has no equivalent—custom splashes are the only option, or accept the default white screen.

---

## 6. SvelteKit Wiring

### Static Assets and Manifest Serving

#### File Location
Place static files (icons, manifest) in the project root `static/` directory (not `src/static/`):
```
static/
  manifest.webmanifest
  icon-192.png
  icon-512.png
  apple-touch-icon.png
```

SvelteKit's build process copies the `static/` directory to the output root, making them available at:
- `/manifest.webmanifest`
- `/icon-192.png`
- etc.

Source: [SvelteKit project structure](https://svelte.dev/docs/kit/project-structure)

#### Manifest Filename
The spec recommends `.webmanifest` extension; `.json` is also widely accepted. Use `.webmanifest` for clarity and MIME type correctness.

#### MIME Type
The correct MIME type for manifest files is `application/manifest+json`. The `adapter-node` server uses `sirv` (a static file server) which delegates MIME type lookup to `mrmime`. The `mrmime` package includes `application/manifest+json` as the standard MIME type for `.webmanifest` files, so this is handled automatically without additional configuration.

Source: adapter-node uses sirv, which uses mrmime for MIME type resolution; confirmed: `mrmime.lookup('webmanifest')` returns `'application/manifest+json'`.

### Linking in the App Template

In `src/app.html`, add the manifest link in the `<head>`:

```html
<!doctype html>
<html lang="%paraglide.lang%" dir="%paraglide.dir%" class="%theme%">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Manifest for Chromium PWA install -->
    <link rel="manifest" href="/manifest.webmanifest" />
    
    <!-- iOS home screen -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="App Name" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

Current genug-da `app.html` is minimal (no manifest links). This will need to be extended.

### URL Resolution: %sveltekit.assets% and Relative Paths

#### When to Use `%sveltekit.assets%`

The `%sveltekit.assets%` placeholder is replaced at build time with the assets path (useful for CDN deployments). For manifest and icons in `static/`, use **absolute paths** (`/manifest.webmanifest`) rather than `%sveltekit.assets%`:

1. The manifest URL is the base URL for resolving relative icon `src` values. If icons are in `static/`, relative paths within the manifest should be:
   ```json
   {
     "icons": [
       { "src": "/icon-192.png", "sizes": "192x192" }
     ],
     "start_url": "/"
   }
   ```

2. The `start_url` and `scope` in the manifest are absolute or relative to the manifest URL. Using absolute paths (`/`) is clearer and avoids confusion.

#### adapter-node Behavior

The `adapter-node` server uses `sirv` (a static file server) paired with `polka` (a lightweight HTTP server). Files from `static/` are copied to the build output and served at root (`/`) with automatic MIME type detection via the `mrmime` library. The adapter handles prerendered pages and static assets transparently.

If a CDN is configured via `paths.assets`, consult your deployment setup for how static files are routed.

#### Building for Production

```bash
DATABASE_URL=:memory: npm run build
```

The build output includes a `static/` directory with all assets. The `adapter-node` handler serves these at the appropriate URLs.

### Viewport Meta Tag

genug-da's current `app.html` already includes:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

This is the minimum recommended for responsive design and PWA compatibility. Good to keep.

### Manifest Members: What to Populate

For genug-da's use case (budgeting app, no native app alternative):

```json
{
  "name": "genug — Budget Management",
  "short_name": "genug",
  "description": "A simple, private budget app",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#FF6B6B",
  "background_color": "#FFFFFF",
  "prefer_related_applications": false,
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Notes:
- `scope: "/"` is typical for a single-app site. Narrow it (e.g., `/app/`) if the site has logged-out pages.
- `theme_color` should match the app's primary color (or a variant safe for both light and dark).
- Include both `any` and `maskable` icons; split them as shown.
- Omit `apple-touch-startup-image` unless splash screen UX is a priority.

---

## Summary: Required Fields Per Platform

| Platform | Required Fields | Service Worker | Icon Sizes | Notes |
|----------|-----------------|-----------------|-----------|-------|
| **Chrome/Android** | name/short_name, icons (192, 512), start_url, display (not browser), prefer_related_applications: false | No | 192×192, 512×512 minimum | Maskable icons optional; separate entries |
| **iOS Safari (11.3+)** | Manifest: name/short_name, icons, display (standalone/fullscreen/minimal-ui), start_url, scope. Apple meta tags: apple-mobile-web-app-capable (legacy), apple-touch-icon (180×180), apple-mobile-web-app-status-bar-style | No | apple-touch-icon: 180×180 (takes precedence); manifest icons used as fallback | Manifest now supported; apple-touch-icon still preferred. Include both for backward compatibility. |
| **Firefox (Android)** | Similar to Chrome | No | 192×192, 512×512 | Largely Chrome-compatible |
| **Edge (Android)** | Similar to Chrome | No | 192×192, 512×512 | Largely Chrome-compatible |

---

## Sources

**W3C / Web Standards:**
- W3C: [Web Application Manifest](https://www.w3.org/TR/appmanifest/) — official spec (all members optional in spec; browser implementations vary)

**MDN (Mozilla Developer Network) — Primary Source:**
- [Web App Manifest](https://developer.mozilla.org/docs/Web/Manifest) — comprehensive reference
- [Making PWAs installable](https://developer.mozilla.org/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) — required Chromium members, installation criteria
- [Manifest: scope](https://developer.mozilla.org/docs/Web/Manifest/scope)
- [Manifest: start_url](https://developer.mozilla.org/docs/Web/Manifest/start_url)
- [Manifest: id](https://developer.mozilla.org/docs/Web/Manifest/id)
- [Manifest: prefer_related_applications](https://developer.mozilla.org/docs/Web/Manifest/prefer_related_applications)
- [Manifest: display](https://developer.mozilla.org/docs/Web/Manifest/display)
- [Manifest: background_color](https://developer.mozilla.org/docs/Web/Manifest/background_color)
- [HTML meta: theme-color](https://developer.mozilla.org/docs/Web/HTML/Element/meta/name/theme-color) — media query support status

**web.dev (Google Developers):**
- [Install Criteria](https://web.dev/articles/install-criteria) — Chrome Android requirements (last updated 2024-09-19)
- [Add a web app manifest](https://web.dev/articles/add-manifest) — manifest creation and icon guidance
- [Maskable Icons](https://web.dev/articles/maskable-icon) — safe zone, purpose field, don't combine rules

**SvelteKit Documentation:**
- [SvelteKit: Project Structure](https://svelte.dev/docs/kit/project-structure) — static directory location (project root, not src/)
- [SvelteKit: adapter-node](https://svelte.dev/docs/kit/adapter-node) — static file serving via sirv
- [SvelteKit: Routing](https://svelte.dev/docs/kit/routing) — route files, page templates

**Apple / WebKit (iOS PWA):**
- WebKit blog (circa iOS 11.3 / Safari 11.1): Web App Manifest `display` member support added for Home Screen web apps (undocumented but confirmed by community testing).
- Verified: `mrmime` package (used by sirv in adapter-node) maps `.webmanifest` to `application/manifest+json`.

**Genug-da Repository:**
- `src/app.html` — current app template (needs manifest links)
- `svelte.config.js` — build configuration
- `static/` — project root directory for static assets
- `docs/adr/0010-dark-mode-token-override-cookie-persisted.md` — theme cookie architecture

**Apple / WebKit:**
- WebKit standards positions not found; no formal Apple PWA spec documentation located for this research. iOS PWA behavior inferred from platform behavior and community testing.
- (apple-mobile-web-app-* meta tags and apple-touch-* behavior established through common practice and undocumented browser behavior)

**Genug-da Repository:**
- `src/app.html` — current template (minimal; no manifest links)
- `svelte.config.js` — build configuration (adapter-node, paths not overridden)
- `docs/adr/0010-dark-mode-token-override-cookie-persisted.md` — theme cookie architecture (conflicts with `prefers-color-scheme` media queries on meta tags)

---

## Undocumented / Confidence Notes

1. **iOS Web App Manifest display member support:** WebKit added support for the manifest `display` member in iOS 11.3 / Safari 11.1, but this feature has never been formally documented by Apple or WebKit in release notes or standards positions. Confidence: very high (consensus across PWA community and confirmed by testing), but formally undocumented.

2. **Manifest `name`/`short_name` and `icons` precedence on iOS:** Modern iOS likely reads these from the manifest, but the exact fallback order and whether all fields are supported remains undocumented. `apple-mobile-web-app-title` and `apple-touch-icon` are the documented/preferred Apple-specific alternatives.

3. **theme-color media query support in Safari:** MDN lists this as "not baseline" (limited availability). Apple has not published formal support status. iOS Safari support is uncertain; Chrome on Android supports it.

4. **Dynamic meta tag updates in installed PWA mode:** Browsers may or may not respect JavaScript updates to meta tag content after installation. Not officially specified; this is observed behavior.

5. **SvelteKit adapter-node MIME type handling:** Verified: `mrmime.lookup('webmanifest')` returns `application/manifest+json`, so `.webmanifest` MIME types are handled automatically without configuration.

6. **Apple touch startup image viability in 2026:** The feature works and is still supported, but Apple maintains a large device matrix; maintaining startup images for every device model is labor-intensive.
