import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

function fragmentToText(fragment: DocumentFragment): string {
  const div = document.createElement('div');
  div.appendChild(fragment.cloneNode(true));
  return div.innerHTML;
}

describe('renderMarkdown', () => {
  it('renders plain text as a paragraph', () => {
    const result = fragmentToText(renderMarkdown('Hello world'));
    expect(result).toContain('<p');
    expect(result).toContain('Hello world');
  });

  it('renders bold text', () => {
    const result = fragmentToText(renderMarkdown('This is **bold** text'));
    expect(result).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    const result = fragmentToText(renderMarkdown('This is *italic* text'));
    expect(result).toContain('<em>italic</em>');
  });

  it('renders links with valid URLs', () => {
    const result = fragmentToText(
      renderMarkdown('Visit [our site](https://example.com)')
    );
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('>our site</a>');
  });

  it('strips javascript: URLs from links', () => {
    const result = fragmentToText(
      renderMarkdown('[click](javascript:alert(1))')
    );
    expect(result).not.toContain('href');
    expect(result).toContain('click');
  });

  it('renders unordered lists', () => {
    const result = fragmentToText(
      renderMarkdown('- Item one\n- Item two\n- Item three')
    );
    expect(result).toContain('<ul');
    expect(result).toContain('<li>');
    expect(result).toContain('Item one');
    expect(result).toContain('Item two');
    expect(result).toContain('Item three');
  });

  it('renders ordered lists', () => {
    const result = fragmentToText(
      renderMarkdown('1. First\n2. Second\n3. Third')
    );
    expect(result).toContain('<ol');
    expect(result).toContain('<li>');
    expect(result).toContain('First');
  });

  it('renders inline code', () => {
    const result = fragmentToText(renderMarkdown('Use `npm install` command'));
    expect(result).toContain('<code');
    expect(result).toContain('npm install');
  });

  it('renders code blocks', () => {
    const result = fragmentToText(
      renderMarkdown('```\nconst x = 1;\nconst y = 2;\n```')
    );
    expect(result).toContain('<pre');
    expect(result).toContain('<code');
    expect(result).toContain('const x = 1;');
  });

  it('renders blockquotes', () => {
    const result = fragmentToText(renderMarkdown('> This is a quote'));
    expect(result).toContain('<blockquote');
    expect(result).toContain('This is a quote');
  });

  it('renders multiple paragraphs', () => {
    const result = fragmentToText(
      renderMarkdown('First paragraph\n\nSecond paragraph')
    );
    const pCount = (result.match(/<p /g) || []).length;
    expect(pCount).toBe(2);
  });

  it('renders nested bold and italic', () => {
    const result = fragmentToText(
      renderMarkdown('This is **bold and *italic* text** here')
    );
    expect(result).toContain('<strong>');
  });

  it('does not render HTML tags', () => {
    const result = fragmentToText(
      renderMarkdown('<script>alert("xss")</script>Hello')
    );
    expect(result).not.toContain('<script>');
    // Text content should be escaped
    expect(result).toContain('&lt;script&gt;');
  });
});
