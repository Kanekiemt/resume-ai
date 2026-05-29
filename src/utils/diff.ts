/** Simple word-level diff for highlighting changes between old and new text */

export interface DiffSegment {
  text: string;
  type: 'same' | 'added' | 'removed';
}

/** Compare two strings and return segments with diff annotations */
export function diffWords(oldText: string, newText: string): {
  old: DiffSegment[];
  new: DiffSegment[];
  hasChanges: boolean;
} {
  if (oldText === newText) {
    return {
      old: [{ text: oldText, type: 'same' }],
      new: [{ text: newText, type: 'same' }],
      hasChanges: false,
    };
  }

  const oldWords = oldText.split(/(\s+)/g);
  const newWords = newText.split(/(\s+)/g);

  // Simple LCS-based diff
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const oldResult: DiffSegment[] = [];
  const newResult: DiffSegment[] = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      oldResult.unshift({ text: oldWords[i - 1], type: 'same' });
      newResult.unshift({ text: newWords[j - 1], type: 'same' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      newResult.unshift({ text: newWords[j - 1], type: 'added' });
      j--;
    } else {
      oldResult.unshift({ text: oldWords[i - 1], type: 'removed' });
      i--;
    }
  }

  return { old: oldResult, new: newResult, hasChanges: true };
}

/** Compare two section items and return bullet-level diffs */
export function diffSectionItems(
  oldItems: any[],
  newItems: any[],
  keyFields: string[]
): { itemIndex: number; field: string; oldVal: string; newVal: string; diff: ReturnType<typeof diffWords> }[] {
  const results: ReturnType<typeof diffSectionItems>[0][] = [];

  for (let idx = 0; idx < Math.max(oldItems.length, newItems.length); idx++) {
    const oldItem = oldItems[idx] || {};
    const newItem = newItems[idx] || {};

    for (const field of keyFields) {
      const oldVal = Array.isArray(oldItem[field])
        ? (oldItem[field] as string[]).join('\n')
        : String(oldItem[field] || '');
      const newVal = Array.isArray(newItem[field])
        ? (newItem[field] as string[]).join('\n')
        : String(newItem[field] || '');

      if (oldVal !== newVal) {
        results.push({
          itemIndex: idx,
          field,
          oldVal,
          newVal,
          diff: diffWords(oldVal, newVal),
        });
      }
    }
  }

  return results;
}
