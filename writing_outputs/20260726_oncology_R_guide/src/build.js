const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, ExternalHyperlink, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageBreak, ImageRun,
  Header, Footer, PageNumber,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const C = require('./content.js');

const FONT = 'Microsoft YaHei';
const MONO = 'Consolas';
const ACCENT = '1F4E79';
const ACCENT2 = '2E74B5';

const border = { style: BorderStyle.SINGLE, size: 2, color: 'BFBFBF' };
const cellBorders = { top: border, bottom: border, left: border, right: border };

// URL 自动识别，转成超链接
const URL_RE = /(https?:\/\/[^\s，。；、）)"']+)/g;
function runsWithLinks(text, opts = {}) {
  const base = { font: FONT, size: opts.size || 21, color: opts.color, bold: opts.bold, italics: opts.italics };
  const out = [];
  let last = 0;
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ ...base, text: text.slice(last, m.index) }));
    out.push(new ExternalHyperlink({
      link: m[1],
      children: [new TextRun({ ...base, text: m[1], style: 'Hyperlink' })],
    }));
    last = m.index + m[1].length;
  }
  if (last < text.length) out.push(new TextRun({ ...base, text: text.slice(last) }));
  if (out.length === 0) out.push(new TextRun({ ...base, text: '' }));
  return out;
}

function codeParas(text) {
  return text.split('\n').map((line, i, arr) => new Paragraph({
    shading: { fill: 'F4F6F8', type: ShadingType.CLEAR },
    spacing: { before: i === 0 ? 120 : 0, after: i === arr.length - 1 ? 160 : 0, line: 260 },
    indent: { left: 220, right: 220 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT2, space: 6 },
      ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 2, color: 'E1E6EA', space: 2 } } : {}),
      ...(i === arr.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E1E6EA', space: 2 } } : {}),
    },
    children: [new TextRun({ text: line.length ? line : ' ', font: MONO, size: 18, color: '1A1A1A' })],
  }));
}

function tableBlock(bk) {
  const widths = bk.widths || Array(bk.head.length).fill(Math.floor(9360 / bk.head.length));
  const mkCell = (txt, isHead, w) => new TableCell({
    borders: cellBorders,
    width: { size: w, type: WidthType.DXA },
    shading: isHead ? { fill: 'DCE6F1', type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 40, after: 40 },
      children: runsWithLinks(String(txt), { size: isHead ? 19 : 18, bold: isHead }),
    })],
  });
  const rows = [
    new TableRow({ tableHeader: true, children: bk.head.map((h, i) => mkCell(h, true, widths[i])) }),
    ...bk.rows.map((r) => new TableRow({ children: r.map((c, i) => mkCell(c, false, widths[i])) })),
  ];
  return new Table({ columnWidths: widths, margins: { top: 60, bottom: 60, left: 110, right: 110 }, rows });
}

const children = [];
let bulletCount = 0;
const numberingConfigs = [{
  reference: 'bullet-list',
  levels: [{
    level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 460, hanging: 260 } } },
  }],
}];
const seenNum = new Set();

for (const bk of C) {
  switch (bk.t) {
    case 'title':
      children.push(new Paragraph({
        spacing: { before: 2200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: bk.x, font: FONT, size: 52, bold: true, color: ACCENT })],
      }));
      break;
    case 'subtitle':
      children.push(new Paragraph({
        spacing: { after: 700 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: bk.x, font: FONT, size: 24, color: '555555' })],
      }));
      break;
    case 'h1':
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 200 },
        children: [new TextRun({ text: bk.x, font: FONT, size: 32, bold: true, color: ACCENT })],
      }));
      break;
    case 'h2':
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 140 },
        children: [new TextRun({ text: bk.x, font: FONT, size: 26, bold: true, color: ACCENT2 })],
      }));
      break;
    case 'h3':
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: bk.x, font: FONT, size: 23, bold: true, color: '333333' })],
      }));
      break;
    case 'p':
      children.push(new Paragraph({
        spacing: { after: 120, line: 300 }, alignment: AlignmentType.BOTH,
        children: runsWithLinks(bk.x),
      }));
      break;
    case 'b':
      children.push(new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        spacing: { after: 70, line: 290 },
        children: runsWithLinks(bk.x),
      }));
      bulletCount++;
      break;
    case 'n': {
      const ref = 'num-' + bk.id;
      if (!seenNum.has(ref)) {
        seenNum.add(ref);
        numberingConfigs.push({
          reference: ref,
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 460, hanging: 260 } } },
          }],
        });
      }
      children.push(new Paragraph({
        numbering: { reference: ref, level: 0 },
        spacing: { after: 70, line: 290 },
        children: runsWithLinks(bk.x),
      }));
      break;
    }
    case 'code':
      children.push(...codeParas(bk.x));
      break;
    case 'tbl':
      children.push(tableBlock(bk));
      children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: '', font: FONT, size: 14 })] }));
      break;
    case 'note':
      children.push(new Paragraph({
        shading: { fill: 'FFF6E5', type: ShadingType.CLEAR },
        spacing: { before: 140, after: 180, line: 290 },
        indent: { left: 160, right: 160 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: 'E8A33D', space: 6 },
          top: { style: BorderStyle.SINGLE, size: 2, color: 'F0DCB4', space: 4 },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: 'F0DCB4', space: 4 },
          right: { style: BorderStyle.SINGLE, size: 2, color: 'F0DCB4', space: 4 },
        },
        children: runsWithLinks(bk.x, { size: 19 }),
      }));
      break;
    case 'img': {
      const p = path.join(ROOT, bk.path);
      if (fs.existsSync(p)) {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 160, after: 60 },
          children: [new ImageRun({
            type: 'png', data: fs.readFileSync(p),
            transformation: { width: bk.w, height: bk.h },
            altText: { title: bk.cap || 'figure', description: bk.cap || 'figure', name: 'figure' },
          })],
        }));
        if (bk.cap) children.push(new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: bk.cap, font: FONT, size: 18, color: '666666' })],
        }));
      }
      break;
    }
    case 'toc':
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1, spacing: { after: 200 },
        children: [new TextRun({ text: '目 录', font: FONT, size: 32, bold: true, color: ACCENT })],
      }));
      children.push(new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: '（在 Word 中打开后，右键此处选择“更新域”即可生成带页码的目录）', font: FONT, size: 18, color: '888888' })],
      }));
      children.push(new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-3' }));
      break;
    case 'pb':
      children.push(new Paragraph({ children: [new PageBreak()] }));
      break;
    default:
      break;
  }
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 21 }, paragraph: { spacing: { line: 300 } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, color: ACCENT, font: FONT },
        paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, color: ACCENT2, font: FONT },
        paragraph: { spacing: { before: 260, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, color: '333333', font: FONT },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: numberingConfigs },
  sections: [{
    properties: { page: { margin: { top: 1300, right: 1200, bottom: 1300, left: 1200 } } },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
        children: [new TextRun({ text: '肿瘤生物信息学 R 语言学习与复现手册 · 2026-07', font: FONT, size: 16, color: '888888' })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: '第 ', font: FONT, size: 16, color: '888888' }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '888888' }),
          new TextRun({ text: ' 页 / 共 ', font: FONT, size: 16, color: '888888' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '888888' }),
          new TextRun({ text: ' 页', font: FONT, size: 16, color: '888888' }),
        ],
      })] }),
    },
    children,
  }],
});

const out = path.join(ROOT, 'final', '肿瘤生物信息学R语言学习与复现手册_2026版.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  console.log('written:', out, (buf.length / 1024).toFixed(0) + ' KB');
});
