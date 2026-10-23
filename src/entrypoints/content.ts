import { detectField, uniqueKinds } from '../core/detector';
import { assessRisk, levelAtLeast } from '../core/risk';
import type { Detection, FieldMeta, PageContext, RiskResult } from '../core/types';
import type { Msg, ScanSummary } from '../lib/messages';
import { getSettings, setTrusted } from '../lib/settings';

const HIGHLIGHT_ATTR = 'data-pii-guard';
const COLORS = {
  low: '#2563eb', medium: '#d97706', high: '#ea580c', critical: '#dc2626', none: '#6b7280',
} as const;
const LEVEL_TEXT = { none: 'Aman', low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' } as const;

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  async main() {
    const host = location.hostname;
    let result: RiskResult = { score: 0, level: 'none', kinds: [], reasons: [] };
    let dismissed = false;
    let lastSignature = '';

    injectHighlightStyle();

    // ---- Mengumpulkan METADATA field (tidak pernah membaca .value) ----
    function labelOf(el: HTMLElement): string {
      const parts: string[] = [];
      const labels = (el as HTMLInputElement).labels;
      if (labels) labels.forEach((l) => parts.push(l.textContent ?? ''));
      const by = el.getAttribute('aria-labelledby');
      if (by) by.split(/\s+/).forEach((id) => parts.push(document.getElementById(id)?.textContent ?? ''));
      if (!parts.length) parts.push(el.closest('label')?.textContent ?? '');
      return parts.join(' ').trim().slice(0, 120);
    }

    function metaOf(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): FieldMeta {
      const input = el as HTMLInputElement;
      return {
        name: el.getAttribute('name') ?? undefined,
        id: el.id || undefined,
        placeholder: el.getAttribute('placeholder') ?? undefined,
        label: labelOf(el),
        ariaLabel: el.getAttribute('aria-label') ?? undefined,
        autocomplete: el.getAttribute('autocomplete') ?? undefined,
        type: el instanceof HTMLInputElement ? input.type : el.tagName.toLowerCase(),
        accept: el.getAttribute('accept') ?? undefined,
        nearbyText: (el.parentElement?.textContent ?? '').trim().slice(0, 120),
      };
    }

    function actionHosts(): string[] {
      const hosts: string[] = [];
      document.querySelectorAll('form').forEach((f) => {
        try {
          const a = f.getAttribute('action');
          if (a) hosts.push(new URL(a, location.href).hostname);
        } catch { /* abaikan action tidak valid */ }
      });
      return hosts;
    }

    function scan() {
      clearHighlights();
      const detections: (Detection | null)[] = [];
      document
        .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')
        .forEach((el) => {
          const d = detectField(metaOf(el));
          detections.push(d);
          if (d && d.severity >= 2) el.setAttribute(HIGHLIGHT_ATTR, '1');
        });

      const kinds = uniqueKinds(detections);
      const ctx: PageContext = {
        isHttps: location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1',
        pageHost: host,
        formActionHosts: actionHosts(),
      };
      result = assessRisk(kinds, ctx);
      console.log('[PII Guard]', result.level, result.score, result.kinds.map(k => k.kind));

      const signature = result.level + ':' + kinds.map((k) => k.kind).join(',') + ':' + result.reasons.length;
      if (signature !== lastSignature) {
        lastSignature = signature;
        dismissed = false;
        browser.runtime.sendMessage({ type: 'badge', level: result.level, count: kinds.length } satisfies Msg).catch(() => {});
        void render();
      }
    }

    // ---- UI banner (Shadow DOM supaya CSS situs tidak mengganggu) ----
    let hostEl: HTMLElement | null = null;

    async function render() {
      const settings = await getSettings();
      const trusted = settings.trustedHosts.includes(host);
      removeBanner();
      if (trusted || dismissed || !levelAtLeast(result.level, settings.minLevel) || result.level === 'none') return;
      showBanner(result);
    }

    function removeBanner() {
      hostEl?.remove();
      hostEl = null;
    }

    function showBanner(r: RiskResult) {
      hostEl = document.createElement('div');
      hostEl.style.cssText = 'all:initial;position:fixed;top:16px;right:16px;z-index:2147483647;';
      const root = hostEl.attachShadow({ mode: 'closed' });
      const color = COLORS[r.level];

      const style = document.createElement('style');
      style.textContent = `
        .card{font:14px/1.45 system-ui,sans-serif;width:340px;max-height:80vh;overflow:auto;background:#fff;color:#111827;
          border:1px solid #e5e7eb;border-left:6px solid ${color};border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);padding:14px}
        .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .title{font-weight:700;font-size:15px}
        .badge{background:${color};color:#fff;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600}
        ul{margin:6px 0 8px;padding-left:18px}
        li{margin:2px 0}
        .edu{color:#374151;font-size:13px;margin:8px 0;padding:8px;background:#f3f4f6;border-radius:6px}
        .reasons li{color:#991b1b}
        .actions{display:flex;gap:8px;margin-top:10px}
        button{flex:1;font:inherit;font-size:13px;padding:7px 8px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer}
        button.primary{background:#111827;color:#fff;border-color:#111827}
        .foot{margin-top:8px;font-size:11px;color:#6b7280}`;
      root.appendChild(style);

      const card = el('div', 'card');
      const head = el('div', 'head');
      head.append(el('span', 'title', 'PII Guard: form ini meminta data pribadi'), el('span', 'badge', LEVEL_TEXT[r.level]));
      card.appendChild(head);

      const list = el('ul');
      r.kinds.forEach((k) => list.appendChild(el('li', '', k.label + (k.specific ? ' (data spesifik)' : ''))));
      card.appendChild(list);

      if (r.reasons.length) {
        const rs = el('ul', 'reasons');
        r.reasons.forEach((t) => rs.appendChild(el('li', '', t)));
        card.appendChild(rs);
      }
      const top = r.kinds[0];
      if (top) card.appendChild(el('div', 'edu', top.edu));

      const actions = el('div', 'actions');
      const close = el('button', '', 'Tutup');
      close.onclick = () => { dismissed = true; removeBanner(); };
      const trust = el('button', 'primary', 'Percayai situs ini');
      trust.onclick = async () => { await setTrusted(host, true); removeBanner(); };
      actions.append(close, trust);
      card.appendChild(actions);
      card.appendChild(el('div', 'foot', 'Dianalisis lokal. Isi yang kamu ketik tidak pernah dibaca.'));

      root.appendChild(card);
      document.documentElement.appendChild(hostEl);
    }

    // ---- Pesan dari popup ----
    browser.runtime.onMessage.addListener((msg: Msg, _s, sendResponse) => {
      if (msg.type === 'get-result') {
        getSettings().then((s) => {
          sendResponse({ host, trusted: s.trustedHosts.includes(host), result } satisfies ScanSummary);
        });
        return true; // respons asinkron
      }
    });

    // Render ulang ketika pengaturan berubah (mis. situs dipercaya lewat popup)
    browser.storage.onChanged.addListener(() => { void render(); });

    // ---- Jalankan otomatis + pantau form dinamis (SPA, modal) ----
    scan();
    let timer: number | undefined;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(scan, 600);
    }).observe(document.documentElement, { childList: true, subtree: true });
  },
});

// ---------- util ----------
function el(tag: string, cls = '', text = ''): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function injectHighlightStyle() {
  if (document.getElementById('pii-guard-style')) return;
  const s = document.createElement('style');
  s.id = 'pii-guard-style';
  s.textContent = `[${HIGHLIGHT_ATTR}]{outline:2px dashed #d97706 !important;outline-offset:2px !important;}`;
  document.head.appendChild(s);
}

function clearHighlights() {
  document.querySelectorAll(`[${HIGHLIGHT_ATTR}]`).forEach((n) => n.removeAttribute(HIGHLIGHT_ATTR));
}
