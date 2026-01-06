
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
  const [targetWordCount, setTargetWordCount] = useState<string>('200');
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

  // 初始化启动效果
  useEffect(() => {
    const splash = document.getElementById('splash');
    const timer = setTimeout(() => {
      if (splash) splash.classList.add('splash-hidden');
      setShowInstructions(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // API Key 自动校验逻辑
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
        setErrorMsg(err.message || "解析出错，请检查ApiKey或网络。");
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

  return (
    <DopamineLayout>
      <header className="mb-12 text-center relative">
        {/* 右上角设置按钮 */}
        <div className="absolute -top-4 -right-4 md:right-0">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-16 h-16 bg-white border-4 border-black rounded-[24px] dopamine-btn-shadow flex items-center justify-center text-4xl hover:rotate-90 transition-all active:scale-90"
          >
            ⚙️
          </button>
        </div>

        {/* 模式标识标签 */}
        <div className="flex justify-center mb-6">
          <div className={`px-6 py-2 rounded-full border-4 border-black font-black text-sm flex items-center gap-2 ${isKeyValid ? 'bg-green-400' : 'bg-yellow-400'} dopamine-shadow animate-pulse`}>
            <span className="text-lg">{isKeyValid ? '🟢' : '🟡'}</span>
            {isKeyValid ? 'AI 接入模式 (Professional)' : '演练模式 (Demo Mode)'}
          </div>
        </div>

        <div className="inline-block px-10 py-6 bg-yellow-400 border-4 border-black rounded-[40px] dopamine-shadow floating">
          <h1 className="cartoon-font text-4xl md:text-6xl text-black font-black flex flex-col md:flex-row items-center gap-4">
            <span>🎨</span> 
            <span>超强图片反推 V1.3</span>
            <span>🎨</span>
          </h1>
        </div>
      </header>

      {/* 使用说明弹窗 */}
      {showInstructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl border-8 border-purple-500 rounded-[50px] dopamine-shadow p-10 space-y-6 animate-pop max-h-[90vh] overflow-y-auto">
            <h2 className="cartoon-font text-5xl font-black text-center gradient-text">全新特性发布 📢</h2>
            <div className="space-y-4 font-bold text-gray-700 text-lg">
              <div className="flex items-start gap-5 p-5 bg-yellow-100 rounded-3xl border-4 border-black">
                <span className="text-4xl">💎</span>
                <p>1️⃣ 本网站采用1:1高度还原原图机制，深度解析您的图片每一个色彩分量。</p>
              </div>
              <div className="flex items-start gap-5 p-5 bg-blue-100 rounded-3xl border-4 border-black">
                <span className="text-4xl">🧪</span>
                <p>2️⃣ 本网站经过多轮内测，适配即梦 AI、Midjourney、Stable Diffusion 全系列模型。</p>
              </div>
              <div className="flex items-start gap-5 p-5 bg-pink-100 rounded-3xl border-4 border-black">
                <span className="text-4xl">🖋️</span>
                <p>3️⃣ 支持任意修改解析结果主题，并针对即梦 AI 提供了专门的字数重写算法。</p>
              </div>
              <div className="flex items-start gap-5 p-5 bg-green-100 rounded-3xl border-4 border-black">
                <span className="text-4xl">💌</span>
                <p>4️⃣ 如你有什么好的想法和意见，请务必通过下方的联系方式反馈给我。</p>
              </div>
            </div>
            <button 
              onClick={() => setShowInstructions(false)}
              className="w-full py-5 bg-purple-500 text-white font-black text-3xl rounded-3xl border-4 border-black dopamine-btn-shadow hover:bg-purple-600"
            >
              准备好起飞了！🚀
            </button>
          </div>
        </div>
      )}

      {/* 设置弹窗 (包含详细模型接入指南) */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl border-8 border-black rounded-[50px] dopamine-shadow p-10 space-y-8 animate-pop max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="cartoon-font text-4xl font-black">API 接入中心 🛠️</h2>
              <button onClick={() => setShowSettings(false)} className="text-5xl hover:scale-125 transition-transform">❌</button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-8 rounded-[32px] border-4 border-black">
                <label className="block font-black text-2xl mb-4 text-blue-900">核心密钥配置 (ApiKey)</label>
                <input 
                  type="password"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder="留空即默认进入【演练模式】"
                  className="w-full px-6 py-4 border-4 border-black rounded-2xl focus:outline-none font-bold shadow-inner text-xl"
                />
                <div className="mt-4 flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full shadow-lg ${isKeyValid === true ? 'bg-green-500 animate-pulse' : isKeyValid === false ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  <span className="text-md font-black text-blue-800">
                    {isKeyValid === true ? '已激活：专业接入模式' : isKeyValid === false ? '错误：密钥校验失败' : '当前：正在使用公共免费线路'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="cartoon-font text-2xl font-black text-purple-600">可选免费大模型 API 获取指引 🌍</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Google Gemini */}
                  <div className="p-6 bg-white border-4 border-purple-200 rounded-[28px] hover:border-purple-500 transition-colors">
                    <h4 className="font-black text-lg mb-2">💎 Gemini (推荐)</h4>
                    <p className="text-xs text-gray-500 mb-4 font-bold">每日免费1500次请求，最强视觉解析力。</p>
                    <div className="flex gap-2">
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="px-4 py-2 bg-purple-500 text-white text-xs font-black rounded-full border-2 border-black">获取 Key</a>
                      <a href="https://ai.google.dev/gemini-api/docs" target="_blank" className="px-4 py-2 bg-gray-100 text-black text-xs font-black rounded-full border-2 border-black">文档</a>
                    </div>
                  </div>
                  {/* DeepSeek */}
                  <div className="p-6 bg-white border-4 border-emerald-200 rounded-[28px] hover:border-emerald-500 transition-colors">
                    <h4 className="font-black text-lg mb-2">🐳 DeepSeek</h4>
                    <p className="text-xs text-gray-500 mb-4 font-bold">国产之光，超高性价比，注册即送免费额度。</p>
                    <div className="flex gap-2">
                      <a href="https://platform.deepseek.com/" target="_blank" className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-full border-2 border-black">立即申请</a>
                      <a href="https://platform.deepseek.com/api-docs/" target="_blank" className="px-4 py-2 bg-gray-100 text-black text-xs font-black rounded-full border-2 border-black">说明</a>
                    </div>
                  </div>
                  {/* Zhipu GLM */}
                  <div className="p-6 bg-white border-4 border-blue-200 rounded-[28px] hover:border-blue-500 transition-colors">
                    <h4 className="font-black text-lg mb-2">🧠 智谱 AI (GLM-4)</h4>
                    <p className="text-xs text-gray-500 mb-4 font-bold">清华系大模型，中文理解能力极强。</p>
                    <div className="flex gap-2">
                      <a href="https://open.bigmodel.cn/usercenter/apikeys" target="_blank" className="px-4 py-2 bg-blue-500 text-white text-xs font-black rounded-full border-2 border-black">进入后台</a>
                      <a href="https://open.bigmodel.cn/dev/api" target="_blank" className="px-4 py-2 bg-gray-100 text-black text-xs font-black rounded-full border-2 border-black">接口指南</a>
                    </div>
                  </div>
                  {/* Qwen */}
                  <div className="p-6 bg-white border-4 border-orange-200 rounded-[28px] hover:border-orange-500 transition-colors">
                    <h4 className="font-black text-lg mb-2">☁️ 通义千问 (Qwen)</h4>
                    <p className="text-xs text-gray-500 mb-4 font-bold">阿里大模型，适配多种中文创意场景。</p>
                    <div className="flex gap-2">
                      <a href="https://bailian.console.aliyun.com/" target="_blank" className="px-4 py-2 bg-orange-500 text-white text-xs font-black rounded-full border-2 border-black">去阿里云</a>
                      <a href="https://help.aliyun.com/zh/dashscope/" target="_blank" className="px-4 py-2 bg-gray-100 text-black text-xs font-black rounded-full border-2 border-black">开发文档</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-5 bg-black text-white font-black text-2xl rounded-3xl dopamine-btn-shadow"
            >
              保存我的配置 💾
            </button>
          </div>
        </div>
      )}

      {/* 微信跳转提示 */}
      {wechatNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-[120] pointer-events-none">
          <div className="bg-white border-8 border-green-500 p-8 rounded-[40px] dopamine-shadow animate-pop pointer-events-auto">
             <h2 className="cartoon-font text-3xl font-black gradient-text text-center">微信号已成功复制！🌈</h2>
             <p className="text-center mt-6 font-black text-green-600 text-2xl animate-bounce">正在跳转至微信...</p>
          </div>
        </div>
      )}

      <main className="w-full">
        {status === AppStatus.IDLE ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-8 border-dashed border-yellow-400 bg-white p-20 rounded-[60px] flex flex-col items-center justify-center cursor-pointer dopamine-shadow hover:scale-105 transition-all group"
          >
            <div className="text-[140px] mb-8 group-hover:rotate-12 transition-transform drop-shadow-2xl">📸</div>
            <p className="cartoon-font text-5xl text-purple-600 font-bold mb-4">开始反推图片</p>
            <p className="text-gray-400 font-black italic text-xl">1:1 原图还原机制已就绪</p>
          </div>
        ) : (
          <div className="space-y-10">
            {imagePreview && (
              <div className="flex justify-center">
                <div className="relative group">
                   <img src={imagePreview} alt="Preview" className="max-h-96 rounded-[60px] border-[10px] border-black dopamine-shadow"/>
                   <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center border-4 border-black text-5xl animate-bounce">🌟</div>
                </div>
              </div>
            )}
            
            {status === AppStatus.ANALYZING || status === AppStatus.MODIFYING ? <LoadingSpinner /> : (
              status === AppStatus.SUCCESS ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button onClick={copyToClipboard} className="px-10 py-4 bg-yellow-400 text-black font-black rounded-3xl border-4 border-black dopamine-btn-shadow flex items-center gap-2 relative text-xl">
                      <span>📋</span> 复制 JSON
                      {copyNotification && <span className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full text-sm animate-pop shadow-2xl">{copyNotification}</span>}
                    </button>
                    <button onClick={handleTranslate} className="px-10 py-4 bg-pink-400 text-black font-black rounded-3xl border-4 border-black dopamine-btn-shadow flex items-center gap-2 text-xl">
                      <span>🌍</span> {language === 'en' ? '翻译结果' : 'Translate'}
                    </button>
                    <button onClick={() => setIsBeautified(!isBeautified)} className={`px-10 py-4 ${isBeautified ? 'bg-purple-500 text-white' : 'bg-white text-black'} font-black rounded-3xl border-4 border-black dopamine-btn-shadow text-xl`}>
                      <span>✨</span> JSON 排版
                    </button>
                    <button onClick={() => setStatus(AppStatus.IDLE)} className="px-10 py-4 bg-cyan-400 text-black font-black rounded-3xl border-4 border-black dopamine-btn-shadow text-xl">
                      <span>🔄</span> 换张图片
                    </button>
                  </div>

                  <div className="bg-gray-900 text-green-400 p-10 rounded-[50px] border-[10px] border-black dopamine-shadow overflow-x-auto max-h-[600px] font-mono text-base leading-relaxed">
                    <pre className="whitespace-pre-wrap">{isBeautified ? JSON.stringify(JSON.parse(rawJson), null, 2) : rawJson}</pre>
                  </div>

                  {/* 字数控制与想法输入面板 */}
                  <div className="bg-white p-10 rounded-[50px] border-[10px] border-black dopamine-shadow space-y-6">
                    <p className="cartoon-font text-3xl text-blue-600 font-bold flex items-center gap-4">
                      <span>🎯</span> 创意重写 (适配即梦 AI 限制)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-7">
                        <textarea 
                          value={instruction}
                          onChange={(e) => setInstruction(e.target.value)}
                          placeholder="输入你的修改想法，例如：改为二次元风格，背景要更有科技感..."
                          className="w-full px-6 py-5 rounded-3xl border-4 border-black font-black focus:ring-8 focus:ring-blue-100 h-32 resize-none text-lg"
                        />
                      </div>
                      <div className="md:col-span-5 space-y-4">
                        <div className="flex flex-col gap-2 bg-gray-50 p-6 rounded-3xl border-4 border-black">
                          <span className="text-lg font-black text-gray-600">目标输出字数:</span>
                          <div className="flex items-center gap-4">
                            <input 
                              type="range" 
                              min="50" 
                              max="1000" 
                              step="50"
                              value={targetWordCount}
                              onChange={(e) => setTargetWordCount(e.target.value)}
                              className="flex-1 accent-blue-500 h-4"
                            />
                            <span className="bg-blue-500 text-white px-4 py-2 rounded-xl font-black min-w-[80px] text-center border-2 border-black">{targetWordCount} 字</span>
                          </div>
                        </div>
                        <button onClick={handleModify} className="w-full py-6 bg-blue-500 text-white font-black text-2xl rounded-3xl border-4 border-black dopamine-btn-shadow hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                          <span>🚀</span> 执行重写指令
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-100 border-[10px] border-red-500 p-12 rounded-[60px] dopamine-shadow text-center">
                  <div className="text-[100px] mb-6">🙀</div>
                  <p className="text-3xl text-red-600 font-black mb-8">{errorMsg || "哎呀，解析引擎熄火了..."}</p>
                  <button onClick={() => setStatus(AppStatus.IDLE)} className="px-14 py-6 bg-red-500 text-white font-black text-2xl rounded-3xl border-4 border-black dopamine-btn-shadow">点我复活</button>
                </div>
              )
            )}
          </div>
        )}
      </main>

      <footer className="mt-32 flex flex-col md:flex-row items-center justify-center gap-12 pb-24">
        <button onClick={jumpToQQ} className="px-16 py-8 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black text-3xl rounded-full border-4 border-black dopamine-btn-shadow hover:scale-110 transition-transform flex items-center gap-5">
          <span>🐧</span> QQ 交流
        </button>
        <button onClick={copyAndJumpWechat} className="px-16 py-8 bg-gradient-to-br from-green-400 to-emerald-600 text-white font-black text-3xl rounded-full border-4 border-black dopamine-btn-shadow hover:scale-110 transition-transform flex items-center gap-5">
          <span>💬</span> 微信咨询
        </button>
      </footer>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </DopamineLayout>
  );
};

export default App;
