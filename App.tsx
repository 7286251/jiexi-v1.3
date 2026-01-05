
import React, { useState, useEffect, useRef } from 'react';
import { DopamineLayout } from './components/DopamineLayout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppStatus } from './types';
import { analyzeImage, modifyResult, translateJson, validateApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState<string>('');
  const [instruction, setInstruction] = useState<string>('');
  const [targetWordCount, setTargetWordCount] = useState<string>('');
  const [isBeautified, setIsBeautified] = useState<boolean>(true);
  const [language, setLanguage] = useState<'zh' | 'en'>('en');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [userApiKey, setUserApiKey] = useState<string>(localStorage.getItem('user_api_key') || '');
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [wechatNotification, setWechatNotification] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Splash and Instructions
  useEffect(() => {
    const splash = document.getElementById('splash');
    const timer = setTimeout(() => {
      if (splash) splash.classList.add('splash-hidden');
      setShowInstructions(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // API Key Validation & Storage
  useEffect(() => {
    const validate = async () => {
      if (userApiKey) {
        localStorage.setItem('user_api_key', userApiKey);
        const valid = await validateApiKey(userApiKey);
        setIsKeyValid(valid);
      } else {
        setIsKeyValid(null);
        localStorage.removeItem('user_api_key');
      }
    };
    const timeout = setTimeout(validate, 1000);
    return () => clearTimeout(timeout);
  }, [userApiKey]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setImagePreview(reader.result as string);
      setStatus(AppStatus.ANALYZING);
      
      try {
        const result = await analyzeImage(base64, userApiKey || undefined);
        setRawJson(result);
        setStatus(AppStatus.SUCCESS);
      } catch (err: any) {
        setErrorMsg(err.message || "解析出错，请检查ApiKey或重试。");
        setStatus(AppStatus.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleModify = async () => {
    if (!instruction.trim() && !targetWordCount) return;
    setStatus(AppStatus.MODIFYING);
    try {
      const updated = await modifyResult(rawJson, instruction, userApiKey || undefined, targetWordCount);
      setRawJson(updated);
      setInstruction('');
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      setStatus(AppStatus.ERROR);
    }
  };

  const handleTranslate = async () => {
    const target = language === 'en' ? 'zh' : 'en';
    setStatus(AppStatus.MODIFYING);
    try {
      const translated = await translateJson(rawJson, target, userApiKey || undefined);
      setRawJson(translated);
      setLanguage(target);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      setStatus(AppStatus.ERROR);
    }
  };

  const copyToClipboard = () => {
    try {
      const text = isBeautified ? JSON.stringify(JSON.parse(rawJson), null, 2) : rawJson;
      navigator.clipboard.writeText(text);
      setCopyNotification("复制成功! ✨");
      setTimeout(() => setCopyNotification(null), 2000);
    } catch (e) {
      navigator.clipboard.writeText(rawJson);
      setCopyNotification("复制成功! ✨");
      setTimeout(() => setCopyNotification(null), 2000);
    }
  };

  const copyAndJumpWechat = () => {
    const wechatId = 'XiaoYu_R1999';
    navigator.clipboard.writeText(wechatId);
    setWechatNotification(true);
    
    // Attempt jump
    setTimeout(() => {
      window.location.href = `weixin://`;
      setTimeout(() => setWechatNotification(false), 3000);
    }, 1500);
  };

  const jumpToQQ = () => {
    const qqNumber = '1091535260'; 
    window.location.href = `mqqwpa://im/chat?chat_type=wpa&uin=${qqNumber}&version=1&src_type=web&web_src=oicqzone.com`;
    setTimeout(() => {
       if (document.hasFocus()) {
         window.location.href = `tencent://message/?uin=${qqNumber}&Site=&Menu=yes`;
       }
    }, 500);
  };

  const renderContent = () => {
    switch (status) {
      case AppStatus.IDLE:
        return (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-8 border-dashed border-yellow-400 bg-white p-12 rounded-[40px] flex flex-col items-center justify-center cursor-pointer dopamine-shadow hover:scale-[1.02] transition-transform active:scale-95 group"
          >
            <div className="text-8xl mb-4 group-hover:rotate-12 transition-transform">📸</div>
            <p className="cartoon-font text-3xl text-purple-600 font-bold mb-2">点击上传图片</p>
            <p className="text-gray-400 font-bold italic">AI 自动解析指令已内置，上传即开跑！</p>
          </div>
        );
      case AppStatus.ANALYZING:
      case AppStatus.MODIFYING:
        return <LoadingSpinner />;
      case AppStatus.ERROR:
        return (
          <div className="bg-red-100 border-4 border-red-500 p-8 rounded-3xl dopamine-shadow text-center">
            <div className="text-5xl mb-4">😿</div>
            <p className="text-xl text-red-600 font-bold">{errorMsg || "发生了一些错误"}</p>
            <button 
              onClick={() => setStatus(AppStatus.IDLE)}
              className="mt-6 px-8 py-3 bg-red-500 text-white font-bold rounded-2xl dopamine-btn-shadow"
            >
              返回重试
            </button>
          </div>
        );
      case AppStatus.SUCCESS:
        let displayJson = rawJson;
        try {
          if (isBeautified) displayJson = JSON.stringify(JSON.parse(rawJson), null, 2);
        } catch (e) { displayJson = rawJson; }

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap gap-3 relative">
              <button 
                onClick={copyToClipboard}
                className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-xl border-2 border-black dopamine-btn-shadow hover:bg-yellow-300 transition-colors flex items-center gap-2 relative"
              >
                <span>📋</span> 复制结果
                {copyNotification && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm animate-pop whitespace-nowrap shadow-lg">
                    {copyNotification}
                  </span>
                )}
              </button>
              <button onClick={handleTranslate} className="px-6 py-2 bg-pink-400 text-black font-bold rounded-xl border-2 border-black dopamine-btn-shadow hover:bg-pink-300 transition-colors flex items-center gap-2">
                <span>🌍</span> {language === 'en' ? '翻译成中文' : 'Translate to English'}
              </button>
              <button onClick={() => setIsBeautified(!isBeautified)} className={`px-6 py-2 ${isBeautified ? 'bg-purple-500 text-white' : 'bg-white text-black'} font-bold rounded-xl border-2 border-black dopamine-btn-shadow transition-colors flex items-center gap-2`}>
                <span>✨</span> {isBeautified ? '已美化' : '美化 JSON'}
              </button>
              <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-2 bg-cyan-400 text-black font-bold rounded-xl border-2 border-black dopamine-btn-shadow hover:bg-cyan-300 transition-colors flex items-center gap-2">
                <span>🔄</span> 重新上传
              </button>
            </div>

            <div className="bg-gray-900 text-green-400 p-6 rounded-[32px] border-4 border-black dopamine-shadow overflow-x-auto max-h-[500px] relative font-mono text-sm leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap">{displayJson}</pre>
            </div>

            <div className="bg-white p-6 rounded-[32px] border-4 border-black dopamine-shadow space-y-4">
              <p className="cartoon-font text-xl text-blue-600 font-bold flex items-center gap-2">
                <span>💡</span> 输入想法优化结果 (仅保留 JSON)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <input 
                    type="text"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="例如：删除所有 lighting 字段..."
                    className="w-full px-4 py-3 rounded-2xl border-2 border-black focus:outline-none focus:ring-4 focus:ring-blue-200 font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-1 rounded-2xl border-2 border-black">
                  <span className="text-xs font-black whitespace-nowrap">目标字数:</span>
                  <input 
                    type="number"
                    value={targetWordCount}
                    onChange={(e) => setTargetWordCount(e.target.value)}
                    placeholder="针对即梦AI限制"
                    className="w-full bg-transparent focus:outline-none text-blue-600 font-bold text-center"
                  />
                </div>
                <button onClick={handleModify} className="px-8 py-3 bg-blue-500 text-white font-bold rounded-2xl border-2 border-black dopamine-btn-shadow hover:bg-blue-600 transition-colors">
                  执行优化
                </button>
              </div>
              <p className="text-xs text-gray-400 italic">提示：输入目标字数可帮助您在即梦AI等平台直接粘贴使用。</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DopamineLayout>
      {/* Header with Settings Access */}
      <header className="mb-12 text-center relative">
        <div className="absolute -top-4 -right-4 md:right-0">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-14 h-14 bg-white border-4 border-black rounded-full dopamine-btn-shadow flex items-center justify-center text-3xl hover:rotate-90 transition-transform"
          >
            ⚙️
          </button>
        </div>

        <div className="inline-block px-10 py-6 bg-yellow-400 border-4 border-black rounded-[40px] dopamine-shadow floating">
          <h1 className="cartoon-font text-4xl md:text-5xl text-black font-black flex flex-col md:flex-row items-center gap-4">
            <span>🔥</span> 
            <span>超强图片反推助手 V1.3</span>
            <span>🔥</span>
          </h1>
        </div>
        <p className="mt-4 text-black font-black cartoon-font tracking-widest bg-white inline-block px-4 rounded-full border-2 border-black">全球分享版 • 内置免费Key</p>
      </header>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl border-8 border-purple-500 rounded-[50px] dopamine-shadow p-8 space-y-6 animate-pop max-h-[90vh] overflow-y-auto">
            <h2 className="cartoon-font text-4xl font-black text-center gradient-text">使用说明书 📖</h2>
            <div className="space-y-3 font-bold text-gray-700">
              <div className="flex items-start gap-4 p-4 bg-yellow-100 rounded-3xl border-2 border-black">
                <span className="text-3xl">1️⃣</span>
                <p>本网站采用1:1高度还原原图机制解析您的图片内容，确保细节无遗漏。</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-blue-100 rounded-3xl border-2 border-black">
                <span className="text-3xl">2️⃣</span>
                <p>本网站经过层层测试发布上线，稳定高效，适配多种图片格式。</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-pink-100 rounded-3xl border-2 border-black">
                <span className="text-3xl">3️⃣</span>
                <p>您可以任意修改解析后结果的主题内容，支持输入字数限制以适配即梦AI等平台。</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-green-100 rounded-3xl border-2 border-black">
                <span className="text-3xl">4️⃣</span>
                <p>如您有什么好的想法和意见，请通过底部按钮联系我。</p>
              </div>
            </div>
            <button 
              onClick={() => setShowInstructions(false)}
              className="w-full py-4 bg-purple-500 text-white font-black text-2xl rounded-full border-4 border-black dopamine-btn-shadow hover:bg-purple-600"
            >
              我知道了，开始使用！🚀
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md border-8 border-black rounded-[40px] dopamine-shadow p-8 space-y-6 animate-pop">
            <div className="flex justify-between items-center">
              <h2 className="cartoon-font text-3xl font-black">系统设置 ⚙️</h2>
              <button onClick={() => setShowSettings(false)} className="text-3xl">❌</button>
            </div>
            <div className="space-y-4">
              <label className="block font-black text-lg">Gemini ApiKey 设置</label>
              <div className="relative">
                <input 
                  type="password"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder="留空则使用系统内置免费Key"
                  className="w-full px-4 py-3 border-4 border-black rounded-2xl focus:outline-none"
                />
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isKeyValid === true ? 'bg-green-500' : isKeyValid === false ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs font-bold text-gray-500">
                    {isKeyValid === true ? '自定义 Key 校验通过' : isKeyValid === false ? 'Key 校验失败' : '正在使用内置免费资源'}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <p className="text-sm text-blue-700 font-bold">💡 提示：本站已内置免费 API Key 供全球用户分享使用。若您有更高频率需求，可在此填入私有 Key。</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-black text-white font-black rounded-2xl dopamine-btn-shadow"
            >
              保存并返回
            </button>
          </div>
        </div>
      )}

      {/* WeChat Success Popup */}
      {wechatNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-[120] pointer-events-none">
          <div className="bg-white border-8 border-green-500 p-8 rounded-[40px] dopamine-shadow animate-pop pointer-events-auto shadow-2xl">
             <h2 className="cartoon-font text-3xl font-black gradient-text text-center">
                微信号已复制在您的粘贴板了！🌈
             </h2>
             <p className="text-center mt-4 font-black text-green-600 text-xl animate-bounce">正在跳转微信...</p>
          </div>
        </div>
      )}

      <main className="w-full">
        {imagePreview && (
          <div className="mb-8 flex justify-center">
            <div className="relative group">
               <img src={imagePreview} alt="Preview" className="max-h-72 rounded-[40px] border-8 border-black dopamine-shadow group-hover:scale-105 transition-transform duration-300"/>
               <div className="absolute -top-6 -right-6 w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center border-4 border-black text-3xl animate-bounce">🔥</div>
            </div>
          </div>
        )}
        
        {renderContent()}
      </main>

      <footer className="mt-20 flex flex-col md:flex-row items-center justify-center gap-8 pb-12">
        <button onClick={jumpToQQ} className="px-12 py-5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black text-2xl rounded-full border-4 border-black dopamine-btn-shadow hover:scale-110 transition-transform flex items-center gap-4">
          <span>🐧</span> QQ 一键跳转
        </button>
        <button onClick={copyAndJumpWechat} className="px-12 py-5 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-2xl rounded-full border-4 border-black dopamine-btn-shadow hover:scale-110 transition-transform flex items-center gap-4">
          <span>💬</span> 微信自动跳转
        </button>
      </footer>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </DopamineLayout>
  );
};

export default App;
