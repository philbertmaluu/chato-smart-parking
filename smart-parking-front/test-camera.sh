#!/bin/bash

# ZKTeco Camera Test Script
# This script helps test the camera connection and streaming endpoints

CAMERA_IP="192.168.0.109"
CAMERA_PORT="80"
USERNAME="admin"
PASSWORD="Password123!"

echo "=================================="
echo "ZKTeco Camera Connection Test"
echo "=================================="
echo ""
echo "Camera IP: $CAMERA_IP"
echo "Camera Port: $CAMERA_PORT"
echo "Username: $USERNAME"
echo ""

# Test 1: Ping camera
echo "Test 1: Pinging camera..."
if ping -c 2 -W 2 $CAMERA_IP > /dev/null 2>&1; then
    echo "✅ Camera is reachable via ping"
else
    echo "❌ Camera is NOT reachable via ping"
    echo "   - Make sure camera is powered on"
    echo "   - Check if camera is connected to the network"
    echo "   - Verify IP address is correct"
fi
echo ""

# Test 2: HTTP connection
echo "Test 2: Testing HTTP connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "http://$CAMERA_IP:$CAMERA_PORT/" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "✅ Camera HTTP port is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Cannot connect to camera HTTP port (Response: $HTTP_CODE)"
    echo "   - Camera may be offline"
    echo "   - Port $CAMERA_PORT may be blocked"
fi
echo ""

# Test 3: Authenticated request
echo "Test 3: Testing authenticated access..."
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 -u "$USERNAME:$PASSWORD" "http://$CAMERA_IP:$CAMERA_PORT/" 2>/dev/null)
if [ "$AUTH_CODE" = "200" ]; then
    echo "✅ Authentication successful!"
else
    echo "⚠️  Authentication response: HTTP $AUTH_CODE"
    if [ "$AUTH_CODE" = "401" ]; then
        echo "   - Credentials may be incorrect"
        echo "   - Try logging in via browser: http://$CAMERA_IP"
    fi
fi
echo ""

# Test 4: Snapshot endpoint
echo "Test 4: Testing snapshot endpoint..."
SNAPSHOT_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 -u "$USERNAME:$PASSWORD" "http://$CAMERA_IP:$CAMERA_PORT/cgi-bin/snapshot.cgi" 2>/dev/null)
if [ "$SNAPSHOT_CODE" = "200" ]; then
    echo "✅ Snapshot endpoint is working!"
    echo "   URL: http://$CAMERA_IP/cgi-bin/snapshot.cgi"
else
    echo "⚠️  Snapshot endpoint response: HTTP $SNAPSHOT_CODE"
fi
echo ""

# Test 5: MJPEG stream endpoint
echo "Test 5: Testing MJPEG stream endpoint..."
MJPEG_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 -u "$USERNAME:$PASSWORD" "http://$CAMERA_IP:$CAMERA_PORT/cgi-bin/mjpeg" 2>/dev/null)
if [ "$MJPEG_CODE" = "200" ]; then
    echo "✅ MJPEG stream endpoint is working!"
    echo "   URL: http://$CAMERA_IP/cgi-bin/mjpeg"
else
    echo "⚠️  MJPEG endpoint response: HTTP $MJPEG_CODE"
fi
echo ""

# Test 6: Check if Next.js server is running
echo "Test 6: Checking Next.js server..."
NEXTJS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:3001/" 2>/dev/null)
if [ "$NEXTJS_CODE" = "200" ] || [ "$NEXTJS_CODE" = "307" ] || [ "$NEXTJS_CODE" = "301" ]; then
    echo "✅ Next.js server is running on http://localhost:3001"
else
    echo "❌ Next.js server is not running"
    echo "   Run: npm run dev"
fi
echo ""

# Summary
echo "=================================="
echo "Quick Access URLs:"
echo "=================================="
echo ""
echo "Test Page:"
echo "  http://localhost:3001/operator/entry/zkteco-test"
echo ""
echo "Direct Camera Access:"
echo "  http://$CAMERA_IP"
echo ""
echo "Snapshot URL (with auth):"
echo "  http://$USERNAME:$PASSWORD@$CAMERA_IP/cgi-bin/snapshot.cgi"
echo ""
echo "RTSP URL (for VLC):"
echo "  rtsp://$USERNAME:$PASSWORD@$CAMERA_IP:554/Streaming/Channels/101"
echo ""
echo "=================================="
echo "Troubleshooting Steps:"
echo "=================================="
echo ""
echo "If camera is not reachable:"
echo "1. Verify camera power and network cable"
echo "2. Check camera IP via router admin panel"
echo "3. Try connecting camera directly to your computer"
echo "4. Use manufacturer's software to find camera IP"
echo ""
echo "If authentication fails:"
echo "1. Try default credentials: admin/admin or admin/12345"
echo "2. Reset camera to factory defaults"
echo "3. Check camera manual for default credentials"
echo ""
