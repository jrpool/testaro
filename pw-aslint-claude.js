/*
  © 2025 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

// aslint.config.js
const { defineConfig } = require('aslint');

module.exports = defineConfig({
  // Configure ASLint rules
  rules: {
    'image-alt': 'error',
    'button-name': 'error',
    'html-has-lang': 'error',
    'link-name': 'error',
    'page-title': 'error'
  }
});

// test.spec.js
const { test, expect } = require('@playwright/test');
const { createASLinter } = require('aslint');

test.describe('Accessibility Tests', () => {
  let linter;

  test.beforeAll(async () => {
    linter = await createASLinter();
  });

  test('should pass accessibility checks', async ({ page }) => {
    // Navigate to your page
    await page.goto('https://your-website.com');

    // Get the page content
    const content = await page.content();

    // Run ASLint
    const results = await linter.lint(content);

    // Assert no accessibility violations
    expect(results.violations).toHaveLength(0);

    // Optional: Log detailed results
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:',
        results.violations.map(v => ({
          rule: v.rule,
          message: v.message,
          element: v.element
        }))
      );
    }
  });

  // Test specific components
  test('check specific component accessibility', async ({ page }) => {
    await page.goto('https://your-website.com/component');

    // Wait for specific component to be visible
    await page.waitForSelector('.your-component');

    // Get component HTML
    const componentHTML = await page.$eval(
      '.your-component',
      el => el.outerHTML
    );

    const results = await linter.lint(componentHTML);
    expect(results.violations).toHaveLength(0);
  });
});

// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  /* Other Playwright configs */
  use: {
    // Enable automatic accessibility violations logging
    trace: 'retain-on-failure'
  },
  reporter: [
    ['html'],
    ['list']
  ]
});
