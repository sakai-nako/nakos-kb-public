export type Segment = {
  kind: 'text' | 'ruby' | 'dots' | 'link';
  value: string;
  annotation?: string;
};
export function segments(value: string): Segment[] {
  const out: Segment[] = [];
  const re = /(https?:\/\/[^\s]+)|[|｜]([^《\n]+)《([^》\n]+)》|《《([^》\n]+)》》/g;
  let at = 0;
  for (const match of value.matchAll(re)) {
    if (match.index! > at) out.push({ kind: 'text', value: value.slice(at, match.index) });
    if (match[1]) out.push({ kind: 'link', value: match[1] });
    else if (match[4]) out.push({ kind: 'dots', value: match[4] });
    else out.push({ kind: 'ruby', value: match[2], annotation: match[3] });
    at = match.index! + match[0].length;
  }
  if (at < value.length) out.push({ kind: 'text', value: value.slice(at) });
  return out;
}
