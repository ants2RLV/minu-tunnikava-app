'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Copy, LayoutDashboard, Loader2, Sparkles, PenTool } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const store = useStore();

  const [localStage, setLocalStage] = useState(store.schoolStage);
  const [localSubject, setLocalSubject] = useState(store.subject);
  const [localTopic, setLocalTopic] = useState(store.topic);
  const [localDuration, setLocalDuration] = useState(store.duration.toString());
  const [localGoals, setLocalGoals] = useState(store.goals);
  const [localNeeds, setLocalNeeds] = useState(store.needs);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<'idle' | 'writing'>('idle');

  const ESTONIAN_SUBJECTS = [
    "Ajalugu", "Bioloogia", "Eesti keel", "Füüsika", "Geograafia", 
    "Informaatika", "Inglise keel (A-võõrkeel)", "Inimeseõpetus", 
    "Keemia", "Kehaline kasvatus", "Kirjandus", "Kunst", 
    "Loodusõpetus", "Matemaatika", "Muusika", 
    "Tehnoloogiaõpetus / Käsitöö ja kodundus", 
    "Vene keel (B-võõrkeel)", "Ühiskonnaõpetus", "Muu valikaine"
  ].sort((a, b) => a.localeCompare('et'));

  const handleGenerate = async () => {
    if (!localSubject || !localStage || !localTopic || !localGoals) {
      alert('Palun täida kõik tärniga tähistatud väljad!');
      return;
    }

    setIsGenerating(true);
    setGenStatus('writing');
    
    // Salvestame metaandmed store'i
    store.setLessonDetails({
      schoolStage: localStage,
      subject: localSubject,
      topic: localTopic,
      duration: parseInt(localDuration, 10) || 45,
      goals: localGoals,
      needs: localNeeds
    });

    let retryCount = 0;
    const maxClientRetries = 1;

    const executeGeneration = async () => {
      try {
        const genResponse = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: localSubject,
            grade: localStage,
            topic: localTopic,
            duration: localDuration,
            objectives: localGoals,
            specialNeeds: localNeeds
          }),
        });

        const genData = await genResponse.json();
        
        if (!genResponse.ok) {
          if (genResponse.status === 503 || genData.isRetryable) {
             if (retryCount < maxClientRetries) {
               retryCount++;
               console.warn("Server hõivatud, proovin uuesti 2s pärast...");
               await new Promise(r => setTimeout(r, 2000));
               return executeGeneration();
             }
          }
          throw new Error(genData.details || 'Teksti genereerimine ebaõnnestus');
        }
        
        const fullText = genData.text;
        store.setDraftContent(fullText);
        
        // SUUNAME MUSTANDILE (Nagu palutud)
        router.push('/draft');
      } catch (error: any) {
        console.error(error);
        alert(`VIGA TEHISARUGA ÜHENDUMISEL:\n\n${error.message}\n\n${retryCount > 0 ? 'Server on hetkel väga koormatud.' : ''}`);
      } finally {
        setIsGenerating(false);
        setGenStatus('idle');
      }
    };

    executeGeneration();
  };

  const handleManualEntry = () => {
    if (!localSubject || !localStage || !localTopic) {
      alert('Täida vähemalt Aine, Klass ja Teema, et ajateljel alustada!');
      return;
    }

    store.setLessonDetails({
      schoolStage: localStage,
      subject: localSubject,
      topic: localTopic,
      duration: parseInt(localDuration, 10) || 45,
      goals: localGoals,
      needs: localNeeds
    });

    // Algatame puhta lehe
    store.resetBlocks();
    router.push('/workspace');
  };

  const handleCopyText = () => {
    const textToCopy = `Tunni teema: ${localTopic}\nKlass: ${localStage}\nAine: ${localSubject}\nEesmärgid: ${localGoals}\n\nMeetodid: ${localNeeds}`;
    navigator.clipboard.writeText(textToCopy);
    alert('Tekst kopeeritud!');
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-3xl shadow-xl border-slate-200 rounded-xl bg-white p-6 sm:p-10">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            Tunnikava koostaja
          </h1>
          <p className="text-slate-500 mt-2">Sisesta algandmed, et alustada tunni planeerimist.</p>
        </div>

        <div className="space-y-6">
          {/* Rida 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Õppeaine *</Label>
              <Select value={localSubject} onValueChange={(v) => setLocalSubject(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Vali aine..." />
                </SelectTrigger>
                <SelectContent>
                  {ESTONIAN_SUBJECTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Klass *</Label>
              <Select value={localStage} onValueChange={(v) => setLocalStage(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Vali klass..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={`${num}. klass`}>{num}. klass</SelectItem>
                  ))}
                  <SelectItem value="Kutsekool">Kutsekool</SelectItem>
                  <SelectItem value="Täiskasvanuharidus">Täiskasvanuharidus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rida 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Teema *</Label>
              <Input 
                placeholder="Näiteks: Murdude liitmine" 
                value={localTopic}
                onChange={(e) => setLocalTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Kestus (min) *</Label>
              <Input 
                type="number" 
                value={localDuration}
                onChange={(e) => setLocalDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Rida 3 */}
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700">Õpieesmärgid / Märksõnad *</Label>
            <Textarea 
              className="resize-none h-24"
              placeholder="Mida õpilased tunni lõpuks teavad või oskavad?"
              value={localGoals}
              onChange={(e) => setLocalGoals(e.target.value)}
            />
          </div>

          {/* Rida 4 */}
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700">Erivajadused / Meetodid (Valikuline)</Label>
            <Textarea 
              className="resize-none h-24"
              placeholder="Näiteks: Rühmatöö, visuaalsed abimaterjalid..."
              value={localNeeds}
              onChange={(e) => setLocalNeeds(e.target.value)}
            />
          </div>

          {/* Tegevusnupud */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-center items-center gap-4">
            
            <Button 
              onClick={handleManualEntry} 
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-slate-600 border-slate-300 hover:bg-slate-50 font-medium"
            >
              <PenTool className="mr-2 h-4 w-4" />
              Tööta ajateljel (ilma AI-ta)
            </Button>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              size="lg" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 px-10 shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Koostan kava...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Genereeri tunnikava (AI)
                </>
              )}
            </Button>

          </div>
        </div>
      </Card>
    </main>
  );
}
