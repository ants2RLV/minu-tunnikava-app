import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const { subject, grade, topic, duration, objectives, specialNeeds, methodology } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY puudub keskkonnamuutujatest (.env)' }, { status: 500 });
    }

    // Kasutame stabiilset v1 versiooni
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const prompt = `
Oled kogenud Eesti õpetaja. Koosta struktureeritud ja põhjalik tunnikava, lähtudes Eesti riiklikest õppekavadest (PRÕK 2025 ja GRÕK 2025).
Kasuta LÕOKE portaali ja HTM-i lõimingu kogumiku põhimõtteid: õppimine peab olema tähenduslik, holistiline ja seotud õpilase igapäevaeluga.

METOODILINE RAAMISTIK:
Sinu ülesanne on koostada tunnikava kasutades TÄPSELT järgmist metoodilist struktuuri: ${methodology || 'Klassikaline'}.
- Kui meetod on 5E, peavad pealkirjad olema: Engage, Explore, Explain, Elaborate, Evaluate.
- Kui meetod on PPP, peavad pealkirjad olema: Presentation, Practice, Production.
- Kui meetod on BackwardDesign (Tagurpidi disain), peavad pealkirjad olema: Eesmärgid, Tõendusmaterjal, Õpitegevused.
- Kui meetod on Hunter, järgi Hunteri 7-sammulist kava.
- Kui meetod on 4A, peavad pealkirjad olema: Anchor, Add, Apply, Away.
- Kui meetod on Klassikaline, kasuta: Häälestus, Põhiosa, Konsolideerimine, Lõpetus.

ANDMED:
Aine: ${subject}
Klass: ${grade}
Teema: ${topic}
Kestus: ${duration} min
Õpieesmärgid: ${objectives}
Erivajadused/Meetodid: ${specialNeeds || 'Ei ole täpsustatud'}

KOHUSTUSLIKUD SEKTSIOONID JA STRUKTUUR:
Väljasta tulemus ILUSAS MARKDOWN vormingus.

## Üldinfo ja Lõiming
- **Lõiming teiste ainetega**: Too välja vähemalt üks konkreetne seos mõne teise õppeainega.
- **Läbiv teema**: Vali ja nimeta üks läbiv teema ning selgita selle rolli tunnis.
- **Eluline näide**: Kirjelda ühte reaalset elulist probleemi või situatsiooni.

Lisa sektsioonid vastavalt valitud meetodile (${methodology}):
(Kasuta ## pealkirju iga etapi jaoks)

JUHISED SISU JAOKS:
1. Eelista aktiivõpet, uurimuslikku õpet ja projektõppe elemente. Vähenda passiivset loenguvormi.
2. Iga tegevuse (## pealkiri) juures pead sa määrama TÄPSELT ühe viiest klotsi tüübist: [Õpetaja teeb, Individuaalselt, Paarilisega, Grupis, Üle ruumi arutelu].
3. Kasuta formaati: ## Tegevuse nimi (kestus minutites) (Klotsi tüüp). 
   Näide: ## Teema tutvustus (10 min) (Õpetaja teeb) või ## Grupiarutelu (15 min) (Grupis).
4. See kestus sulgudes on kriitiliselt oluline parsimise jaoks!
5. Kasuta paksus kirjas teksti oluliste mõistete jaoks ja täpploendeid tegevuste kirjeldamiseks.
6. Toeta matemaatilisi sümboleid LaTeX vormingus (nt $x^2$ või $\\frac{1}{2}$), kui teema seda nõuab.
7. ÄRA tagasta JSON-it ega muud ümbritsevat teksti, vaid puhas Markdown tekst.
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
