# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability within ReelBird, please report it responsibly.

### How to Report

1. **Do not** create a public GitHub issue
2. Email security details to: security@reelbird.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution**: Within 30 days (depending on complexity)

### Security Best Practices

- Keep dependencies updated
- Use environment variables for sensitive data
- Enable security headers
- Regular security audits
- Input validation and sanitization

## Security Features

- JWT-based authentication
- Input validation with Joi
- Helmet.js security headers
- CORS configuration
- SQL injection prevention
- Environment variable protection

## Dependencies

We regularly audit our dependencies for known vulnerabilities:

```bash
# Backend
cd backend && npm audit

# Frontend  
cd frontend && npm audit

# AI Worker
cd ai-worker && pip check
```

## Contact

For security-related questions, contact: security@reelbird.com
