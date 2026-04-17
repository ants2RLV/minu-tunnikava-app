import { Block } from '@/store/useStore';

export function parseTextToBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let currentMinute = 0;

  const regex = /(?:^|\n)([\s\S]*?)\((\d+)\s*min\)([\s\S]*?)(?=(?:\n[\s\S]*?\(\d+\s*min\))|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (currentMinute >= 45) break;

    const title = match[1].trim();
    const duration = parseInt(match[2], 10);
    const content = match[3] ? match[3].trim() : "";
    const fullContent = title + "\n\n" + content;

    let type = "Indiv. töö";
    let colorClass = "bg-green-300";

    const lowerContent = fullContent.toLowerCase();
    if (lowerContent.includes("häälestus") || lowerContent.includes("arutelu") || lowerContent.includes("kokkuvõte") || lowerContent.includes("lõpetus")) {
      type = "Ruumitöö"; colorClass = "bg-purple-300";
    } else if (lowerContent.includes("loeng") || lowerContent.includes("selgitus") || lowerContent.includes("tutvustus")) {
      type = "Loeng"; colorClass = "bg-red-300";
    } else if (lowerContent.includes("grupitöö") || lowerContent.includes("rühmatöö") || lowerContent.includes("elulised näited")) {
      type = "Grupitöö"; colorClass = "bg-blue-300";
    } else if (lowerContent.includes("paaristöö")) {
      type = "Paaristöö"; colorClass = "bg-yellow-300";
    }

    const blockCount = Math.floor(duration / 5);

    for (let i = 0; i < blockCount; i++) {
      if (currentMinute >= 45) break;
      blocks.push({
        id: crypto.randomUUID(),
        time: `${currentMinute}-${currentMinute + 5} min`,
        type: type,
        colorClass: colorClass,
        content: fullContent
      });
      currentMinute += 5;
    }
  }

  while (currentMinute < 45) {
    blocks.push({
      id: crypto.randomUUID(),
      time: `${currentMinute}-${currentMinute + 5} min`,
      type: "Indiv. töö",
      colorClass: "bg-green-300",
      content: "Iseseisev töö / Varu"
    });
    currentMinute += 5;
  }

  return blocks.slice(0, 9);
}
