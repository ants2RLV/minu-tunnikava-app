import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const { text: inputText } = await request.json();
    if (!inputText) {
      return NextResponse.json({ error: 'Tekst on nõutud' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY puudub keskkonnamuutujatest (.env)' }, { status: 500 });
    }

    // Kasutame stabiilset v1 versiooni
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const prompt = `
Sinu ülesanne on analüüsida õpetaja tunnikava teksti ja jagada see TÄPSELT üheksaks 5-minutiliseks klotsiks (kokku 45 min). 
Iga klots peab olema JSON objekt massiivis, millel on järgnevad väljad:
- "id": (unikaalne string)
- "time": (nt '0-5 min')
- "type": (Vali üks: 'Ruumitöö', 'Loeng', 'Grupitöö', 'Indiv. töö', 'Paaristöö')
- "colorClass": (Vastavalt tüübile: 'bg-purple-300' ruumitööle, 'bg-red-300' loengule, 'bg-blue-300' grupitööle, 'bg-green-300' indiv tööle, 'bg-yellow-300' paaristööle)
- "content": (Põhjalik tekst selle 5 minuti tegevuse kohta, toetab matemaatilisi sümboleid ka latex formatis).

Kui algne kava on lühem kui 45 min, täida ülejäänud puuduolevad klotsid ('Indiv. töö' ja neutraalse sisuga "Varuaeg / Iseseisev töö").
Tagasta AINULT kehtiv JSON massiiv, mis sisaldab täpselt 9 objekti.

TUNNIKAVA TEKST:
${inputText}
`;

    // Mudelite nimekiri ja korduskatsete arv
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-001"];
    let jsonResult = "";
    let lastError: any = null;

    for (const modelId of modelsToTry) {
      console.log(`Proovin mudelit (parsimine): ${modelId}`);
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelId,
            generationConfig: { responseMimeType: "application/json" }
          });
          const result = await model.generateContent(prompt);
          jsonResult = result.response.text().trim();
          
          if (jsonResult) break; // Edu!
        } catch (error: any) {
          lastError = error;
          if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
            retryCount++;
            console.warn(`Mudel ${modelId} on ülekoormatud (503). Katse ${retryCount}/${maxRetries}. Ootan 1s...`);
            await sleep(1000);
          } else {
            console.error(`Mudel ${modelId} tõrkus muul põhjusel parsimisel: ${error.message}`);
            break; 
          }
        }
      }

      if (jsonResult) break; 
    }

    if (!jsonResult) {
      throw lastError || new Error("Ükski mudel ei andnud JSON vastust.");
    }

    // Puhastame markdown-st vajadusel
    if (jsonResult.startsWith('```json')) {
      jsonResult = jsonResult.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    const parsedData = JSON.parse(jsonResult);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("AI Error (parse-blocks):", error);
    return NextResponse.json({ 
      error: 'Server on ülekoormatud või tekkis parsimisviga.', 
      details: error.message || 'Tundmatu viga',
      isRetryable: true
    }, { status: 500 });
  }
}
