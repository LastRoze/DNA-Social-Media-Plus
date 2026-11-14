interface Finding {
  file: string;
  line: number;
  column: number;
  message: string;
  excerpt: string;
}

const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

const hex = (cp: number): string => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;

const excerptOf = (line: string): string => JSON.stringify(line.length > 120 ? `${line.slice(0, 117)}...` : line);

function allowedNonAscii(cp: number): boolean {
  return (
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0x3000 && cp <= 0x303f) ||
    (cp >= 0xff01 && cp <= 0xff60)
  );
}

function characterMessage(cp: number): string | null {
  switch (cp) {
    case 0xfffd:
      return `${hex(cp)} replacement character: the text is corrupted, rewrite the flagged sentence`;
    case 0x2014:
      return `${hex(cp)} em dash: use a plain hyphen (-)`;
    case 0x2013:
      return `${hex(cp)} en dash: use a plain hyphen (-)`;
    case 0x2018:
    case 0x2019:
      return `${hex(cp)} curly apostrophe: use a plain apostrophe (')`;
    case 0x201c:
    case 0x201d:
      return `${hex(cp)} curly quote: use a plain double quote (")`;
    case 0x2026:
      return `${hex(cp)} ellipsis character: use three periods (...)`;
    case 0x00a0:
      return `${hex(cp)} non-breaking space: use a plain space`;
    case 0x00ad:
      return `${hex(cp)} soft hyphen: remove it`;
    case 0x00c3:
      return `${hex(cp)} mojibake signature: the text was double-encoded, rewrite the flagged sentence`;
    case 0x00e2:
      return `${hex(cp)} mojibake signature (smart punctuation bytes survived decoding), rewrite the flagged sentence`;
    case 0x0009:
      return `${hex(cp)} tab character: use spaces`;
    case 0x000d:
      return `${hex(cp)} carriage return: save the file with Unix (LF) line endings`;
    default:
      break;
  }
  if (cp < 0x20 || cp === 0x7f) return `${hex(cp)} control character`;
  if (cp >= 0x80 && cp <= 0x9f) return `${hex(cp)} C1 control character`;
  if (
    (cp >= 0x200b && cp <= 0x200f) ||
    (cp >= 0x202a && cp <= 0x202e) ||
    (cp >= 0x2060 && cp <= 0x2064) ||
    cp === 0xfeff ||
    (cp >= 0x1d173 && cp <= 0x1d17a)
  ) {
    return `${hex(cp)} invisible formatting character`;
  }
  if (cp >= 0x20 && cp <= 0x7e) return null;
  if (!allowedNonAscii(cp)) {
    return `${hex(cp)} character outside ASCII: text is ASCII only, except CJK when quoting zh-CN strings`;
  }
  return null;
}

function outsideInlineCode(line: string): string {
  const withoutSpans = line.replace(/`[^`]*`/g, "");
  const open = withoutSpans.indexOf("`");
  return open === -1 ? withoutSpans : withoutSpans.slice(0, open);
}

async function lintFile(path: string, findings: Finding[]): Promise<void> {
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  if (bytes.length === 0) {
    findings.push({ file: path, line: 0, column: 0, message: "file is empty", excerpt: "" });
    return;
  }
  let text: string;
  try {
    text = decoder.decode(bytes);
  } catch {
    findings.push({
      file: path,
      line: 0,
      column: 0,
      message: "invalid UTF-8: rewrite the file with the file-write tool, never through a shell command line",
      excerpt: "",
    });
    return;
  }
  if (text.charCodeAt(0) === 0xfeff) {
    findings.push({
      file: path,
      line: 1,
      column: 1,
      message: `${hex(0xfeff)} byte order mark: save the file without a BOM`,
      excerpt: excerptOf(text.slice(0, 40)),
    });
    text = text.slice(1);
  }
  let inFence = false;
  for (const [index, line] of text.split("\n").entries()) {
    const lineNumber = index + 1;
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    for (const [column, character] of [...line].entries()) {
      const message = characterMessage(character.codePointAt(0)!);
      if (message) {
        findings.push({ file: path, line: lineNumber, column: column + 1, message, excerpt: excerptOf(line) });
      }
    }
    if (!inFence) {
      const column = outsideInlineCode(line).indexOf("\\");
      if (column !== -1) {
        findings.push({
          file: path,
          line: lineNumber,
          column: column + 1,
          message:
            "stray backslash outside code spans: quote-marker corruption looks exactly like this; put real escapes inside code spans",
          excerpt: excerptOf(line),
        });
      }
    }
  }
}

const files = Bun.argv.slice(2);
if (files.length === 0) {
  console.error("usage: bun scripts/text-lint.ts <file> [<file> ...]");
  process.exit(2);
}
const findings: Finding[] = [];
for (const file of files) await lintFile(file, findings);
for (const finding of findings) {
  console.error(`FAIL ${finding.file}:${finding.line}:${finding.column} ${finding.message}`);
  if (finding.excerpt) console.error(`     ${finding.excerpt}`);
}
if (findings.length > 0) {
  console.error(`\n${findings.length} text hygiene finding(s) across ${files.length} file(s). Rewrite the flagged text with the file-write tool as clean UTF-8, then run the lint again.`);
  process.exit(1);
}
console.log(`ok   text hygiene: ${files.length} file(s) clean`);
