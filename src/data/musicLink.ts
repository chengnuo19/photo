import type { MusicPlatform } from './schema';

export const PLATFORM_NAMES: Record<MusicPlatform, string> = {
  netease: '网易云音乐',
  qq: 'QQ 音乐',
  kugou: '酷狗音乐',
  kuwo: '酷我音乐',
  apple: 'Apple Music',
  spotify: 'Spotify',
  other: '音乐 App',
};

const HOSTS: [RegExp, MusicPlatform][] = [
  [/(^|\.)(music\.163\.com|163cn\.tv|163\.com)$/, 'netease'],
  [/(^|\.)(y\.qq\.com|qq\.com)$/, 'qq'],
  [/(^|\.)kugou\.com$/, 'kugou'],
  [/(^|\.)kuwo\.cn$/, 'kuwo'],
  [/(^|\.)music\.apple\.com$/, 'apple'],
  [/(^|\.)(open\.)?spotify\.com$|(^|\.)spotify\.link$/, 'spotify'],
];

/**
 * Read what someone pasted from a music app's "share" button — usually a sentence with the
 * song name and a link ("分享歌手的单曲《晴天》: https://163cn.tv/xxxx (来自@网易云音乐)").
 */
export function parseSongLink(text: string): { url: string; title?: string; platform: MusicPlatform } | null {
  const m = text.match(/https?:\/\/[^\s"'<>，。）)】]+/i);
  if (!m) return null;
  let url: URL;
  try {
    url = new URL(m[0]);
  } catch {
    return null;
  }
  const platform = HOSTS.find(([re]) => re.test(url.hostname))?.[1] ?? 'other';
  const title = text.match(/《([^》]{1,60})》/)?.[1]?.trim();
  return { url: url.href, title, platform };
}
