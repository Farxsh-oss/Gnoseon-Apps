import { useState } from 'react';
import { Download, Smartphone, Monitor, X, Share, Plus } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallPrompt() {
  const { canInstall, isInstalled, platform, isIos, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  const PlatformIcon = platform === 'desktop' ? Monitor : Smartphone;

  return (
    <>
      {/* Install Banner */}
      <div className="mx-4 mb-2 neu-flat rounded-xl p-3 border-l-4 border-green-500 flex items-center gap-3 animate-fade-in">
        <div className="neu-raised p-2 rounded-lg flex-shrink-0">
          <PlatformIcon className="w-5 h-5 text-green-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-green-600 font-mono">
            {platform === 'desktop' ? '[ DESKTOP_APP ]' : '[ MOBILE_APP ]'}
          </p>
          <p className="text-xs text-gray-500 truncate font-mono">
            Install Gnōseōn — buka tanpa browser
          </p>
        </div>

        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex items-center gap-1 px-3 py-1.5 neu-raised rounded-lg text-xs font-bold text-green-700 hover:neu-pressed transition-all disabled:opacity-60 flex-shrink-0"
        >
          <Download className="w-3 h-3" />
          {installing ? 'Installing...' : 'Install'}
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* iOS Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="w-full max-w-sm neu-flat rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-purple-600 font-mono text-sm">[ INSTALL_iOS ]</h3>
              <button onClick={() => setShowIosGuide(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 font-mono">
              Ikuti langkah berikut untuk install di iPhone/iPad:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 neu-inset p-3 rounded-xl">
                <div className="neu-raised p-1.5 rounded-lg flex-shrink-0">
                  <Share className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Step 1</p>
                  <p className="text-xs text-gray-500">Tap tombol <strong>Share</strong> (kotak dengan panah ke atas) di Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3 neu-inset p-3 rounded-xl">
                <div className="neu-raised p-1.5 rounded-lg flex-shrink-0">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Step 2</p>
                  <p className="text-xs text-gray-500">Pilih <strong>"Add to Home Screen"</strong> dari menu yang muncul</p>
                </div>
              </div>

              <div className="flex items-start gap-3 neu-inset p-3 rounded-xl">
                <div className="neu-raised p-1.5 rounded-lg flex-shrink-0">
                  <Download className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Step 3</p>
                  <p className="text-xs text-gray-500">Tap <strong>"Add"</strong> — Gnōseōn akan muncul di home screen</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setShowIosGuide(false); setDismissed(true); }}
              className="w-full mt-4 py-2 neu-raised rounded-xl text-xs font-bold text-green-700 hover:neu-pressed transition-all"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
