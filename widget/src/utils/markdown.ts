/**
 * Safe markdown renderer that returns a DocumentFragment.
 * No innerHTML — all elements created via DOM API.
 * Supports: bold, italic, inline code, links, unordered/ordered lists,
 * code blocks, blockquotes, paragraphs.
 */
export function renderMarkdown(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (fenced)
    if (line.trimStart().startsWith('```')) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```

      const pre = document.createElement('pre');
      pre.className = 'jc-code-block';
      const code = document.createElement('code');
      code.textContent = codeLines.join('\n');
      pre.appendChild(code);
      fragment.appendChild(pre);
      continue;
    }

    // Heading (## or ###)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      const tag = `h${level}` as 'h1' | 'h2' | 'h3';
      const heading = document.createElement(tag);
      heading.className = `jc-heading jc-heading-${level}`;
      appendInlineContent(heading, headingMatch[2]);
      fragment.appendChild(heading);
      i++;
      continue;
    }

    // Table (detect header row with pipe separators)
    if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+[-|:\s]+$/.test(lines[i + 1])) {
      const table = document.createElement('table');
      table.className = 'jc-table';

      // Header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headerCells = parsePipeRow(lines[i]);
      for (const cell of headerCells) {
        const th = document.createElement('th');
        appendInlineContent(th, cell.trim());
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);
      i += 2; // skip header + separator

      // Body rows
      const tbody = document.createElement('tbody');
      while (i < lines.length && lines[i].includes('|')) {
        const bodyRow = document.createElement('tr');
        const bodyCells = parsePipeRow(lines[i]);
        for (const cell of bodyCells) {
          const td = document.createElement('td');
          appendInlineContent(td, cell.trim());
          bodyRow.appendChild(td);
        }
        tbody.appendChild(bodyRow);
        i++;
      }
      table.appendChild(tbody);

      const wrapper = document.createElement('div');
      wrapper.className = 'jc-table-wrapper';
      wrapper.appendChild(table);
      fragment.appendChild(wrapper);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'jc-blockquote';
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      appendInlineContent(blockquote, quoteLines.join('\n'));
      fragment.appendChild(blockquote);
      continue;
    }

    // Unordered list
    if (/^[\-\*]\s/.test(line)) {
      const ul = document.createElement('ul');
      ul.className = 'jc-list';
      while (i < lines.length && /^[\-\*]\s/.test(lines[i])) {
        const li = document.createElement('li');
        appendInlineContent(li, lines[i].replace(/^[\-\*]\s/, ''));
        ul.appendChild(li);
        i++;
      }
      fragment.appendChild(ul);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const ol = document.createElement('ol');
      ol.className = 'jc-list';
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const li = document.createElement('li');
        appendInlineContent(li, lines[i].replace(/^\d+\.\s/, ''));
        ol.appendChild(li);
        i++;
      }
      fragment.appendChild(ol);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      const hr = document.createElement('hr');
      hr.className = 'jc-hr';
      fragment.appendChild(hr);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph (default)
    const p = document.createElement('p');
    p.className = 'jc-paragraph';
    appendInlineContent(p, line);
    fragment.appendChild(p);
    i++;
  }

  return fragment;
}

function appendInlineContent(parent: HTMLElement, text: string): void {
  // Regex for inline elements: bold, italic, inline code, links
  const inlinePattern =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parent.appendChild(
        document.createTextNode(text.slice(lastIndex, match.index))
      );
    }

    if (match[1]) {
      // Bold: **text**
      const strong = document.createElement('strong');
      strong.textContent = match[2];
      parent.appendChild(strong);
    } else if (match[3]) {
      // Italic: *text*
      const em = document.createElement('em');
      em.textContent = match[4];
      parent.appendChild(em);
    } else if (match[5]) {
      // Inline code: `code`
      const code = document.createElement('code');
      code.className = 'jc-inline-code';
      code.textContent = match[6];
      parent.appendChild(code);
    } else if (match[7]) {
      // Link: [text](url)
      const url = match[9];
      if (isValidUrl(url)) {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = match[8];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'jc-link';
        parent.appendChild(a);
      } else {
        // Invalid URL — render as plain text
        parent.appendChild(document.createTextNode(match[8]));
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parent.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function parsePipeRow(line: string): string[] {
  // Strip leading/trailing pipes and split by |
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|');
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
