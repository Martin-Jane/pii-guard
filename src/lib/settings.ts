import { browser } from 'wxt/browser';
import type { Level } from '../core/types';

export interface Settings {
  /** Banner hanya muncul bila level risiko >= nilai ini */
  minLevel: Level;
  trustedHosts: string[];
  recruitmentMode: boolean;
  opsecMode: boolean;
}

export const DEFAULTS: Settings = { minLevel: 'medium', trustedHosts: [], recruitmentMode: true, opsecMode: true };

export async function getSettings(): Promise<Settings> {
  const s = await browser.storage.local.get(['minLevel', 'trustedHosts', 'recruitmentMode', 'opsecMode']);
  return {
    minLevel: (s.minLevel as Level) ?? DEFAULTS.minLevel,
    trustedHosts: (s.trustedHosts as string[]) ?? [],
    recruitmentMode: (s.recruitmentMode as boolean) ?? true,
    opsecMode: (s.opsecMode as boolean) ?? true,
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

export async function setMode(key: 'recruitmentMode' | 'opsecMode', value: boolean) {
  await browser.storage.local.set({ [key]: value });
}
