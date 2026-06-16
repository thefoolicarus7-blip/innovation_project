import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath  = path.join(__dirname, '..', 'DOCUMENTATION.md');
const outPath = path.join(__dirname, '..', 'DOCUMENTATION.docx');

const raw   = fs.readFileSync(mdPath, 'utf-8');
const lines = raw.split('\n');

// ── Inline formatter ────────────────────────────────────────────────────────
function stripLinks(t) {
  return t
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [text](url) → text
    .replace(/\\\|/g, '|');                    // escaped pipes
}

function parseInline(rawText) {
  const text = stripLinks(rawText);
  const runs = [];
  let rem = text;

  while (rem.length > 0) {
    const bIdx = rem.indexOf('**');
    const cIdx = rem.indexOf('`');

    if (bIdx === -1 && cIdx === -1) {
      if (rem) runs.push(new TextRun({ text: rem }));
      break;
    }

    let first, kind;
    if      (bIdx === -1)      { first = cIdx; kind = 'code'; }
    else if (cIdx === -1)      { first = bIdx; kind = 'bold'; }
    else if (bIdx <= cIdx)     { first = bIdx; kind = 'bold'; }
    else                       { first = cIdx; kind = 'code'; }

    if (first > 0) runs.push(new TextRun({ text: rem.substring(0, first) }));

    if (kind === 'bold') {
      const end = rem.indexOf('**', first + 2);
      if (end === -1) { runs.push(new TextRun({ text: rem.substring(first) })); break; }
      runs.push(new TextRun({ text: rem.substring(first + 2, end), bold: true }));
      rem = rem.substring(end + 2);
    } else {
      const end = rem.indexOf('`', first + 1);
      if (end === -1) { runs.push(new TextRun({ text: rem.substring(first) })); break; }
      runs.push(new TextRun({
        text: rem.substring(first + 1, end),
        font: 'Courier New',
        size: 18,
        color: '555555',
      }));
      rem = rem.substring(end + 1);
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: '' })];
}

// ── Build document children ─────────────────────────────────────────────────
const children = [];
let inCode  = false;
let codeBuf = [];
let inTable = false;
let tblRows = [];

function flushTable() {
  if (tblRows.length === 0) return;
  const colCount = Math.max(...tblRows.map(r => r.length));
  const pct = Math.floor(100 / colCount);

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tblRows.map((row, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        children: row.map(cell =>
          new TableCell({
            width: { size: pct, type: WidthType.PERCENTAGE },
            shading: ri === 0
              ? { fill: 'D9E1F2', type: ShadingType.CLEAR, color: 'auto' }
              : undefined,
            children: [new Paragraph({
              children: parseInline(cell),
              spacing: { before: 60, after: 60 },
            })],
          })
        ),
      })
    ),
  }));
  tblRows = [];
}

function pushCode() {
  if (codeBuf.length === 0) return;
  children.push(new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { before: 80 },
  }));
  for (const cl of codeBuf) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: cl === '' ? ' ' : cl,
        font: 'Courier New',
        size: 17,
        color: '2D2D2D',
      })],
      spacing: { before: 0, after: 0 },
      indent: { left: 580 },
    }));
  }
  children.push(new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { after: 80 },
  }));
  codeBuf = [];
}

for (const line of lines) {
  // ── Code block fences ────────────────────────────────────────────────────
  if (line.startsWith('```')) {
    if (!inCode) { inCode = true; codeBuf = []; }
    else         { inCode = false; pushCode(); }
    continue;
  }
  if (inCode) { codeBuf.push(line); continue; }

  // ── Tables ───────────────────────────────────────────────────────────────
  if (line.startsWith('|')) {
    inTable = true;
    if (/^\|[\s\-|:]+\|$/.test(line)) continue; // separator row
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    tblRows.push(cells);
    continue;
  } else if (inTable) {
    inTable = false;
    flushTable();
  }

  // ── Headings ─────────────────────────────────────────────────────────────
  if (line.startsWith('# ')) {
    children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
    continue;
  }
  if (line.startsWith('## ')) {
    children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
    continue;
  }
  if (line.startsWith('### ')) {
    children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
    continue;
  }
  if (line.startsWith('#### ')) {
    children.push(new Paragraph({ text: line.slice(5), heading: HeadingLevel.HEADING_4 }));
    continue;
  }

  // ── Horizontal rule ──────────────────────────────────────────────────────
  if (line.trim() === '---') {
    children.push(new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { before: 100, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB', space: 1 } },
    }));
    continue;
  }

  // ── Bullet lists ─────────────────────────────────────────────────────────
  const bullet = line.match(/^(\s*)[-*]\s+(.+)$/);
  if (bullet) {
    const level = Math.min(Math.floor(bullet[1].length / 2), 8);
    children.push(new Paragraph({
      children: parseInline(bullet[2]),
      bullet: { level },
    }));
    continue;
  }

  // ── Numbered lists ───────────────────────────────────────────────────────
  const numbered = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
  if (numbered) {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `${numbered[2]}. `, bold: false }),
        ...parseInline(numbered[3]),
      ],
      indent: { left: 360 },
      spacing: { before: 40, after: 40 },
    }));
    continue;
  }

  // ── Empty line ───────────────────────────────────────────────────────────
  if (line.trim() === '') {
    children.push(new Paragraph({ text: '', spacing: { before: 0, after: 80 } }));
    continue;
  }

  // ── Regular paragraph ────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: parseInline(line),
    spacing: { before: 40, after: 40 },
  }));
}

if (tblRows.length > 0) flushTable();
if (codeBuf.length > 0) pushCode();

// ── Assemble document ────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'Claude Code',
  title: 'Swipe2Work — Comprehensive Project Documentation',
  description: 'Auto-generated from DOCUMENTATION.md',
  styles: {
    default: {
      heading1: {
        run: { bold: true, size: 40, color: '1A3A6B' },
        paragraph: { spacing: { before: 480, after: 240 } },
      },
      heading2: {
        run: { bold: true, size: 30, color: '1A3A6B' },
        paragraph: { spacing: { before: 400, after: 160 } },
      },
      heading3: {
        run: { bold: true, size: 24, color: '1F5C99' },
        paragraph: { spacing: { before: 320, after: 120 } },
      },
      heading4: {
        run: { bold: true, size: 22, color: '2D6FAE' },
        paragraph: { spacing: { before: 240, after: 80 } },
      },
      document: {
        run: { size: 22, font: 'Calibri' },
        paragraph: { spacing: { line: 280 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log('Done:', outPath);
