import type { Msg } from '../lib/messages';

const COLORS: Record<string, string> = {
  low: '#2563eb', medium: '#d97706', high: '#ea580c', critical: '#dc2626',
};

export default defineBackground(() => {
  // Content script mengirim ringkasan; background hanya memasang badge di ikon.
  browser.runtime.onMessage.addListener((msg: Msg, sender) => {
    if (msg.type !== 'badge' || !sender.tab?.id) return;
    const tabId = sender.tab.id;
    if (msg.level === 'none') {
      browser.action.setBadgeText({ tabId, text: '' });
      return;
    }
    browser.action.setBadgeText({ tabId, text: String(msg.count) });
    browser.action.setBadgeBackgroundColor({ tabId, color: COLORS[msg.level] ?? '#666' });
  });
});
