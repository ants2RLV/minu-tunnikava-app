'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { MathText } from '@/components/MathText';

interface BlockItemProps {
  block: Block;
  index: number; // Jätame sisse dnd-kit vajadustele ja igaks juhuks
  onClick: () => void;
  isSelected?: boolean;
}

export function BlockItem({ block, index, onClick, isSelected }: BlockItemProps) {
  const bgColorClass = block.colorClass || 'bg-slate-300';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const customStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={customStyle}
      onClick={onClick}
      className={cn(
        "group relative flex-[1] min-w-[50px] sm:min-w-[70px] h-[160px] sm:h-[200px] rounded-lg shadow-sm border-2 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none overflow-hidden",
        "flex flex-col text-slate-900 select-none",
        isDragging ? "opacity-50 z-50 border-slate-700" : "border-slate-800/10",
        isSelected ? "ring-4 ring-offset-2 ring-blue-600" : "hover:border-slate-800/30",
        /* AKORDIONI EFEKT: hoveril venib element laiemaks (flex basis kasvab) */
        "hover:flex-[4] hover:min-w-[300px]",
        bgColorClass
      )}
    >
      {/* Lohistamise nupp (nähtav ainult vaikimisi hoveril või laiendatult) */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-1 right-1 lg:opacity-0 group-hover:opacity-100 transition-opacity z-20 p-2 cursor-grab active:cursor-grabbing text-slate-800 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={18} />
      </div>

      {/* KLOTSI PEALKIRI NING AEG */}
      <div className="absolute top-2 left-0 right-0 px-2 flex flex-col items-center z-10 pointer-events-none transition-all duration-300 group-hover:items-start group-hover:-translate-x-1 group-hover:pl-4">
        <div className="text-[10px] sm:text-xs font-bold bg-white/70 backdrop-blur-sm rounded px-1.5 py-0.5 shadow-sm text-slate-800 mb-1">
          {block.time || `${index * 5}-${(index + 1) * 5} min`}
        </div>
        <div className="text-[11px] sm:text-sm font-extrabold uppercase tracking-tight leading-tight text-center group-hover:text-left drop-shadow-sm w-full truncate">
          {block.type}
        </div>
      </div>

      {/* LAIENDATUD SISU EFEKT: Näitab ainult block.content otseselt ilma jamadeta */}
      <div className="mt-16 px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 overflow-y-auto h-full text-xs sm:text-sm font-medium leading-relaxed text-slate-800/90 pointer-events-auto custom-scrollbar">
        {block.content ? (
          <MathText text={block.content} />
        ) : (
          <span className="italic opacity-60">Sisu puudub...</span>
        )}
      </div>
    </div>
  );
}
