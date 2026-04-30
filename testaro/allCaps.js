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
const MAX_QUALIFYING = 100;

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
      catalogIndex: index,
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
        resolve(
          [...text.matchAll(/\{"index":\s*\d+,\s*"confidence":\s*[01]\.\d{1,2}\}/g)]
          .map(m => {
            const {index, confidence} = JSON.parse(m[0]);
            return {index, confidence: Math.round(confidence * 10) / 10};
          })
        );
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
exports.reporter = async (_, catalog, withItems) => {
  const data = {};
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  // Get data on the catalog entries whose text values contain 2+ consecutive capital letters.
  const qualifying = Object.entries(catalog)
  .filter(([, entry]) => entry.text && /\p{Lu}{2,}/u.test(entry.text))
  .map(([index, entry]) => ({
    index: Number(index),
    tagName: entry.tagName,
    text: getContext(entry.text)
  }));
  // If there are none:
  if (!qualifying.length) {
    // Report this.
    return {data, totals, standardInstances};
  }
  // Sort them, with unbiased (Fisher–Yates) randomization.
  const sample = qualifying.slice();
  for (let i = sample.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sample[i], sample[j]] = [sample[j], sample[i]];
  }
  // If their count exceeds the limit on AI assistance:
  if (sample.length > MAX_QUALIFYING) {
    // Truncate them.
    sample.length = MAX_QUALIFYING;
  }
  let violations;
  try {
    // Get AI estimates of the probabilities of their violating the rule.
    const classifications = await classifyWithAI(sample);
    // Treat the entries with above-minimum violation confidence levels as violations.
    violations = classifications
    .filter(({confidence}) => confidence >= MIN_CONFIDENCE)
    .map(({index, confidence}) => ({
      catalogIndex: String(index),
      what: `Element contains unnecessarily (with confidence ${Math.round(confidence * 100)}%) all-capital text`
    }));
    const evaluated = classifications.length;
    const leftOut = qualifying.length - evaluated;
    // If any entries were truncated out and any AI confidence levels were above-minimum:
    if (leftOut > 0 && evaluated > 0) {
      // Add data about the estimated violation rate among those entries.
      data.leftOut = {
        count: leftOut,
        estimatedViolations: Math.round((violations.length / evaluated) * leftOut)
      };
    }
  }
  catch(error) {
    data.aiError = error.message;
    violations = getRuleBasedViolations(catalog);
  }
  const estimatedLeftOut = data.leftOut?.estimatedViolations ?? 0;
  // Add the estimated violation count to the totals.
  totals[0] = violations.length + estimatedLeftOut;
  // If itemization is required:
  if (withItems) {
    // For each entry deemed a violation:
    for (const {catalogIndex, what} of violations) {
      // Add an instance to the standard instances.
      standardInstances.push({ruleID, what, ordinalSeverity: 0, count: 1, catalogIndex});
    }
    // If any entries were truncated:
    if (estimatedLeftOut) {
      // Add a summary instance for them.
      standardInstances.push({ruleID, what: whats, ordinalSeverity: 0, count: estimatedLeftOut});
    }
  }
  // Otherwise, i.e. if itemization is not required, and if any violations exist:
  else if (totals[0]) {
    // Add a summary instance for them.
    standardInstances.push({ruleID, what: whats, ordinalSeverity: 0, count: totals[0]});
  }
  return {data, totals, standardInstances};
};
