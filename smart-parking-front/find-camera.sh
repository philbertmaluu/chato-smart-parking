#!/bin/bash

echo "🔍 Searching for ZKTeco Camera on Network..."
echo "=========================================="
echo ""

# Get current network
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
NETWORK_PREFIX=$(echo $CURRENT_IP | cut -d'.' -f1-3)

echo "Your computer IP: $CURRENT_IP"
echo "Scanning network: $NETWORK_PREFIX.0/24"
echo ""
echo "Common camera IPs to try manually:"
echo "  - ${NETWORK_PREFIX}.64"
echo "  - ${NETWORK_PREFIX}.108"  
echo "  - ${NETWORK_PREFIX}.109"
echo "  - ${NETWORK_PREFIX}.110"
echo ""

# Test common camera IPs
echo "Testing common camera IPs..."
for IP in 64 108 109 110 100 101 102 103 104 105 106 107; do
    FULL_IP="${NETWORK_PREFIX}.${IP}"
    printf "Testing $FULL_IP ... "
    
    # Try ping with 1 second timeout
    if ping -c 1 -W 1 $FULL_IP > /dev/null 2>&1; then
        echo "✅ RESPONDING!"
        
        # Try to get HTTP response
        HTTP_RESP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://$FULL_IP" 2>/dev/null)
        if [ "$HTTP_RESP" != "000" ]; then
            echo "   └─ HTTP port accessible (Status: $HTTP_RESP)"
            echo "   └─ Try this IP in Camera Setup page!"
            echo "   └─ URL: http://$FULL_IP"
        fi
    else
        echo "⚪ No response"
    fi
done

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. If a camera was found above:"
echo "   - Copy the IP address"
echo "   - Go to: http://localhost:3001/operator/entry/camera-setup"
echo "   - Enter the IP and test connection"
echo ""
echo "2. If no camera found:"
echo "   - Check camera power (LED should be on)"
echo "   - Check network cable connection"
echo "   - Check your router's admin page for connected devices"
echo "   - Try Demo Mode with your webcam on the setup page"
echo ""
echo "3. Manual check:"
echo "   - Run: arp -a | grep -i '192.168'"
echo "   - Look for new MAC addresses"
echo ""
