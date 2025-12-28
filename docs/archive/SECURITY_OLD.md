# Security Measures

This document outlines the security measures implemented in the Traefik Log Dashboard.

## Recent Security Fixes (2025-12-12)

### 1. Middleware Protection (`middleware.ts`)

**Added comprehensive request validation:**
- ✅ **Malicious Pattern Detection**: Blocks requests containing shell commands, code injection attempts
- ✅ **Server Action Validation**: Filters out fake Server Action requests used in attacks
- ✅ **Rate Limiting**: Limits requests to 100 per minute per IP address
- ✅ **Input Sanitization**: Validates URL parameters and request bodies
- ✅ **Security Headers**: Adds X-Frame-Options, CSP, XSS Protection, etc.

**Blocked Patterns:**
- Shell commands: `/bin/bash`, `/bin/sh`, `/dev/tcp`
- Code execution: `eval()`, `exec()`, `system()`
- Script injection: `<script>`, `onclick=`, `onerror=`
- Template injection: `${`, `$(`

### 2. Error Handling

**Files:**
- `global-error.tsx` - Catches and filters malicious errors
- `instrumentation.ts` - Runtime error filtering to reduce log pollution

**Features:**
- Suppresses "Failed to find Server Action" errors from attack attempts
- Logs security warnings without exposing attack payloads
- Maintains legitimate error logging

### 3. CORS Configuration

**Updated `next.config.js`:**
- Configurable via `ALLOWED_ORIGINS` environment variable
- Defaults to `*` for development (restrict in production)
- Added `Access-Control-Max-Age` for better performance

## Security Best Practices

### For Production Deployments:

1. **Restrict CORS Origins:**
   ```bash
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Enable HTTPS Only:**
   - Use reverse proxy (Traefik, nginx) with TLS
   - Redirect HTTP to HTTPS

3. **Implement Authentication:**
   - The dashboard already requires agent tokens
   - Consider adding user authentication for the web interface

4. **Monitor Security Logs:**
   ```bash
   docker compose logs -f dashboard | grep "\[Security\]"
   ```

5. **Update Rate Limits:**
   Edit `middleware.ts` to adjust:
   ```typescript
   const RATE_LIMIT_MAX_REQUESTS = 100; // Adjust as needed
   const RATE_LIMIT_WINDOW = 60000; // 1 minute
   ```

6. **Review CSP Policy:**
   Update Content-Security-Policy in `middleware.ts` to match your requirements

## Attack Patterns Detected

The middleware will log and block:

1. **Reverse Shell Attempts:**
   - `/bin/bash -i >& /dev/tcp/IP/PORT`
   - Base64 encoded shell commands

2. **Code Injection:**
   - JavaScript injection via Server Actions
   - Template injection attacks

3. **XSS Attempts:**
   - Script tags in URLs or parameters
   - Event handler injection

## Incident Response

If you see security warnings in logs:

1. **Check the source IP:**
   ```bash
   docker compose logs dashboard | grep "\[Security\]"
   ```

2. **Block repeat offenders at firewall level:**
   ```bash
   # Example: iptables
   iptables -A INPUT -s MALICIOUS_IP -j DROP
   ```

3. **Review access patterns:**
   - Multiple 403 errors indicate scanning/attacks
   - Adjust rate limits if legitimate traffic is blocked

4. **Update patterns if needed:**
   - Add new patterns to `MALICIOUS_PATTERNS` in `middleware.ts`
   - Report new attack vectors to the project

## Security Updates

- **2025-12-12**: Added middleware, error filtering, and comprehensive request validation
- **Previous**: Basic CORS and authentication via tokens

## Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly
3. Include: description, reproduction steps, impact assessment

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
