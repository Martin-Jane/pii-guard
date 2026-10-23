import { browser } from 'wxt/browser';
import type { Level } from '../core/types';

export interface Settings {
  /** Banner hanya muncul bila level risiko >= nilai ini */
  minLevel: Level;
  trustedHosts: string[];
}

export const DEFAULTS: Settings = { minLevel: 'medium', trustedHosts: [] };

export async function getSettings(): Promise<Settings> {
  const s = await browser.storage.local.get(['minLevel', 'trustedHosts']);
  return {
    minLevel: (s.minLevel as Level) ?? DEFAULTS.minLevel,
    trustedHosts: (s.trustedHosts as string[]) ?? [],
  };
}

export async function setMinLevel(minLevel: Level) {
  await browser.storage.local.set({ minLevel });
}

export async function setTrusted(host: string, trusted: boolean) {
  const { trustedHosts } = await getSettings();
  const set = new Set(trustedHosts);
  trusted ? set.add(host) : set.delete(host);
  await browser.storage.local.set({ trustedHosts: [...set] });
}
