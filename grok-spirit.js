(function () {

    const CSS = `


        /* Floating Input/Button general styles */
        .gs-floating-input {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid var(--border-l1, rgba(0,0,0,0.1));
            background: var(--surface-l2, #f5f5f5);
            color: var(--fg-primary, #000);
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            outline: none;
            transition: all 0.2s;
            margin-top: 2px;
            margin-bottom: 2px;
        }

        .gs-floating-input:focus {
            border-color: #8247e5;
            background: var(--surface-l3, #eeeeee);
            box-shadow: 0 0 8px rgba(130, 71, 229, 0.2);
        }

        .gs-ui-divider {
            width: 28px;
            height: 1.5px;
            background: var(--border-l1, rgba(0,0,0,0.4));
            margin: 7px auto;
            opacity: 1;
            border-radius: 1px;
        }

        @media (prefers-color-scheme: dark) {
            .gs-ui-divider {
                background: rgba(255,255,255,0.45);
            }
        }

        /* Folder Popup Styles */
        .gs-folder-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.1);
            backdrop-filter: blur(2px);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .gs-folder-popup-overlay.gs-visible {
            display: block;
            opacity: 1;
        }

        .gs-folder-popup-panel {
            position: absolute;
            background: var(--bg-surface-l1, #ffffff);
            border: 1px solid var(--border-l1, rgba(0,0,0,0.1));
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            z-index: 10001;
            transform: scale(0.9) translateX(10px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            width: 260px;
        }
        .gs-folder-popup-panel.gs-visible {
            transform: scale(1) translateX(0);
            opacity: 1;
            pointer-events: auto;
        }

        .gs-popup-row {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .gs-popup-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--fg-secondary, #666);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-left: 4px;
        }

        .gs-folder-popup-input {
            padding: 10px 12px;
            border: 1px solid var(--border-l1, #ced4da);
            border-radius: 10px;
            font-size: 13px;
            outline: none;
            background: var(--bg-surface-l2, #f9f9f9);
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        .gs-folder-popup-input:focus {
            border-color: #8247e5;
        }

        .gs-folder-popup-confirm {
            background: #8247e5;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 10px;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
        }
        .gs-folder-popup-confirm:hover {
            background: #6f32cf;
        }
        .gs-folder-popup-confirm:active {
            transform: scale(0.98);
        }

        @media (prefers-color-scheme: dark) {
            .gs-floating-input {
                background: #3c3c3c;
                color: #f1f1f1;
                border-color: #444;
            }
            .gs-floating-input:focus {
                background: #444;
            }
            .gs-folder-popup-panel {
                background: #252525;
                border-color: #333;
                color: #f1f1f1;
            }
            .gs-folder-popup-input {
                background: #1a1a1a;
                border-color: #333;
                color: #fff;
            }
            .gs-popup-label {
                color: #aaa;
            }
        }

        /* Status Animations */
        @keyframes gs-spin-3d {
            0% { transform: perspective(400px) rotateY(0deg); }
            100% { transform: perspective(400px) rotateY(360deg); }
        }

        /* Status Themes (Base Colors) */
        .gs-floating-download-btn.gs-theme-regular {
            background: rgba(130, 71, 229, 0.1) !important;
            color: #8247e5 !important;
        }
        .gs-floating-download-btn.gs-theme-hd {
            background: rgba(245, 158, 11, 0.1) !important;
            color: #f59e0b !important;
        }

        .gs-floating-download-btn.gs-status-processing .gs-icon-container, 
        .gs-floating-download-btn.gs-status-generating-hd .gs-icon-container {
            animation: gs-spin-3d 2.5s infinite ease-in-out;
            transform-style: preserve-3d;
        }

    `;
    document.head.insertAdjacentHTML('beforeend', '<style id="gs-inline-style">' + CSS + '</style>');

    const statusText = {
        'processing': 'Processing new video...',
        'failed': 'Processing failed',
        'completed': 'Processing completed',
        'generating_hd': 'HD video generating...'
    };
    const statusClass = {
        'processing': 'gs-status-processing',
        'failed': 'gs-status-failed',
        'completed': 'gs-status-completed',
        'generating_hd': 'gs-status-generating-hd'
    };

    let state = {
        active: false,
        currentUrl: window.location.href,
        currentDataKey: '',
        currentData: null,
        //
        floatingSpicyBtn: null,
        floatingDownloadBtn: null,
        floatingSettingsBtn: null,
        floatingFolderPopup: null,
        floatingDivider: null
    }

    // #region 初始化全局侦听和处理
    window.addEventListener('message', async (event) => {
        if (event.source !== window || event.data?.source !== 'grok-spirit-fetch') return;
        //
        //根据refer来获取要保存到哪个数据
        const msg = event.data;
        let { key, data } = await getKeyAndDataByReferer(msg.referer);
        if (!data) return;

        try {
            if (msg.type === 'status') {
                if (msg.status === 'processing') {
                    console.log(`[GrokSpirit] processing start`);
                    data.hookSessionActive = true;
                    await handleVideoProcessing('processing', key, data, msg.referer);
                } else if (msg.status === 'completed') {
                    console.log(`[GrokSpirit] processing completed with data`, msg.data);
                    data.hookSessionActive = false;
                    await handleVideoDetected(msg.data, key, data, msg.referer);
                } else if (msg.status === 'failed') {
                    console.log(`[GrokSpirit] processing failed`);
                    data.hookSessionActive = false;
                    await handleVideoProcessing('failed', key, data, msg.referer);
                }
                return;
            }
        } catch (e) {
            // ignore
            //console.log(e);
        }
    });
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.source === 'grok-spirit-generate-hd') {
            let referer = request.referer;
            let { key, data } = await getKeyAndDataByReferer(referer.key);
            if (data) {
                if (!request.status) handleVideoProcessing('generating_hd', key, data);
                else handleVideoProcessing('completed', key, data);
            }
        }
    });
    // Handle video processing status
    async function getKeyAndDataByReferer(referer) {
        let key;
        let data;
        if (state.currentDataKey === referer) {
            key = state.currentDataKey;
            data = state.currentData;
        } else {
            key = referer
            data = await window.GrokSpiritUtils.readStorage(key);
            console.log(key, data);
        }
        return { key, data };
    }
    async function handleVideoProcessing(status, key, data) {
        console.log(`[GrokSpirit] handleVideoProcessing called with status:`, status, 'key:', key);

        data.processingStatus = status;
        data.isProcessing = status !== 'failed' && status !== 'completed';
        await saveData(key, data);
        if (data.id === state.currentData?.id) updateGSUI();
    }
    async function handleVideoDetected(videoInfo, key, data) {
        console.log(`[GrokSpirit] handleVideoDetected called with videoInfo:`, videoInfo, 'key:', key);

        // Extract original prompt from the response
        const originalPrompt = extractOriginalPrompt(videoInfo);
        videoInfo.originalPrompt = originalPrompt;

        //console.log(`[${formatTime()}] Caching video data with key:`, urlKey, 'from URL:', cacheUrl);
        //console.log(`[${formatTime()}] Current URL at detection time:`, currentUrl);
        //console.log(`[${formatTime()}] ProcessingVideoData:`, processingVideoData);

        // Ensure originalPrompt is a string before stringifying
        const videoInfoForStorage = { ...videoInfo };
        if (videoInfoForStorage.originalPrompt && typeof videoInfoForStorage.originalPrompt === 'object') {
            videoInfoForStorage.originalPrompt = JSON.stringify(videoInfoForStorage.originalPrompt);
            console.log(`[GrokSpirit] Converted originalPrompt object to string for storage`);
        }

        data.cachedVideoData = videoInfo;

        // Update processing status
        data.processingStatus = 'completed';
        data.isProcessing = false; // Processing completed, reset state
        await saveData(key, data);
        if (data.id === state.currentData?.id) updateGSUI();
    }
    function extractOriginalPrompt(videoInfo) {
        // Original prompt is now directly passed from background script
        if (videoInfo.hasOwnProperty('originalPrompt')) {
            const originalPromptRaw = videoInfo.originalPrompt;

            // Parse original (may be JSON string or plain text)
            const parsedOriginal = typeof originalPromptRaw === 'object' && originalPromptRaw !== null
                ? originalPromptRaw
                : window.GrokSpiritUtils.safeParseJsonString(originalPromptRaw);

            // Parse generated prompt from progress 100 response
            // Prefer new field generated_prompt; fallback to legacy videoPrompt
            const parsedGenerated = window.GrokSpiritUtils.safeParseJsonString(videoInfo.generated_prompt || videoInfo.videoPrompt);

            const hasStructuredData = !!(parsedOriginal && typeof parsedOriginal === 'object' &&
                (parsedOriginal.shot || parsedOriginal.scene || parsedOriginal.cinematography || parsedOriginal.visual_details));

            if (hasStructuredData) {
                // Case 1 & 2: Structured prompt injection
                try {
                    const finalPrompt = parsedGenerated;
                    if (!finalPrompt || typeof finalPrompt !== 'object') {
                        return parsedOriginal;
                    }

                    // Deep comparison of objects (ignoring formatting differences)
                    const isConsistent = deepEqual(parsedOriginal, finalPrompt);

                    if (isConsistent) {
                        console.log(`[GrokSpirit] cachedVideoData.videoPrompt: Injection completely consistent`);
                        return "Injection completely consistent";
                    } else {
                        // Case 2: Partial injection - show original prompt
                        return parsedOriginal;
                    }
                } catch (e) {
                    // If parsing fails, fall back to showing original prompt
                    return parsedOriginal || originalPromptRaw;
                }
            } else {
                // Case 3: Plain text prompt - show extracted original prompt
                return originalPromptRaw;
            }
        }

        return null;
    }
    // Deep equality comparison for objects
    function deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;

        if (obj1 == null || obj2 == null) return obj1 === obj2;

        if (typeof obj1 !== typeof obj2) return false;

        if (typeof obj1 !== 'object') return obj1 === obj2;

        if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

        if (Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) {
                if (!deepEqual(obj1[i], obj2[i])) return false;
            }
            return true;
        }

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        for (let key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!deepEqual(obj1[key], obj2[key])) return false;
        }

        return true;
    }
    //
    chrome.runtime.sendMessage({ action: 'grok-spirit-fetch' });
    // #endregion 

    function canRun(url) {
        return url.includes('/imagine/post/')
    }
    async function start(url) {
        if (!state.active) {
            state.active = true;
            console.log('[GrokSpirit] start on', url);

            state.currentUrl = url;
            initGSUI();
            await mountGSUI();
            await setData();

        } else if (state.currentUrl !== url) {
            // 如果上一次的页面和新的页面都在 /imagine/post/ 格式内，则判定为没有离开当前生成上下文，不复位。
            if (state.currentUrl.includes('/imagine/post/') && url.includes('/imagine/post/')) {
                console.log('[GrokSpirit] Ignoring internal URL change within the same post interface:', url);
                state.currentUrl = url;
            } else {
                console.log('[GrokSpirit] changed url', url);
                state.currentUrl = url;

                // 切换页面时，需要清空过去的 key 强制抓取新页面的图片/UUID
                if (state.currentDataKey) {
                    if (state.currentData?.cachedVideoData?.videoUrl) {
                        await saveData();
                    }
                    state.currentDataKey = state.currentData = null;
                }

                await setData();
            }
        }

        //修复数据魔法
        // chrome.storage.local.get(null, async (items) => {
        //     for (let key in items) {
        //         if (key.startsWith(`grok_video_`)) {
        //             let data = items[key];
        //         }
        //     }
        //     console.log('done');
        // });

        return () => stop();
    }
    async function stop() {
        if (!state.active) return;
        state.active = false;
        console.log('[GrokSpirit] stop');

        state.currentUrl = null;
        if (state.floatingSpicyBtn) {
            state.floatingSpicyBtn.remove();
            state.floatingSpicyBtn = null;
        }
        if (state.floatingDownloadBtn) {
            state.floatingDownloadBtn.remove();
            state.floatingDownloadBtn = null;
        }
        if (state.floatingDivider) {
            state.floatingDivider.remove();
            state.floatingDivider = null;
        }
        if (state.floatingSettingsBtn) {
            state.floatingSettingsBtn.remove();
            state.floatingSettingsBtn = null;
        }
        if (state.floatingFolderPopup) {
            state.floatingFolderPopup.overlay.remove();
            state.floatingFolderPopup.panel.remove();
            state.floatingFolderPopup = null;
        }

        if (state.currentDataKey) {
            if (state.currentData?.cachedVideoData?.videoUrl) await saveData();
            state.currentDataKey = state.currentData = null;
        }
    }

    window.GrokSpirit = { canRun, start, stop }

    // Find UI
    function findOperationContainer() {
        // Select the container that wraps all operation controls
        // This is the first child of max-w-[750px] mx-auto
        return document.querySelector('.query-bar');
    }
    function findPromptLayer() {
        return findOperationContainer()?.querySelector('.flex.justify-end.relative.w-full')
    }
    function findPromptInput() {
        return findPromptLayer()?.querySelector('textarea[aria-required="true"]')
    }
    function findSidebarButtons() {
        const targetBtn = document.querySelector('button[aria-label="Unsave"]') || document.querySelector('button[aria-label="Save"]');
        return targetBtn?.parentElement;
    }
    function findVideo() {
        return document.querySelector('video[id="sd-video"]')
    }

    // Data
    async function setData() {
        let urlKey;

        // 【思路转换】：如果当前状态里已经存有 urlKey，
        // 我们不需要每次因为页面重渲染或微小变化重新去抓取图片 (图片在生成阶段不一定有)
        // 只有当我们是首次进入或者切换到了全新的帖子页面时，再去寻找。
        if (state.currentDataKey) {
            urlKey = state.currentDataKey;
        } else {
            try {
                // 尝试通过页面元素获取UUID: img[col-start-1 row-start-1 w-full h-full object-cover invisible pointer-events-none]
                const img = document.querySelector('img.col-start-1.row-start-1.w-full.h-full.object-cover');
                const src = img ? img.getAttribute('src') : null;
                if (src) {
                    const uuid = window.GrokSpiritUtils.extractLastUUId(src);
                    if (uuid) {
                        urlKey = `grok_video_${uuid}`;
                    }
                }
            } catch (e) {
                console.error('[GrokSpirit] Error waiting for image:', e);
            }
        }

        if (!urlKey) {
            throw new Error('Failed to extract UUID from URL');
        }

        //如果要切换key
        if (state.currentDataKey && state.currentDataKey !== urlKey) {
            if (state.currentData?.cachedVideoData?.videoUrl) await window.GrokSpiritUtils.writeStorage(state.currentDataKey, state.currentData);
            state.currentDataKey = state.currentData = null;
        }

        state.currentDataKey = urlKey;

        let cached = await window.GrokSpiritUtils.readStorage(urlKey);
        if (cached) {
            // Ensure originalPrompt is properly handled when loading from cache
            if (cached.cachedVideoData?.originalPrompt && typeof cached.cachedVideoData?.originalPrompt === 'string') {
                try {
                    // Try to parse as JSON, if it fails, keep as string
                    const parsed = JSON.parse(cached.cachedVideoData.originalPrompt);
                    if (typeof parsed === 'object' && parsed !== null) {
                        cached.cachedVideoData.originalPrompt = parsed;
                        // console.log(`[GrokSpirit] Converted originalPrompt string back to object when loading from cache`);
                    }
                } catch (e) {
                    // Keep as string if parsing fails
                    // console.log(`[GrokSpirit] originalPrompt is plain text, keeping as string`);
                }
            }

            state.currentData = cached;
            console.log(`[GrokSpirit] Loaded cached data for URL:`, state.currentUrl, state.currentData);
        }
        if (!state.currentData) {
            state.currentData = generateEmptyVideoData(state.currentDataKey);
            console.log(`[GrokSpirit] Create a default data for URL:`, state.currentUrl, state.currentData);
        }
        //当每次进入时，都填充一次最新的数据
        {
            let input = findPromptInput();
            if (input) state.currentData.cachedVideoData.videoPrompt = input.value || input.textContent || '';
            //设置默认的视频地址
            let video = findVideo();//sd-video
            if (video) {
                state.currentData.cachedVideoData.videoUrl = video.getAttribute('src') || ''
                if (state.currentData.cachedVideoData.videoUrl) {
                    //"https://assets.grok.com/users/[uuid]/generated/[uuid]/generated_video.mp4?cache=1"
                    state.currentData.cachedVideoData.videoId = window.GrokSpiritUtils.extractLastUUId(state.currentData.cachedVideoData.videoUrl);
                }
            }
        }
        //设置文件夹
        // {
        //     let folderName = window.FavoritesManager?.queryByUrlId?.(state.currentData.id)?.folderName;
        //     if (folderName) {
        //         if (!state.currentData.folderName) state.currentData.folderName = `${folderName}/${state.currentData.id}`;
        //         else if (!state.currentData.folderName.startsWith(folderName)) {
        //             let arr = state.currentData.folderName.split('/');
        //             if (arr.length <= 1) {
        //                 arr.unshift(folderName);
        //             } else if (arr.length === 2) {
        //                 if (arr[arr.length - 1] === '000') {
        //                     arr.unshift(folderName);
        //                 } else {
        //                     arr[0] = folderName;
        //                 }
        //             } else if (arr.length >= 3) {
        //                 arr[0] = folderName;
        //             }
        //             state.currentData.folderName = arr.join('/');
        //         }
        //     }
        // }
        //
        updateGSUI();
    }
    function generateEmptyVideoData(urlKey) {
        let urlId = window.GrokSpiritUtils.extractLastUUId(urlKey);
        let data = {
            id: urlId,
            cachedVideoData: {},
            locales: null,
            isProcessing: false,
            processingStatus: null,
            folderName: urlId,
            sequence: 1,
            spicy: false
        }
        return data;
    }
    async function saveData(key, data) {
        if (!key) key = state.currentDataKey;
        if (!data) data = state.currentData;
        if (key && data) await window.GrokSpiritUtils.writeStorage(key, data);
    }

    // UI
    function initGSUI() {
        createFloatingDivider();
        createFloatingSpicyButton();
        createFloatingSettingsButton();
        createFloatingDownloadButton();
    }
    function createFloatingSpicyButton() {
        if (state.floatingSpicyBtn) return state.floatingSpicyBtn;

        const btn = document.createElement('button');
        btn.className = 'gs-floating-spicy-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-100 select-none border border-transparent rounded-full overflow-hidden h-10 w-10 p-2 bg-surface-l2 text-primary hover:bg-surface-l3';
        btn.setAttribute('aria-label', 'Spicy Mode');
        btn.style.marginBottom = '2px'; // Add slight space above Unsave
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Stem (Green Part) -->
                <path d="M12 3C12 3 13 4 12 6C11 8 9 9 9 9" stroke="#2D6A4F" stroke-width="2.5" stroke-linecap="round"/>
                <!-- Body (The Chili) -->
                <path d="M16 8C14 6 11 6 9 9C6 13 5 18 8 20.5C11 23 16 22 18.5 19.5C21 17 21 13 18.5 10.5L16 8Z" fill="#E63946" stroke="#9B2226" stroke-width="1"/>
                <!-- Highlight/Reflect -->
                <path d="M16.5 13C16.5 13 17.5 14.5 17 16.5" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            </svg>
        `;

        btn.onclick = async (event) => {
            event.preventDefault();
            event.stopPropagation();
            state.currentData.spicy = !state.currentData.spicy;
            updateSpicyStatus();
            await saveData();
        };

        state.floatingSpicyBtn = btn;
        return btn;
    }
    function createFloatingDivider() {
        if (state.floatingDivider) return state.floatingDivider;
        const div = document.createElement('div');
        div.className = 'gs-ui-divider';
        state.floatingDivider = div;
        return div;
    }
    function createFloatingSettingsButton() {
        if (state.floatingSettingsBtn) return state.floatingSettingsBtn;

        const btn = document.createElement('button');
        btn.className = 'gs-floating-settings-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold leading-[normal] cursor-pointer transition-all duration-100 select-none border border-transparent rounded-full overflow-hidden h-10 w-10 p-2 bg-surface-l2 text-primary hover:bg-surface-l3';
        btn.style.border = '1px solid var(--border-l1, rgba(0,0,0,0.1))';
        btn.setAttribute('aria-label', 'Plugin Settings');
        btn.style.marginTop = '2px';
        btn.style.marginBottom = '2px';

        btn.innerHTML = `1`; // Default

        btn.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleSettingsPopup(btn);
        };

        state.floatingSettingsBtn = btn;
        return btn;
    }
    function toggleSettingsPopup(anchorBtn) {
        if (!state.floatingFolderPopup) {
            // Create Popup UI
            const overlay = document.createElement('div');
            overlay.className = 'gs-folder-popup-overlay';

            const panel = document.createElement('div');
            panel.className = 'gs-folder-popup-panel';
            panel.innerHTML = `
                <div class="gs-popup-row">
                    <label class="gs-popup-label">Save Folder Path</label>
                    <input type="text" class="gs-folder-popup-input gs-path-input" placeholder="输入文件夹保存路径..." />
                </div>
                <div class="gs-popup-row">
                    <label class="gs-popup-label">Next Sequence Number</label>
                    <input type="number" class="gs-folder-popup-input gs-seq-input" placeholder="序号" style="text-align: center; width: 100px;" />
                </div>
                <button class="gs-folder-popup-confirm" title="Save Settings">
                    <span>Confirm</span>
                </button>
            `;

            const pathInput = panel.querySelector('.gs-path-input');
            const seqInput = panel.querySelector('.gs-seq-input');
            const confirmBtn = panel.querySelector('.gs-folder-popup-confirm');

            const saveAndClose = async () => {
                const newFolder = pathInput.value.trim();
                const newSeq = parseInt(seqInput.value, 10);

                state.currentData.folderName = newFolder;
                if (!isNaN(newSeq)) state.currentData.sequence = newSeq;

                await saveData();
                updateSequence();
                hide();
            };

            const hide = () => {
                overlay.classList.remove('gs-visible');
                panel.classList.remove('gs-visible');
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 300);
            };

            overlay.onclick = hide;
            confirmBtn.onclick = saveAndClose;

            const handleEnter = (e) => { if (e.key === 'Enter') saveAndClose(); };
            pathInput.onkeydown = handleEnter;
            seqInput.onkeydown = handleEnter;

            document.body.appendChild(overlay);
            document.body.appendChild(panel);

            state.floatingFolderPopup = { overlay, panel, pathInput, seqInput };
        }

        const { overlay, panel, pathInput, seqInput } = state.floatingFolderPopup;

        if (panel.classList.contains('gs-visible')) {
            overlay.classList.remove('gs-visible');
            panel.classList.remove('gs-visible');
            return;
        }

        // Position panel near the button
        const rect = anchorBtn.getBoundingClientRect();
        panel.style.top = `${rect.top + window.scrollY - 30}px`;
        panel.style.left = `${rect.left + window.scrollX - 280}px`;

        pathInput.value = state.currentData.folderName || '';
        seqInput.value = state.currentData.sequence || 1;

        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('gs-visible');
            panel.classList.add('gs-visible');
            pathInput.focus();
            pathInput.setSelectionRange(0, 0);
            pathInput.scrollLeft = 0; // Explicitly scroll to the beginning
        }, 10);
    }
    function createFloatingDownloadButton() {
        if (state.floatingDownloadBtn) return state.floatingDownloadBtn;

        const btn = document.createElement('button');
        btn.className = 'gs-floating-download-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 select-none border border-transparent rounded-full overflow-hidden h-10 w-10 p-2 bg-surface-l2 text-primary hover:bg-surface-l3';
        btn.setAttribute('aria-label', 'GrokSpirit Download');
        btn.style.marginTop = '2px';
        btn.style.position = 'relative';

        btn.innerHTML = `
            <div class="gs-icon-container" style="position:relative; width:22px; height:22px; pointer-events:none; z-index:1; display:flex; align-items:center; justify-content:center;">
                <!-- Base Icon (Floppy/Save) -->
                <svg class="gs-icon-base" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transition: opacity 0.3s, color 0.3s; opacity: 1;">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17 21v-8H7v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 3v5h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>

                <!-- Checkmark Icon - Badge style at top-right -->
                <svg class="gs-icon-check" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute; top:-4px; right:-4px; width:14px; height:14px; opacity:0; transform: scale(0.5); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); filter: drop-shadow(0 0 1px white);">
                    <path d="M20 6L9 17L4 12" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20 6L9 17L4 12" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>

                <!-- Failed Icon (X) - Badge style at top-right -->
                <svg class="gs-icon-fail" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute; top:-4px; right:-4px; width:14px; height:14px; opacity:0; transform: scale(0.5); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); filter: drop-shadow(0 0 1px white);">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 6L6 18M6 6l12 12" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;

        btn.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleDownloadAll();
        };

        state.floatingDownloadBtn = btn;
        return btn;
    }
    function handleDownloadAll() {
        if (!state.currentData.cachedVideoData?.videoUrl) {
            console.error('[GrokSpirit] No video URL available for download');
            return;
        }

        let structuredData;
        try { structuredData = JSON.parse(state.currentData.cachedVideoData.videoPrompt); } catch (e) { }
        if (!structuredData) {
            structuredData = state.currentData.cachedVideoData.videoPrompt;
        } else if (state.currentData.locales) {
            structuredData = { en: { ...structuredData }, ...state.currentData.locales }
        }

        const payload = {
            action: 'grok-spirit-download',
            referer: { key: state.currentDataKey, url: state.currentUrl },
            videoInfo: {
                videoId: state.currentData.cachedVideoData.videoId,
                videoUrl: state.currentData.cachedVideoData.videoUrl,
                videoPrompt: state.currentData.cachedVideoData.videoPrompt,
                originalPrompt: state.currentData.cachedVideoData.originalPrompt || null,
                progress: state.currentData.cachedVideoData.progress,
                pageUrl: state.currentUrl,
                structuredData: structuredData,
                folderName: state.currentData.folderName,
                sequence: `${state.currentData.sequence}`.padStart(3, '0'),
                originImgUrl: findVideo()?.parentNode.querySelector('img')?.src,
            }
        };
        chrome.runtime.sendMessage(payload, async (response) => {
            if (chrome.runtime.lastError) {
                console.error('[GrokSpirit] Background message failed:', chrome.runtime.lastError);
                return;
            }
            if (!response || !response.success) {
                console.error('[GrokSpirit] Background download failed:', response && response.error);
                return;
            }
            //保存状态
            let { key, data } = await getKeyAndDataByReferer(payload.referer.key);
            //if (!data) data = generateEmptyVideoData(payload.referer); impossible
            data.sequence += 1;
            await saveData(key, data);
            if (data.id === state.currentData?.id) {
                updateSequence();
            }
        });
    }

    async function mountGSUI() {
        const sidebar = await window.GrokSpiritUtils.waitForSelector(() => findSidebarButtons());
        if (sidebar) {
            // Append components in order: Divider -> Spicy -> Settings -> Download
            if (state.floatingDivider && !sidebar.contains(state.floatingDivider)) {
                sidebar.appendChild(state.floatingDivider);
            }
            if (state.floatingSpicyBtn && !sidebar.contains(state.floatingSpicyBtn)) {
                sidebar.appendChild(state.floatingSpicyBtn);
            }
            if (state.floatingSettingsBtn && !sidebar.contains(state.floatingSettingsBtn)) {
                sidebar.appendChild(state.floatingSettingsBtn);
            }
            if (state.floatingDownloadBtn && !sidebar.contains(state.floatingDownloadBtn)) {
                sidebar.appendChild(state.floatingDownloadBtn);
            }
            console.log('[GrokSpirit] Mounted floating UI components in sidebar');
        }
    }

    function updateGSUI() {
        if (state.floatingDownloadBtn && state.currentDataKey) {
            state.floatingDownloadBtn.setAttribute('data-key', state.currentDataKey);
        }
        updateSpicyStatus();
        updateSequence();
        updateProcessingLayer();
    }
    function updateSpicyStatus() {
        if (state.floatingSpicyBtn) {
            const isActive = state.currentData?.spicy === true;
            state.floatingSpicyBtn.classList.toggle('gs-active', isActive);
            if (isActive) {
                state.floatingSpicyBtn.style.boxShadow = '0 0 12px rgba(255, 77, 79, 0.4)';
                state.floatingSpicyBtn.style.borderColor = '#ff4d4f';
                state.floatingSpicyBtn.style.background = 'rgba(255, 77, 79, 0.1)';
            } else {
                state.floatingSpicyBtn.style.boxShadow = '';
                state.floatingSpicyBtn.style.borderColor = 'transparent';
                state.floatingSpicyBtn.style.background = '';
            }
        }
    }
    function updateSequence() {
        if (!state.currentData) return;
        const val = `${state.currentData.sequence || 1}`;

        if (state.floatingSettingsBtn) {
            state.floatingSettingsBtn.innerHTML = val;
        }
    }
    function updateProcessingLayer() {
        if (!state.currentData) return;
        const status = state.currentData.processingStatus;

        if (state.floatingDownloadBtn) {
            const btn = state.floatingDownloadBtn;
            const iconBase = btn.querySelector('.gs-icon-base');
            const iconCheck = btn.querySelector('.gs-icon-check');
            const iconFail = btn.querySelector('.gs-icon-fail');

            btn.classList.remove('gs-status-processing', 'gs-status-completed', 'gs-status-failed', 'gs-status-generating-hd');

            // Update Hover Text
            btn.title = statusText[status] || 'GrokSpirit Download';

            // Determine operation theme: Purple (Regular) vs Amber (HD)
            if (status === 'generating_hd') {
                btn.classList.remove('gs-theme-regular');
                btn.classList.add('gs-theme-hd');
            } else if (status === 'processing') {
                btn.classList.remove('gs-theme-hd');
                btn.classList.add('gs-theme-regular');
            }
            // (If status is completed/failed, we keep the previous theme class)

            if (!btn.classList.contains('gs-theme-regular') && !btn.classList.contains('gs-theme-hd')) {
                return;
            }

            if (status) {
                const sType = statusClass[status];
                btn.classList.add(sType);

                if (status === 'processing' || status === 'generating_hd') {
                    if (iconBase) iconBase.style.opacity = '1';
                    if (iconCheck) { iconCheck.style.opacity = '0'; iconCheck.style.transform = 'scale(0.5)'; }
                    if (iconFail) { iconFail.style.opacity = '0'; iconFail.style.transform = 'scale(0.5)'; }
                } else if (status === 'completed') {
                    if (iconBase) iconBase.style.opacity = '1';
                    if (iconFail) { iconFail.style.opacity = '0'; iconFail.style.transform = 'scale(0.5)'; }
                    if (iconCheck) { iconCheck.style.opacity = '1'; iconCheck.style.transform = 'scale(1)'; }

                    setTimeout(() => {
                        if (state.currentData?.processingStatus === 'completed') {
                            if (iconCheck) { iconCheck.style.opacity = '0'; iconCheck.style.transform = 'scale(0.5)'; }
                        }
                    }, 3000);
                } else if (status === 'failed') {
                    if (iconBase) iconBase.style.opacity = '1';
                    if (iconCheck) { iconCheck.style.opacity = '0'; iconCheck.style.transform = 'scale(0.5)'; }
                    if (iconFail) {
                        iconFail.style.opacity = '1';
                        iconFail.style.transform = 'scale(1)';
                    }
                }
            } else {
                if (iconBase) iconBase.style.opacity = '1';
                if (iconCheck) { iconCheck.style.opacity = '0'; iconCheck.style.transform = 'scale(0.5)'; }
                if (iconFail) { iconFail.style.opacity = '0'; iconFail.style.transform = 'scale(0.5)'; }
            }
        }
    }
})()
