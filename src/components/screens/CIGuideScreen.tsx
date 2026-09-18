import React from 'react';
import { Github, CheckCircle2, Code2, Smartphone, Terminal, ArrowRight } from 'lucide-react';

export const CIGuideScreen: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto w-full space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
          <Github className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Native Android & GitHub CI</h2>
          <p className="text-xs text-slate-400">
            Build and install the native Android APK directly from your phone.
          </p>
        </div>
      </div>

      {/* Steps Card */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3.5 text-xs">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          How to get your APK on your phone:
        </h3>
        <ol className="list-decimal list-inside space-y-2.5 text-slate-300 leading-relaxed">
          <li>
            <strong className="text-slate-100">Push to GitHub:</strong> In Google AI Studio, push your changes to your repository.
          </li>
          <li>
            <strong className="text-slate-100">Automated Cloud Build:</strong> GitHub Actions triggers <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300">.github/workflows/build.yml</code> using Ubuntu + Temurin JDK 17.
          </li>
          <li>
            <strong className="text-slate-100">Gradle Compilation:</strong> Runs <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300">./gradlew assembleDebug --info</code> with AAPT2 and Jetpack Compose.
          </li>
          <li>
            <strong className="text-slate-100">Install APK:</strong> Go to your GitHub repository in your mobile browser → tap <strong>Actions</strong> tab → click the latest workflow run → download <strong>AI-Lyric-Video-Maker-debug.zip</strong>, unpack and install the APK!
          </li>
        </ol>
      </div>

      {/* Intact Native Android Codebase verification */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          Native Android Architecture (Intact):
        </h3>
        <div className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] text-slate-400 space-y-1.5">
          <div className="text-emerald-400 font-semibold">✓ Kotlin & Jetpack Compose 1.5</div>
          <div>✓ AndroidX Media3 ExoPlayer Audio Engine</div>
          <div>✓ DynamicFontManager (Custom Tamil TTF/OTF ligature support)</div>
          <div>✓ ManualTapSyncEngine & WaveformExtractor</div>
          <div>✓ MediaCodec & MediaMuxer Native Video Render Pipeline</div>
          <div>✓ Launcher Icons (res/drawable/ic_launcher.xml, ic_launcher_round.xml)</div>
          <div>✓ Gradle 8.7 Wrapper & Android Gradle Plugin 8.3.1</div>
        </div>
      </div>
    </div>
  );
};
