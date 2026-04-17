import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const { subject, grade, topic, duration, objectives, specialNeeds } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY puudub keskkonnamuutujatest (.env)' }, { status: 500 });
    }

    // Kasutame stabiilset v1 versiooni
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const prompt = `
Oled kogenud Eesti õpetaja. Koosta struktureeritud ja põhjalik tunnikava järgmiste andmete põhjal:
Aine: ${subject}
Klass: ${grade}
Teema: ${topic}
Kestus: ${duration} min
Õpieesmärgid: ${objectives}
Erivajadused/Meetodid: ${specialNeeds || 'Ei ole täpsustatud'}

Väljasta tulemus ILUSAS MARKDOWN vormingus. 
Kasuta kindlasti pealkirju:
## Häälestus
## Põhiosa
## Lõpetus

Lisa iga tegevuse juurde kellaaeg/kestus sulgudes, näiteks (5 min) või (15 min). See on kriitiliselt oluline hilisema parsimise jaoks!
Kasuta paksus kirjas teksti oluliste mõistete jaoks ja täpploendeid tegevuste kirjeldamiseks. 
ÄRA tagasta JSON-it ega muud ümbritsevat teksti, vaid puhas Markdown tekst, mis sobib otse kuvamiseks.
Toeta matemaatilisi sümboleid LaTeX vormingus (nt $x^2$ või $\\frac{1}{2}$), kui teema seda nõuab.
`;

    // Mudelite nimekiri ja korduskatsete arv
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-001"];
    let finalContent = "";
    let lastError: any = null;

    for (const modelId of modelsToTry) {
      console.log(`Proovin mudelit: ${modelId}`);
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const model = genAI.getGenerativeModel({ model: modelId });
          const result = await model.generateContent(prompt);
          finalContent = result.response.text();
          
          if (finalContent) break; // Edu!
        } catch (error: any) {
          lastError = error;
          // Kontrollime 503 või sarnast serveri viga
          if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
            retryCount++;
            console.warn(`Mudel ${modelId} on ülekoormatud (503). Katse ${retryCount}/${maxRetries}. Ootan 1s...`);
            await sleep(1000);
          } else {
            // Muu viga (nt 404 või Auth), proovime järgmist mudelit kohe
            console.error(`Mudel ${modelId} tõrkus muul põhjusel: ${error.message}`);
            break; 
          }
        }
      }

      if (finalContent) break; // Leidsime töötava mudeli/vastuse
    }

    if (!finalContent) {
      throw lastError || new Error("Ükski mudel ei andnud vastust.");
    }

    return NextResponse.json({ text: finalContent });
  } catch (error: any) {
    console.error("GEMINI API ERROR (generate-plan):", error);
    return NextResponse.json({ 
      error: 'Server on ülekoormatud või tekkis API viga.', 
      details: error.message || 'Tundmatu viga',
      isRetryable: true
    }, { status: 500 });
  }
}
