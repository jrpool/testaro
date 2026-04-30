/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  allCaps
  Related to Tenon rule 153.
  This test reports elements whose text contains upper-case strings that are not intrinsically upper-case (i.e., not acronyms, abbreviations, or terms whose standard form is all-capitals). Claude Haiku classifies qualifying catalog entries and estimates the probability of a rule violation. If the AI call fails, the test falls back to a rule-based check for 8+ consecutive upper-case letters.
*/

// IMPORTS

const https = require('https');

// PARAMETERS

const MIN_CONFIDENCE = 0.5;
const MAX_MARGIN = 100;
const MAX_TOTAL = 2000;

// CONSTANTS

const ruleID = 'allCaps';
const whats = 'Elements have all-capital text';

// FUNCTIONS

// Returns text limited to MAX_MARGIN characters before the first and after the last uppercase match, capped at MAX_TOTAL characters.
const getContext = text => {
  const matches = [...text.matchAll(/\p{Lu}{2,}/gu)];
  const first = matches[0];
  const last = matches[matches.length - 1];
  const start = Math.max(0, first.index - MAX_MARGIN);
  const end = Math.min(text.length, last.index + last[0].length + MAX_MARGIN);
  return text.slice(start, end).slice(0, MAX_TOTAL);
};

// Returns violations using the rule-based fallback (8+ consecutive uppercase letters).
const getRuleBasedViolations = catalog =>
  Object.entries(catalog)
    .filter(([, entry]) => entry.text && /\p{Lu}{8,}/u.test(entry.text))
    .map(([index]) => ({
      catalogIndex: Number(index),
      what: '[No AI available] Element contains all-capital text'
    }));

// Sends qualifying entries to Claude Haiku and returns confidence scores.
const classifyWithAI = entries => new Promise((resolve, reject) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    reject(new Error('ANTHROPIC_API_KEY not set'));
    return;
  }
  const prompt =
    'Classify HTML elements for an accessibility rule. All-capital text violates the rule UNLESS it is an acronym, abbreviation, or term whose standard form is all-capitals (NASA, WHO, etc.).\n\n'
    + 'For each element, give a confidence score (0.0–1.0, rounded to one decimal place) for the probability that the element VIOLATES the rule (its all-caps text is NOT intrinsically all-caps).\n\n'
    + 'Respond with ONLY a JSON array. Each element: {"index": <number>, "confidence": <number>}\n\n'
    + 'Elements:\n'
    + JSON.stringify(entries);
  const payload = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{role: 'user', content: prompt}]
  });
  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload)
    }
  };
  const req = https.request(options, res => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed.error) {
          reject(new Error(parsed.error.message));
          return;
        }
        const text = parsed.content[0].text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          reject(new Error('No JSON array in Haiku response'));
          return;
        }
        resolve(JSON.parse(jsonMatch[0]));
      }
      catch(error) {
        reject(new Error(`Haiku response error: ${error.message}`));
      }
    });
  });
  req.on('error', reject);
  req.setTimeout(20000, () => req.destroy(new Error('Haiku API timeout')));
  req.write(payload);
  req.end();
});

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const data = {};
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  const qualifying = Object.entries(catalog)
    .filter(([, entry]) => entry.text && /\p{Lu}{2,}/u.test(entry.text))
    .map(([index, entry]) => ({
      index: Number(index),
      tagName: entry.tagName,
      text: getContext(entry.text)
    }));
  if (!qualifying.length) {
    return {data, totals, standardInstances};
  }
  let violations;
  try {
    const classifications = await classifyWithAI(qualifying);
    violations = classifications
      .filter(({confidence}) => confidence >= MIN_CONFIDENCE)
      .map(({index, confidence}) => ({
        catalogIndex: index,
        what: `Element contains all-capital text (${Math.round(confidence * 100)}% non-intrinsic probability)`
      }));
  }
  catch(error) {
    data.aiError = error.message;
    violations = getRuleBasedViolations(catalog);
  }
  totals[0] = violations.length;
  if (withItems) {
    for (const {catalogIndex, what} of violations) {
      standardInstances.push({ruleID, what, ordinalSeverity: 0, count: 1, catalogIndex});
    }
  }
  else if (violations.length) {
    standardInstances.push({ruleID, what: whats, ordinalSeverity: 0, count: violations.length});
  }
  return {data, totals, standardInstances};
};
