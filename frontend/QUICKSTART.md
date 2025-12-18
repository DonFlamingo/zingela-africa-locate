# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Step 3: Configure Traccar Connection

1. **Navigate to Settings** (click Settings in the sidebar)

2. **Enter Traccar Configuration**:
   - **Server URL**: Your Traccar server URL (e.g., `https://track.example.com` or `http://localhost:8082`)
   - **Authentication**: Choose either:
     - **API Token** (Recommended): Get from Traccar → Settings → Users → Your User → Generate Token
     - **Username & Password**: Your Traccar login credentials

3. **Click "Save & Test Connection"**

   ✅ If successful, you'll see a green "Connected" badge

### Step 4: Explore the App

- **Dashboard**: View fleet overview and KPIs
- **Live Map**: See real-time device positions
- **Devices**: Manage your fleet devices
- **Geofences**: Define geographic boundaries
- **Alerts**: Monitor fleet events
- **Reports**: View trip reports and analytics

## 🔧 Troubleshooting

### "Traccar connection not configured"
→ Go to Settings and configure your Traccar connection

### CORS Errors
→ Configure CORS on your Traccar server or use a backend proxy

### No Devices Showing
→ Ensure devices exist in Traccar and you have proper permissions

### WebSocket Not Connecting
→ Check that your Traccar URL uses `wss://` for HTTPS connections

## 📝 Next Steps

1. **Add Devices**: Go to Devices → Add Device
2. **View Live Tracking**: Check the Live Map page
3. **Set Up Geofences**: Create boundaries in Geofences
4. **Monitor Alerts**: Check the Alerts page for events

## 🏗️ Production Deployment

For production use:

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your web server

3. **Set up a backend proxy** to:
   - Store Traccar credentials securely
   - Handle authentication
   - Proxy API requests
   - Manage WebSocket connections

See the main README.md for detailed production setup instructions.

---

**Need Help?** Check the main README.md for detailed documentation.

