'use client';

import { useStore } from '@/store/useStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SidebarProps {
  selectedBlockId: string | null;
  onClose: () => void;
}

export function Sidebar({ selectedBlockId, onClose }: SidebarProps) {
  const { blocks, updateBlockType, updateBlockContent } = useStore();
  const block = blocks.find((b) => b.id === selectedBlockId);

  if (!block) return null;

  return (
    <Sheet open={!!selectedBlockId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Klotsi seaded</SheetTitle>
          <SheetDescription>Muuda klotsi sisu ja tüüpi.</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label>Tegevustüüp</Label>
            <Select 
              value={block.type} 
              onValueChange={(value) => updateBlockType(block.id, value ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vali tüüp..." />
              </SelectTrigger>
              <SelectContent>
                {["Õpetaja teeb", "Individuaalselt", "Paarilisega", "Grupis", "Üle ruumi arutelu"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Tegevuse sisu</Label>
            <Textarea 
              className="resize-none h-32 custom-scrollbar"
              placeholder="Kirjelda, mida õpilased või õpetaja täpsemalt teevad..."
              value={block.content}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
