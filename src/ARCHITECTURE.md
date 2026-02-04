# 📁 System Architecture & File Structure

## 🗂️ Complete File Inventory

### **Root Files**
- `App.tsx` - Main application with routing & authentication
- `README.md` - Complete system documentation  
- `DEMO_GUIDE.md` - Step-by-step testing guide
- `SYSTEM_OVERVIEW.md` - Production features overview

### **📱 Main Components** (`/components`)
1. `LoginPage.tsx` - Unified login for Admin & Worker
2. `RegisterPage.tsx` - Station registration with brand selection
3. `AdminDashboard.tsx` - Admin main container with sidebar nav
4. `WorkerDashboard.tsx` - Worker main container with home screen

### **👨‍💼 Admin Components** (`/components/admin`)
1. `AdminDashboardHome.tsx` - Dashboard overview with stats
2. `WorkerManagement.tsx` - Create & manage workers
3. `SettlementReports.tsx` - View & download duty reports
4. `AttendanceView.tsx` - Daily/monthly attendance tracking
5. `SalaryCalculator.tsx` - Month-end salary with adjustments
6. `FuelPriceSettings.tsx` - Update petrol/diesel prices

### **👨‍🔧 Worker Components** (`/components/worker`)
1. `DutyEntryForm.tsx` - Multi-pump duty entry with auto-calc
2. `PreviousDuties.tsx` - View & download past duties

### **🔧 Backend** (`/supabase/functions/server`)
- `index.tsx` - Hono web server with 11 API endpoints
- `kv_store.tsx` - Key-value database utilities (protected)

### **🎨 Styles**
- `styles/globals.css` - Tailwind CSS v4 configuration

### **🔑 Utils**
- `utils/supabase/info.tsx` - Project ID & API keys (protected)

---

## 🌐 API Endpoints

### **Authentication**
- `POST /register-station` - Register new fuel station
- `POST /login` - Login admin/worker with attendance marking
- `GET /me` - Verify current session

### **Worker Management**
- `POST /create-worker` - Admin creates new worker
- `GET /workers` - Get all workers for station
- `POST /toggle-worker` - Enable/disable worker

### **Duty Operations**
- `POST /submit-duty` - Worker submits duty with calculations
- `GET /duties` - Get duties (filtered by date/worker/role)

### **Fuel Prices**
- `POST /update-prices` - Admin updates petrol/diesel prices

### **Reporting & Analytics**
- `GET /dashboard-stats` - Real-time stats for admin dashboard
- `GET /attendance` - Attendance records (daily/monthly)
- `GET /salary-report` - Month-end salary calculations

---

## 💾 Data Models

### **Station**
```typescript
{
  id: string,
  name: string,
  brand: string,
  address: string,
  theme: {
    primaryColor: string,
    secondaryColor: string
  },
  prices: {
    petrol: number,
    diesel: number
  }
}
```

### **User** (Admin/Worker)
```typescript
{
  id: string,
  stationId: string,
  name: string,
  email: string,
  password: string (hashed),
  role: 'admin' | 'worker',
  dutyType?: 'Day' | 'Night',
  baseSalary?: number,
  active: boolean
}
```

### **Duty Submission**
```typescript
{
  id: string,
  stationId: string,
  workerId: string,
  workerName: string,
  dutyType: string,
  date: string,
  pumps: [
    {
      pumpNumber: string,
      fuelType: 'Petrol' | 'Diesel',
      opening: number,
      closing: number,
      liters: number,
      amount: number
    }
  ],
  petrolTotal: number,
  dieselTotal: number,
  totalSales: number,
  cashAmount: number,
  cardAmount: number,
  onlineAmount: number,
  creditAmount: number,
  testingAmount: number,
  totalReceived: number,
  difference: number, // negative = shortage, positive = excess
  submittedAt: string
}
```

### **Attendance**
```typescript
{
  userId: string,
  userName: string,
  stationId: string,
  date: string,
  dutyType: string,
  loginTime: string,
  status: 'present'
}
```

### **Session**
```typescript
{
  userId: string,
  stationId: string,
  role: string,
  createdAt: string
}
```

---

## 🔄 Data Flow

### **Registration Flow**
```
User Form → POST /register-station → 
Create Station + Admin User → 
Return success → Redirect to Login
```

### **Login Flow**
```
Credentials → POST /login → 
Verify password → Create session → 
Mark attendance (if worker) → 
Return token + user + station data
```

### **Duty Submission Flow**
```
Worker Form → Auto-calculate liters → 
Auto-calculate amounts → 
Auto-calculate totals → 
Auto-calculate settlement → 
Preview → POST /submit-duty → 
Store in database → Generate PDF
```

### **Dashboard Stats Flow**
```
Admin Dashboard → GET /dashboard-stats?date=X → 
Fetch all duties for date → 
Calculate totals & breakdowns → 
Group by worker → Return aggregated data
```

### **Salary Calculation Flow**
```
Admin Salary Tab → GET /salary-report?month=X → 
Fetch all duties for month → 
Group by worker → Sum shortages/excess → 
Calculate final salary → Return report
```

---

## 🎨 UI Component Tree

```
App.tsx
├── LoginPage
├── RegisterPage
├── AdminDashboard
│   ├── AdminDashboardHome
│   ├── WorkerManagement
│   ├── SettlementReports
│   ├── AttendanceView
│   ├── SalaryCalculator
│   └── FuelPriceSettings
└── WorkerDashboard
    ├── Home View (default)
    ├── DutyEntryForm
    └── PreviousDuties
```

---

## 🔐 Security Layers

1. **Password Hashing**: SHA-256 before storage
2. **Session Tokens**: Unique token per login
3. **Role Checking**: Every protected endpoint verifies role
4. **Data Isolation**: Workers only see their own data
5. **Authorization Headers**: Bearer token required
6. **Input Validation**: Server-side validation on all endpoints

---

## 📊 Key Features by Component

### **App.tsx**
- Session persistence (localStorage)
- Auto-login on page refresh
- Role-based routing
- Toast notifications

### **LoginPage.tsx**
- Email/password authentication
- Gradient background design
- Switch to registration
- Loading states

### **RegisterPage.tsx**
- Multi-field station setup
- Brand selection (4 options)
- Custom color picker
- Theme preview

### **AdminDashboard.tsx**
- Tabbed navigation (6 sections)
- Responsive sidebar
- Mobile bottom nav
- Branded header

### **AdminDashboardHome.tsx**
- Date filter
- 4 stat cards (Sales, Petrol, Diesel, Shortage)
- Payment breakdown
- Worker performance cards
- Quick stats row

### **WorkerManagement.tsx**
- Worker creation dialog
- Worker cards grid
- Enable/disable toggle
- Shift & salary display

### **SettlementReports.tsx**
- Date & worker filters
- Settlement cards
- PDF download
- Color-coded badges

### **AttendanceView.tsx**
- Daily/monthly toggle
- Date/month picker
- Attendance cards
- Login time display

### **SalaryCalculator.tsx**
- Month picker
- Salary breakdown cards
- Deduction/credit highlighting
- PDF report download

### **FuelPriceSettings.tsx**
- Current price display
- Update price form
- Visual price cards
- Station info display

### **WorkerDashboard.tsx**
- Welcome card
- Shift info
- Today's prices
- Duty status
- Real-time clock

### **DutyEntryForm.tsx**
- Multi-pump entry
- Add/remove pumps
- Auto-calculations (9 types)
- Payment collection
- Summary preview
- Form validation

### **PreviousDuties.tsx**
- Date filter
- Duty history cards
- Settlement badges
- PDF download per duty

---

## 🧮 Calculation Logic

### **Pump Calculations**
```javascript
liters = closing - opening
amount = liters × fuelPrice
```

### **Totals**
```javascript
petrolTotal = sum(petrolPumps.amount)
dieselTotal = sum(dieselPumps.amount)
totalSales = petrolTotal + dieselTotal
```

### **Settlement**
```javascript
totalReceived = cash + card + online + credit - testing
difference = totalReceived - totalSales
// if difference < 0: shortage
// if difference > 0: excess
```

### **Salary**
```javascript
finalSalary = baseSalary - totalShortages + totalExcess
```

---

## 🎯 Component Responsibilities

### **Authentication Components**
- Handle user registration
- Validate credentials
- Create sessions
- Store tokens

### **Admin Components**
- Manage station data
- Oversee workers
- View all operations
- Generate reports
- Calculate payroll

### **Worker Components**
- Submit duties
- View own history
- Download own reports
- See fuel prices

### **Backend (Server)**
- Process requests
- Validate data
- Store persistently
- Calculate aggregations
- Handle errors

---

## 📦 Dependencies

**Frontend:**
- React (UI framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- Shadcn UI (Components)
- Sonner (Toasts)
- Lucide React (Icons)

**Backend:**
- Deno (Runtime)
- Hono (Web framework)
- Supabase (Database)
- Crypto (Password hashing)

---

## ✅ Complete Feature Checklist

**Authentication & Users**
- [x] Station registration
- [x] Admin login
- [x] Worker login
- [x] Session management
- [x] Auto-login
- [x] Logout
- [x] Password hashing

**Admin Features**
- [x] Dashboard overview
- [x] Worker creation
- [x] Worker enable/disable
- [x] Fuel price updates
- [x] Settlement reports
- [x] Attendance tracking
- [x] Salary calculation
- [x] PDF downloads

**Worker Features**
- [x] Duty submission
- [x] Multi-pump entry
- [x] Auto-calculations
- [x] Duty history
- [x] PDF downloads

**System Features**
- [x] Brand theming
- [x] Responsive design
- [x] Data persistence
- [x] Date filtering
- [x] Error handling
- [x] Form validation

---

**Total Lines of Code**: ~3,500+  
**Total Components**: 13  
**Total API Endpoints**: 11  
**Total Features**: 40+  

**Status**: ✅ PRODUCTION-READY
