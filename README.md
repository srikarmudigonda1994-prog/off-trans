# Offline Translator (Spanish ⇄ English)

A React Native + TypeScript app that translates text and speech between
Spanish and English, entirely on-device after a one-time model download.
No server, no API key, no network calls once set up. (Video translation
is scaffolded but currently disabled — see "Known gaps" below.)

## Before you build: read this

This project was generated in a sandboxed environment with **no network
access and no mobile build tools** (no Xcode, no Android SDK, no `npm`
registry access). That means:

- Every file here is real, hand-written TypeScript/TSX following each
  library's actual public API — not a stub or placeholder.
- **None of it has been `npm install`ed, compiled, or run.** I can't
  verify it builds cleanly from here — what you're getting is the
  result of iterating against real GitHub Actions build logs sent back
  over the course of this conversation, not a local test run.
- Every dependency version in `package.json` has been checked against
  the live npm registry (not guessed), and this went through several
  real rounds of "it failed here" → fix → retry:
  - `ffmpeg-kit-next-react-native` isn't published to npm at all (it's
    source you build yourself).
  - The original `react-native-fs` is abandoned and incompatible with
    the New Architecture this RN version uses by default — replaced
    with the maintained `@dr.pogodin/react-native-fs` fork.
  - `react-native-audio-recorder-player` is now deprecated upstream in
    favor of `react-native-nitro-sound` — but that in turn needs
    FFmpeg-free handling too (see below), so this app uses
    `@dr.pogodin/react-native-audio` instead, recording raw 16kHz mono
    PCM directly and writing a WAV header by hand. No transcoding step
    needed.
  - `ffmpeg-kit-react-native`'s underlying native Android artifact
    (`com.arthenica:ffmpeg-kit-https`) has actually been pulled from
    Maven Central, Google's repo, and JitPack — not just the GitHub
    project archived. The replacement that turns up first when
    searching for this is a single-operator outfit ("Jokobee" /
    `ffmpegkit-maintained`) republishing binaries for several unrelated
    abandoned libraries (FFmpeg, llama.cpp, whisper.cpp, yt-dlp) with
    paywalled "Pro" tiers and AI-generated docs — not something I'm
    willing to point you at for a compiled binary that runs with full
    app permissions. Video translation is disabled rather than built
    on that.
  - Several older native modules' own `android/build.gradle` files
    still call the removed `jcenter()` Gradle method, which hard-fails
    on modern Gradle (9.x) rather than just warning. The build
    workflow patches every occurrence of this under `node_modules`
    after install.
- The scripts embedded in `.github/workflows/build-apk.yml` were
  tested in that sandbox against realistic fixture files (not the
  real thing) before being sent over, so their logic is verified in
  isolation — what actually caught the issues above was your real CI
  runs.

## Architecture

```
Input (text / audio)
        │
        ▼
Speech to text — whisper.rn / whisper.cpp, on-device
        │  (skipped for text input)
        ▼
Translation — Google ML Kit, on-device
        │
        ▼
Output — translated text, or spoken audio (react-native-tts)
```

| Capability | Library | Notes |
|---|---|---|
| Text translation | `@react-native-ml-kit/translate-text` | On-device, downloads a ~30MB language pack once per direction |
| Audio recording | `@dr.pogodin/react-native-audio` | Captures raw 16kHz mono PCM directly; a WAV header is built in JS — no transcoding library needed |
| Speech-to-text | `whisper.rn` | Bundles whisper.cpp; downloads a ~140MB multilingual model once |
| Text-to-speech | `react-native-tts` | Wraps the OS's built-in voices — no model download needed |
| Video | — | Disabled — see "Known gaps" |

## Getting an APK — fully in the browser, nothing installed locally

`.github/workflows/build-apk.yml` does the entire build in the cloud:
generates the native `android/` project with the React Native CLI,
copies this repo's app code into it, merges dependencies, patches the
Android permissions/SDK versions and any stale `jcenter()` calls,
`npm install`s, and runs the Gradle build — all on GitHub's servers.

1. **Create the workflow file directly on GitHub** (don't drag it in
   as part of a folder — Finder/most Linux file managers hide
   dot-folders like `.github` by default, so a folder drag can drop it
   silently): on your repo's page, **Add file → Create new file**,
   type the path `.github/workflows/build-apk.yml` (or whatever name
   you've already used, e.g. `main.yaml` — the name doesn't matter,
   only the `.github/workflows/` location does), paste in the
   workflow's contents, and commit directly to `main`.
2. **Upload this project's other files to the repo root** —
   `src/`, `index.js`, `app.json`, `babel.config.js`,
   `metro.config.js`, `tsconfig.json`, `package.json`, `native-setup/`
   — via **Add file → Upload files**, as loose files/folders (not
   zipped). Commit.

That second commit triggers the workflow. Open the **Actions** tab to
watch it run (a few minutes, mostly the Gradle build). When it's
green, open the run, scroll to **Artifacts**, and download
**offline-translator-debug-apk** — a zip containing `app-debug.apk`.
Get that onto your phone (email, Drive, etc.), tap it, and allow
"install from unknown sources" when Android asks — expected for a
debug build outside the Play Store.

Open the app, go to the **Models** tab first, and download the offline
models once over Wi-Fi. Everything after that works with zero network
access.

**Note:** this is a debug build — fine to sideload and run yourself,
but not signed for Play Store distribution. That's a separate step (a
release keystore + signing config) worth doing once the app itself is
where you want it.

<details>
<summary>Prefer a local build instead? (needs Android Studio / SDK on your machine)</summary>

```bash
npx @react-native-community/cli init OfflineTranslator --version 0.87.1
# copy src/, index.js, app.json, babel.config.js, metro.config.js,
# tsconfig.json into the generated OfflineTranslator/ folder, merge
# package.json by hand, then:
cd OfflineTranslator
npm install
# apply native-setup/AndroidManifest-additions.xml and
# native-setup/build-gradle-notes.txt (including its jcenter() note)
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

`native-setup/Info.plist-additions.xml` and `Podfile-notes.txt` cover
the equivalent iOS steps if you want to build for iPhone too — that
needs a Mac with Xcode and isn't something a GitHub Actions Linux
runner can do for you.
</details>

## Project structure

```
src/
  App.tsx                    Root component, gates on first-run setup
  navigation/AppNavigator.tsx Bottom tabs: Text / Audio / Video / Settings
  screens/                   One screen per tab (Video is a placeholder)
  services/
    translation/             ML Kit wrapper
    speech/                  whisper.rn (STT), react-native-tts (TTS),
                              audioRecorder.ts (raw WAV capture)
    models/                  First-run download orchestration
  hooks/                     useTranslation, useSetupStatus
  components/                Shared LanguageSwap + ProgressBar
  types/, constants/         Shared types and language metadata
native-setup/                Copy-paste native config snippets
```

## Known gaps and where to look

- **Video translation is disabled.** It needs real video-container
  handling (extracting the audio track, burning subtitles back in),
  which normally means FFmpeg. See "Before you build" above for why
  that's not wired up right now rather than pointed at an unverified
  binary source. To revisit this: check whether
  [FFmpegKitNext](https://github.com/arthenica/ffmpeg-kit-next) has
  published usable npm/Maven artifacts by the time you read this, or
  build its native binaries yourself from source per its own
  instructions — either is a safer foundation than a random
  republished `.aar`.
- **`@react-native-ml-kit/translate-text` is community-maintained and
  was in alpha as of when this was written.** If you hit issues,
  `react-native-mlkit-translate-text` (a different, older package) is
  a fallback with a similar API.
- **`whisper.rn`'s segment timestamp field names** (`t0`/`t1` vs other
  shapes) have moved between versions — `whisperStt.ts` has a `NOTE:`
  comment at the exact spot to check against your installed version's
  type definitions.
- **Model URLs**: the Whisper model in `whisperStt.ts` points at the
  official `ggerganov/whisper.cpp` Hugging Face repo. If that path
  changes, update `MODEL_URL`.
- **App size**: the whisper model is downloaded at runtime rather than
  bundled, specifically to keep the App Store / Play Store binary
  small and avoid Metro's asset bundling limits on large files.
- **`@dr.pogodin/react-native-audio` may need `react-native-permissions`
  for a smooth runtime mic-permission prompt** on some OS versions,
  on top of the manifest declaration — if recording silently fails to
  start on a real device, that's the first thing to add.

## Extending this

- Swap `ggml-base.bin` for `ggml-small.bin` in `whisperStt.ts` for
  better accuracy at a larger download size, or `ggml-tiny.bin` for
  faster/smaller at lower accuracy.
- Add more language pairs by extending `LanguageCode` and the maps in
  `constants/languages.ts` and `mlkitTranslate.ts` — ML Kit supports
  50+ languages on-device.
- A conversation-mode screen (continuous mic listening with live
  partial transcripts) is possible via `whisper.rn`'s
  `RealtimeTranscriber` API — see its README for the streaming setup.
