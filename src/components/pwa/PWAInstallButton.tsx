import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:from-violet-500 hover:to-indigo-500 transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          <Share2 className="w-3.5 h-3.5 text-violet-400" />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-violet-400" />
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  1. Tap the <strong className="text-violet-400">Share</strong> icon at the bottom of Safari.
                </p>
                <p>
                  2. Scroll down and tap <strong className="text-violet-400">Add to Home Screen</strong>.
                </p>
                <p>
                  3. Tap <strong className="text-violet-400">Add</strong> to launch it as a full-screen standalone application!
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-violet-600 hover:bg-violet-500 py-2.5 text-xs font-semibold text-white transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback: Show subtle install / home screen instructions on standard browser
  return (
    <button
      onClick={() => {
        alert(
          'To install AI Lyric Video Maker as a PWA:\n\n' +
          '• On Android Chrome: Tap the three dots (⋮) menu in the top right → select "Add to Home screen" or "Install app".\n' +
          '• On Desktop Chrome: Click the install icon in the address bar.'
        );
      }}
      className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
      title="Install as Progressive Web App"
    >
      <Download className="w-3.5 h-3.5 text-violet-400" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
};
