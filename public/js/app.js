/**
 * 《燕云十六声》装备管理系统 - 核心应用逻辑
 * 功能：装备CRUD、截图上传(OCR预留)、自动配装(流派推荐+属性权重)
 */

// ==================== 数据存储层 ====================
const Store = {
  KEY: 'yysls_equipment',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save(equips) {
    localStorage.setItem(this.KEY, JSON.stringify(equips));
  },

  add(equip) {
    const list = this.load();
    equip.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    equip.createdAt = new Date().toISOString();
    list.unshift(equip);
    this.save(list);
    return equip;
  },

  update(id, data) {
    const list = this.load();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    this.save(list);
    return list[idx];
  },

  remove(id) {
    const list = this.load();
    this.save(list.filter(e => e.id !== id));
  },

  get(id) {
    return this.load().find(e => e.id === id) || null;
  },

  getAll() {
    return this.load();
  },

  getBySlot(slot) {
    return this.load().filter(e => e.slot === slot);
  },

  exportJSON() {
    return JSON.stringify(this.load(), null, 2);
  },

  importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) throw new Error('格式错误');
      this.save(data);
      return true;
    } catch (e) {
      console.error('导入失败:', e);
      return false;
    }
  }
};

// ==================== 工具函数 ====================
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function toast(msg, type = 'success') {
  const container = $('.toast-container') || (() => {
    const c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function getQualityColor(q) {
  return EQUIP_QUALITIES[q]?.color || '#8b949e';
}

function getQualityLabel(q) {
  return EQUIP_QUALITIES[q]?.label || q;
}

function getSlotCategory(slot) {
  if (slot === '主武器') return 'weapon';
  if (['头盔', '上衣', '下装', '鞋子'].includes(slot)) return 'armor';
  return 'accessory';
}

function getSlotsForCategory(cat) {
  return EQUIP_CATEGORIES[cat]?.slots || [];
}

// 评估词条接近满值的程度
function getAffixQuality(key, val) {
  const affix = AFFIX_MAP[key];
  if (!affix || !affix.maxVal) return 'normal';
  const ratio = val / affix.maxVal;
  if (ratio >= 0.95) return 'great';
  if (ratio >= 0.8) return 'good';
  return 'normal';
}

// ==================== 页面路由 ====================
function navigate(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-links button').forEach(a => a.classList.remove('active'));
  const target = $(`#page-${page}`);
  if (target) target.classList.add('active');
  const navLink = $(`.nav-links button[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');

  // 页面进入时刷新
  if (page === 'equip') renderEquipList();
  if (page === 'build') renderBuildPage();
}

// ==================== 装备列表页 ====================
function renderEquipList() {
  const equips = Store.getAll();
  const container = $('#equip-grid');
  const statsBar = $('#equip-stats');

  // 统计
  const total = equips.length;
  const goldCount = equips.filter(e => e.quality === 'gold').length;
  const purpleCount = equips.filter(e => e.quality === 'purple').length;
  statsBar.innerHTML = `
    <span class="stat-item">总装备: <strong>${total}</strong></span>
    <span class="stat-item">金装: <strong>${goldCount}</strong></span>
    <span class="stat-item">紫装: <strong>${purpleCount}</strong></span>
  `;

  // 筛选
  const search = ($('#filter-search')?.value || '').toLowerCase();
  const filterCat = $('#filter-category')?.value || '';
  const filterSlot = $('#filter-slot')?.value || '';
  const filterQuality = $('#filter-quality')?.value || '';

  let filtered = equips;
  if (search) filtered = filtered.filter(e =>
    e.name.toLowerCase().includes(search) ||
    (e.set && e.set.toLowerCase().includes(search))
  );
  if (filterCat) filtered = filtered.filter(e => getSlotCategory(e.slot) === filterCat);
  if (filterSlot) filtered = filtered.filter(e => e.slot === filterSlot);
  if (filterQuality) filtered = filtered.filter(e => e.quality === filterQuality);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">📦</div>
        <p>${total === 0 ? '还没有装备，点击右上角添加' : '没有匹配的装备'}</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(e => {
    const affixHTML = (e.affixes || []).map(a => {
      const q = getAffixQuality(a.key, a.value);
      return `<div class="affix-item">
        <span class="affix-name">${AFFIX_MAP[a.key]?.name || a.key}</span>
        <span class="affix-val ${q}">${a.value}${AFFIX_MAP[a.key]?.unit || ''}</span>
      </div>`;
    }).join('');

    return `<div class="equip-card" data-quality="${e.quality}" data-id="${e.id}" onclick="openEquipDetail('${e.id}')">
      <div class="equip-header">
        <span class="equip-name" style="color:${getQualityColor(e.quality)}">${e.name}</span>
        <span class="equip-tag quality-${e.quality}">${getQualityLabel(e.quality)}</span>
      </div>
      <div class="equip-meta">
        <span class="equip-tag">${e.slot}</span>
        ${e.level ? `<span class="equip-tag">Lv.${e.level}</span>` : ''}
        ${e.set ? `<span class="equip-tag">${e.set}</span>` : ''}
        ${e.weaponType ? `<span class="equip-tag">${e.weaponType}</span>` : ''}
      </div>
      <div class="affix-list">${affixHTML}</div>
      <div class="equip-actions">
        <button class="btn btn-sm" onclick="event.stopPropagation();openEditEquip('${e.id}')">✏️ 编辑</button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteEquip('${e.id}')">🗑️ 删除</button>
      </div>
    </div>`;
  }).join('');
}

function deleteEquip(id) {
  if (!confirm('确定要删除这件装备吗？')) return;
  Store.remove(id);
  toast('装备已删除');
  renderEquipList();
}

// ==================== 装备创建/编辑模态框 ====================
let editingEquipId = null;

function openCreateEquip() {
  editingEquipId = null;
  $('#modal-title').textContent = '创建装备';
  $('#equip-form').reset();
  $('#affix-rows').innerHTML = '';
  addAffixRow();
  $('#modal-equip').classList.add('active');
}

function openEditEquip(id) {
  const equip = Store.get(id);
  if (!equip) return;
  editingEquipId = id;
  $('#modal-title').textContent = '编辑装备';
  $('#equip-name').value = equip.name || '';
  $('#equip-slot').value = equip.slot || '';
  $('#equip-quality').value = equip.quality || 'purple';
  $('#equip-level').value = equip.level || 100;
  $('#equip-set').value = equip.set || '';
  $('#equip-weapon-type').value = equip.weaponType || '';
  $('#equip-note').value = equip.note || '';

  // 填充词条
  $('#affix-rows').innerHTML = '';
  (equip.affixes || []).forEach(a => addAffixRow(a.key, a.value));

  $('#modal-equip').classList.add('active');
}

function closeModal() {
  $$('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function addAffixRow(key = '', value = '') {
  const container = $('#affix-rows');
  const row = document.createElement('div');
  row.className = 'affix-row';

  // 构建词条选项
  const options = Object.values(AFFIX_CATEGORIES).map(cat =>
    `<optgroup label="${cat.label}">${cat.affixes.map(a =>
      `<option value="${a.key}" ${a.key === key ? 'selected' : ''}>${a.name}</option>`
    ).join('')}</optgroup>`
  ).join('');

  row.innerHTML = `
    <select class="affix-key">${options}</select>
    <input type="number" class="affix-val-input" value="${value}" placeholder="数值" step="0.1">
    <button class="remove-affix" onclick="this.parentElement.remove()" title="移除">✕</button>
  `;
  container.appendChild(row);
}

function saveEquip() {
  const name = $('#equip-name').value.trim();
  if (!name) { toast('请输入装备名称', 'error'); return; }

  const slot = $('#equip-slot').value;
  if (!slot) { toast('请选择装备槽位', 'error'); return; }

  // 收集词条
  const affixes = [];
  $$('#affix-rows .affix-row').forEach(row => {
    const key = row.querySelector('.affix-key').value;
    const val = parseFloat(row.querySelector('.affix-val-input').value);
    if (key && !isNaN(val) && val > 0) {
      affixes.push({ key, value: val });
    }
  });

  const data = {
    name,
    slot,
    quality: $('#equip-quality').value,
    level: parseInt($('#equip-level').value) || 100,
    set: $('#equip-set').value,
    weaponType: $('#equip-weapon-type').value,
    note: $('#equip-note').value,
    affixes
  };

  if (editingEquipId) {
    Store.update(editingEquipId, data);
    toast('装备已更新');
  } else {
    Store.add(data);
    toast('装备已创建');
  }

  closeModal();
  renderEquipList();
}

// 槽位联动：根据大类更新槽位选项
function onCategoryChange() {
  const cat = $('#equip-category')?.value;
  const slotSelect = $('#equip-slot');
  if (!cat || !slotSelect) return;
  const slots = getSlotsForCategory(cat);
  slotSelect.innerHTML = '<option value="">请选择</option>' +
    slots.map(s => `<option value="${s}">${s}</option>`).join('');
}

// ==================== 装备详情 ====================
function openEquipDetail(id) {
  const equip = Store.get(id);
  if (!equip) return;

  const color = getQualityColor(equip.quality);
  const affixHTML = (equip.affixes || []).map(a => {
    const info = AFFIX_MAP[a.key] || {};
    const q = getAffixQuality(a.key, a.value);
    const pct = info.maxVal ? Math.round((a.value / info.maxVal) * 100) : 0;
    return `<div class="affix-item">
      <span class="affix-name">${info.name || a.key}</span>
      <span class="affix-val ${q}">${a.value}${info.unit || ''} ${pct ? `(${pct}%)` : ''}</span>
    </div>`;
  }).join('');

  // 计算装备评分
  const score = calcEquipScore(equip);
  const grade = scoreToGrade(score);

  $('#detail-content').innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:20px;font-weight:800;color:${color};margin-bottom:4px;">${equip.name}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <span class="equip-tag quality-${equip.quality}">${getQualityLabel(equip.quality)}</span>
        <span class="equip-tag">${equip.slot}</span>
        ${equip.level ? `<span class="equip-tag">Lv.${equip.level}</span>` : ''}
        ${equip.set ? `<span class="equip-tag">${equip.set}</span>` : ''}
        ${equip.weaponType ? `<span class="equip-tag">${equip.weaponType}</span>` : ''}
        <span class="score-badge ${grade}">${grade.toUpperCase()}</span>
      </div>
    </div>
    <div class="affix-list">${affixHTML}</div>
    ${equip.note ? `<div style="margin-top:12px;padding:10px;background:var(--bg-card);border-radius:6px;font-size:12px;color:var(--text-secondary);">📝 ${equip.note}</div>` : ''}
    <div style="margin-top:12px;font-size:12px;color:var(--text-muted);">装备评分: ${score.toFixed(1)}</div>
  `;

  $('#modal-detail').classList.add('active');
}

function calcEquipScore(equip) {
  if (!equip.affixes || equip.affixes.length === 0) return 0;
  let total = 0;
  equip.affixes.forEach(a => {
    const info = AFFIX_MAP[a.key];
    if (info && info.maxVal) {
      total += (a.value / info.maxVal) * 100;
    }
  });
  return total / equip.affixes.length;
}

function scoreToGrade(score) {
  if (score >= 90) return 's';
  if (score >= 75) return 'a';
  if (score >= 60) return 'b';
  if (score >= 40) return 'c';
  return 'd';
}

// ==================== 截图上传 + Tesseract.js OCR ====================
let ocrWorker = null;
let ocrRawText = '';
let ocrParsedEquip = null; // 解析后的装备数据

function initUpload() {
  const zone = $('#upload-zone');
  const input = $('#upload-file');

  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleUploadFile(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) handleUploadFile(input.files[0]);
    input.value = '';
  });

  // 监听全局粘贴事件（Ctrl+V），支持从剪贴板粘贴截图
  document.addEventListener('paste', (e) => {
    // 仅在截图上传页激活时响应
    const uploadPage = $('#page-upload');
    if (!uploadPage || !uploadPage.classList.contains('active')) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleUploadFile(file);
        return;
      }
    }
  });
}

function handleUploadFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('请上传图片文件', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = $('#upload-preview');
    preview.innerHTML = `<img src="${e.target.result}" alt="装备截图预览">`;

    // 将图片base64暂存
    window._uploadedImage = e.target.result;

    // 自动触发OCR识别（含图片预处理）
    runOCR(e.target.result);
  };
  reader.readAsDataURL(file);
}

// ==================== 图片预处理管线 ====================
/**
 * 对图片进行预处理以提升OCR准确率
 * 流程：加载图片 → 灰度化 → 对比度增强 → 锐化 → 自适应二值化 → 缩放至最佳DPI
 * @param {string} imageData - base64图片数据
 * @returns {string} 预处理后的base64图片数据
 */
function preprocessImage(imageData) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 1. 创建Canvas，限制最大尺寸（避免内存溢出）
      const MAX_DIM = 3000;
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      // 2. 绘制原图
      ctx.drawImage(img, 0, 0, w, h);
      let imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // 3. 灰度化 + 对比度增强 + 锐化（单次遍历像素）
      const contrast = 1.4; // 对比度系数（1.0=原图，>1增强）
      const brightness = -10; // 亮度微调（游戏UI偏亮，适当压暗突出文字）
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      // 锐化卷积核（3x3拉普拉斯锐化）
      // [ 0, -1,  0]
      // [-1,  5, -1]
      // [ 0, -1,  0]
      const grayBuf = new Float32Array(w * h); // 先存灰度值用于锐化
      for (let i = 0; i < w * h; i++) {
        const idx = i * 4;
        // 加权灰度公式
        let gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        // 对比度增强
        gray = factor * (gray - 128) + 128 + brightness;
        gray = Math.max(0, Math.min(255, gray));
        grayBuf[i] = gray;
      }

      // 应用锐化
      const sharpened = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
            sharpened[i] = grayBuf[i];
          } else {
            sharpened[i] = 5 * grayBuf[i]
              - grayBuf[i - 1]
              - grayBuf[i + 1]
              - grayBuf[i - w]
              - grayBuf[i + w];
            sharpened[i] = Math.max(0, Math.min(255, sharpened[i]));
          }
        }
      }

      // 4. 自适应二值化（局部均值法，窗口大小15x15）
      const WIN = 15;
      const halfWin = Math.floor(WIN / 2);
      const C = 10; // 偏移常数（游戏UI文字与背景对比大，用较小值）
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          // 计算局部窗口均值
          let sum = 0;
          let count = 0;
          const y0 = Math.max(0, y - halfWin);
          const y1 = Math.min(h - 1, y + halfWin);
          const x0 = Math.max(0, x - halfWin);
          const x1 = Math.min(w - 1, x + halfWin);
          for (let yy = y0; yy <= y1; yy += 2) { // 隔行采样加速
            for (let xx = x0; xx <= x1; xx += 2) {
              sum += sharpened[yy * w + xx];
              count++;
            }
          }
          const localMean = sum / count;
          // 二值化：像素值 > 局部均值 - C → 白，否则黑
          const val = sharpened[i] > (localMean - C) ? 255 : 0;
          const idx = i * 4;
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // 5. 如果图片太小，放大到最小推荐尺寸（Tesseract最佳300dpi）
      // 游戏截图一般足够大，此步仅在截图很小时生效
      const MIN_DIM = 800;
      if (w < MIN_DIM || h < MIN_DIM) {
        const upScale = MIN_DIM / Math.min(w, h);
        const nw = Math.round(w * upScale);
        const nh = Math.round(h * upScale);
        const upCanvas = document.createElement('canvas');
        upCanvas.width = nw;
        upCanvas.height = nh;
        const upCtx = upCanvas.getContext('2d');
        upCtx.imageSmoothingEnabled = false; // 最近邻插值保持锐利
        upCtx.drawImage(canvas, 0, 0, nw, nh);
        resolve(upCanvas.toDataURL('image/png'));
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    };
    img.src = imageData;
  });
}

// ==================== Tesseract.js OCR核心 ====================
async function runOCR(imageData) {
  const status = $('#ocr-status');
  const resultDiv = $('#ocr-result');
  const rawTextDiv = $('#ocr-raw-text');
  const parsedDiv = $('#ocr-parsed');

  // 显示识别中状态
  status.style.display = 'flex';
  status.className = 'ocr-status pending';
  status.innerHTML = `<div class="spinner"></div><span>正在初始化OCR引擎，首次需下载中文语言包（约25MB）...</span>`;
  resultDiv.style.display = 'none';
  ocrRawText = '';
  ocrParsedEquip = null;

  try {
    // 初始化worker（首次会下载chi_sim语言包）
    if (!ocrWorker) {
      status.innerHTML = `<div class="spinner"></div><span>正在加载Tesseract.js引擎和中文语言包，请稍候...</span>`;
      ocrWorker = await Tesseract.createWorker('chi_sim', 1, {
        logger: m => {
          if (m.status === 'loading tesseract core') {
            status.innerHTML = `<div class="spinner"></div><span>正在加载OCR核心引擎...</span>`;
          } else if (m.status === 'initializing tesseract') {
            status.innerHTML = `<div class="spinner"></div><span>正在初始化OCR引擎...</span>`;
          } else if (m.status === 'loading language traineddata') {
            const pct = Math.round((m.progress || 0) * 100);
            status.innerHTML = `<div class="spinner"></div><span>正在下载中文语言包... ${pct}%</span>`;
          } else if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            status.innerHTML = `<div class="spinner"></div><span>正在识别文字... ${pct}%</span>`;
          }
        }
      });

      // 设置OCR引擎优化参数
      await ocrWorker.setParameters({
        // 页面分段模式：PSM_SINGLE_BLOCK（单文本块，适合装备面板截图）
        tessedit_pageseg_mode: '6',
        // 仅使用LSTM神经网络引擎（精度最高）
        tessedit_ocr_engine_mode: '1',
        // 保留词间空格（中文词条名称需要）
        preserve_interword_spaces: '1',
      });
    }

    // 图片预处理（灰度→对比度增强→锐化→自适应二值化）
    status.innerHTML = `<div class="spinner"></div><span>正在预处理图片（增强对比度、二值化）...</span>`;
    const processedImage = await preprocessImage(imageData);

    // 执行识别
    status.innerHTML = `<div class="spinner"></div><span>正在识别文字...</span>`;
    const { data: { text, confidence } } = await ocrWorker.recognize(processedImage);
    ocrRawText = text.trim();

    if (!ocrRawText) {
      status.className = 'ocr-status pending';
      status.innerHTML = `<span>⚠️ 未识别到文字内容，请确保截图清晰且包含装备信息</span>`;
      return;
    }

    // 显示原始文本
    rawTextDiv.textContent = ocrRawText;

    // 解析装备信息
    ocrParsedEquip = parseEquipFromText(ocrRawText);
    renderParsedEquip(ocrParsedEquip);

    // 显示结果区
    resultDiv.style.display = 'block';
    const confPct = Math.round(confidence || 0);
    status.className = 'ocr-status success';
    status.innerHTML = `<span>✅ 识别完成！置信度 ${confPct}%，共识别 ${ocrRawText.length} 个字符，解析出 ${ocrParsedEquip.affixes.length} 条词条</span>`;

    toast('OCR识别完成');
  } catch (err) {
    console.error('OCR识别失败:', err);
    status.className = 'ocr-status pending';
    status.innerHTML = `<span>❌ 识别失败: ${err.message || '未知错误'}，请重试</span>`;
    // 释放worker以便重试
    if (ocrWorker) {
      try { await ocrWorker.terminate(); } catch(e) {}
      ocrWorker = null;
    }
  }
}

// ==================== OCR结果解析 ====================
function parseEquipFromText(text) {
  const result = {
    name: '',
    slot: '',
    quality: '',
    level: null,
    set: '',
    weaponType: '',
    affixes: []
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 1. 尝试提取装备名称（通常在前几行，包含特殊字符或较长）
  for (const line of lines.slice(0, 5)) {
    // 跳过纯数字行或太短的行
    if (/^\d+\.?\d*$/.test(line) || line.length < 2) continue;
    // 跳过明显是词条的行（包含+号和数字）
    if (/^[+\-]?\d/.test(line) && line.length < 20) continue;
    // 候选名称：长度适中，不是纯属性描述
    if (line.length >= 2 && line.length <= 20 && !result.name) {
      result.name = line.replace(/[·\-\s]+$/, '').trim();
      break;
    }
  }

  // 2. 识别品质
  if (/金|橙|传说/.test(text)) result.quality = 'gold';
  else if (/紫|史诗/.test(text)) result.quality = 'purple';
  else if (/蓝|稀有/.test(text)) result.quality = 'blue';
  else if (/绿|普通|优秀/.test(text)) result.quality = 'green';

  // 3. 识别等级
  const levelMatch = text.match(/(\d{2,3})\s*[级Lv]/);
  if (levelMatch) result.level = parseInt(levelMatch[1]);

  // 4. 识别槽位
  const slotMap = {
    '主武器': '主武器', '武器': '主武器',
    '头盔': '头盔', '头': '头盔', '帽': '头盔',
    '上衣': '上衣', '衣服': '上衣', '胸甲': '上衣', '铠甲': '上衣',
    '下装': '下装', '裤子': '下装', '腿甲': '下装', '裙': '下装',
    '鞋子': '鞋子', '鞋': '鞋子', '靴': '鞋子', '足': '鞋子',
    '项链': '项链', '项': '项链', '坠': '项链',
    '戒指': '戒指', '戒': '戒指', '指环': '戒指'
  };
  for (const [keyword, slot] of Object.entries(slotMap)) {
    if (text.includes(keyword)) { result.slot = slot; break; }
  }

  // 5. 识别武器类型
  const weaponMap = { '长剑': '长剑', '剑': '长剑', '陌刀': '陌刀', '刀': '陌刀', '枪': '枪', '扇': '扇', '伞': '伞' };
  for (const [keyword, wtype] of Object.entries(weaponMap)) {
    if (text.includes(keyword) && !result.weaponType) { result.weaponType = wtype; break; }
  }

  // 6. 识别套装
  const sets = ['断岳玄甲', '桂月', '燕归', '承音'];
  for (const s of sets) {
    if (text.includes(s)) { result.set = s; break; }
  }

  // 7. 识别词条（核心解析逻辑）
  // 构建词条关键词映射（支持模糊匹配）
  const affixPatterns = [
    // 攻击类
    { key: 'max_atk', patterns: [/最大外功攻击?\s*[+＋]?\s*(\d+\.?\d*)/, /外功攻击\s*[+＋]?\s*(\d+\.?\d*)/, /大攻\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'min_atk', patterns: [/最小外功攻击?\s*[+＋]?\s*(\d+\.?\d*)/, /小攻\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'ele_mingjin', patterns: [/鸣金攻击\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'ele_pozhu', patterns: [/破竹攻击\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'ele_qiansi', patterns: [/牵丝攻击\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'ele_lieshi', patterns: [/裂石攻击\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'wuxing_pen', patterns: [/外功穿透\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'wuxiang_pen', patterns: [/无相穿透\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'true_dmg', patterns: [/武学真伤\s*[+＋]?\s*(\d+\.?\d*)/, /真效\s*[+＋]?\s*(\d+\.?\d*)/] },
    // 三率类
    { key: 'crit_rate', patterns: [/会心率\s*[+＋]?\s*(\d+\.?\d*)\s*%?/, /会心\s*[+＋]?\s*(\d+\.?\d*)\s*%?/] },
    { key: 'crit_dmg_rate', patterns: [/会意率\s*[+＋]?\s*(\d+\.?\d*)\s*%?/, /会意\s*[+＋]?\s*(\d+\.?\d*)\s*%?/] },
    { key: 'precision', patterns: [/精准率\s*[+＋]?\s*(\d+\.?\d*)\s*%?/, /精准\s*[+＋]?\s*(\d+\.?\d*)\s*%?/] },
    // 增伤类
    { key: 'boss_dmg', patterns: [/对首领增伤\s*[+＋]?\s*(\d+\.?\d*)\s*%?/, /首领增伤\s*[+＋]?\s*(\d+\.?\d*)\s*%?/] },
    { key: 'single_wuxue', patterns: [/(\S+)武学增伤\s*[+＋]?\s*(\d+\.?\d*)\s*%?/] },
    { key: 'all_wuxue', patterns: [/全武学增伤\s*[+＋]?\s*(\d+\.?\d*)\s*%?/] },
    // 五维
    { key: 'jin', patterns: [/劲\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'shi', patterns: [/势\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'min_wuwei', patterns: [/敏\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'ti', patterns: [/体\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'yu', patterns: [/御\s*[+＋]?\s*(\d+\.?\d*)/] },
    // 防御/生存
    { key: 'def', patterns: [/外功防御\s*[+＋]?\s*(\d+\.?\d*)/, /防御\s*[+＋]?\s*(\d+\.?\d*)/] },
    { key: 'max_hp', patterns: [/气血最大值?\s*[+＋]?\s*(\d+\.?\d*)/, /气血\s*[+＋]?\s*(\d+\.?\d*)/, /生命值?\s*[+＋]?\s*(\d+\.?\d*)/] },
  ];

  const foundKeys = new Set();
  for (const { key, patterns } of affixPatterns) {
    if (foundKeys.has(key)) continue;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val > 0) {
          // 修正key：五维"敏"和增伤"单武学"需要特殊处理
          let finalKey = key;
          if (key === 'min_wuwei') finalKey = 'min';
          if (key === 'single_wuxue') {
            // 单武学增伤，match[1]是武学类型名
            const wuxueMatch = text.match(/(\S+)武学增伤\s*[+＋]?\s*(\d+\.?\d*)\s*%?/);
            if (wuxueMatch) {
              result.affixes.push({ key: 'single_wuxue', value: parseFloat(wuxueMatch[2]), label: `${wuxueMatch[1]}武学增伤` });
              foundKeys.add(key);
              break;
            }
            continue;
          }
          result.affixes.push({ key: finalKey, value: val });
          foundKeys.add(key);
          break;
        }
      }
    }
  }

  return result;
}

// 渲染解析结果
function renderParsedEquip(equip) {
  const container = $('#ocr-parsed');
  if (!container) return;

  let html = '<div style="display:flex;flex-direction:column;gap:8px;">';

  // 装备基本信息
  if (equip.name || equip.slot || equip.quality) {
    html += '<div style="padding:8px 12px;background:var(--accent-dim);border-radius:6px;font-size:13px;">';
    html += '<div style="font-weight:600;margin-bottom:4px;">装备信息</div>';
    const infos = [];
    if (equip.name) infos.push(`名称: ${equip.name}`);
    if (equip.slot) infos.push(`槽位: ${equip.slot}`);
    if (equip.quality) infos.push(`品质: ${getQualityLabel(equip.quality)}`);
    if (equip.level) infos.push(`等级: ${equip.level}级`);
    if (equip.set) infos.push(`套装: ${equip.set}`);
    if (equip.weaponType) infos.push(`武器: ${equip.weaponType}`);
    html += infos.map(i => `<span style="display:inline-block;margin-right:12px;">${i}</span>`).join('');
    html += '</div>';
  }

  // 词条信息
  if (equip.affixes.length > 0) {
    html += '<div style="padding:8px 12px;background:var(--bg-card);border-radius:6px;font-size:13px;">';
    html += '<div style="font-weight:600;margin-bottom:6px;">识别词条</div>';
    html += equip.affixes.map(a => {
      const info = AFFIX_MAP[a.key];
      const name = a.label || (info ? info.name : a.key);
      const unit = info ? info.unit : '';
      return `<div style="display:flex;justify-content:space-between;padding:2px 0;">
        <span style="color:var(--text-secondary);">${name}</span>
        <span style="color:var(--accent);font-weight:500;">${a.value}${unit}</span>
      </div>`;
    }).join('');
    html += '</div>';
  }

  if (!equip.name && equip.affixes.length === 0) {
    html += '<div style="padding:8px 12px;background:var(--info-dim);border-radius:6px;font-size:12px;color:var(--info);">⚠️ 未能自动解析出装备信息，请手动填写或尝试更清晰的截图</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

// 复制OCR原文
function copyOCRText() {
  if (!ocrRawText) { toast('没有可复制的文本', 'error'); return; }
  navigator.clipboard.writeText(ocrRawText).then(() => {
    toast('已复制到剪贴板');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = ocrRawText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('已复制到剪贴板');
  });
}

// 将OCR解析结果填入创建表单
function fillEquipFromOCR() {
  if (!ocrParsedEquip) {
    toast('没有可填充的数据', 'error');
    return;
  }

  const equip = ocrParsedEquip;

  // 切换到装备管理页并打开创建表单
  navigate('equip');
  setTimeout(() => {
    openCreateEquip();

    // 填充基本信息
    if (equip.name) $('#equip-name').value = equip.name;
    if (equip.slot) $('#equip-slot').value = equip.slot;
    if (equip.quality) $('#equip-quality').value = equip.quality;
    if (equip.level) $('#equip-level').value = equip.level;
    if (equip.set) $('#equip-set').value = equip.set;
    if (equip.weaponType) $('#equip-weapon-type').value = equip.weaponType;

    // 清空默认词条行，填入解析的词条
    const affixContainer = $('#affix-rows');
    affixContainer.innerHTML = '';
    if (equip.affixes.length > 0) {
      equip.affixes.forEach(a => addAffixRow(a.key, a.value));
    } else {
      addAffixRow(); // 保留一个空行
    }

    toast('已填入识别结果，请检查并修正');
  }, 100);
}

// ==================== 自动配装引擎 ====================
let buildStyle = null; // 当前选择的流派
let customWeights = {}; // 自定义权重

function renderBuildPage() {
  renderStyleCards();
  renderBuildSlots();
}

function renderStyleCards() {
  const container = $('#style-cards');
  if (!container) return;

  container.innerHTML = Object.entries(FIGHTING_STYLES).map(([key, style]) => `
    <div class="style-card ${buildStyle === key ? 'selected' : ''}" onclick="selectBuildStyle('${key}')">
      <div class="style-name">${style.label}</div>
      <div class="style-desc">${style.desc}</div>
    </div>
  `).join('');
}

function selectBuildStyle(key) {
  buildStyle = buildStyle === key ? null : key;
  renderStyleCards();
  renderBuildSlots();
}

function renderBuildSlots() {
  const container = $('#build-slots');
  if (!container) return;

  const equips = Store.getAll();
  const style = buildStyle ? FIGHTING_STYLES[buildStyle] : null;

  container.innerHTML = ALL_SLOTS.map(slot => {
    const slotEquips = equips.filter(e => e.slot === slot);
    if (slotEquips.length === 0) {
      return `<div class="build-slot">
        <div class="slot-label">${slot}</div>
        <div class="slot-empty">暂无装备</div>
      </div>`;
    }

    // 为该槽位选出最佳装备
    let best = null;
    let bestScore = -1;

    slotEquips.forEach(equip => {
      let score = 0;
      (equip.affixes || []).forEach(a => {
        if (style) {
          // 流派推荐模式：使用流派权重
          score += (style.affixWeights[a.key] || 0) * (a.value / (AFFIX_MAP[a.key]?.maxVal || 1));
        } else if (customWeights[a.key]) {
          // 自定义权重模式
          score += customWeights[a.key] * a.value;
        } else {
          // 默认：按满值比例
          const info = AFFIX_MAP[a.key];
          if (info && info.maxVal) score += (a.value / info.maxVal) * 100;
        }
      });
      if (score > bestScore) {
        bestScore = score;
        best = equip;
      }
    });

    if (!best) {
      return `<div class="build-slot">
        <div class="slot-label">${slot}</div>
        <div class="slot-empty">暂无装备</div>
      </div>`;
    }

    const topAffixes = (best.affixes || []).slice(0, 3).map(a =>
      `${AFFIX_MAP[a.key]?.name || a.key}: ${a.value}`
    ).join(' | ');

    return `<div class="build-slot filled">
      <div class="slot-label">${slot}</div>
      <div class="slot-equip-name" style="color:${getQualityColor(best.quality)}">${best.name}</div>
      <div class="slot-equip-affixes">${topAffixes}</div>
    </div>`;
  }).join('');

  // 渲染属性汇总
  renderBuildSummary();
}

function renderBuildSummary() {
  const container = $('#build-summary');
  if (!container) return;

  const equips = Store.getAll();
  const style = buildStyle ? FIGHTING_STYLES[buildStyle] : null;

  // 收集每个槽位的最佳装备
  const bestEquips = [];
  ALL_SLOTS.forEach(slot => {
    const slotEquips = equips.filter(e => e.slot === slot);
    if (slotEquips.length === 0) return;

    let best = null, bestScore = -1;
    slotEquips.forEach(equip => {
      let score = 0;
      (equip.affixes || []).forEach(a => {
        if (style) {
          score += (style.affixWeights[a.key] || 0) * (a.value / (AFFIX_MAP[a.key]?.maxVal || 1));
        } else if (customWeights[a.key]) {
          score += customWeights[a.key] * a.value;
        } else {
          const info = AFFIX_MAP[a.key];
          if (info && info.maxVal) score += (a.value / info.maxVal) * 100;
        }
      });
      if (score > bestScore) { bestScore = score; best = equip; }
    });
    if (best) bestEquips.push(best);
  });

  // 汇总属性
  const totals = {};
  bestEquips.forEach(eq => {
    (eq.affixes || []).forEach(a => {
      if (!totals[a.key]) totals[a.key] = 0;
      totals[a.key] += a.value;
    });
  });

  // 渲染汇总
  const statCards = Object.entries(totals).map(([key, val]) => {
    const info = AFFIX_MAP[key];
    return `<div class="stat-card">
      <div class="stat-label">${info?.name || key}</div>
      <div class="stat-value">${val}<span class="unit">${info?.unit || ''}</span></div>
    </div>`;
  }).join('');

  // 套装统计
  const setCounts = {};
  bestEquips.forEach(eq => {
    if (eq.set) setCounts[eq.set] = (setCounts[eq.set] || 0) + 1;
  });
  const setInfo = Object.entries(setCounts).map(([s, c]) => `${s} ×${c}`).join('，') || '无套装';

  container.innerHTML = `
    <div class="result-header">
      <h3>📋 配装属性汇总</h3>
      <div style="display:flex;gap:8px;">
        <span class="equip-tag">${buildStyle ? FIGHTING_STYLES[buildStyle].label + ' 推荐' : '默认排序'}</span>
        <span class="equip-tag">已装备 ${bestEquips.length}/${ALL_SLOTS.length}</span>
      </div>
    </div>
    <div style="margin-bottom:12px;font-size:13px;color:var(--text-secondary);">套装: ${setInfo}</div>
    ${style ? `<div style="margin-bottom:16px;padding:10px;background:var(--accent-dim);border-radius:6px;font-size:12px;color:var(--accent);">💡 ${style.tips}</div>` : ''}
    <div class="stat-summary">${statCards || '<div class="empty-state"><p>暂无配装数据</p></div>'}</div>
  `;
}

// 自定义权重编辑
function renderWeightEditor() {
  const container = $('#weight-editor');
  if (!container) return;

  // 收集所有出现过的词条key
  const equips = Store.getAll();
  const allKeys = new Set();
  equips.forEach(e => (e.affixes || []).forEach(a => allKeys.add(a.key)));

  if (allKeys.size === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:12px;">请先添加装备后才能设置权重</div>';
    return;
  }

  container.innerHTML = Array.from(allKeys).map(key => {
    const info = AFFIX_MAP[key];
    const w = customWeights[key] || 50;
    return `<div class="weight-editor">
      <label>${info?.name || key}</label>
      <input type="range" min="0" max="100" value="${w}" oninput="updateWeight('${key}', this.value, this)">
      <span class="weight-val" id="wv-${key}">${w}</span>
    </div>`;
  }).join('');
}

function updateWeight(key, val, el) {
  customWeights[key] = parseInt(val);
  const label = document.getElementById(`wv-${key}`);
  if (label) label.textContent = val;
}

// ==================== 导入/导出 ====================
function exportData() {
  const json = Store.exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `燕云十六声_装备数据_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('数据已导出');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (Store.importJSON(e.target.result)) {
        toast('数据导入成功');
        renderEquipList();
      } else {
        toast('导入失败，请检查文件格式', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  // 导航
  $$('.nav-links button').forEach(a => {
    a.addEventListener('click', () => navigate(a.dataset.page));
  });

  // 筛选事件
  $('#filter-search')?.addEventListener('input', renderEquipList);
  $('#filter-category')?.addEventListener('change', () => {
    onCategoryChange();
    renderEquipList();
  });
  $('#filter-slot')?.addEventListener('change', renderEquipList);
  $('#filter-quality')?.addEventListener('change', renderEquipList);

  // 模态框关闭
  $$('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal();
    });
  });

  // ESC关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // 上传初始化
  initUpload();

  // 配装页标签切换
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $$('.tab-content').forEach(t => t.style.display = 'none');
      const target = $(`#tab-${tab}`);
      if (target) target.style.display = 'block';
      if (tab === 'custom') renderWeightEditor();
    });
  });

  // 初始渲染
  navigate('equip');
});
