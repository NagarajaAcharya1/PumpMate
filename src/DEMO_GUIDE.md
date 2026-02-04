# Quick Start Guide

## 🎯 Demo Workflow

### Step 1: Register Your Fuel Station (Admin)

1. Click "Register your fuel station" on the login page
2. Fill in the details:
   - **Station Name**: e.g., "City Center Fuel Station"
   - **Brand**: Choose from Indian Oil, HP, BP, or Custom
   - **Address**: Your complete station address
   - **Admin Name**: Your name
   - **Admin Email**: e.g., admin@example.com
   - **Password**: Minimum 6 characters

3. Click "Register Station"
4. You'll be redirected to login

### Step 2: Admin Login

1. Use the email and password you just created
2. You'll see the Admin Dashboard with 6 sections:
   - Dashboard (Overview)
   - Workers (Manage staff)
   - Settlements (View duty reports)
   - Attendance (Track logins)
   - Salary (Monthly calculations)
   - Settings (Fuel prices)

### Step 3: Set Fuel Prices (Admin)

1. Go to **Settings** tab
2. Update today's fuel prices:
   - Petrol: e.g., ₹106.50
   - Diesel: e.g., ₹94.80
3. Click "Save New Prices"

### Step 4: Add Workers (Admin)

1. Go to **Workers** tab
2. Click "Add Worker"
3. Fill in worker details:
   - **Name**: e.g., "Rajesh Kumar"
   - **Email**: e.g., rajesh@example.com
   - **Password**: e.g., worker123
   - **Duty Type**: Day or Night shift
   - **Base Salary**: e.g., ₹15000
4. Click "Create Worker"
5. Repeat for multiple workers (recommended: create 2-3 workers for testing)

### Step 5: Worker Login

1. Logout from admin account
2. Login with worker credentials (email and password you created)
3. **Note**: Attendance is automatically marked on login!
4. You'll see the Worker Dashboard showing:
   - Current shift
   - Base salary
   - Today's fuel prices
   - Two main actions

### Step 6: Submit a Duty (Worker)

1. Click "Submit New Duty" (large green button)
2. **Add Pump Readings**:
   - Pump Number: 1
   - Fuel Type: Petrol
   - Opening: 1000.00
   - Closing: 1250.50
   - System automatically calculates liters and amount!

3. Click "Add Pump" to add more pumps (e.g., Pump 2 for Diesel)

4. **Enter Payment Collection**:
   - Cash: e.g., ₹26000
   - Card: e.g., ₹500
   - Online: e.g., ₹200
   - Credit: e.g., ₹100
   - Testing Fuel: e.g., ₹50 (deduction)

5. Click "Preview Summary"
6. Review all details
7. Click "Confirm & Submit"
8. Download the PDF report if needed

### Step 7: View Admin Dashboard

1. Logout from worker account
2. Login back as admin
3. Go to **Dashboard** tab
4. You'll see:
   - Today's total sales
   - Petrol vs Diesel breakdown
   - Payment method breakdown (Cash, Card, Online, Credit)
   - Worker-wise performance
   - Shortage/Excess summary

### Step 8: Check Settlements (Admin)

1. Go to **Settlements** tab
2. See all submitted duties with:
   - Worker name and shift
   - Date and time
   - Total sales and received amount
   - Shortage or Excess badge (red/green)
3. Click "Download" to get PDF report

### Step 9: View Attendance (Admin)

1. Go to **Attendance** tab
2. Switch between Daily and Monthly views
3. See when each worker logged in
4. Monthly view shows total present days per worker

### Step 10: Calculate Salaries (Admin)

1. Go to **Salary** tab
2. Select the current month
3. See salary breakdown for each worker:
   - Base Salary
   - Total Shortages (deductions in red)
   - Total Excess (bonuses in green)
   - Final Payable Salary
4. Download monthly salary report as PDF

## 🎨 Testing Different Brands

Try registering multiple stations with different brands to see the theme system:

1. **Indian Oil**: Blue and Orange theme
2. **HP**: Blue and Red theme
3. **BP**: Green and Yellow theme
4. **Custom**: Choose your own color

Each station maintains its own:
- Workers
- Fuel prices
- Duties
- Attendance
- Salary calculations

## 📊 Sample Data for Testing

### Worker 1 - Day Shift
- Opening: 1000.00, Closing: 1450.75 (Petrol)
- Opening: 2000.00, Closing: 2380.50 (Diesel)
- Cash: ₹45000, Card: ₹2500, Online: ₹1000
- Result: Should show either shortage or excess

### Worker 2 - Night Shift
- Opening: 1450.75, Closing: 1650.25 (Petrol)
- Opening: 2380.50, Closing: 2550.00 (Diesel)
- Cash: ₹22000, Card: ₹1000
- Result: Different settlement amount

## 💡 Pro Tips

1. **For Accurate Testing**: Submit duties on different dates by manually adjusting system date
2. **Multiple Pumps**: Real fuel stations have 4-8 pumps - add multiple pump readings
3. **Shortage Scenario**: Enter received amount less than total sales
4. **Excess Scenario**: Enter received amount more than total sales
5. **Monthly Salary**: Submit 5-10 duties across a month to see meaningful salary calculations

## 🔐 Security Note

- Each worker can only see their own duty history
- Admin can see all workers and all duties
- Passwords are hashed before storage
- Session tokens manage authentication

## 📱 Mobile Testing

- Open on mobile/tablet to see responsive design
- Large buttons optimized for touch
- Bottom navigation on mobile
- All features work on any screen size

## 🐛 Troubleshooting

**"Email already registered"**: Use a different email address

**"Duty Already Submitted"**: Can only submit one duty per day per worker

**"No Settlements Found"**: Make sure you've submitted at least one duty as a worker

**Negative closing reading**: Closing reading must be greater than opening reading

---

**Ready to revolutionize fuel station management!** 🚀
