# Security Policy

## Supported Versions

We actively maintain security for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in ReelBird, please follow these steps:

### 1. Do NOT disclose publicly
- Do not open a public issue on GitHub
- Do not discuss the vulnerability in public forums or chat rooms
- Do not post about it on social media

### 2. Report privately
Please email security concerns to: [security@reelbird.app](mailto:security@reelbird.app)

Include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (if known)

### 3. What to expect
- We will acknowledge receipt within 48 hours
- We will investigate and respond within 7 days
- We will work with you to resolve the issue
- We will credit you in our security advisories (unless you prefer to remain anonymous)

## Security Best Practices

### For Users
- Keep your Docker containers updated
- Use strong passwords for database access
- Regularly rotate API keys and secrets
- Monitor access logs for suspicious activity
- Use HTTPS in production environments

### For Developers
- Never commit secrets or API keys to the repository
- Use environment variables for sensitive configuration
- Regularly update dependencies for security patches
- Follow secure coding practices
- Implement proper input validation and sanitization

## Security Features

### Authentication & Authorization
- JWT-based authentication (when enabled)
- Password hashing with bcrypt
- Role-based access control
- Session management

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- CSRF protection
- Secure file upload handling

### Infrastructure Security
- Container security best practices
- Network isolation between services
- Secure default configurations
- Regular security updates

## Known Security Considerations

### File Upload
- File type validation
- File size limits (20MB max)
- Secure file storage
- Temporary file cleanup

### AI Model Security
- Model input validation
- Secure model storage
- Processing isolation
- No persistent storage of uploaded content

### Database Security
- Connection encryption
- Parameterized queries
- Access control
- Regular backups

## Security Updates

We regularly update dependencies and apply security patches. Check our release notes for security-related updates.

## Contact

For security-related questions or concerns:
- Email: [security@reelbird.app](mailto:security@reelbird.app)
- GitHub: Open a private security advisory

Thank you for helping keep ReelBird secure!
