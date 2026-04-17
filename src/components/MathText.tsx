import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
}

export function MathText({ text }: MathTextProps) {
  const html = useMemo(() => {
    if (!text) return '';
    const parts = text.split('$');
    if (parts.length <= 1) return escapeHtml(text).replace(/\n/g, '<br/>');

    let res = '';
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        try {
          res += katex.renderToString(parts[i], { throwOnError: false });
        } catch (e) {
          res += parts[i];
        }
      } else {
        res += escapeHtml(parts[i]).replace(/\n/g, '<br/>');
      }
    }
    return res;
  }, [text]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
