# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Utsuwa, please report it by opening a GitHub issue or contacting the maintainer directly.

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (if applicable)

## Security Considerations

### API Key Storage

Utsuwa stores API keys for LLM and TTS providers locally on your device. This means:

- Keys are stored locally on your device only
- Keys are not sent to any server other than the respective API providers
- Keys persist until you remove them in Settings or clear the app's data

**Recommendations:**
- Use Utsuwa on trusted devices only
- Consider using API keys with usage limits when possible
- Remove API keys in Settings if using a shared device

### Client-Side Application

Utsuwa runs entirely on your device — whether in a browser or the desktop app. There is no backend server that processes or stores your data. All API calls are made directly from the app to the respective service providers.

### Third-Party Services

When you configure API keys, Utsuwa communicates directly with:
- LLM providers (OpenAI, Anthropic, Google, etc.)
- TTS providers (ElevenLabs, OpenAI, etc.)

Please review the privacy policies and terms of service of any providers you choose to use.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Updates

Security updates will be released as needed. Watch the repository for notifications about important updates.
