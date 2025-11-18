/**
 * Smart text merging utility to avoid duplicates
 * Ported from Python GUI logic (_merge_transcription_chunks)
 */

/**
 * Merge new transcription chunk with existing text, avoiding duplicates
 */
export function mergeTranscriptionChunks(existingText: string, newChunk: string): string {
  if (!existingText) {
    return newChunk.trim();
  }

  if (!newChunk || !newChunk.trim()) {
    return existingText;
  }

  // Normalize text: lowercase for comparison, preserve original for output
  const existingLower = existingText.toLowerCase();
  const newChunkLower = newChunk.trim().toLowerCase();
  const newChunkOriginal = newChunk.trim();

  // Split into words for comparison
  const existingWords = existingLower.split(/\s+/);
  const newWordsLower = newChunkLower.split(/\s+/);
  const newWordsOriginal = newChunkOriginal.split(/\s+/);

  if (newWordsLower.length === 0) {
    return existingText;
  }

  // Check for high similarity (duplicate run detection)
  const similarity = calculateSimilarity(existingWords, newWordsLower);
  const similarityThreshold = 0.75; // 75% word overlap suggests duplicate

  if (similarity >= similarityThreshold) {
    const lengthRatio = newWordsLower.length / existingWords.length;
    if (lengthRatio >= 0.5 && lengthRatio <= 1.5) {
      // Similar length suggests complete duplicate
      console.log(
        `⚠️ Detected potential duplicate transcription run (similarity: ${(similarity * 100).toFixed(2)}%, length ratio: ${(lengthRatio * 100).toFixed(2)}%)`
      );
      return existingText;
    }
  }

  // Find the longest overlap at the end of existing text and start of new chunk
  const maxCheck = Math.min(15, existingWords.length, newWordsLower.length);
  let maxOverlap = 0;
  let bestOverlapStart = 0;

  // Start from larger overlaps and work down (prefer longer matches)
  for (let overlapSize = maxCheck; overlapSize > 0; overlapSize--) {
    const existingTail = existingWords.slice(-overlapSize);
    const newHead = newWordsLower.slice(0, overlapSize);

    // Check if they match exactly
    if (arraysEqual(existingTail, newHead)) {
      maxOverlap = overlapSize;
      bestOverlapStart = overlapSize;
      break;
    }
  }

  // If we found an overlap, skip those words in the new chunk
  if (maxOverlap > 0) {
    const remainingWords = newWordsOriginal.slice(bestOverlapStart);
    if (remainingWords.length > 0) {
      const mergedText =
        existingText.trim() + ' ' + remainingWords.join(' ');
      console.log(
        `Merged chunk: removed ${maxOverlap} overlapping words, added ${remainingWords.length} new words`
      );
      return mergedText;
    } else {
      // New chunk is completely contained in existing text
      console.log(
        `Skipped duplicate chunk (completely overlapping, ${maxOverlap} words)`
      );
      return existingText;
    }
  } else {
    // No overlap detected - append with space
    const mergedText = existingText.trim() + ' ' + newChunkOriginal;
    console.log(`No overlap detected, appended ${newWordsOriginal.length} words`);
    return mergedText;
  }
}

/**
 * Calculate similarity ratio between two word arrays using Jaccard similarity
 */
function calculateSimilarity(
  text1Words: string[],
  text2Words: string[]
): number {
  if (!text1Words.length || !text2Words.length) {
    return 0.0;
  }

  const set1 = new Set(text1Words);
  const set2 = new Set(text2Words);

  if (set1.size === 0 || set2.size === 0) {
    return 0.0;
  }

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) {
    return 0.0;
  }

  return intersection.size / union.size;
}

/**
 * Check if two arrays are equal
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

