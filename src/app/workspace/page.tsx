'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, Block } from '@/store/useStore';
import { Timeline } from '@/components/workspace/Timeline';
import { Sidebar } from '@/components/workspace/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Copy, FileUp, ChevronDown, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';

export default function WorkspacePage() {
  const router = useRouter();
  const { schoolStage, subject, topic, blocks, setBlocks, initializeBlocks } = useStore();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeBlocks();
  }, [initializeBlocks]);

  const generateExportText = () => {
    return blocks.map((b, i) => {
      const timeRange = b.time || `${i * 5}-${(i + 1) * 5} min`;
      return `${timeRange} | ${b.type} | ${b.content || 'Kirjeldus puudub'}`;
    }).join('\n');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateExportText());
      alert('Tunnikava tekst kopeeritud!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadDocx = () => {
    // Värvide vastavustabel (Tailwind -> HEX)
    const colorMap: Record<string, string> = {
      'bg-red-300': '#fca5a5',      // Õpetaja teeb
      'bg-green-300': '#86efac',    // Individuaalselt
      'bg-yellow-300': '#fde047',   // Paarilisega
      'bg-blue-300': '#93c5fd',     // Grupis
      'bg-purple-300': '#d8b4fe',   // Üle ruumi arutelu
      'bg-slate-300': '#cbd5e1'
    };

    const blocksHtml = blocks.map((b, i) => {
      const bgColor = colorMap[b.colorClass || ''] || '#e2e8f0';
      const timeRange = b.time || `${i * 5}-${(i + 1) * 5} min`;
      const summary = b.content.length > 100 ? b.content.substring(0, 97) + '...' : b.content;
      
      return `
        <td style="width: 100pt; padding: 10pt; background-color: ${bgColor}; border: 1pt solid #94a3b8; vertical-align: top; border-radius: 4pt;">
          <div style="font-size: 9pt; font-weight: bold; color: #475569; margin-bottom: 4pt;">${timeRange}</div>
          <div style="font-size: 10pt; font-weight: 800; color: #1e293b; margin-bottom: 6pt;">${b.type}</div>
          <div style="font-size: 9pt; line-height: 1.2; color: #334155;">${summary}</div>
        </td>
      `;
    }).join('');

    const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Klotsitehnika Tunnikava</title>
      <style>
        /* Word landscape orientation support */
        @page Section1 { 
          size: 841.9pt 595.3pt; 
          mso-page-orientation: landscape; 
          margin: 0.5in 0.5in 0.5in 0.5in; 
        }
        div.Section1 { page: Section1; }
        
        body { font-family: 'Segoe UI', Calibri, sans-serif; }
        h1 { color: #1e3a8a; font-size: 22pt; margin-bottom: 5pt; }
        .header { color: #64748b; font-size: 11pt; margin-bottom: 15pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 10pt; }
        table { border-collapse: separate; border-spacing: 4pt; width: 100%; table-layout: fixed; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h1>${topic || 'Tunnikava'}</h1>
        <div class="header">
          <strong>Aine:</strong> ${subject} | <strong>Klass:</strong> ${schoolStage} | <strong>Kestus:</strong> ${blocks.length * 5} min
        </div>
        
        <table>
          <tr>
            ${blocks.slice(0, blocks.length > 9 ? Math.ceil(blocks.length / 2) : blocks.length).map((b, i) => {
              const bgColor = colorMap[b.colorClass || ''] || '#e2e8f0';
              const timeRange = b.time || `${i * 5}-${(i + 1) * 5} min`;
              const summary = b.content.length > 100 ? b.content.substring(0, 97) + '...' : b.content;
              return `
                <td style="width: 80pt; padding: 8pt; background-color: ${bgColor}; border: 1pt solid #94a3b8; vertical-align: top; border-radius: 4pt;">
                  <div style="font-size: 8pt; font-weight: bold; color: #475569; margin-bottom: 2pt;">${timeRange}</div>
                  <div style="font-size: 9pt; font-weight: 800; color: #1e293b; margin-bottom: 4pt;">${b.type}</div>
                  <div style="font-size: 8pt; line-height: 1.1; color: #334155;">${summary}</div>
                </td>
              `;
            }).join('')}
          </tr>
          ${blocks.length > 9 ? `
          <tr>
            ${blocks.slice(Math.ceil(blocks.length / 2)).map((b, i) => {
              const localIdx = i + Math.ceil(blocks.length / 2);
              const bgColor = colorMap[b.colorClass || ''] || '#e2e8f0';
              const timeRange = b.time || `${localIdx * 5}-${(localIdx + 1) * 5} min`;
              const summary = b.content.length > 100 ? b.content.substring(0, 97) + '...' : b.content;
              return `
                <td style="width: 80pt; padding: 8pt; background-color: ${bgColor}; border: 1pt solid #94a3b8; vertical-align: top; border-radius: 4pt;">
                  <div style="font-size: 8pt; font-weight: bold; color: #475569; margin-bottom: 2pt;">${timeRange}</div>
                  <div style="font-size: 9pt; font-weight: 800; color: #1e293b; margin-bottom: 4pt;">${b.type}</div>
                  <div style="font-size: 8pt; line-height: 1.1; color: #334155;">${summary}</div>
                </td>
              `;
            }).join('')}
          </tr>` : ''}
        </table>

        <div style="margin-top: 25pt; font-size: 9pt; color: #94a3b8; font-style: italic;">
          Genereeritud Klotsitehnika planeerijaga • 45-minutiline visuaalne ajatelg
        </div>
      </div>
    </body>
    </html>
    `;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Klotsikava_${topic?.replace(/\s+/g, '_') || 'Tunnikava'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHtml = () => {
    const colorMap: Record<string, string> = {
      'bg-red-300': '#fca5a5',
      'bg-green-300': '#86efac',
      'bg-yellow-300': '#fde047',
      'bg-blue-300': '#93c5fd',
      'bg-purple-300': '#d8b4fe',
      'bg-slate-300': '#cbd5e1'
    };
 
    const blocksHtml = blocks.map((b, i) => {
      const bgColor = b.colorClass || 'bg-slate-300';
      const timeRange = b.time || `${i * 5}-${(i + 1) * 5} min`;
      
      return `
        <div class="block-item group border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer" onclick="toggleBlock(this)">
          <div class="h-4 ${bgColor} w-full border-b border-slate-100 italic"></div>
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">${timeRange}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">${b.type}</span>
            </div>
            <h3 class="text-lg font-extrabold text-slate-800 leading-tight mb-2">${b.content.split('\n')[0].replace(/#/g, '')}</h3>
            <div class="content-preview text-slate-500 text-sm line-clamp-2">
              ${b.content}
            </div>
            <div class="content-full hidden mt-4 pt-4 border-t border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
              ${b.content}
            </div>
          </div>
        </div>
      `;
    }).join('');
 
    const html = `
 <!DOCTYPE html>
 <html lang="et">
 <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Tunnikava: ${topic || 'Interaktiivne vaade'}</title>
     <script src="https://cdn.tailwindcss.com"></script>
     <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
     <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
     <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script>
     <style>
         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
         body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
         .block-item.active { grid-column: span 3; }
         .block-item.active .content-preview { display: none; }
         .block-item.active .content-full { display: block; }
         @media print {
             body { background: white; padding: 0; }
             .no-print { display: none; }
             .content-full { display: block !important; }
             .content-preview { display: none !important; }
             .block-item { break-inside: avoid; border: 1px solid #e2e8f0 !important; margin-bottom: 2rem; box-shadow: none !important; }
             .grid { display: block !important; }
         }
     </style>
 </head>
 <body class="p-8 md:p-16">
     <div class="max-w-6xl mx-auto">
         <header class="mb-12 border-b-2 border-slate-200 pb-8 flex justify-between items-end">
             <div>
                 <h1 class="text-4xl font-black text-slate-900 mb-2">${topic || 'Nimetu tunnikava'}</h1>
                 <p class="text-slate-500 font-medium">
                     ${subject} • ${schoolStage} • ${blocks.length * 5} minutit
                 </p>
             </div>
             <div class="text-right no-print">
                 <button onclick="window.print()" class="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">Trüki / Salvesta PDF</button>
             </div>
         </header>
 
         <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
             ${blocksHtml}
         </div>
 
         <footer class="mt-24 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm italic no-print">
             Loodud Klotsitehnikaga – interaktiivne tunniplaneerimise tööriist
         </footer>
     </div>
 
     <script>
         function toggleBlock(el) {
             const wasActive = el.classList.contains('active');
             // Close all other blocks
             document.querySelectorAll('.block-item').forEach(b => b.classList.remove('active'));
             // Toggle current if it wasn't active
             if (!wasActive) {
                 el.classList.add('active');
                 el.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
         }
 
         document.addEventListener("DOMContentLoaded", function() {
             renderMathInElement(document.body, {
                 delimiters: [
                     {left: "$$", right: "$$", display: true},
                     {left: "$", right: "$", display: false}
                 ]
             });
         });
     </script>
 </body>
 </html>
     `;
     
     const blob = new Blob([html], { type: 'text/html' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `Tunnikava_${topic?.replace(/\s+/g, '_') || 'Interaktiivne'}.html`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
   };

  // Legacy local parser removed in favor of AI API

  const parseAndImportBlocks = async () => {
    if (!importText.trim()) return;
    
    setIsImporting(true);
    try {
      const response = await fetch('/api/parse-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: importText,
          duration: (blocks.length * 5) || 45
        }),
      });

      if (!response.ok) throw new Error('AI analüüs ebaõnnestus');
      
      const newBlocks = await response.json();
      setBlocks(newBlocks);
      setIsImportOpen(false);
      setImportText('');
      alert('Klotsid edukalt genereeritud tehisaru poolt!');
    } catch (error) {
      console.error(error);
      alert('Viga: Tehisaru ei saanud kava analüüsida. Kontrolli, kas GEMINI_API_KEY on .env failis olemas.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-10 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {topic || 'Pealkirjata tund'}
            </h1>
            <p className="text-sm text-slate-500">
              {schoolStage && subject ? `${schoolStage} • ${subject}` : 'Andmed puuduvad'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2">
              <FileUp className="h-4 w-4" />
              Impordi oma kava
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Impordi kava tunniklotsideks</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-slate-500">
                  Kleebi siia oma vabas vormis tunni kava (nt "Häälestus 5 min, Individuaalne töö 10 min..."). 
                  Süsteem üritab seda analüüsida ja laiali jagada.
                </p>
                <Textarea 
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Kleebi oma kava tekst siia..."
                  className="h-48 resize-none"
                />
                <Button 
                  onClick={parseAndImportBlocks} 
                  disabled={isImporting || !importText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analüüsin kava...
                    </>
                  ) : (
                    'Loo klotsid'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2 bg-green-600 hover:bg-green-700 text-white h-9 px-4 py-2">
              Eksport
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleCopyText} className="cursor-pointer">
                <Copy className="mr-2 h-4 w-4" /> Kopeeri tekst
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadDocx} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" /> Laadi alla (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadHtml} className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Interaktiivne HTML (.html)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-hidden flex flex-col items-center">
        <div className="w-full max-w-[1200px] mt-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 px-2">Ajatelg (45 minutit)</h2>
          <Timeline 
            onBlockClick={(id) => setSelectedBlockId(id)} 
            selectedBlockId={selectedBlockId}
          />
          <p className="text-sm text-slate-400 mt-4 px-2 text-center">
            Pukseeri klotse horisontaalsel teljel nende järjekorra muutmiseks. Seadete avamiseks klõpsa klotsil.
          </p>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 px-4 py-4 bg-white/50 rounded-xl border border-slate-100">
            {[
              { label: "Õpetaja teeb", color: "bg-red-300" },
              { label: "Individuaalselt", color: "bg-green-300" },
              { label: "Paarilisega", color: "bg-yellow-300" },
              { label: "Grupis", color: "bg-blue-300" },
              { label: "Üle ruumi arutelu", color: "bg-purple-300" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-sm ${item.color} shadow-sm`} />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Sidebar */}
      <Sidebar 
        selectedBlockId={selectedBlockId} 
        onClose={() => setSelectedBlockId(null)} 
      />
    </div>
  );
}
