
import React, { useState, useEffect } from 'react';
import { Film, Users, Sparkles, Download, RefreshCw, AlertCircle, Trash2, Lightbulb, Key, ExternalLink } from 'lucide-react';
import { AppState, UploadedImage } from './types';
import ImageInput from './components/ImageInput';
import { generateSwappedPoster } from './services/geminiService';

/**
 * Define AIStudio interface and augment the Window object.
 * Removed readonly modifier to fix "All declarations of 'aistudio' must have identical modifiers" error.
 */
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Removed readonly to match environment declaration and resolve conflict
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    poster: null,
    people: [],
    isProcessing: false,
    result: null,
    error: null,
  });
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      // Check if the user has already selected an API key.
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } catch (e) {
      console.error("Failed to check API key status", e);
    }
  };

  const handleOpenKeyDialog = async () => {
    // Open the API key selection dialog.
    await window.aistudio.openSelectKey();
    // Per guidelines, assume key selection was successful after triggering the dialog to avoid race conditions.
    setHasKey(true);
  };

  const handlePosterUpload = (image: UploadedImage) => {
    setState(prev => ({ ...prev, poster: image, error: null }));
  };

  const handlePersonUpload = (image: UploadedImage) => {
    setState(prev => ({ ...prev, people: [...prev.people, image], error: null }));
  };

  const handleRemovePoster = () => {
    setState(prev => ({ ...prev, poster: null }));
  };

  const handleRemovePerson = (id: string) => {
    setState(prev => ({ ...prev, people: prev.people.filter(p => p.id !== id) }));
  };

  const handleProcess = async () => {
    if (!hasKey) {
      setState(prev => ({ ...prev, error: "使用 Pro 模式需要先選取您的 API Key。" }));
      return;
    }
    if (!state.poster) {
      setState(prev => ({ ...prev, error: "請上傳一張電影海報。" }));
      return;
    }
    if (state.people.length === 0) {
      setState(prev => ({ ...prev, error: "請上傳至少一位置換人物。" }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null, result: null }));

    try {
      const resultUrl = await generateSwappedPoster(state.poster, state.people);
      setState(prev => ({ ...prev, result: resultUrl, isProcessing: false }));
    } catch (err: any) {
      // If the API call fails with "Requested entity was not found", reset the key selection state.
      if (err.message === "KEY_NOT_FOUND") {
        setHasKey(false);
        setState(prev => ({ ...prev, isProcessing: false, error: "API Key 無效或已過期，請重新選取。" }));
      } else {
        setState(prev => ({ ...prev, error: err.message, isProcessing: false }));
      }
    }
  };

  const resetAll = () => {
    setState({
      poster: null,
      people: [],
      isProcessing: false,
      result: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between mb-10 gap-6 border-b border-slate-900 pb-8">
        <div className="flex items-center gap-5">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-3 rounded-2xl shadow-xl shadow-indigo-500/20">
            <Film className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white italic">
              CineSwap <span className="text-indigo-500">PRO</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">AI-Powered Cinematic Face Replacer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hasKey && (
            <button 
              onClick={handleOpenKeyDialog}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-indigo-600/20"
            >
              <Key size={18} />
              選取 API Key
            </button>
          )}
          <button 
            onClick={resetAll}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800"
          >
            <Trash2 size={18} />
            <span className="font-bold text-sm">清除重來</span>
          </button>
        </div>
      </header>

      {!hasKey && (
        <div className="w-full max-w-4xl mb-10 bg-amber-950/20 border border-amber-500/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-amber-200 font-bold flex items-center gap-2">
              <AlertCircle size={20} />
              需要選取 API Key 才能執行 Pro 置換
            </h3>
            <p className="text-amber-200/60 text-sm">
              請從付費專案中選擇 API Key。請參考 
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-amber-400 underline ml-1 inline-flex items-center gap-1">
                計費文件 <ExternalLink size={12} />
              </a>
            </p>
          </div>
          <button 
            onClick={handleOpenKeyDialog}
            className="px-8 py-3 bg-amber-500 text-black font-black rounded-full hover:bg-amber-400 transition-all whitespace-nowrap"
          >
            立即選取 KEY
          </button>
        </div>
      )}

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
            <ImageInput
              label="1. 上傳電影海報"
              description="請選擇人物臉部清晰的海報。"
              onUpload={handlePosterUpload}
              onRemove={handleRemovePoster}
              images={state.poster ? [state.poster] : []}
            />
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
            <ImageInput
              label="2. 上傳您的照片 (2-5人)"
              description="照片臉部需清晰，建議為正面。"
              multiple
              maxFiles={5}
              onUpload={handlePersonUpload}
              onRemove={handleRemovePerson}
              images={state.people}
            />
          </div>

          <div className="bg-indigo-950/20 border border-indigo-500/20 p-6 rounded-2xl flex gap-4">
            <Lightbulb className="text-indigo-400 shrink-0" size={24} />
            <div className="space-y-2 text-sm text-indigo-200/70">
              <p>我們已切換至 <span className="text-indigo-400 font-bold">Pro 模式</span>，這能顯著提升臉部置換的成功率與畫質。如果依然失敗，請確認圖片中人臉是否被遮擋。</p>
            </div>
          </div>

          {state.error && (
            <div className="p-5 bg-red-950/30 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold flex items-center gap-3">
              <AlertCircle size={20} />
              {state.error}
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={state.isProcessing || !state.poster || state.people.length === 0 || !hasKey}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 font-black text-xl transition-all relative overflow-hidden group
              ${state.isProcessing || !hasKey
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/30 active:scale-95'
              }`}
          >
            {state.isProcessing ? (
              <>
                <RefreshCw className="animate-spin" size={26} />
                <span>正在重塑海報像素...</span>
              </>
            ) : (
              <>
                <Sparkles size={26} />
                <span>執行全卡司 Pro 置換</span>
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900/20 border border-white/5 rounded-[3rem] min-h-[600px] flex flex-col overflow-hidden relative shadow-inner">
            <div className="px-10 py-6 bg-slate-900/50 flex items-center justify-between backdrop-blur-md border-b border-white/5">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Processed Result</span>
              {state.result && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = state.result!;
                    link.download = `CineSwap-Result.png`;
                    link.click();
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-slate-950 text-xs font-black rounded-full hover:bg-indigo-50 transition-all"
                >
                  <Download size={14} />
                  下載作品
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center p-10">
              {state.result ? (
                <img src={state.result} alt="Result" className="max-h-[70vh] rounded-xl shadow-2xl animate-in zoom-in-95 duration-500" />
              ) : state.isProcessing ? (
                <div className="text-center space-y-8">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-400 font-bold animate-pulse">Pro 引擎正在分析海報結構並對齊面部...</p>
                </div>
              ) : (
                <div className="text-center space-y-6 opacity-40">
                  <Film size={80} className="mx-auto text-slate-700" />
                  <p className="font-bold text-slate-600">等待置換生成</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
