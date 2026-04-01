// XML Diff Utility Functions - XML-Aware Diffing

export interface XmlNode {
  type: 'element' | 'text' | 'comment';
  tagName?: string;
  attributes?: Record<string, string>;
  content?: string;
  children?: XmlNode[];
  path: string;
}

export interface DiffLine {
  lineNumber: number;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  leftContent?: string;
  rightContent?: string;
  content: string;
  depth: number;
  isTag: boolean;
  tagName?: string;
}

export interface DiffResult {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
}

/**
 * Parse XML string into a tree of XmlNodes
 */
function parseXmlToNodes(xmlString: string): XmlNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  function nodeToXmlNode(node: Node, path: string): XmlNode | null {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const attributes: Record<string, string> = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
      }
      
      const children: XmlNode[] = [];
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = nodeToXmlNode(element.childNodes[i], `${path}/${element.tagName}[${i}]`);
        if (child) children.push(child);
      }
      
      return {
        type: 'element',
        tagName: element.tagName,
        attributes,
        children,
        path: `${path}/${element.tagName}`
      };
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        return {
          type: 'text',
          content: text,
          path: `${path}/text()`
        };
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      return {
        type: 'comment',
        content: node.textContent || '',
        path: `${path}/comment()`
      };
    }
    return null;
  }
  
  const root = doc.documentElement;
  return nodeToXmlNode(root, '') || { type: 'element', path: '/' };
}

/**
 * Flatten XML tree to lines for display
 */
interface FlatLine {
  content: string;
  depth: number;
  isTag: boolean;
  tagName?: string;
  nodeSignature: string; // Used for matching
}

function flattenXmlNode(node: XmlNode, depth: number = 0): FlatLine[] {
  const lines: FlatLine[] = [];
  
  if (node.type === 'element' && node.tagName) {
    const attrs = node.attributes || {};
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    
    const hasChildren = node.children && node.children.length > 0;
    const hasOnlyTextChild = hasChildren && 
      node.children!.length === 1 && 
      node.children![0].type === 'text';
    
    if (hasOnlyTextChild) {
      // Single line: <tag>text</tag>
      const textContent = node.children![0].content || '';
      const opening = attrStr ? `<${node.tagName} ${attrStr}>` : `<${node.tagName}>`;
      const line = `${opening}${textContent}</${node.tagName}>`;
      lines.push({
        content: '  '.repeat(depth) + line,
        depth,
        isTag: true,
        tagName: node.tagName,
        nodeSignature: `${node.tagName}|${attrStr}|${textContent}`
      });
    } else if (hasChildren) {
      // Opening tag
      const opening = attrStr ? `<${node.tagName} ${attrStr}>` : `<${node.tagName}>`;
      lines.push({
        content: '  '.repeat(depth) + opening,
        depth,
        isTag: true,
        tagName: node.tagName,
        nodeSignature: `${node.tagName}|${attrStr}|open`
      });
      
      // Children
      for (const child of node.children!) {
        lines.push(...flattenXmlNode(child, depth + 1));
      }
      
      // Closing tag
      lines.push({
        content: '  '.repeat(depth) + `</${node.tagName}>`,
        depth,
        isTag: true,
        tagName: node.tagName,
        nodeSignature: `${node.tagName}|close`
      });
    } else {
      // Self-closing or empty
      const line = attrStr ? `<${node.tagName} ${attrStr}/>` : `<${node.tagName}/>`;
      lines.push({
        content: '  '.repeat(depth) + line,
        depth,
        isTag: true,
        tagName: node.tagName,
        nodeSignature: `${node.tagName}|${attrStr}|self`
      });
    }
  } else if (node.type === 'text' && node.content) {
    lines.push({
      content: '  '.repeat(depth) + node.content,
      depth,
      isTag: false,
      nodeSignature: `text|${node.content}`
    });
  } else if (node.type === 'comment') {
    lines.push({
      content: '  '.repeat(depth) + `<!--${node.content}-->`,
      depth,
      isTag: false,
      nodeSignature: `comment|${node.content}`
    });
  }
  
  return lines;
}

/**
 * Compute the Longest Common Subsequence (LCS) of two arrays
 */
function computeLCS<T>(arr1: T[], arr2: T[], equals: (a: T, b: T) => boolean): number[][] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (equals(arr1[i - 1], arr2[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Get LCS indices from the DP table
 */
function getLCSIndices(dp: number[][], arr1: any[], arr2: any[], equals: (a: any, b: any) => boolean): { left: Set<number>; right: Set<number> } {
  const leftIndices = new Set<number>();
  const rightIndices = new Set<number>();
  
  let i = arr1.length, j = arr2.length;
  while (i > 0 && j > 0) {
    if (equals(arr1[i - 1], arr2[j - 1])) {
      leftIndices.add(i - 1);
      rightIndices.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return { left: leftIndices, right: rightIndices };
}

/**
 * Check if two XML lines are similar enough to be considered modified (same tag)
 */
function areSimilarLines(line1: FlatLine, line2: FlatLine): boolean {
  if (line1.isTag !== line2.isTag) return false;
  if (line1.tagName !== line2.tagName) return false;
  if (line1.depth !== line2.depth) return false;
  return true;
}

/**
 * XML-aware diff that compares XML structure
 */
export function diffXmlLines(xml1: string, xml2: string): DiffResult {
  // Parse and flatten both XMLs
  let lines1: FlatLine[];
  let lines2: FlatLine[];
  
  try {
    const node1 = parseXmlToNodes(xml1);
    lines1 = flattenXmlNode(node1);
  } catch {
    lines1 = xml1.split('\n').map((line, i) => ({
      content: line,
      depth: 0,
      isTag: line.trim().startsWith('<'),
      nodeSignature: `line-${i}-${line.trim()}`
    }));
  }
  
  try {
    const node2 = parseXmlToNodes(xml2);
    lines2 = flattenXmlNode(node2);
  } catch {
    lines2 = xml2.split('\n').map((line, i) => ({
      content: line,
      depth: 0,
      isTag: line.trim().startsWith('<'),
      nodeSignature: `line-${i}-${line.trim()}`
    }));
  }
  
  // Compute LCS based on node signatures
  const dp = computeLCS(lines1, lines2, (a, b) => a.nodeSignature === b.nodeSignature);
  const lcsIndices = getLCSIndices(dp, lines1, lines2, (a, b) => a.nodeSignature === b.nodeSignature);
  
  const leftLines: DiffLine[] = [];
  const rightLines: DiffLine[] = [];
  
  let i = 0, j = 0;
  let leftLineNum = 1, rightLineNum = 1;
  
  while (i < lines1.length || j < lines2.length) {
    const inLCS1 = lcsIndices.left.has(i);
    const inLCS2 = lcsIndices.right.has(j);
    
    if (inLCS1 && inLCS2) {
      // Both lines are part of LCS - unchanged
      leftLines.push({
        lineNumber: leftLineNum++,
        type: 'unchanged',
        content: lines1[i].content,
        leftContent: lines1[i].content,
        rightContent: lines2[j].content,
        depth: lines1[i].depth,
        isTag: lines1[i].isTag,
        tagName: lines1[i].tagName
      });
      rightLines.push({
        lineNumber: rightLineNum++,
        type: 'unchanged',
        content: lines2[j].content,
        leftContent: lines1[i].content,
        rightContent: lines2[j].content,
        depth: lines2[j].depth,
        isTag: lines2[j].isTag,
        tagName: lines2[j].tagName
      });
      i++;
      j++;
    } else if (!inLCS1 && !inLCS2 && i < lines1.length && j < lines2.length) {
      // Both not in LCS - check if similar (modified) or different (add/remove)
      if (areSimilarLines(lines1[i], lines2[j])) {
        // Modified - same tag structure, different content
        leftLines.push({
          lineNumber: leftLineNum++,
          type: 'modified',
          content: lines1[i].content,
          leftContent: lines1[i].content,
          rightContent: lines2[j].content,
          depth: lines1[i].depth,
          isTag: lines1[i].isTag,
          tagName: lines1[i].tagName
        });
        rightLines.push({
          lineNumber: rightLineNum++,
          type: 'modified',
          content: lines2[j].content,
          leftContent: lines1[i].content,
          rightContent: lines2[j].content,
          depth: lines2[j].depth,
          isTag: lines2[j].isTag,
          tagName: lines2[j].tagName
        });
        i++;
        j++;
      } else {
        // Not similar - treat as removal from left
        leftLines.push({
          lineNumber: leftLineNum++,
          type: 'removed',
          content: lines1[i].content,
          leftContent: lines1[i].content,
          depth: lines1[i].depth,
          isTag: lines1[i].isTag,
          tagName: lines1[i].tagName
        });
        rightLines.push({
          lineNumber: -1,
          type: 'removed',
          content: '',
          leftContent: lines1[i].content,
          depth: lines1[i].depth,
          isTag: lines1[i].isTag,
          tagName: lines1[i].tagName
        });
        i++;
      }
    } else if (!inLCS1 && i < lines1.length) {
      // Left line not in LCS - removed
      leftLines.push({
        lineNumber: leftLineNum++,
        type: 'removed',
        content: lines1[i].content,
        leftContent: lines1[i].content,
        depth: lines1[i].depth,
        isTag: lines1[i].isTag,
        tagName: lines1[i].tagName
      });
      rightLines.push({
        lineNumber: -1,
        type: 'removed',
        content: '',
        leftContent: lines1[i].content,
        depth: lines1[i].depth,
        isTag: lines1[i].isTag,
        tagName: lines1[i].tagName
      });
      i++;
    } else if (!inLCS2 && j < lines2.length) {
      // Right line not in LCS - added
      leftLines.push({
        lineNumber: -1,
        type: 'added',
        content: '',
        rightContent: lines2[j].content,
        depth: lines2[j].depth,
        isTag: lines2[j].isTag,
        tagName: lines2[j].tagName
      });
      rightLines.push({
        lineNumber: rightLineNum++,
        type: 'added',
        content: lines2[j].content,
        rightContent: lines2[j].content,
        depth: lines2[j].depth,
        isTag: lines2[j].isTag,
        tagName: lines2[j].tagName
      });
      j++;
    } else {
      // Safety break
      break;
    }
  }
  
  return { leftLines, rightLines };
}

/**
 * Format XML with proper indentation
 */
export function formatXml(xml: string): string {
  try {
    const node = parseXmlToNodes(xml);
    const lines = flattenXmlNode(node);
    return lines.map(l => l.content).join('\n');
  } catch {
    // Fallback to simple formatting
    let formatted = '';
    let indent = 0;
    const rawLines = xml.replace(/>\s*</g, '>\n<').split('\n');
    
    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }
      
      formatted += '  '.repeat(indent) + trimmed + '\n';
      
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
        indent++;
      }
    }
    
    return formatted.trim();
  }
}

/**
 * Get summary of differences between two XML files
 */
export function getDiffSummary(diffResult: DiffResult): { added: number; removed: number; modified: number } {
  let added = 0;
  let removed = 0;
  let modified = 0;
  
  for (const line of diffResult.leftLines) {
    if (line.type === 'added') added++;
    if (line.type === 'removed') removed++;
    if (line.type === 'modified') modified++;
  }
  
  return { added, removed, modified };
}
