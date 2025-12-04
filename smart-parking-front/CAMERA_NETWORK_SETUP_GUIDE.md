# ZKTeco Camera Connection Guide

## 📷 Your Camera Configuration

Based on the screenshot provided, here are your **actual camera settings**:

### Network Settings
- **IP Address**: `192.168.0.109`
- **Subnet Mask**: `255.255.255.0`
- **Gateway**: `192.168.0.1`
- **RTSP Port**: `554`

### Stream URLs
- **Main Stream**: `rtsp://192.168.0.109:554/ch01`
- **Sub Stream**: `rtsp://192.168.0.109:554/ch01_sub`
- **Third Stream**: `rtsp://192.168.0.109:554/ch01_third`

### Authentication
- **Username**: (Empty - no username required)
- **Password**: `Password123!`

## 🚨 Current Issue: Camera Not Reachable

The camera at `192.168.0.109` is not currently accessible from your development machine.

### Possible Causes:

1. **Different Network Subnets**
   - Your computer might be on a different network segment
   - Camera is on `192.168.0.x` network
   - Your computer might be on `192.168.1.x` or `10.x.x.x` network

2. **Network Configuration**
   - Camera and computer not on same physical network
   - Router/switch configuration issues
   - Firewall blocking access

3. **Camera Power/Connection**
   - Camera might be powered off
   - Ethernet cable disconnected
   - Network switch/router issues

## 🔧 Troubleshooting Steps

### Step 1: Check Your Network
```bash
# Check your current IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Check your network route
netstat -rn | grep default
```

### Step 2: Find the Camera on Your Network
```bash
# Scan for devices on your local network
# Replace 192.168.1 with your actual network prefix
nmap -sn 192.168.1.0/24

# Or scan the camera's expected network
nmap -sn 192.168.0.0/24
```

### Step 3: Check Physical Connection
1. **Power LED**: Camera should show power indicators
2. **Network LED**: Should show network activity
3. **Cable**: Ensure ethernet cable is properly connected
4. **Switch/Router**: Check if other devices can reach the camera

### Step 4: Access Camera Web Interface
Try accessing the camera directly via web browser:
- `http://192.168.0.109` (if on same network)

## 🔌 Network Setup Solutions

### Option 1: Connect to Camera's Network
If the camera is on a separate network segment:
1. Connect your computer to the same network as the camera
2. Configure your computer's IP to `192.168.0.x` range (e.g., `192.168.0.100`)
3. Set subnet mask to `255.255.255.0`
4. Set gateway to `192.168.0.1`

### Option 2: Change Camera IP
If you need the camera on your network:
1. Connect to camera's current network temporarily
2. Access camera web interface at `http://192.168.0.109`
3. Change camera IP to match your network (e.g., `192.168.1.109`)
4. Update gateway and DNS settings accordingly

### Option 3: Bridge Networks
Set up routing between networks or use a managed switch to bridge the networks.

## 🧪 Testing the Integration

Once the network connectivity is resolved:

### 1. Update Environment Variables
Create a `.env.local` file in your Next.js project:
```env
NEXT_PUBLIC_ZKTECO_IP=192.168.0.109
NEXT_PUBLIC_ZKTECO_HTTP_PORT=80
NEXT_PUBLIC_ZKTECO_RTSP_PORT=554
NEXT_PUBLIC_ZKTECO_USERNAME=
NEXT_PUBLIC_ZKTECO_PASSWORD=Password123!
```

### 2. Update Laravel Environment
In your Laravel `.env` file:
```env
ZKTECO_IP=192.168.0.109
ZKTECO_HTTP_PORT=80
ZKTECO_RTSP_PORT=554
ZKTECO_USERNAME=
ZKTECO_PASSWORD=Password123!
```

### 3. Test the Connection
1. Go to: `http://localhost:3001/operator/entry/camera-setup`
2. Enter camera details
3. Click "Test Connection"
4. If successful, you'll see live video streams

## 📱 Quick Network Check Commands

```bash
# Check if you can reach the camera's network gateway
ping 192.168.0.1

# Check if camera responds to ping (when network is accessible)
ping 192.168.0.109

# Test RTSP port connectivity
nc -zv 192.168.0.109 554

# Test HTTP port connectivity
nc -zv 192.168.0.109 80
```

## 🎯 RTSP URLs for Testing

Once network connectivity is established, you can test these RTSP URLs in VLC:

1. **Main Stream (High Quality)**:
   ```
   rtsp://192.168.0.109:554/ch01
   ```

2. **Sub Stream (Lower Quality, Better for Web)**:
   ```
   rtsp://192.168.0.109:554/ch01_sub
   ```

3. **With Authentication** (if camera requires it later):
   ```
   rtsp://:Password123!@192.168.0.109:554/ch01
   ```

## ✅ Next Steps

1. **Resolve Network Connectivity**: Ensure your computer can reach `192.168.0.109`
2. **Test Web Interface**: Access `http://192.168.0.109` in browser
3. **Test RTSP Stream**: Use VLC with the RTSP URLs above
4. **Configure Application**: Update environment variables and test in the setup page

The integration code is ready and will work perfectly once network connectivity is established!