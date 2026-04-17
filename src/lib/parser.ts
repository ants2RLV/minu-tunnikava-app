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

    let type = "Individuaalselt";
    let colorClass = "bg-green-300";

    const lowerContent = fullContent.toLowerCase();
    
    // Prioriteet 1: Otsesed uued tüübinimed
    if (lowerContent.includes("õpetaja teeb")) {
      type = "Õpetaja teeb"; colorClass = "bg-red-300";
    } else if (lowerContent.includes("individuaalselt")) {
      type = "Individuaalselt"; colorClass = "bg-green-300";
    } else if (lowerContent.includes("paarilisega")) {
      type = "Paarilisega"; colorClass = "bg-yellow-300";
    } else if (lowerContent.includes("grupis")) {
      type = "Grupis"; colorClass = "bg-blue-300";
    } else if (lowerContent.includes("üle ruumi arutelu")) {
      type = "Üle ruumi arutelu"; colorClass = "bg-purple-300";
    } 
    // Prioriteet 2: Vanad märksõnad ja tuletamine
    else if (lowerContent.includes("häälestus") || lowerContent.includes("arutelu") || lowerContent.includes("kokkuvõte") || lowerContent.includes("lõpetus") || lowerContent.includes("engage") || lowerContent.includes("anchor") || lowerContent.includes("away")) {
      type = "Üle ruumi arutelu"; colorClass = "bg-purple-300";
    } else if (lowerContent.includes("loeng") || lowerContent.includes("selgitus") || lowerContent.includes("tutvustus") || lowerContent.includes("presentation") || lowerContent.includes("modeling")) {
      type = "Õpetaja teeb"; colorClass = "bg-red-300";
    } else if (lowerContent.includes("grupitöö") || lowerContent.includes("rühmatöö") || lowerContent.includes("explore") || lowerContent.includes("practice") || lowerContent.includes("production") || lowerContent.includes("apply") || lowerContent.includes("elulised näited")) {
      type = "Grupis"; colorClass = "bg-blue-300";
    } else if (lowerContent.includes("paaristöö")) {
      type = "Paarilisega"; colorClass = "bg-yellow-300";
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
