# Building the MultiChat Desktop App (.exe)

## First time setup

```bash
npm install
```

## Run in development (no .exe, just launches the app)

```bash
npm start
```

The setup wizard will appear on first run. After completing it, relaunch
with `npm start` again to see the chat window.

To force the setup wizard again, delete:
```
%APPDATA%\MultiChat\multichat-config.json
```

## Build the .exe installer

```bash
npm run build
```

The installer will be created in the `dist/` folder as:
```
dist/MultiChat Setup 1.0.0.exe
```

Double-click it to install. Creates a Start Menu shortcut and Desktop shortcut.

---

## Before building — add an icon (optional but recommended)

Create an `assets/` folder and add:
- `assets/icon.ico` — Windows icon (256x256 recommended)
- `assets/icon.png` — Used for the system tray (32x32 or 64x64)

Free converter: https://convertio.co/png-ico/

If no icon files are found the app will build and run without a custom icon.

---

## How it works

When a user launches MultiChat.exe for the first time:
1. **Setup wizard appears** — they fill in their stream details (no code, no files)
2. Settings are saved to `%APPDATA%\MultiChat\multichat-config.json`
3. **Chat window opens** — Discord bridge starts automatically in the background

Every launch after that skips setup and goes straight to the chat.

To change settings: right-click the **system tray icon → Settings**

---

## Distributing to others

1. Build the .exe with `npm run build`
2. Upload `dist/MultiChat Setup 1.0.0.exe` to a GitHub Release
3. Users download and install — the setup wizard handles everything
4. No config files, no terminal, no npm required for end users
