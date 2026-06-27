/** Megosztási szöveg és Open Graph meta — szerver + Facebook crawler */

export function getEpisodeShareSummary(episode, maxLen = 220) {
  const teaser = episode.teaser?.trim();
  if (teaser) return teaser;

  const thought = episode.thought?.trim();
  if (thought) {
    const firstBlock = thought.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
    if (firstBlock.length <= maxLen) return firstBlock;
    return `${firstBlock.slice(0, maxLen - 1).trim()}…`;
  }

  const question = episode.question?.trim();
  if (question) {
    if (question.length <= maxLen) return question;
    return `${question.slice(0, maxLen - 1).trim()}…`;
  }

  return '';
}

export function buildEpisodeShareMeta(series, episode, baseUrl) {
  const root = baseUrl.replace(/\/$/, '');
  const title = `${episode.title} — ${series.title} (${episode.day}. nap)`;
  const description =
    getEpisodeShareSummary(episode) ||
    series.description?.trim() ||
    'IFIge – heti lelki minisorozatok fiataloknak';
  const url = `${root}/series/${series.slug}/episode/${episode.day}`;
  const imagePath = episode.image?.trim() || series.coverImage?.trim() || '/ifige-wordmark.png';
  const image = imagePath.startsWith('http') ? imagePath : `${root}${imagePath}`;

  return { title, description, url, image };
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function injectOgTags(html, meta) {
  const e = escapeHtmlAttr;
  const tags = [
    `<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    '<meta property="og:type" content="article" />',
    '<meta property="og:site_name" content="IFIge" />',
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:url" content="${e(meta.url)}" />`,
    `<meta property="og:image" content="${e(meta.image)}" />`,
    '<meta property="og:locale" content="hu_HU" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(meta.image)}" />`,
  ].join('\n    ');

  let out = html.replace(/<title>[^<]*<\/title>\s*/i, '');
  out = out.replace(/<meta name="description"[^>]*>\s*/i, '');
  return out.replace('</head>', `    ${tags}\n  </head>`);
}

export const EPISODE_PATH_RE = /^\/series\/([^/]+)\/episode\/(\d+)\/?$/;

export function parseEpisodePath(pathname) {
  const match = pathname.match(EPISODE_PATH_RE);
  if (!match) return null;
  return { slug: decodeURIComponent(match[1]), day: parseInt(match[2], 10) };
}

export function getRequestBaseUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost';
  return `${proto}://${host}`;
}
