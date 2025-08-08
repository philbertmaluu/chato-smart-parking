# Smart Parking Desktop App

A modern desktop application for smart parking management, built with Next.js and Tauri, with Laravel backend.

## Features

- 🚗 Real-time parking management
- 📊 Analytics and reporting
- 👥 Multi-role user management (Admin, Manager, Operator)
- 🎨 Modern UI with dark/light themes
- 🔐 Secure authentication with Laravel backend
- 🖥️ Cross-platform desktop application

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Desktop**: Tauri (Rust + Web Technologies)
- **Backend**: Laravel (PHP)
- **Authentication**: Laravel Sanctum
- **UI **Components****: Radix UI, Shadcn/ui

## Prerequisites

- Node.js 18+ and npm/pnpm
- Rust (for Tauri)
- Laravel backend running on `http://localhost:8000`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Laravel API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/toll-v1

# Development settings
NEXT_PUBLIC_APP_ENV=development
```

### 3. Laravel Backend Setup

Make sure your Laravel backend is running and has the following API endpoints:

#### Authentication Endpoints
- `POST /api/toll-v1/login` - User login
- `POST /api/toll-v1/register` - User registration
- `POST /api/toll-v1/logout` - User logout
- `POST /api/toll-v1/refresh` - Refresh token

#### Parking Management Endpoints
- `GET /api/parking/stations` - Get parking stations
- `GET /api/parking/gates` - Get parking gates
- `GET /api/parking/vehicles` - Get vehicles
- `GET /api/parking/sessions` - Get parking sessions
- `POST /api/parking/entry` - Vehicle entry
- `POST /api/parking/exit` - Vehicle exit

#### Analytics Endpoints
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/occupancy` - Occupancy analytics

### 4. Development

#### Web Development
```bash
npm run dev
```

#### Desktop Development
```bash
npm run desktop:dev
```

### 5. Building

#### Web Build
```bash
npm run build
```

#### Desktop Build
```bash
npm run desktop:build
```

## Project Structure

```
smart-parking-app/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── manager/           # Manager dashboard pages
│   └── operator/          # Operator pages
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   └── api.ts           # API client for Laravel
├── src-tauri/           # Tauri desktop configuration
└── public/              # Static assets
```

## API Integration

The app uses a centralized API client (`lib/api.ts`) that handles:

- Authentication token management
- Request/response handling
- Error handling
- TypeScript types for API responses

### Using the API Client

```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';

// Make API calls
const stations = await apiClient.get(API_ENDPOINTS.PARKING.STATIONS);
const newSession = await apiClient.post(API_ENDPOINTS.PARKING.ENTRY, data);
```

## Authentication

The app uses Laravel Sanctum for authentication. The `AuthProvider` component manages:

- User login/logout
- Token storage and refresh
- Role-based routing
- Session persistence

## Desktop Features

### Tauri Configuration

The desktop app is configured in `src-tauri/tauri.conf.json`:

- Window size: 800x600 (resizable)
- Development server: `http://localhost:3000`
- Build output: `../out` (Next.js static export)

### Desktop-specific Features

- Native window controls
- System tray integration (can be added)
- File system access (if needed)
- Hardware integration (camera, etc.)

## Deployment

### Web Deployment

Build the Next.js app for web deployment:

```bash
npm run build
```

### Desktop Distribution

Build the desktop app for distribution:

```bash
npm run desktop:build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`.

## Development Workflow

1. **Backend Development**: Develop Laravel API endpoints
2. **Frontend Development**: Use `npm run dev` for web development
3. **Desktop Testing**: Use `npm run desktop:dev` for desktop testing
4. **Integration Testing**: Test API integration with Laravel backend

## Troubleshooting

### Common Issues

1. **Rust not found**: Install Rust using `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. **API connection failed**: Ensure Laravel backend is running on `http://localhost:8000`
3. **Build errors**: Check that all dependencies are installed and Rust toolchain is up to date

### Debug Mode

For debugging, you can run the desktop app in debug mode:

```bash
npm run desktop:dev -- --debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both web and desktop versions
5. Submit a pull request

## License

This project is licensed under the MIT License. 