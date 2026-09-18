# AI Lyric Video Maker (Native Android & CI/CD Studio)

A native Android application built with **Kotlin**, **Jetpack Compose**, and **AndroidX Media3** for creating synchronized lyric videos with custom Tamil & English typography, dynamic waveform scrubbing, interactive Tap-to-Sync timing recording, timeline micro-adjustments, and live animated video preview.

The repository is configured for automated cloud builds via **GitHub Actions**, allowing you to develop from a mobile device using Google AI Studio and download installable Android APKs directly from GitHub releases/artifacts without requiring Android Studio on your device.

---

## Architecture & Project Structure

```
├── .github/
│   └── workflows/
│       └── build.yml               # GitHub Actions CI workflow to build & upload APK artifact
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar      # Official binary Gradle wrapper distribution
│       └── gradle-wrapper.properties # Gradle 8.7 configuration
├── app/
│   ├── build.gradle.kts            # Android application module config (SDK 34, Compose, Media3)
│   ├── proguard-rules.pro          # Proguard & R8 rules
│   └── src/main/
│       ├── AndroidManifest.xml     # Activity declarations & permissions
│       ├── java/com/ailyricvideomaker/app/
│       │   ├── MainActivity.kt     # Jetpack Compose single-activity entrypoint
│       │   ├── data/
│       │   │   ├── model/          # LyricLine, ProjectData, TextStyleConfig, AnimationConfig
│       │   │   └── repository/     # Local JSON persistence across app launches
│       │   ├── domain/
│       │   │   ├── audio/          # AudioEngine (Media3 ExoPlayer wrapper with position flow)
│       │   │   ├── waveform/       # WaveformExtractor (memory-safe peak downsampling)
│       │   │   ├── font/           # DynamicFontManager (TTF/OTF loader with Tamil Unicode shaping)
│       │   │   └── sync/           # LyricSyncProvider, ManualTapSyncEngine, GeminiLyricSyncProvider
│       │   └── ui/
│       │       ├── screens/        # MainEditorScreen (Preview, Assets, Lyrics, Timeline, Style)
│       │       ├── theme/          # Material 3 dark creator theme (Color, Type, Theme)
│       │       └── viewmodel/      # LyricVideoViewModel (State, timeline operations, playback)
│       └── res/                    # Dark theme styles, colors, strings, backup rules
├── build.gradle.kts                # Root project Gradle build script
├── settings.gradle.kts             # Dependency & plugin repositories
├── gradlew & gradlew.bat           # Executable Gradle wrapper scripts
└── README.md                       # Comprehensive guide & architecture documentation
```

---

## How GitHub Actions Builds the APK

This repository requires **no local Android Studio setup**. Every time you commit or push changes:

1. **Trigger:** The workflow in `.github/workflows/build.yml` triggers on `push` to `main`/`master` or manually via `workflow_dispatch`.
2. **Environment:** Runs on an `ubuntu-latest` container equipped with Android SDK and JDK 17.
3. **Execution:** Runs `./gradlew assembleDebug --stacktrace`.
4. **Artifact Generation:** Compiles the APK at `app/build/outputs/apk/debug/app-debug.apk`.
5. **Downloadable Artifact:** Uploads the output as **`AI-Lyric-Video-Maker-debug`**.

### Where to Download the APK:
1. Open your repository on **GitHub** (via mobile or desktop browser).
2. Tap the **Actions** tab at the top.
3. Tap on the latest workflow run (e.g., *"Build Android APK"*).
4. Scroll to the **Artifacts** section at the bottom of the page.
5. Tap **`AI-Lyric-Video-Maker-debug`** to download the zip containing your installable `app-debug.apk`.

---

## Local Building with Gradle (Optional)

If you have a laptop or computer with Java 17 installed:

```bash
# Clone the repository
git clone <your-repo-url>
cd ailyricvideomaker

# Make wrapper executable (Linux/macOS)
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug

# Output APK path:
# app/build/outputs/apk/debug/app-debug.apk
```

---

## Currently Implemented Features (Phases 1–4)

1. **Phase 1: Project UI & Asset Management**
   - **Background Picker:** Selects phone gallery images via modern Android PhotoPicker / SAF.
   - **Authoritative Lyrics Editor:** Preserves user-supplied text and exact line breaks for Tamil, English, and Unicode mixed scripts.
   - **Audio Engine:** Full playback, pause, seek, and loop support for MP3, WAV, and M4A using AndroidX Media3 ExoPlayer.
   - **Dynamic Font Loader:** Dynamically imports TTF and OTF files directly into a native `Typeface` and Compose `FontFamily`, preserving HarfBuzz Tamil diacritics and ligatures.

2. **Phase 2: Audio Waveform Engine**
   - Extracts normalized audio energy envelopes without uncompressed PCM memory spikes.
   - Interactive waveform scrubber with playhead, timestamp readout, and drag-to-seek functionality.

3. **Phase 3: Lyric Timeline Engine**
   - Structured `LyricLine` objects with start and end timestamps.
   - Real-time active line highlighting synced to the playback position.

4. **Phase 4: Tap-to-Sync & Timeline Correction**
   - **Interactive Tap to Sync:** Play the song and tap the screen as each line is sung; automatically generates sequential timestamps and computes intelligent end times.
   - **Precision Timeline Editor:** Nudge lines earlier/later (-250ms / +250ms), micro-adjust start/end boundaries, split long lines, merge adjacent lines, and edit lyric text.

5. **Live Animated Preview & Styling**
   - Live canvas preview displaying background image + custom font lyrics.
   - Real-time animations: Fade, Slide, Highlight, Zoom, and Typewriter.
   - Styling controls: font size, vertical positioning, text alignment, drop shadow, and stroke outline.

6. **Project Persistence**
   - Local state auto-saves to preferences so you can exit and return to your project without losing lyrics, timings, or styling.

---

## Future Roadmap

- **Gemini AI Multimodal Synchronization:**
  - `GeminiLyricSyncProvider` is architected to stream the audio and exact lyrics to Gemini (e.g. `gemini-2.5-flash`), returning structured timestamp JSON:
    ```json
    [
      {
        "line": 1,
        "text": "exact supplied lyric",
        "start": 5.32,
        "end": 9.74,
        "confidence": 0.91
      }
    ]
    ```
- **On-Device MP4 Video Export:**
  - Deterministic frame-by-frame rendering pipeline utilizing Android hardware `MediaCodec` (H.264/AVC) + `MediaMuxer` to export crisp 1080p video files directly to the device's Movies folder.
