# Offline Translator (Spanish ⇄ English)

A React Native + TypeScript app that translates text, speech, and video
between Spanish and English, entirely on-device after a one-time model
download. No server, no API key, no network calls once set up.

## Before you build: read this

This project was generated in a sandboxed environment with **no network
access and no mobile build tools** (no Xcode, no Android SDK, no `npm`
registry access). That means:

- Every file here is real, hand-written TypeScript/TSX following each
  library's actual public API — not a stub or placeholder.
- **None of it has been `npm install`ed, compiled, or run.** I can't
  verify it builds cleanly from here.
- A few library APIs (noted inline with `NOTE:` comments) have shifted
  field names across recent versions — check those specific spots
  against the version that actually gets installed.
- The two scripts embedded in `.github/workflows/build-apk.yml`
  (merging `package.json`, patching the Android manifest/gradle files)
  **were** tested in that sandbox against realistic fixture files, so
  their logic is verified — what's unverified is the real
  `react-native init` + Gradle build around them.

## Architecture

```
Input (text / audio / video)
        │
        ▼
Speech to text — whisper.rn / whisper.cpp, on-device
        │  (skipped for text input)
        ▼
Translation — Google ML Kit, on-device
        │
        ▼
Output — translated text, spoken audio (react-native-tts),
         or a video with burned-in translated subtitles
```

| Capability | Library | Notes |
|---|---|---|
| Text translation | `@react-native-ml-kit/translate-text` | On-device, downloads a ~30MB language pack once per direction |
| Speech-to-text | `whisper.rn` | Bundles whisper.cpp; downloads a ~140MB multilingual model once |
| Text-to-speech | `react-native-tts` | Wraps the OS's built-in voices — no model download needed |
| Video audio extraction / subtitle burn-in | `ffmpeg-kit-next-react-native` | The maintained continuation of the now-retired `ffmpeg-kit-react-native` |

## Getting an APK — fully in the browser, nothing installed locally

`.github/workflows/build-apk.yml` does the entire build in the cloud:
unzips the project, generates the native `android/` project with the
React Native CLI, merges dependencies, patches the Android
permissions/SDK versions, `npm install`s, and runs the Gradle build —
all on GitHub's servers.

Two steps, both avoiding the classic gotcha where a browser's
drag-and-drop silently skips the `.github` folder because Finder/most
Linux file managers hide dot-folders by default:

1. **Create the workflow file directly on GitHub** (don't drag it in):
   on your repo's page, **Add file → Create new file**, type the path
   `.github/workflows/build-apk.yml`, paste in the workflow's contents,
   and commit directly to `main`.
2. **Upload the zip as one file** — **Add file → Upload files**, drag
   in `OfflineTranslator.zip` itself (no need to extract it), commit.
   A single visible file has nothing to hide, so this step can't drop
   anything silently the way a whole-folder drag can.

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
# native-setup/build-gradle-notes.txt
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
  screens/                   One screen per tab
  services/
    translation/             ML Kit wrapper
    speech/                  whisper.rn (STT) + react-native-tts (TTS)
    video/                   FFmpegKitNext pipeline (extract, subtitle, remux)
    models/                  First-run download orchestration
  hooks/                     useTranslation, useSetupStatus
  components/                Shared LanguageSwap + ProgressBar
  types/, constants/         Shared types and language metadata
native-setup/                Copy-paste native config snippets
```

## Known gaps and where to look

- **Dubbing (replacing spoken audio) isn't wired into the Video
  screen.** `ffmpegPipeline.ts` has `replaceAudioTrack()` ready to go,
  but synced dubbing needs per-segment TTS generation stretched or
  padded to match each segment's original duration — a real feature
  in its own right. The shipped video flow does translated burned-in
  subtitles instead, which sidesteps timing entirely.
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
