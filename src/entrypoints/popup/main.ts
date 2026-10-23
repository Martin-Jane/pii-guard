import { browser } from 'wxt/browser';
import type { Level } from '../../core/types';
import type { ScanSummary } from '../../lib/messages';
import { getSettings, setMinLevel, setTrusted } from '../../lib/settings';

const COLORS: Record<Level, string> = { none: '#16a34a', low: '#2563eb', medium: '#d97706', high: '#ea580c', critical: '#dc2626' };
const TEXT: Record<Level, string> = { none: 'Aman', low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' };

const app = document.getElementById('app')!;

function h(tag: string, props: Record<string, any> = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  kids.forEach((k) => e.append(k));
  return e;
}

async function main() {
  const settings = await getSettings();
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  let summary: ScanSummary | null = null;
  try {
    if (tab?.id) summary = await browser.tabs.sendMessage(tab.id, { type: 'get-result' });
  } catch { /* halaman tidak bisa dipindai (chrome://, store, dll) */ }

  app.replaceChildren(h('h1', {}, 'PII Guard'));

  if (!summary) {
    app.append(h('p', { className: 'muted' }, 'Halaman ini tidak dapat dipindai (halaman khusus browser, atau belum selesai dimuat). Coba muat ulang.'));
  } else {
    const { result, host, trusted } = summary;
    app.append(
      h('div', {}, h('span', { className: 'pill', style: `background:${COLORS[result.level]}` }, TEXT[result.level]),
        ` skor ${result.score}/100`),
      h('p', { className: 'muted' }, host + (trusted ? ' (dipercaya)' : '')),
    );
    if (result.kinds.length) {
      const ul = h('ul');
      result.kinds.forEach((k) => ul.append(h('li', {}, k.label)));
      app.append(h('div', {}, `${result.kinds.length} jenis data diminta:`), ul);
    } else {
      app.append(h('p', {}, 'Tidak ada permintaan data pribadi terdeteksi di halaman ini.'));
    }
    if (result.reasons.length) {
      const ul = h('ul', { className: 'red' });
      result.reasons.forEach((r) => ul.append(h('li', {}, r)));
      app.append(ul);
    }
    const btn = h('button', {}, trusted ? 'Batalkan kepercayaan situs ini' : 'Percayai situs ini');
    btn.addEventListener('click', async () => { await setTrusted(host, !trusted); main(); });
    app.append(btn);
  }

  const sel = h('select') as HTMLSelectElement;
  (['low', 'medium', 'high', 'critical'] as Level[]).forEach((l) => {
    const o = h('option', { value: l, selected: settings.minLevel === l }, TEXT[l]) as HTMLOptionElement;
    sel.append(o);
  });
  sel.addEventListener('change', () => setMinLevel(sel.value as Level));
  app.append(h('hr'), h('label', {}, 'Tampilkan banner mulai level: ', sel),
    h('p', { className: 'muted' }, 'Dianalisis lokal. Data yang kamu ketik tidak pernah dibaca.'));
}

main();
