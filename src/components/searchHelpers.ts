export interface SearchItem<T> {
  keywords: string;
  label: string;
  item: T;
}

export function toSearchItems<T>(
  items: T[],
  keywordFunction: (v: T) => string,
  labelFunction: (v: T) => string,
): SearchItem<T>[] {
  return items.map((item) => ({
    // keywords representation of the item
    keywords: keywordFunction(item).toLowerCase().trim(),
    // item label
    label: labelFunction(item),
    // store reference to the original item
    item,
  }));
}

export function limitListItems<T>(items: T[], start: number, maxLength: number): T[] {
  if (maxLength <= 0 || items.length < maxLength) {
    return items;
  }
  return items.slice(start, Math.min(start + maxLength, items.length - 1));
}

export function prepareUserEnteredText(userEnteredText: string): string {
  if (!userEnteredText) {
    return '';
  }
  const textFiltered = userEnteredText.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ').trim();
  return textFiltered.toLowerCase().trim();
}

export function matchItems<T>(
  listItems: readonly SearchItem<T>[],
  query: string,
  selectedLabelLookup: Set<string>,
): SearchItem<T>[] {
  const searchWords = query.split(' ');
  return listItems.filter((listItem) => {
    const itemKeywords = listItem.keywords;
    return (
      searchWords.every((searchWord) => itemKeywords.includes(searchWord)) && !selectedLabelLookup.has(listItem.label)
    );
  });
}

/**
 * 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
 */
export function createHighlighter(q: string): (l: string) => string {
  const qs = '(' + q.trim().replace(/\s/g, ')(.*)(') + ')';
  const reg = new RegExp(qs, 'ig');
  const len = qs.split(')(').length + 1;
  let repl = '';
  for (let n = 1; n < len; n++) {
    repl += n % 2 ? `<b>$${n}</b>` : `$${n}`;
  }

  return (i) => i.replace(reg, repl);
}
