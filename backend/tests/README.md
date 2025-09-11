# ReelBird Testing Documentation

## Overview

This directory contains comprehensive testing tools and procedures for the ReelBird video processing system, implementing the AGENTS.md testing standards with closed-loop debugging capabilities.

## Testing Architecture

### End-to-End Testing with Playwright
- **Primary Test Runner**: Playwright for browser automation
- **Configuration**: `playwright.config.ts` with optimized settings
- **Reporting**: HTML reports with trace files for debugging
- **CI Integration**: GitHub Actions workflow with artifact upload

### Test Categories

1. **Video Upload Workflow** (`video-upload.spec.ts`)
   - File upload validation
   - Automatic frame extraction (10 FPS)
   - AI processing pipeline
   - Status tracking and updates
   - Error handling and edge cases

2. **API Endpoint Testing**
   - Health checks
   - Authentication (when enabled)
   - Database operations
   - Redis queue processing

## Running Tests

### Local Development
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Start services
docker-compose up -d

# Run tests with closed-loop debugging
npm run test:debug

# Run tests directly
npm run test:e2e

# Open trace files
npm run trace:open
```

### Test Runner Commands
```bash
# Run tests with automatic failure analysis
node scripts/test-runner.js run

# Open HTML report
node scripts/test-runner.js report

# Open specific trace file
node scripts/test-runner.js trace ./test-results/trace.zip
```

## Closed-Loop Debugging

The test runner implements automatic failure analysis:

1. **Error Detection**: Parses HTML reports and console logs
2. **Trace Collection**: Gathers trace files for detailed analysis
3. **Suggestion Generation**: Provides actionable fixes based on error patterns
4. **Artifact Management**: Preserves test artifacts for investigation

### Common Error Patterns

| Error Type | Detection Pattern | Suggested Action |
|------------|------------------|------------------|
| Timeout | `timeout` in error message | Increase timeout or optimize operations |
| Routing | `404` or `not found` | Check API route definitions |
| Database | `connection` or `database` | Verify DB connection and migrations |
| Redis | `redis` or `queue` | Check Redis connection and queue setup |

## CI/CD Integration

### GitHub Actions Workflow
- **Trigger**: Push/PR to main/master branches
- **Services**: PostgreSQL and Redis containers
- **Artifacts**: Test reports, traces, and results
- **Timeout**: 60 minutes maximum

### Artifact Management
- `playwright-report/` - HTML test reports
- `test-results/` - JSON test results and trace files
- Retention: 30 days for reports, traces only on failure

## Test Data Management

### Video Files
- **Test Videos**: Generated dynamically for each test
- **Cleanup**: Automatic cleanup after test completion
- **Formats**: MP4 format with fake content for testing

### Database State
- **Migrations**: Automatic migration before tests
- **Isolation**: Each test run starts with clean state
- **Seeding**: Test user created automatically

## Performance Considerations

### Timeouts
- **Default**: 30 seconds for most operations
- **Processing**: Up to 60 seconds for video processing
- **CI**: Extended timeouts for slower CI environments

### Resource Usage
- **Docker**: All tests run in containerized environment
- **Memory**: Optimized for CI resource constraints
- **Parallel**: Tests run in parallel where possible

## Debugging Workflow

### When Tests Fail

1. **Automatic Analysis**: Test runner analyzes failure
2. **Report Generation**: HTML report with error details
3. **Trace Collection**: Trace files for step-by-step debugging
4. **Suggestion Review**: Actionable recommendations
5. **Fix Application**: Apply suggested fixes
6. **Rerun Tests**: Verify fixes work

### Manual Debugging

```bash
# Check service logs
docker-compose logs api
docker-compose logs ai-worker
docker-compose logs db

# Check test artifacts
ls -la playwright-report/
ls -la test-results/

# Run specific test
npx playwright test video-upload.spec.ts --headed

# Debug mode
npx playwright test --debug
```

## Best Practices

### Test Writing
- **Idempotent**: Tests should not depend on external state
- **Isolated**: Each test should be independent
- **Descriptive**: Clear test names and assertions
- **Fast**: Optimize for speed while maintaining coverage

### Maintenance
- **Regular Updates**: Keep Playwright and dependencies current
- **Artifact Cleanup**: Remove old test artifacts regularly
- **Documentation**: Update tests when features change
- **Monitoring**: Track test performance and reliability

## Troubleshooting

### Common Issues

**Tests timeout**: Increase timeout values or optimize slow operations
**Route conflicts**: Check route ordering in server.js
**Database errors**: Verify migrations and connection strings
**Redis issues**: Check Redis connection and queue configuration
**Docker problems**: Ensure all containers are healthy before testing

### Getting Help

1. Check test logs and error messages
2. Review HTML reports for detailed failure info
3. Use trace files for step-by-step debugging
4. Consult CI artifacts for environment-specific issues
5. Run tests locally to reproduce CI failures
