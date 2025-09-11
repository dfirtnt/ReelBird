# SousChef Project Instructions for IDE Agents

## Communication Standards
- **Radical Conciseness**: Maximum signal, minimum noise. Every word must serve a purpose.
- **Lead with Conclusion**: State most important information first, evidence second.
- **Structured Data**: Use lists, tables, code blocks over prose.
- **Report Facts**: State plan, action, result. Avoid describing internal process.
- **No Sycophantic Language**: Never use "You're absolutely right!", "Excellent point!" or similar flattery.
- **Brief Acknowledgments Only**: "Got it.", "I understand." - only when confirming technical requirements.

## Operational Doctrine
- **Autonomous Operation**: Execute plans without unnecessary user intervention after reconnaissance.
- **Zero-Assumption Discipline**: Verify all assumptions against live system. Code is ultimate source of truth.
- **Extreme Ownership**: Identify and fix all related issues, update all consumers of changed components.
- **Mandatory Workflow**: Reconnaissance → Plan → Execute → Verify → Report
- **Read Before Write**: Read before write; reread immediately after write.
- **System-Wide Planning**: Account for full system impact of all changes.
- **Autonomous Correction**: Diagnose and fix failures without user intervention.
- **Status Legend**: `✅` success, `⚠️` self-corrected issues, `🚧` blockers

## Architecture & Environment
 

## Database Operations
 
 
 

## Development Workflow
- **User Shortcuts**: Accept "lg" user prompt as a request to git commit and push to main, PLUS execute GitHub-ready tasks:
  - **Security & Setup**: Scan for hardcoded credentials/API keys, create comprehensive .gitignore, add .env.example, move config to external files
  - **Dependency Security**: Check requirements for latest versions and CVE vulnerabilities, update if patches available, alert if no patches
  - **Documentation & Standards**: Create professional README.md, add LICENSE (MIT), pin dependencies, add type hints/docstrings, remove debug prints
  - **Repository Files**: Add GitHub Actions CI workflow, create .github/SECURITY.md, consider CHANGELOG.md and CONTRIBUTING.md
  - **Final Verification**: Ensure no secrets in code, comprehensive .gitignore, professional README, proper license, documented dependencies/code
- **File Management**: Don't delete files without user confirmation
- **Documentation**: Create in Markdown (.md) files when requested
- **Testing**: Use Docker containers for all testing and validation, Playwright for browser testing

## Browser Testing with Playwright
- **Autonomous End-to-End Testing**: Set up Playwright for automated browser testing with closed-loop debugging
- **Installation Requirements**:
  - Add `@playwright/test` as dev dependency
  - Run `npx playwright install --with-deps`
- **Configuration** (`playwright.config.ts`):
  - Enable `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`
  - Use HTML reporter with `open: 'never'`
  - Define Chromium project using `devices['Desktop Chrome']`
- **NPM Scripts** (add to `package.json`):
  ```json
  {
    "scripts": {
      "test:e2e": "playwright test --reporter=html",
      "trace:open": "playwright show-trace ./playwright-report/*/*.zip"
    }
  }
  ```
- **MCP Tool Integration**: Wire commands for:
  - Run `test:e2e`
  - Open latest HTML report
  - Open latest trace.zip
  - Extract stack traces and errors for agent analysis
- **Closed Loop Behavior**: On test failure, automatically:
  - Parse HTML report and extract "Copy prompt" text
  - Summarize console/network/stack errors from trace.zip
  - Draft patch for failing test or app code
  - Apply patch and rerun affected tests
- **CI Setup**: GitHub Actions workflow that:
  - Runs `pnpm test:e2e`
  - Uploads `playwright-report/` and `trace.zip` artifacts
  - Enables agent to retrieve artifacts and propose patches via PRs
- **Testing Constraints**:
  - Use Playwright as primary test runner
  - Prefer MCP hooks for repeatability
  - Keep code changes idempotent and minimal
  - Follow closed loop: run → collect report/trace → analyze → patch → rerun → commit/PR

## Terminal Command Execution
- **Default Pattern**: Always pipe commands to `cat` to prevent pagination hanging
- **Simple Commands**: `command | cat` for basic operations
- **Analysis Commands**: Use temp files when output needs processing: `command > /tmp/output.txt`
- **Cleanup**: Remove temp files after analysis: `rm /tmp/output.txt`


## User Preferences
- **Communication**: Concise, technical responses
