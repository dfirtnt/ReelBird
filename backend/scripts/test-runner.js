#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test Runner with Closed-Loop Debugging
 * Implements AGENTS.md testing procedures with automatic failure analysis
 */

class TestRunner {
  constructor() {
    this.testDir = path.join(__dirname, '../tests/e2e');
    this.reportDir = path.join(__dirname, '../playwright-report');
    this.traceDir = path.join(__dirname, '../test-results');
  }

  async runTests() {
    console.log('🧪 Starting Playwright E2E Tests...');
    
    try {
      // Run tests with HTML reporter
      execSync('npm run test:e2e', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      console.log('✅ All tests passed!');
      return { success: true };
      
    } catch (error) {
      console.log('❌ Tests failed. Starting closed-loop debugging...');
      return await this.analyzeFailure();
    }
  }

  async analyzeFailure() {
    const analysis = {
      success: false,
      errors: [],
      suggestions: [],
      traces: []
    };

    try {
      // Find latest HTML report
      const htmlReport = this.findLatestReport();
      if (htmlReport) {
        analysis.errors.push(...this.parseHtmlReport(htmlReport));
      }

      // Find trace files
      const traceFiles = this.findTraceFiles();
      analysis.traces = traceFiles;

      // Generate suggestions
      analysis.suggestions = this.generateSuggestions(analysis.errors);

      console.log('🔍 Failure Analysis:');
      console.log(`   Errors found: ${analysis.errors.length}`);
      console.log(`   Trace files: ${traceFiles.length}`);
      console.log(`   Suggestions: ${analysis.suggestions.length}`);

      return analysis;

    } catch (error) {
      console.error('Error analyzing failure:', error.message);
      return analysis;
    }
  }

  findLatestReport() {
    if (!fs.existsSync(this.reportDir)) {
      return null;
    }

    const files = fs.readdirSync(this.reportDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      return null;
    }

    // Return the most recent HTML file
    const latestFile = htmlFiles.sort().reverse()[0];
    return path.join(this.reportDir, latestFile);
  }

  findTraceFiles() {
    if (!fs.existsSync(this.traceDir)) {
      return [];
    }

    const files = fs.readdirSync(this.traceDir, { recursive: true });
    return files.filter(file => file.endsWith('.zip')).map(file => 
      path.join(this.traceDir, file)
    );
  }

  parseHtmlReport(reportPath) {
    const errors = [];
    
    try {
      const content = fs.readFileSync(reportPath, 'utf8');
      
      // Extract error messages from HTML
      const errorMatches = content.match(/class="error[^"]*"[^>]*>([^<]+)</g);
      if (errorMatches) {
        errorMatches.forEach(match => {
          const errorText = match.replace(/class="error[^"]*"[^>]*>/, '').replace(/</, '');
          errors.push({
            type: 'test_error',
            message: errorText.trim(),
            source: 'html_report'
          });
        });
      }

      // Extract console errors
      const consoleMatches = content.match(/console\.error[^>]*>([^<]+)</g);
      if (consoleMatches) {
        consoleMatches.forEach(match => {
          const errorText = match.replace(/console\.error[^>]*>/, '').replace(/</, '');
          errors.push({
            type: 'console_error',
            message: errorText.trim(),
            source: 'html_report'
          });
        });
      }

    } catch (error) {
      console.error('Error parsing HTML report:', error.message);
    }

    return errors;
  }

  generateSuggestions(errors) {
    const suggestions = [];

    errors.forEach(error => {
      switch (error.type) {
        case 'test_error':
          if (error.message.includes('timeout')) {
            suggestions.push({
              type: 'timeout',
              action: 'Increase test timeout or optimize slow operations',
              code: 'await page.setDefaultTimeout(30000)'
            });
          }
          if (error.message.includes('not found') || error.message.includes('404')) {
            suggestions.push({
              type: 'routing',
              action: 'Check API route definitions and server startup',
              code: 'Verify route order in server.js'
            });
          }
          break;
          
        case 'console_error':
          if (error.message.includes('database') || error.message.includes('connection')) {
            suggestions.push({
              type: 'database',
              action: 'Check database connection and migrations',
              code: 'npm run migrate'
            });
          }
          if (error.message.includes('redis') || error.message.includes('queue')) {
            suggestions.push({
              type: 'redis',
              action: 'Check Redis connection and queue setup',
              code: 'docker-compose logs redis'
            });
          }
          break;
      }
    });

    return suggestions;
  }

  async openTrace(tracePath) {
    if (!fs.existsSync(tracePath)) {
      console.error('Trace file not found:', tracePath);
      return;
    }

    try {
      console.log('🔍 Opening trace file:', tracePath);
      execSync(`npx playwright show-trace "${tracePath}"`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.error('Error opening trace:', error.message);
    }
  }

  async openReport() {
    const reportPath = this.findLatestReport();
    if (!reportPath) {
      console.error('No HTML report found');
      return;
    }

    try {
      console.log('📊 Opening HTML report:', reportPath);
      execSync(`open "${reportPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error opening report:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new TestRunner();
  const command = process.argv[2];

  switch (command) {
    case 'run':
      runner.runTests();
      break;
    case 'trace':
      const tracePath = process.argv[3];
      if (tracePath) {
        runner.openTrace(tracePath);
      } else {
        console.log('Usage: node test-runner.js trace <path-to-trace.zip>');
      }
      break;
    case 'report':
      runner.openReport();
      break;
    default:
      console.log('Usage:');
      console.log('  node test-runner.js run     - Run tests with closed-loop debugging');
      console.log('  node test-runner.js trace   - Open trace file');
      console.log('  node test-runner.js report  - Open HTML report');
  }
}

module.exports = TestRunner;
