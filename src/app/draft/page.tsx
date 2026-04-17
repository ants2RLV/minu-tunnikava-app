'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Copy, Download, LayoutDashboard, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DraftPage() {
  const router = useRouter();
  const { draftContent, setBlocks, topic, subject, schoolStage, duration } = useStore();
  const [mounted, setMounted] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Teksti puhastamine ja Wordi-ühilduvaks muutmine
  const processContentForWord = (markdown: string) => {
    let html = markdown;

    // 1. PUHASTUS: LaTeX ja matemaatilised sümbolid
    html = html
      .replace(/\$/g, '') // Eemalda $ sümbolid
      .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2') // \frac{1}{2} -> 1/2
      .replace(/\\sqrt\{(.+?)\}/g, '√$1') // \sqrt{x} -> √x
      .replace(/\\cdot/g, '·') // \cdot -> ·
      .replace(/\s\*\s/g, ' · ') // Üksik * -> · (korrutusmärgi jaoks)
      .replace(/\^2/g, '²') // Astmed
      .replace(/\^3/g, '³')
      .replace(/x-väärtused/g, 'x väärtused') // Sidekriipsude parandus
      .replace(/y-väärtused/g, 'y väärtused')
      .replace(/(\d)-(\d)/g, '$1–$2') // Arvude vahelised miinused -> mõttekriips
      .replace(/\s-\s/g, ' – ') // Ümbritsetud miinused -> mõttekriips
      .replace(/\(-(\d+)\)/g, '(–$1)'); // Sulu sees miinused

    // 2. TABELITE TUVASTAMINE (Coordinate tables)
    // Otsime ridu mis meenutavad: * Kui x = 0, siis y = -1
    const lines = html.split('\n');
    let inTable = false;
    let tableRows: string[] = [];
    const processedLines: string[] = [];

    lines.forEach(line => {
      const match = line.match(/Kui x\s?=\s?(-?\d+),\ssiis\sy\s?=\s?(.+?)\s?=\s?(-?\d+)/i) || 
                    line.match(/x\s?=\s?(-?\d+).*?y\s?=\s?(-?\d+)/i);
      
      if (match) {
        if (!inTable) {
          inTable = true;
          processedLines.push('<!-- TABLE_START -->');
        }
        const x = match[1];
        const y = match[match.length - 1]; // Võtame viimase numbri kui y
        tableRows.push(`<tr><td>${x}</td><td>${y}</td><td>(${x}; ${y})</td></tr>`);
      } else {
        if (inTable) {
          inTable = false;
          const tableHtml = `
            <table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse; width:100%; margin:15pt 0;">
              <tr style="background-color:#f1f5f9; font-weight:bold;">
                <td>x väärtus</td>
                <td>y väärtus</td>
                <td>Punkt (x; y)</td>
              </tr>
              ${tableRows.join('')}
            </table>
          `;
          processedLines.push(tableHtml);
          tableRows = [];
        }
        processedLines.push(line);
      }
    });
    // Kui fail lõppes tabeliga
    if (inTable) {
      const tableHtml = `<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse; width:100%; margin:15pt 0;"><tr style="background-color:#f1f5f9; font-weight:bold;"><td>x</td><td>y</td><td>P (x; y)</td></tr>${tableRows.join('')}</table>`;
      processedLines.push(tableHtml);
    }

    html = processedLines.join('\n');

    // 3. MARKDOWN TO HTML (Simple converter for Word compatibility)
    html = html
      .replace(/^# (.*$)/gm, '<h1 style="color:#1e3a8a; font-size:24pt; font-family:Segoe UI, sans-serif; margin-bottom:10pt;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="color:#1e40af; font-size:18pt; font-family:Segoe UI, sans-serif; margin-top:15pt; margin-bottom:10pt;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="color:#2563eb; font-size:14pt; font-family:Segoe UI, sans-serif; margin-top:10pt;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\s*-\s+(.*$)/gm, '<li style="margin-bottom:5pt;">$1</li>');

    // Mähime listid ul-tagide vahele (lihtsustatud süsteem)
    html = html.replace(/(<li[\s\S]*<\/li>)/gm, '<ul style="margin-bottom:10pt;">$1</ul>');

    // Ülejäänud tekst p-tagide vahele
    html = html.split('\n').map(line => {
      if (!line.trim() || line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('<table') || line.startsWith('<!--')) {
        return line;
      }
      return `<p style="margin-bottom:10pt; line-height:1.5; font-family:Segoe UI, sans-serif;">${line}</p>`;
    }).join('\n');

    return html;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(draftContent);
      alert('Mustandi tekst kopeeritud lõikelauale!');
    } catch (err) {
      console.error('Kopeerimine ebaõnnestus', err);
    }
  };

  const handleDownloadDocx = () => {
    const processedHtml = processContentForWord(draftContent);

    const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Tunnikava: ${topic || 'Mustand'}</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, sans-serif; padding: 40px; }
        h1 { mso-style-name: "Heading 1"; }
        h2 { mso-style-name: "Heading 2"; }
        p, li { font-size: 11pt; color: #334155; }
        .meta { color: #64748b; font-style: italic; margin-bottom: 30pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 10pt; }
      </style>
    </head>
    <body>
      <h1 style="color:#1e3a8a; font-size:24pt;">Tunnikava: ${topic || 'Nimetu'}</h1>
      <div class="meta">
        <p>Aine: ${subject || '-'}</p>
        <p>Klass: ${schoolStage || '-'}</p>
        <p>Kestus: ${duration || '45'} min</p>
      </div>
      <div id="content">
        ${processedHtml}
      </div>
    </body>
    </html>
    `;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tunnikava_${topic?.replace(/\s+/g, '_') || 'Mustand'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenWorkspace = async () => {
    setIsOpening(true);
    try {
      const response = await fetch('/api/parse-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftContent }),
      });

      if (!response.ok) {
        alert('Tehisaru parsimine ebaõnnestus koormuse tõttu. Avaneb tühi ajatelg.');
        router.push('/workspace');
        return;
      }
      
      const newBlocks = await response.json();
      setBlocks(newBlocks);
      router.push('/workspace');
    } catch (error) {
      console.error(error);
      alert('Viga: Tehisaru ei saanud kava analüüsida ja klotse luua.');
    } finally {
      setIsOpening(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tunnikava Mustand</h1>
          <p className="text-slate-500">Kopeeri, laadi alla või liigu ajateljele.</p>
        </div>
        <Link href="/">
          <Button variant="ghost" className="text-slate-600 hover:bg-slate-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tagasi vormi juurde
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-lg p-8 sm:p-14 min-h-[600px] border border-slate-200">
        <style dangerouslySetInnerHTML={{__html: `
          .draft-paper { color: #334155; }
          .draft-paper h1 { font-size: 2.25rem; font-weight: 800; color: #1e3a8a; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
          .draft-paper h2 { font-size: 1.75rem; font-weight: 700; color: #1e40af; margin-top: 2.5rem; margin-bottom: 1rem; }
          .draft-paper h3 { font-size: 1.25rem; font-weight: 700; color: #3b82f6; margin-top: 1.5rem; margin-bottom: 0.5rem; }
          .draft-paper p { font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.25rem; }
          .draft-paper ul, .draft-paper ol { margin-left: 1.5rem; margin-bottom: 1.5rem; }
          .draft-paper li { line-height: 1.8; margin-bottom: 0.75rem; list-style-type: disc; }
          .draft-paper strong { font-weight: 700; color: #0f172a; }
        `}} />
        
        <div className="draft-paper max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {draftContent || '# Tunnikava puudub\n\nPalun täida vorm uuesti.'}
          </ReactMarkdown>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 shadow-lg border border-slate-200 rounded-xl">
        <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center">
          <Button onClick={handleCopyText} variant="outline" className="flex-1 md:flex-none py-6 border-blue-200 text-blue-700 hover:bg-blue-50">
            <Copy className="mr-2 h-5 w-5" />
            Kopeeri tekst
          </Button>
          <Button onClick={handleDownloadDocx} variant="outline" className="flex-1 md:flex-none py-6 border-blue-200 text-blue-700 hover:bg-blue-50">
            <Download className="mr-2 h-5 w-5" />
            Laadi alla (.doc)
          </Button>
        </div>

        <Button 
          onClick={handleOpenWorkspace} 
          disabled={isOpening || !draftContent}
          size="lg" 
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-8 px-12 shadow-xl hover:scale-105 transition-transform"
        >
          {isOpening ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loon visuaalset ajatelge...
            </>
          ) : (
            <>
              <LayoutDashboard className="mr-2 h-6 w-6" />
              Ava Klotsitehnikas
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
