# donflamingo I.O.T - Fleet Tracking Web App

A modern, production-ready IoT fleet tracking SaaS frontend that integrates with Traccar GPS tracking server via REST API and WebSocket.

## 🚀 Features

- **Real-time Tracking**: Live map with WebSocket updates showing device positions
- **Multi-tenant Architecture**: Organization-based data scoping with role-based access control
- **Device Management**: Full CRUD operations for fleet devices
- **Geofencing**: Define and manage geographic boundaries
- **Alerts & Events**: Monitor fleet events and notifications
- **Reports & Analytics**: Trip reports, summary statistics, and CSV export
- **Safe Immobilisation UX**: Request-only immobilisation flow with safety checklist
- **Traccar Integration**: Configurable connection to Traccar server (no hardcoded URLs)

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Maps**: react-leaflet
- **Charts**: recharts
- **State Management**: React Query
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- A running Traccar server instance
- Traccar API token or username/password

## 🏃 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Traccar Connection

1. Start the development server:
```bash
npm run dev
```

2. Navigate to **Settings → Traccar Connection** in the app
3. Enter your Traccar server URL (e.g., `https://track.example.com`)
4. Choose authentication method:
   - **API Token** (Recommended): Generate a token in Traccar (Settings → Users → Your User → Generate Token)
   - **Username & Password**: Use your Traccar credentials
5. Click "Save & Test Connection"

### 3. Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── DeviceCard.tsx
│   │   └── ImmobilisationModal.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useTraccarConfig.ts
│   ├── layout/              # Layout components
│   │   └── Layout.tsx
│   ├── models/              # TypeScript types and interfaces
│   │   └── types.ts
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── LiveMap.tsx
│   │   ├── Devices.tsx
│   │   ├── DeviceDetail.tsx
│   │   ├── Geofences.tsx
│   │   ├── Alerts.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── services/            # API and service layer
│   │   ├── traccarApi.ts    # Traccar REST API client
│   │   ├── traccarWebSocket.ts  # WebSocket client
│   │   ├── storage.ts       # Local storage utilities
│   │   └── commands.ts      # Command management
│   ├── utils/               # Utility functions
│   │   ├── roleCheck.ts
│   │   └── deviceStatus.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔐 Security Considerations

### Current Implementation (Frontend-Only)

⚠️ **IMPORTANT**: This application currently stores Traccar credentials in browser localStorage. This is **NOT secure** for production use.

**Security Limitations:**
- Credentials are stored client-side and visible in browser storage
- No server-side validation or authorization
- No protection against XSS attacks
- No audit logging of sensitive actions
- CORS issues may occur when connecting directly to Traccar

### Production Recommendations

1. **Backend Proxy**: Create a backend API that:
   - Stores Traccar credentials securely (encrypted)
   - Proxies all Traccar API requests
   - Handles authentication and authorization
   - Implements rate limiting
   - Provides audit logging

2. **Authentication**: Implement proper user authentication:
   - JWT tokens or session-based auth
   - Secure password storage
   - Multi-factor authentication for sensitive operations

3. **Authorization**: Server-side role-based access control:
   - Validate user permissions on every request
   - Scope data by organization server-side
   - Prevent privilege escalation

4. **Immobilisation Commands**: The current implementation only creates command records. In production:
   - Backend should validate authorization
   - Execute commands through secure channel
   - Maintain audit trail of all immobilisation actions
   - Implement approval workflows for critical actions

## 🔌 Traccar Integration

### REST API Endpoints Used

- `GET /api/server` - Test connection
- `GET /api/devices` - List devices
- `GET /api/devices/:id` - Get device details
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/positions` - Get positions
- `GET /api/geofences` - List geofences
- `GET /api/events` - Get alerts/events
- `GET /api/reports/trips` - Get trip reports
- `GET /api/reports/summary` - Get summary statistics

### WebSocket Connection

- Endpoint: `wss://<traccar-server>/api/socket`
- Messages: `positions`, `devices`, `events`
- Auto-reconnects with exponential backoff

## 🎨 Theming

The app uses a dark IoT theme:
- Background: `#050816`
- Surface: `#0b1220`
- Accent: Cyan/Teal (`#06b6d4`)

Customize colors in `tailwind.config.js`.

## 🚧 Extending with Backend

The codebase is structured to easily add a backend:

1. **API Client**: Update `services/traccarApi.ts` to call your backend instead of Traccar directly
2. **Storage**: Replace `services/storage.ts` with API calls to your backend
3. **Authentication**: Implement proper auth flow with your backend
4. **Commands**: Move command execution to backend API
5. **WebSocket**: Proxy WebSocket through your backend

Example backend API structure:
```
POST /api/traccar/devices
GET /api/traccar/devices
GET /api/traccar/positions
...
```

## 📝 Multi-Tenancy

The app implements frontend-level multi-tenancy:

- All data is scoped by `organizationId`
- Users belong to organizations
- Role-based access control (admin, manager, viewer)
- In production, this should be enforced server-side

## 🛡️ Immobilisation Safety

The immobilisation feature implements a safe request-only flow:

1. **Multi-step Modal**: Safety warning → Checklist → Reason → Confirmation
2. **Mandatory Checklist**: Vehicle stationary, user authorized, action audited
3. **Reason Required**: Must provide reason for action
4. **Typed Confirmation**: Must type "IMMOBILISE" or "RESTORE POWER"
5. **Request Only**: Creates command record with status "requested"
6. **No Direct Execution**: Actual execution deferred to backend

## 🐛 Troubleshooting

### CORS Errors
If you encounter CORS errors when connecting to Traccar:
- Configure CORS on your Traccar server
- Or use a backend proxy (recommended)

### WebSocket Connection Fails
- Ensure Traccar server URL uses `wss://` for HTTPS
- Check firewall/proxy settings
- Verify Traccar WebSocket is enabled

### Devices Not Showing
- Verify Traccar connection in Settings
- Check that devices have `organizationId` set (currently frontend-filtered)
- Ensure you have proper Traccar permissions

## 📄 License

This project is part of the donflamingo I.O.T fleet tracking solution.

## 🤝 Contributing

This is a production-ready template. To extend:

1. Add backend API integration
2. Implement proper authentication
3. Add server-side data scoping
4. Enhance security measures
5. Add comprehensive error handling
6. Implement audit logging

---

**Built with ❤️ for fleet management and IoT tracking**

