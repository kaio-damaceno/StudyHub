
import { Deck, Flashcard, FlashcardType, createNewFlashcard } from '../../types';

interface ParsedAnkiRow {
  deckPath: string;
  front: string;
  back: string;
  tags: string[];
  interval?: number;
  reps?: number;
  lapses?: number;
  ease?: number;
}

export class AnkiParser {
  public static parseExport(content: string): { rows: ParsedAnkiRow[] } {
    const lines = content.split(/\r?\n/);
    let separator = ';'; 
    let deckColumnIdx = 0;
    let tagsColumnIdx = 3;
    let frontColumnIdx = 1;
    let backColumnIdx = 2;

    let headerOffset = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const lower = trimmed.toLowerCase();
        if (lower.includes('#separator:')) {
          const sepValue = trimmed.split(':')[1].trim();
          if (sepValue === 'tab') separator = '\t';
          else if (sepValue === 'comma') separator = ',';
          else if (sepValue === 'semicolon') separator = ';';
          else if (sepValue === 'space') separator = ' ';
          else separator = sepValue;
        }
        if (lower.includes('#deck column:')) deckColumnIdx = parseInt(trimmed.split(':')[1].trim()) - 1;
        if (lower.includes('#tags column:')) tagsColumnIdx = parseInt(trimmed.split(':')[1].trim()) - 1;
        headerOffset++;
      } else if (trimmed === '') {
        headerOffset++;
      } else {
        break;
      }
    }

    const rawData = lines.slice(headerOffset).join('\n');
    const rows: ParsedAnkiRow[] = [];
    
    let currentRowFields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < rawData.length; i++) {
        const char = rawData[i];
        const nextChar = rawData[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === separator && !inQuotes) {
            currentRowFields.push(currentField.trim());
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            currentRowFields.push(currentField.trim());
            if (currentRowFields.length >= 2) {
                rows.push(this.mapFieldsToRow(currentRowFields, deckColumnIdx, tagsColumnIdx, frontColumnIdx, backColumnIdx));
            }
            currentField = '';
            currentRowFields = [];
        } else if (char === '\r' && !inQuotes) {
            // ignore
        } else {
            currentField += char;
        }
    }

    // Processar última linha pendente
    if (currentField !== '' || currentRowFields.length > 0) {
        currentRowFields.push(currentField.trim());
        if (currentRowFields.length >= 2) {
            rows.push(this.mapFieldsToRow(currentRowFields, deckColumnIdx, tagsColumnIdx, frontColumnIdx, backColumnIdx));
        }
    }

    return { rows };
  }

  private static mapFieldsToRow(
    fields: string[], 
    deckIdx: number, 
    tagsIdx: number,
    frontIdx: number,
    backIdx: number
  ): ParsedAnkiRow {
    if (fields.length === 2) {
        return { deckPath: 'Importados', front: fields[0], back: fields[1], tags: [] };
    }
    return {
      deckPath: fields[deckIdx] || 'Importados',
      front: fields[frontIdx] || '',
      back: fields[backIdx] || '',
      tags: (fields[tagsIdx]) ? fields[tagsIdx].split(' ').filter(t => t.trim()) : []
    };
  }

  public static detectType(front: string, back: string): FlashcardType {
    if (front.includes('{{c') || back.includes('{{c')) return 'CLOZE';
    return 'BASIC';
  }

  public static mapProgress(card: any, interval?: number, lapses?: number): any {
    const updated = { ...card };
    if (interval && interval > 0) {
      updated.metrics.stability = interval;
      updated.stage = interval > 21 ? 'S4_RETENTION' : 'S3_CONSOLIDATION';
      updated.nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);
    }
    return updated;
  }
}
