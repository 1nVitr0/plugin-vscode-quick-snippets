import { EndOfLine, Position, Range, Selection, TextEditorEdit } from 'vscode';

export class StringTextEditProvider implements TextEditorEdit {
  private lines: { offset: number, length: number, text: string }[];
  private endOfLine: EndOfLine;
  private replacements: [Range, string][] = [];
  private insertions: [Position, string][] = [];
  private deletions: Range[] = [];

  public constructor(private text: string) {
    this.endOfLine = /\r\n/.test(text) ? EndOfLine.CRLF : EndOfLine.LF;

    let offset = 0;
    this.lines = text.split(/\r?\n/).map((text, i, lines) => {
      const line = { text, offset, length: text.length };
      offset += line.length;
      return line;
    });
  }

  public replace (location: Selection | Range | Position, value: string): void {
    if (location instanceof Position) this.insertions.push([location, value]);
    else this.replacements.push([location, value]);
  }

  public insert (location: Position, value: string): void {
    this.insertions.push([location, value]);
  }

  public delete (location: Selection | Range): void {
    this.deletions.push(location);
  }

  public setEndOfLine (endOfLine: EndOfLine): void {
    this.endOfLine = endOfLine;
  }

  public apply (): string | false {
    if (!this.validate()) return false;

    const { lines, replacements, insertions, deletions } = this;

    let result = lines.map(({ text }) => text).join(this.endOfLine === EndOfLine.CRLF ? "\r\n" : "\n");

    const offsetReplacements = replacements.map<[number, number, string]>(([range, value]) => {
      const start = this.offset(range.start);
      const end = this.offset(range.end);
      return [start, end, value.replace(/\r?\n/g, this.endOfLine === EndOfLine.CRLF ? "\r\n" : "\n")];
    });
    const offsetInsertions = insertions.map<[number, string]>(([position, value]) => {
      const offset = this.offset(position);
      return [offset, value.replace(/\r?\n/g, this.endOfLine === EndOfLine.CRLF ? "\r\n" : "\n")];
    });
    const offsetDeletions = deletions.map<[number, number]>((range) => {
      const start = this.offset(range.start);
      const end = this.offset(range.end);
      return [start, end] as [number, number];
    });

    let replacement: [number, number, string] | undefined;
    while (replacement = offsetReplacements.pop()) {
      const [start, end, value] = replacement;
      result = result.slice(0, start) + value + result.slice(end);
      const diff = value.length - (end - start);

      offsetReplacements.forEach((replacement) => {
        if (replacement[0] > start) replacement[0] += diff;
        if (replacement[1] > end) replacement[1] += diff;
      });
      offsetInsertions.forEach((insertion) => {
        if (insertion[0] > start) insertion[0] += diff;
      });
      offsetDeletions.forEach((deletion) => {
        if (deletion[0] > start) deletion[0] += diff;
        if (deletion[1] > end) deletion[1] += diff;
      });
    }

    let insertion: [number, string] | undefined;
    while (insertion = offsetInsertions.pop()) {
      const [offset, value] = insertion;
      result = result.slice(0, offset) + value + result.slice(offset);

      offsetInsertions.forEach((insertion) => {
        if (insertion[0] > offset) insertion[0] += value.length;
      });
      offsetDeletions.forEach((deletion) => {
        if (deletion[0] > offset) deletion[0] += value.length;
        if (deletion[1] > offset) deletion[1] += value.length;
      });
    }

    let deletion: [number, number] | undefined;
    while (deletion = offsetDeletions.pop()) {
      const [start, end] = deletion;
      result = result.slice(0, start) + result.slice(end);

      offsetDeletions.forEach((deletion) => {
        if (deletion[0] > start) deletion[0] -= end - start;
        if (deletion[1] > end) deletion[1] -= end - start;
      });
    }

    return result;
  }

  private validate (): boolean {
    const { replacements, insertions, deletions } = this;
    const overlappingReplacement = replacements.some(([range], i) => {
      if (replacements.some(([other], j) => i !== j && range.intersection(other))) return true;
      if (insertions.some(([position]) => range.contains(position))) return true;
      if (deletions.some((range) => range.intersection(range))) return true;
      return false;
    });
    const overlappingInsertion = insertions.some(([position], i) => {
      if (insertions.some(([other], j) => i !== j && position.isEqual(other))) return true;
      if (deletions.some((range) => range.contains(position))) return true;
      return false;
    });
    const overlappingDeletion = deletions.some((range, i) => {
      if (deletions.some((other, j) => i !== j && range.intersection(other))) return true;
      return false;
    });

    return !(overlappingReplacement || overlappingInsertion || overlappingDeletion);
  }

  private offset (position: Position): number {
    const { lines } = this;
    const line = lines[position.line];
    const lineEndingOffset = this.endOfLine === EndOfLine.CRLF ? 2 : 1;
    return line.offset + position.character + lineEndingOffset * position.line;
  }
}