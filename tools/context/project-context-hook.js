#!/usr/bin/env node
'use strict';

// Claude Code UserPromptSubmit hook.
// Injects a small, project-specific memory index on EVERY user prompt and retrieves
// only relevant existing findings. No dependencies; bounded output to control context cost.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function walkMarkdown(dir, out = [], depth = 0) {
  if (depth > 4 || out.length > 120) return out;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', 'archive', 'document-references', 'dist'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, out, depth + 1);
    else if (/\.md$/i.test(entry.name) && !/HANDOFF\.md$/i.test(entry.name)) out.push(full);
    if (out.length > 120) break;
  }
  return out;
}

function termsFrom(text) {
  return [...new Set((text.match(/[A-Za-z0-9_.-]{3,}/g) || [])
    .map(s => s.toLowerCase())
    .filter(s => !new Set(['the','and','for','that','this','with','from','into','please','about','task','project','fix','make','need','want','can','you','claude','dcs','logic','simulator']).has(s)))].slice(0, 12);
}

function relevantSnippets(root, prompt) {
  const explicitIds = [...new Set((prompt.match(/\b(?:ABC|DITL)-?\d{1,3}[A-Z]?\b/gi) || []).map(s => s.toUpperCase()))];
  const terms = termsFrom(prompt);
  const dirs = [
    path.join(root, 'docs', 'abc-audit'),
    path.join(root, 'docs', 'versions'),
    path.join(root, 'tests', 'regress'),
    path.join(root, 'src', 'ui', 'uat'),
  ];
  const files = [];
  for (const dir of dirs) walkMarkdown(dir, files);
  for (const name of ['FINDINGS.md', 'docs/CHECKLIST.md', 'tests/regress/README.md']) {
    const full = path.join(root, name);
    if (fs.existsSync(full)) files.push(full);
  }

  const hits = [];
  for (const file of [...new Set(files)]) {
    const content = readText(file);
    if (!content) continue;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 12) continue;
      const lower = line.toLowerCase();
      const idMatches = explicitIds.filter(id => lower.includes(id.toLowerCase()));
      const termMatches = terms.filter(term => lower.includes(term));
      const score = idMatches.length * 5 + termMatches.length;
      if (score >= (explicitIds.length ? 5 : 3)) {
        hits.push({ score, text: `- ${path.relative(root, file)}: ${line.slice(0, 420)}` });
      }
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return [...new Set(hits.map(h => h.text))].slice(0, 6).join('\n');
}

function graphQuery(root, prompt) {
  const graph = path.join(root, 'graphify-out', 'graph.json');
  if (!fs.existsSync(graph) || !prompt.trim()) return '';
  const result = spawnSync('graphify', ['query', prompt.slice(0, 500), '--graph', graph], {
    cwd: root, encoding: 'utf8', timeout: 1800, maxBuffer: 16000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) return '';
  return (result.stdout || '').trim().slice(0, 2200);
}

(async () => {
  try {
    const inputText = await readStdin();
    let input = {};
    try { input = JSON.parse(inputText || '{}'); } catch {}
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const prompt = String(input.prompt || '');
    const memory = readText(path.join(root, 'docs', 'PROJECT_MEMORY.md')).trim();
    const graph = graphQuery(root, prompt);
    const snippets = graph ? '' : relevantSnippets(root, prompt);
    const parts = [
      '[AUTOMATIC PROJECT MEMORY — injected on this user prompt]',
      'Treat this as required context, not as a replacement for checking current files.',
      memory ? memory.slice(0, 4300) : 'PROJECT_MEMORY.md is missing. Read CLAUDE.md, PROJECT_RULES.md, and HANDOFF.md before repository work.',
    ];
    if (graph) parts.push('[Graphify query results — use as navigation hints, verify source files before conclusions]\n' + graph);
    else if (snippets) parts.push('[Targeted findings/report matches — verify against original source where needed]\n' + snippets);
    else parts.push('No confident targeted Markdown matches were found. Search the repository using exact tag/sheet/function names; for DCS behavior, inspect the original document-references source before deciding.');
    parts.push('Do not claim you read a source, queried Graphify, ran tests, or verified a result unless you actually did so in this task.');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: parts.join('\n\n').slice(0, 6800),
      },
    }));
  } catch {
    // Fail open so a memory-hook problem never blocks the user's prompt.
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: 'Project memory hook failed. Read CLAUDE.md, PROJECT_RULES.md, and HANDOFF.md before repository work; do not claim the hook retrieved context.',
      },
    }));
  }
})();
