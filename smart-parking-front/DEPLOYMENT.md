# Desktop App Deployment Guide

This guide explains how to build and deploy the Smart Parking desktop application to work with a remote backend API.

## Prerequisites

- Node.js 18+ installed
- Rust and Tauri CLI installed (for building)
- Access to your remote backend API

## Configuration

### 1. Set API URL

Create a `.env.production` file in the project root:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/toll-v1
NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_ENABLED=true
NEXT_PUBLIC_CAMERA_POLL_INTERVAL_MS=4000
```

Or use the IP address:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000/api/toll-v1
```

### 2. Build the Desktop App

```bash
# Install dependencies (if not already done)
npm install

# Build the desktop installer
npm run desktop:build
```

The installer will be created at:
- Windows: `src-tauri/target/release/bundle/nsis/Smart Parking System_1.1.0_x64-setup.exe`

### 3. Install on Target PC

1. Copy the installer file to the target PC
2. Run the installer
3. The app will automatically connect to the configured API URL

## How It Works

### Frontend-Only Deployment

The desktop app is a **frontend-only** application that:
- ✅ Connects to your remote backend API over HTTP/HTTPS
- ✅ Stores authentication tokens locally
- ✅ Polls camera directly (if configured)
- ✅ Sends detections to remote backend when processed
- ✅ Works offline for local detection storage (syncs when online)

### API Connection

The app uses the `NEXT_PUBLIC_API_URL` environment variable to determine the backend URL. This is set at **build time**, so:

- **For different APIs**: Build separate installers with different `.env.production` files
- **For same API**: One installer works for all PCs

### Backend Requirements

Your remote backend must:
1. ✅ Allow CORS from Tauri app origin
2. ✅ Be accessible over HTTP/HTTPS
3. ✅ Have the same API endpoints as expected
4. ✅ Support authentication via Bearer tokens

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://157.245.191.111/api/toll-v1` |
| `NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_ENABLED` | Enable local camera polling | `false` |
| `NEXT_PUBLIC_CAMERA_POLL_INTERVAL_MS` | Camera polling interval | `4000` |
| `NEXT_PUBLIC_USE_CAMERA_PROXY` | Use backend proxy for camera | `true` |

## Troubleshooting

### App can't connect to backend

1. Check if `NEXT_PUBLIC_API_URL` is correct in `.env.production`
2. Verify backend is accessible from target PC
3. Check backend CORS settings
4. Check firewall/network settings

### Camera not working

1. Ensure camera IP is configured in gate settings
2. Check if `NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_ENABLED=true`
3. Verify camera is accessible from target PC network

### Build fails

1. Ensure all dependencies are installed: `npm install`
2. Check Rust is installed: `rustc --version`
3. Check Tauri CLI: `cargo tauri --version`

## Distribution

### Single API Deployment

If all PCs use the same backend:
1. Build once with `.env.production` configured
2. Distribute the installer to all PCs
3. Install and run - no additional configuration needed

### Multiple API Deployment

If different PCs need different backends:
1. Build separate installers for each API URL
2. Name them differently (e.g., `Smart-Parking-Site1.exe`, `Smart-Parking-Site2.exe`)
3. Distribute appropriate installer to each site

## Security Notes

- API tokens are stored in browser localStorage
- HTTPS is recommended for production APIs
- The app can work with HTTP for local networks
- Camera credentials are stored in app config (not in installer)

## Support

For issues or questions:
1. Check backend API is running and accessible
2. Verify network connectivity
3. Check browser console for errors (F12 in Tauri app)
4. Review backend logs for API errors

