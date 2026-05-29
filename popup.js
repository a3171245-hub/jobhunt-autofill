const fields = [
  'lastName', 'firstName', 'lastNameKana', 'firstNameKana', 'gender',
  'zipCode', 'prefecture', 'city', 'street', 'address', 'building',
  'homePhone', 'mobile', 'email', 'subEmail', 'sameAsCurrentAddr',
  'university', 'faculty',
  'birthYear', 'birthMonth', 'birthDay',
  'zemi', 'circle',
  'gradYear', 'gradMonth', 'gradType'
];

// ===== 自作プルダウン（ネイティブselectが拡張popup内で開かない対策。divで実装）=====
const numRange = (s, e, suf) => {
  const arr = [{ v: '', t: '選択しない' }];
  for (let i = s; i <= e; i++) arr.push({ v: String(i), t: i + (suf || '') });
  return arr;
};
const DROPDOWNS = {
  gender: [{ v: '', t: '選択しない' }, { v: '男性', t: '男性' }, { v: '女性', t: '女性' }, { v: '回答しない', t: '回答しない' }],
  birthYear: numRange(1998, 2010),
  birthMonth: numRange(1, 12),
  birthDay: numRange(1, 31),
  gradYear: numRange(2025, 2032),
  gradMonth: numRange(1, 12),
  gradType: [{ v: '', t: '選択しない' }, { v: '卒業見込み', t: '卒業（修了）見込み' }, { v: '卒業', t: '卒業（修了）' }],
  sameAsCurrentAddr: [{ v: '', t: 'チェックしない' }, { v: 'yes', t: '自動でチェックを入れる' }]
};

function buildDropdown(host) {
  const id = host.dataset.dd;
  const opts = DROPDOWNS[id];
  if (!opts) return;
  const hidden = document.createElement('input');
  hidden.type = 'hidden'; hidden.id = id;            // ← idは隠しinputに。save/復元のコードはそのまま動く
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'cdd-btn'; btn.textContent = opts[0].t;
  const list = document.createElement('div');
  list.className = 'cdd-list';
  opts.forEach(o => {
    const it = document.createElement('div');
    it.className = 'cdd-item'; it.textContent = o.t;
    it.addEventListener('click', () => {
      hidden.value = o.v; btn.textContent = o.t; host.classList.remove('open');
    });
    list.appendChild(it);
  });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.cdd.open').forEach(d => { if (d !== host) d.classList.remove('open'); });
    host.classList.toggle('open');
  });
  host.appendChild(hidden); host.appendChild(btn); host.appendChild(list);
}
function setDropdownValue(id, val) {
  const host = document.querySelector(`.cdd[data-dd="${id}"]`);
  if (!host) return;
  const hidden = host.querySelector('input[type="hidden"]');
  const btn = host.querySelector('.cdd-btn');
  const match = (DROPDOWNS[id] || []).find(o => o.v === String(val));
  hidden.value = match ? match.v : '';
  btn.textContent = match ? match.t : DROPDOWNS[id][0].t;
}
document.querySelectorAll('.cdd').forEach(buildDropdown);
document.addEventListener('click', () => document.querySelectorAll('.cdd.open').forEach(d => d.classList.remove('open')));

// ===== 保存値の復元 =====
chrome.storage.local.get('userData', (result) => {
  if (!result.userData) return;
  fields.forEach(key => {
    if (DROPDOWNS[key]) { setDropdownValue(key, result.userData[key] || ''); }
    else { const el = document.getElementById(key); if (el) el.value = result.userData[key] || ''; }
  });
});

// ===== 保存 =====
document.getElementById('saveBtn').addEventListener('click', () => {
  const data = {};
  fields.forEach(key => {
    const el = document.getElementById(key);
    if (el) data[key] = el.value;
  });
  chrome.storage.local.set({ userData: data }, () => {
    showStatus('✅ 保存しました', '#4CAF50', 'statusSave');   // ← 下に表示
  });
});

// ===== 自動入力 =====
document.getElementById('autofillBtn').addEventListener('click', () => {
  chrome.storage.local.get('userData', (result) => {
    if (!result.userData) {
      showStatus('⚠️ 先に情報を保存してください', 'red');
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: fillForm,
        args: [result.userData]
      }, (results) => {
        const count = results && results[0] ? results[0].result : 0;
        showStatus(`⚡ ${count}件 自動入力しました`, '#2196F3');
      });
    });
  });
});

function showStatus(msg, color, targetId) {
  const el = document.getElementById(targetId || 'status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color;
  setTimeout(() => { el.textContent = ''; }, 2500);
}

function fillForm(userData) {
  const setVal = (el, val) => {
    if (!el || val == null || val === '') return false;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  const applySelect = (sel, matched) => {
    sel.value = matched.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    try { if (window.jQuery) window.jQuery(sel).val(matched.value).trigger('change'); } catch (e) {}
    try {
      const w = sel.closest('.jqTransformSelectWrapper');
      if (w) { const d = w.querySelector('a.jqTransformSelectOpen, span, a'); if (d) d.textContent = matched.textContent; }
    } catch (e) {}
  };
  const selNum = (sel, val) => {
    if (!sel || !val) return false;
    const want = String(val).replace(/[^0-9]/g, '');
    const wn = String(parseInt(want, 10));
    for (const o of sel.options) {
      const tn = o.textContent.replace(/[^0-9]/g, '');
      if (tn === want || (tn && String(parseInt(tn,10)) === wn)) { applySelect(sel, o); return true; }
    }
    return false;
  };
  const selText = (sel, val) => {
    if (!sel || !val) return false;
    const want = String(val).replace(/\s/g, '');
    for (const o of sel.options) { const t=o.textContent.replace(/\s/g,''); if (t && t===want){applySelect(sel,o);return true;} }
    for (const o of sel.options) { const t=o.textContent.replace(/\s/g,''); if (t && (t.includes(want)||want.includes(t))){applySelect(sel,o);return true;} }
    return false;
  };
  // 卒業区分: 「見込み」の有無で判定（卒業（修了）見込み 等の表記揺れに強い）
  const selGrad = (sel, val) => {
    if (!sel || !val) return false;
    const wantMikomi = /見込/.test(val);
    for (const o of sel.options) {
      const t = o.textContent;
      if (!/卒業|修了/.test(t)) continue;
      if (/見込/.test(t) === wantMikomi) { applySelect(sel, o); return true; }
    }
    return false;
  };
  const selRadioByLabel = (name, val) => {
    if (!val) return false;
    const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
    for (const r of radios) {
      let lt = '';
      if (r.id) { const lb = document.querySelector(`label[for="${r.id}"]`); if (lb) lt += lb.textContent; }
      const lp = r.closest('label'); if (lp) lt += lp.textContent;
      let sib = r.nextSibling, guard = 0;
      while (sib && lt.replace(/\s/g,'')==='' && guard<5) { if (sib.textContent) lt += sib.textContent; sib = sib.nextSibling; guard++; }
      lt = lt.replace(/\s/g,'');
      if (lt.includes(val) || r.value === val) {
        r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
        try { if (window.jQuery) window.jQuery(r).trigger('click'); } catch(e){}
        return true;
      }
    }
    return false;
  };
  const checkBox = (name) => {
    const cb = document.querySelector(`input[type="checkbox"][name="${name}"]`);
    if (cb && !cb.checked) {
      cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true }));
      try { if (window.jQuery) window.jQuery(cb).trigger('click'); } catch(e){}
      return true;
    }
    return false;
  };
  const byName = (n) => document.querySelector(`[name="${n}"]`);
  const splitZip = (z) => (z||'').replace(/[^0-9]/g,'').match(/^(\d{3})(\d{4})$/)?.slice(1) || null;
  const splitTel = (t) => {
    const d = (t||'').replace(/[^0-9]/g,'');
    if (d.length === 11) return [d.slice(0,3), d.slice(3,7), d.slice(7)];
    if (d.length === 10) return [d.slice(0,2), d.slice(2,6), d.slice(6)];
    return null;
  };
  const mailParts = (m) => { const i=(m||'').indexOf('@'); return i>0 ? [m.slice(0,i), m.slice(i+1)] : [m, '']; };

  let filled = 0;
  const host = location.hostname;

  // ===================================================================
  // i-web型（ヒューマネージ・新卒シェア1位）
  // 判定: i-webs.jp ドメイン、または i-web 特有のname(kname1+ybirth+gken)。
  // これで Suntory 等の独自ドメインの i-web フォームも自動的にカバーされる。
  // ===================================================================
  const isIweb = /i-webs?\.jp/.test(host) || /suntory/.test(host) ||
    (byName('kname1') && byName('ybirth') && byName('gken'));
  if (isIweb) {
    const map = {
      kname1: userData.lastName, kname2: userData.firstName,
      yname1: userData.lastNameKana, yname2: userData.firstNameKana,
      gadrs1: (userData.city||'') + (userData.street||'') || userData.address,
      gadrs2: userData.building,
      bikoa: userData.zemi, bikob: userData.circle
    };
    Object.entries(map).forEach(([n,v]) => { if (setVal(byName(n), v)) filled++; });

    const zp = splitZip(userData.zipCode);
    if (zp) { setVal(byName('gyubin1'), zp[0]) && filled++; setVal(byName('gyubin2'), zp[1]) && filled++; }

    const tp = splitTel(userData.homePhone);
    if (tp) { ['gtel1','gtel2','gtel3'].forEach((n,i)=> setVal(byName(n), tp[i]) && filled++); }
    const mp = splitTel(userData.mobile);
    if (mp) { ['kttel1','kttel2','kttel3'].forEach((n,i)=> setVal(byName(n), mp[i]) && filled++); }

    if (userData.email) {
      const [acc, dom] = mailParts(userData.email);
      ['account1','account2'].forEach(n => setVal(byName(n), acc) && filled++);
      ['domain1','domain2'].forEach(n => setVal(byName(n), dom) && filled++);
    }
    if (userData.subEmail) {
      const [sacc, sdom] = mailParts(userData.subEmail);
      ['account3','account4'].forEach(n => setVal(byName(n), sacc) && filled++);
      ['domain3','domain4'].forEach(n => setVal(byName(n), sdom) && filled++);
    }

    // 休暇中連絡先を現住所と同じにする（i-webは adch）
    if (userData.sameAsCurrentAddr === 'yes') { if (checkBox('adch')) filled++; }

    selNum(byName('ybirth'), userData.birthYear) && filled++;
    selNum(byName('mbirth'), userData.birthMonth) && filled++;
    selNum(byName('dbirth'), userData.birthDay) && filled++;
    selText(byName('gken'), userData.prefecture) && filled++;
    selNum(byName('syear'), userData.gradYear) && filled++;
    selNum(byName('smonth'), userData.gradMonth) && filled++;
    selGrad(byName('shikbn'), userData.gradType) && filled++;

    return filled;
  }

  // ===================================================================
  // axol型
  // ===================================================================
  if (/axol/.test(host)) {
    const map = {
      kanji_sei: userData.lastName, kanji_na: userData.firstName,
      kana_sei: userData.lastNameKana, kana_na: userData.firstNameKana,
      jushog1: userData.city, jushog2: userData.street, jushog3: userData.building,
      email: userData.email, email2: userData.email
    };
    Object.entries(map).forEach(([n,v]) => { if (setVal(byName(n), v)) filled++; });
    if (userData.subEmail) { setVal(byName('kmail'), userData.subEmail) && filled++; setVal(byName('kmail2'), userData.subEmail) && filled++; }
    selRadioByLabel('sex', userData.gender) && filled++;
    const zp = splitZip(userData.zipCode);
    if (zp) { setVal(byName('yubing_h'), zp[0]) && filled++; setVal(byName('yubing_l'), zp[1]) && filled++; }
    const tp = splitTel(userData.homePhone);
    if (tp) { ['telg_h','telg_m','telg_l'].forEach((n,i)=> setVal(byName(n), tp[i]) && filled++); }
    const mp = splitTel(userData.mobile);
    if (mp) { ['keitai_h','keitai_m','keitai_l'].forEach((n,i)=> setVal(byName(n), mp[i]) && filled++); }
    if (userData.sameAsCurrentAddr === 'yes') { if (checkBox('jushosame')) filled++; }
    selNum(byName('birth_Y'), userData.birthYear) && filled++;
    selNum(byName('birth_m'), userData.birthMonth) && filled++;
    selNum(byName('birth_d'), userData.birthDay) && filled++;
    selText(byName('keng'), userData.prefecture) && filled++;
    selNum(byName('school_to_Y'), userData.gradYear) && filled++;
    selNum(byName('school_to_m'), userData.gradMonth) && filled++;
    return filled;
  }

  // ===================================================================
  // 汎用フォールバック（未対応ATS用。7-8割カバー）
  // ===================================================================
  const getLabel = (el) => {
    let t = (el.placeholder || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.name || '');
    if (el.id) { const lb = document.querySelector(`label[for="${el.id}"]`); if (lb) t += ' ' + lb.textContent; }
    const lp = el.closest('label'); if (lp) t += ' ' + lp.textContent;
    const row = el.closest('tr, dd, .formbox, [class*="row"], [class*="field"], dl, li');
    if (row) { const h = row.querySelector('th, dt, label, [class*="head"], [class*="title"], [class*="label"]'); if (h && h!==el) t += ' ' + h.textContent; }
    return t.replace(/\s/g, '');
  };
  const inputs = [...document.querySelectorAll('input[type="text"], input:not([type]), input[type="email"], input[type="tel"], textarea')]
    .filter(el => el.offsetParent !== null && el.type !== 'hidden');
  inputs.forEach(el => {
    if (el.value) return;
    const L = getLabel(el);
    const nm = (el.name || '').toLowerCase();
    if (/頭文字|initial/.test(L)) return;
    if (/郵便|yubin|zip|postal/.test(L) && !/休暇|連絡先/.test(L)) {
      if (/_h$/.test(nm)) { const p=splitZip(userData.zipCode); if(p) setVal(el,p[0])&&filled++; return; }
      if (/_l$/.test(nm)) { const p=splitZip(userData.zipCode); if(p) setVal(el,p[1])&&filled++; return; }
      if (userData.zipCode) setVal(el, userData.zipCode.replace(/[^0-9-]/g,''))&&filled++; return;
    }
    if (/電話|tel|keitai|携帯/.test(L) && !/アドレス|mail|メール/.test(L) && !/休暇|連絡先/.test(L)) {
      const mob = /携帯|keitai/.test(L); const v = mob ? userData.mobile : userData.homePhone;
      const p = splitTel(v); if(!p) return;
      if (/_h$/.test(nm)) { setVal(el,p[0])&&filled++; return; }
      if (/_m$/.test(nm)) { setVal(el,p[1])&&filled++; return; }
      if (/_l$/.test(nm)) { setVal(el,p[2])&&filled++; return; }
      if (v) setVal(el, v.replace(/[^0-9-]/g,''))&&filled++; return;
    }
    if (/mail|メール/.test(L) && userData.email) {
      if (/account/.test(nm)) { setVal(el, mailParts(userData.email)[0])&&filled++; return; }
      if (/domain/.test(nm)) { setVal(el, mailParts(userData.email)[1])&&filled++; return; }
      setVal(el, userData.email)&&filled++; return;
    }
    if (/カナ姓|kana_sei|セイ/.test(L) || (/カナ|kana/.test(L)&&/姓/.test(L))) { setVal(el,userData.lastNameKana)&&filled++; return; }
    if (/カナ名|kana_na|メイ/.test(L) || (/カナ|kana/.test(L)&&/名/.test(L))) { setVal(el,userData.firstNameKana)&&filled++; return; }
    if (/漢字姓|kanji_sei/.test(L) || (/姓/.test(L)&&!/カナ|kana/.test(L)&&!/名/.test(L))) { setVal(el,userData.lastName)&&filled++; return; }
    if (/漢字名|kanji_na/.test(L) || (/名/.test(L)&&!/カナ|kana|氏名|姓|建物|学校|大学|頭文字/.test(L))) { setVal(el,userData.firstName)&&filled++; return; }
    if (/建物|部屋|マンション|アパート/.test(L) && !/休暇/.test(L)) { setVal(el,userData.building)&&filled++; return; }
    if (/市区|町村/.test(L) && !/休暇/.test(L)) { setVal(el,userData.city||userData.address)&&filled++; return; }
    if (/町域|番地/.test(L) && !/休暇/.test(L)) { setVal(el,userData.street)&&filled++; return; }
    if (/現住所|住所/.test(L) && !/郵便|電話|mail|建物|休暇/.test(L)) { setVal(el,(userData.city||'')+(userData.street||'')||userData.address)&&filled++; return; }
    if (/学科|学部|gakubu|gakka/.test(L)) { setVal(el,userData.faculty)&&filled++; return; }
    if (/大学|学校|university|school/.test(L) && !/区分|頭文字/.test(L)) { setVal(el,userData.university)&&filled++; return; }
    if (/ゼミ|研究室/.test(L) && !/サークル/.test(L)) { setVal(el,userData.zemi)&&filled++; return; }
    if (/サークル|クラブ|部活/.test(L)) { setVal(el,userData.circle)&&filled++; return; }
  });
  document.querySelectorAll('select').forEach(sel => {
    const L = getLabel(sel);
    if (/都道府県|prefecture/.test(L) && !sel.value) selText(sel, userData.prefecture) && filled++;
  });
  const rows = new Set();
  document.querySelectorAll('select').forEach(s => { const r=s.closest('tr,dd,.formbox,[class*="row"],[class*="field"],dl,li'); if(r) rows.add(r); });
  rows.forEach(row => {
    const h = row.querySelector('th,dt,label,[class*="head"],[class*="title"],[class*="label"]');
    const L = (h?h.textContent:row.textContent.slice(0,20)).replace(/\s/g,'');
    const ss = [...row.querySelectorAll('select')].filter(s=>s.options.length>1);
    if (/生年月日|誕生|birth/.test(L) && ss.length>=3 && !ss[0].value) {
      selNum(ss[0],userData.birthYear)&&filled++; selNum(ss[1],userData.birthMonth)&&filled++; selNum(ss[2],userData.birthDay)&&filled++;
    } else if (/卒業/.test(L) && ss.length>=2 && !ss[0].value) {
      selNum(ss[0],userData.gradYear)&&filled++; selNum(ss[1],userData.gradMonth)&&filled++;
      if (ss[2] && userData.gradType) selGrad(ss[2],userData.gradType)&&filled++;
    }
  });
  return filled;
}