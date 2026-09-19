export type AboutSegment = { kind: 'text' | 'link'; value: string; label?: string };

export function aboutSegments(value: string): AboutSegment[] {
  const result: AboutSegment[] = [];
  const matcher = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let cursor = 0;
  for (const match of value.matchAll(matcher)) {
    if (match.index! > cursor)
      result.push({ kind: 'text', value: value.slice(cursor, match.index) });
    if (/^https?:\/\//i.test(match[2])) {
      result.push({ kind: 'link', label: match[1], value: match[2] });
    } else {
      result.push({ kind: 'text', value: match[0] });
    }
    cursor = match.index! + match[0].length;
  }
  if (cursor < value.length) result.push({ kind: 'text', value: value.slice(cursor) });
  return result;
}
