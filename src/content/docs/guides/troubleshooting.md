---
title: Troubleshooting
description: Common issues and solutions for Utsuwa.
---

# Troubleshooting

This guide covers common issues you might encounter when using Utsuwa and how to resolve them.

## Node.js Version Issues

### "Unsupported engine" error

Utsuwa requires Node.js 22 or higher. If you see an error like:

```bash
npm error engine Unsupported engine
npm error notsup Required: {"node":">=22.0.0"}
```

You need to update your Node.js version. If you're using nvm:

```bash
nvm install 22
nvm use 22
```

Or with the project's `.nvmrc`:

```bash
nvm use
```

### Checking your Node version

```bash
node --version
```

Should output `v22.0.0` or higher.

## API Key Configuration

### "Invalid API key" error

This usually means your API key is incorrect or expired. Double-check:

1. The key is entered correctly (no extra spaces)
2. The key hasn't been revoked
3. You're using the right key for the provider (OpenAI key for OpenAI, etc.)

### API key not being saved

All API keys are stored locally on your device. If keys aren't persisting:

1. Check if you're in private/incognito mode (web only — incognito can clear storage on close)
2. Clear site data and re-enter the key
3. On the desktop app, try restarting the application

### Rate limiting

If you're getting rate limit errors, you may need to:

1. Wait a few minutes before retrying
2. Check your API provider's usage dashboard
3. Upgrade your API plan if needed

## VRM Model Issues

### Model not loading

If your VRM model won't load:

1. **Check file size** - Large models (>50MB) may take longer to load
2. **Verify the format** - Ensure it's a valid `.vrm` file
3. **Try another model** - Test with a different VRM to isolate the issue
4. **Check the console** - Open DevTools (F12 in browser or desktop app) and look for errors

### Model displays incorrectly

If the model appears distorted or wrong:

1. **VRM version** - Some older VRM 0.x models may have compatibility issues
2. **Bone structure** - Models need standard VRM bone configurations
3. **Materials** - Some custom shaders may not render correctly

### Animations not playing

If the idle animation or expressions aren't working:

1. **Wait for load** - Animations load after the model
2. **Check VRMA support** - Ensure your model supports VRM animations
3. **Refresh the page** - Sometimes a reload fixes animation issues

## Text-to-Speech Issues

### No audio output

If TTS isn't producing sound:

1. **Check audio** - Make sure the tab isn't muted (web) or system audio is enabled (desktop)
2. **Verify permissions** - Your browser or OS may need to grant audio autoplay permission
3. **Check API key** - Verify your ElevenLabs or OpenAI TTS API key is valid
4. **Check provider status** - The TTS provider may be experiencing issues

### Lip-sync not working

If the avatar's mouth isn't moving:

1. **Audio is required** - Lip-sync only works when TTS audio plays
2. **Volume level** - Very quiet audio may not trigger lip-sync
3. **Browser support** - Web Audio API must be supported

### Voice sounds wrong

1. **Check voice settings** - ElevenLabs and OpenAI TTS have different available voices
2. **Custom voice ID** - If using ElevenLabs custom voice, verify the voice ID is correct

## Voice Input Issues

### Mic button not responding (desktop)

The desktop app uses Tauri's webview, which does not support the browser's Web Speech API. You need to configure Groq Whisper for voice input on desktop:

1. Go to **Settings > Character**
2. Under **Voice Input (STT)**, enter your Groq API key

### Mic button not responding (web)

If the mic button shows an error in the browser:

1. **Check browser support** - Web Speech API works in Chrome, Edge, and Safari. Firefox has limited support.
2. **Allow microphone access** - Your browser may be blocking the microphone permission.
3. **Use Groq Whisper** - For better quality or broader browser support, add a Groq API key in **Settings > Character** under Voice Input (STT). When configured, it automatically overrides Web Speech API.

### "Microphone access denied"

Your browser or OS is blocking microphone access:

1. **Browser permissions** - Click the lock icon in the address bar and allow microphone access
2. **System permissions** - On macOS, go to System Settings > Privacy & Security > Microphone and enable access for your browser or Utsuwa

## Memory & Performance

### App running slowly

Performance issues can stem from:

1. **Semantic memory model** - The embedding model (~23MB) loads on first use
2. **Large conversation history** - Long sessions accumulate data
3. **VRM model size** - Complex models use more GPU resources

Solutions:

1. Give the embedding model time to load initially
2. Clear old sessions in Settings > Data
3. Use simpler VRM models if performance is an issue

### Storage errors

If you see IndexedDB or storage errors:

1. **Check available space** - Storage on your device may be full
2. **Clear site data** - Reset the app's storage (web: clear site data, desktop: reinstall)
3. **Disable private mode** - Some storage features don't work in incognito (web only)

### Memory usage is high

The app uses memory for:

1. Three.js 3D rendering
2. VRM model geometry and textures
3. Conversation history
4. Embedding model for semantic search

If memory is a concern, refresh the page periodically to clear accumulated data.

## Common Errors

### "Failed to fetch" errors

These usually indicate network problems:

1. **Check internet connection**
2. **Verify API endpoint** - Some providers may be down
3. **CORS issues** - If self-hosting, check CORS configuration
4. **Firewall/proxy** - Corporate networks may block API calls

### "Page not found" after deployment

If routes work locally but not in production:

1. **Check adapter settings** - Ensure the SvelteKit adapter is configured correctly
2. **Verify build output** - Check the deployment logs
3. **Case sensitivity** - Some hosts are case-sensitive for file paths

### Console shows "Cannot read property of undefined"

This often means something loaded out of order:

1. **Refresh the page**
2. **Clear cache** - Hard refresh (Ctrl+Shift+R) on web, or restart the desktop app
3. **Check for updates** - Pull latest code if self-hosting, or restart the desktop app

## Getting More Help

If your issue isn't covered here:

1. Check the [GitHub Issues](https://github.com/The-Lab-by-Ordinary-Company/utsuwa/issues) for similar problems
2. Open a new issue with:
   - App version (web or desktop) and browser if web
   - Steps to reproduce
   - Any console errors
   - Screenshots if relevant
