# Fuel Station Sales & Duty Management System

A complete, production-ready web platform for Indian petrol bunks (fuel stations) to digitally manage daily sales, duty-wise cashier settlements, attendance tracking, and salary calculations.

## 🚀 Features

### Authentication & Onboarding
- Station registration with brand selection (Indian Oil, HP, BP, or Custom)
- Automatic brand-based theme application across the platform
- Secure login for both Admin and Worker roles
- Session management with auto-login

### Admin Features

#### Dashboard
- Real-time overview of daily operations
- Today's total sales (Petrol vs Diesel)
- Payment breakdown (Cash, Card, Online, Credit)
- Worker-wise performance summary
- Shortage and excess tracking

#### Worker Management
- Create worker profiles with login credentials
- Set duty type (Day/Night shift)
- Configure base monthly salary
- Enable/Disable workers
- View worker details and status

#### Settlement Reports
- View all duty submissions
- Filter by date and worker
- Download professional PDF reports
- Color-coded shortage/excess indicators

#### Attendance Management
- Automatic attendance marking on worker login
- Daily and monthly attendance views
- Login time tracking
- Worker-wise attendance summary

#### Salary Calculator
- Month-end salary computation
- Base salary + excess - shortage
- Downloadable monthly salary reports
- Individual worker salary breakdowns

#### Fuel Price Settings
- Set per-liter prices for Petrol and Diesel
- Update prices anytime
- Automatic price application to calculations

### Worker Features

#### Worker Dashboard
- Simple, distraction-free interface
- Current shift information
- Today's fuel prices display
- Real-time clock
- Duty submission status

#### Duty Entry
- Multi-pump reading entry
- Automatic liter calculation (Closing - Opening)
- Auto-calculated sale amounts based on current prices
- Payment collection entry (Cash, Card, Online, Credit)
- Testing fuel deduction
- Automatic shortage/excess calculation
- Preview before submission
- Form validation

#### Duty History
- View previously submitted duties
- Filter by date
- Download individual duty reports as PDF

### PDF Reports
All reports include:
- Station branding with theme colors
- Comprehensive duty details
- Pump-wise readings
- Payment breakdown
- Settlement summary
- Professional printable layout

## 🎨 Brand Theme System

**Indian Oil**
- Primary: Blue (#003c7e)
- Secondary: Orange (#ff6600)

**HP (Hindustan Petroleum)**
- Primary: Blue (#0066cc)
- Secondary: Red (#e31e24)

**BP (Bharat Petroleum)**
- Primary: Green (#00923f)
- Secondary: Yellow (#ffed00)

**Custom**
- User-selectable theme color

## 💻 Tech Stack

- **Frontend**: React, TypeScript
- **UI**: Tailwind CSS, Shadcn UI components
- **Backend**: Supabase Edge Functions (Deno + Hono)
- **Database**: Supabase Key-Value Store
- **Authentication**: Custom session-based auth
- **Notifications**: Sonner toast

## 🔐 Security Features

- Password hashing (SHA-256)
- Session token management
- Role-based access control
- Protected routes and endpoints
- Worker data isolation

## 📱 Responsive Design

- Fully responsive for desktop, tablet, and mobile
- Mobile-optimized navigation
- Touch-friendly input controls
- Large, easy-to-tap buttons for duty entry

## 🧮 Automatic Calculations

- Liters sold (Closing - Opening)
- Sale amounts (Liters × Price)
- Petrol and Diesel totals
- Total received from all payment methods
- Shortage/Excess settlement
- Monthly salary adjustments

## 📊 Real-World Use Cases

1. **Daily Operations**: Workers submit duty with pump readings and payments
2. **Shift Handover**: Clear settlement report shows shortage/excess
3. **Monthly Payroll**: Automatic salary calculation with all adjustments
4. **Attendance Tracking**: Login-based attendance for all workers
5. **Fuel Price Updates**: Admin updates prices centrally
6. **Historical Reports**: Download and archive all duty records

## 🎯 Key Benefits

- **Paperless Operations**: Complete digital management
- **Error-Free Math**: All calculations automated
- **Accountability**: Clear shortage/excess tracking
- **Salary Transparency**: Workers see exactly how salary is calculated
- **Easy Auditing**: All data searchable and downloadable
- **Professional Reports**: Branded PDFs for records

## 📝 Getting Started

### For Fuel Station Owners:
1. Register your fuel station
2. Add worker profiles
3. Set current fuel prices
4. Workers can start logging in and submitting duties

### For Workers:
1. Login with credentials provided by admin
2. View today's fuel prices
3. Submit duty with pump readings and payment collection
4. Download your duty report

## 🛠️ Admin Default Credentials (After Registration)

After registering your station, use the email and password you created during registration to login as Admin.

## 👥 Sample Workflow

1. **Morning**: Day shift worker logs in (attendance auto-marked)
2. **Duty Start**: Worker notes opening readings
3. **Throughout Day**: Fuel sales happen, payments collected
4. **Duty End**: Worker enters closing readings and payment amounts
5. **Submission**: System calculates shortage/excess automatically
6. **Admin Review**: Admin sees all settlements in dashboard
7. **Month End**: Admin generates salary report with all adjustments

## 📈 Analytics & Insights

- Daily sales trends
- Worker performance comparison
- Payment method analysis
- Shortage/excess patterns
- Fuel type distribution (Petrol vs Diesel)

---

**Built for real Indian petrol bunk operations** 🇮🇳
