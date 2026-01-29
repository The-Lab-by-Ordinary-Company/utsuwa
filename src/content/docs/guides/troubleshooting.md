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

All API keys are stored in your browser's localStorage. If keys aren't persisting:

1. Check if you're in private/incognito mode
2. Clear site data and re-enter the key
3. Make sure your browser allows localStorage

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
4. **Check the console** - Open browser DevTools (F12) and look for errors

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

1. **Check browser audio** - Make sure the tab isn't muted
2. **Verify permissions** - Browser may need audio autoplay permission
3. **Test the provider** - Try Web Speech API (no key required) first
4. **Check API key** - For ElevenLabs/other providers, verify the key is valid

### Lip-sync not working

If the avatar's mouth isn't moving:

1. **Audio is required** - Lip-sync only works when TTS audio plays
2. **Volume level** - Very quiet audio may not trigger lip-sync
3. **Browser support** - Web Audio API must be supported

### Voice sounds wrong

1. **Check voice settings** - Different providers have different voices
2. **Custom voice ID** - If using ElevenLabs custom voice, verify the ID

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

### Browser storage errors

If you see IndexedDB or storage errors:

1. **Check available space** - Browser storage may be full
2. **Clear site data** - Reset the app's storage
3. **Disable private mode** - Some storage features don't work in incognito

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
2. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
3. **Check for updates** - Pull latest code if self-hosting

## Getting More Help

If your issue isn't covered here:

1. Check the [GitHub Issues](https://github.com/dyascj/utsuwa/issues) for similar problems
2. Open a new issue with:
   - Browser and version
   - Steps to reproduce
   - Any console errors
   - Screenshots if relevant
