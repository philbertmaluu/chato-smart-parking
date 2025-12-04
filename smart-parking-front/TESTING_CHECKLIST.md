# 🧪 Camera Live Stream Testing Guide

## Test Status: READY TO TEST

Your Direct Camera Access page is now loaded at:
**http://localhost:3000/operator/entry/direct-camera**

---

## 📋 Testing Checklist

### Test 1: Load Web Interface
- [ ] Click "Load Web Interface" button
- [ ] Check if camera login page appears
- [ ] Enter credentials if prompted (admin / Password123!)
- [ ] **RESULT:** ________________

### Test 2: MJPEG Stream  
- [ ] Click "MJPEG Stream" button
- [ ] Check if live video appears
- [ ] Video should update in real-time
- [ ] **RESULT:** ________________

### Test 3: Live Snapshots
- [ ] Click "Live Snapshots" button
- [ ] Check if images appear and refresh every second
- [ ] Should see timestamps changing
- [ ] **RESULT:** ________________

### Test 4: Alternative Endpoints
Try each of these buttons one by one:

- [ ] Click "/live/main"
  - **RESULT:** ________________

- [ ] Click "/live/sub"
  - **RESULT:** ________________

- [ ] Click "/Streaming/Channels/1/picture"
  - **RESULT:** ________________

- [ ] Click "/video.cgi"
  - **RESULT:** ________________

### Test 5: Copy & Open in Browser
- [ ] After a successful test, click "Copy" button
- [ ] Paste URL in Safari/Chrome
- [ ] Verify it works in external browser
- [ ] **RESULT:** ________________

---

## 🎯 What to Look For

### ✅ SUCCESS indicators:
- Video/image appears in the preview area
- Stream updates continuously (MJPEG) or periodically (Snapshots)
- No error messages
- Badge shows stream type (🌐 Web Interface, 📸 Image Stream, etc.)

### ❌ FAILURE indicators:
- Black screen with no content
- Error message in browser console
- Image with broken icon
- No response after clicking button

---

## 📝 Recording Results

For each test that WORKS, write down:
1. **Which button worked:** ________________
2. **What you see:** (video/image/interface)
3. **URL shown in "Current URL" section:** ________________

For each test that FAILS:
1. **Which button failed:** ________________
2. **What happened:** (nothing/error/black screen)
3. **Browser console error (if any):** ________________

---

## 🔍 Browser Console Check

To see detailed errors:
1. Right-click on the page
2. Select "Inspect" or "Inspect Element"
3. Click "Console" tab
4. Look for red error messages
5. Copy any errors you see

---

## 💡 What URL Works in Safari?

**IMPORTANT:** Please tell me what URL you use in Safari to see the camera stream.

Examples:
- `http://192.168.0.109`
- `http://192.168.0.109/live.html`
- `http://192.168.0.109:8080`
- `http://192.168.0.109/cgi-bin/mjpeg`
- Something else: ________________

This will help me configure the correct endpoint!

---

## 🚀 Quick Test Commands

You can also test URLs directly in terminal:

```bash
# Test if camera responds
curl -I http://192.168.0.109

# Test with authentication
curl -u admin:Password123! http://192.168.0.109

# Test MJPEG endpoint
curl -u admin:Password123! http://192.168.0.109/cgi-bin/mjpeg --output test.mjpeg

# Test snapshot
curl -u admin:Password123! http://192.168.0.109/cgi-bin/snapshot.cgi --output snapshot.jpg
```

---

## ⚡ Next Steps After Testing

Once you identify which method works:
1. I'll update the main application to use that method
2. We'll integrate it into the operator entry page
3. You'll have live camera feed in your parking app!

---

**START TESTING NOW!** 
Open http://localhost:3000/operator/entry/direct-camera and click each button!
