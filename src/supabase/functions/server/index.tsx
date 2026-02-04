import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Session-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to hash passwords (simple for prototype)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to verify session
async function verifySession(authHeader: string | null): Promise<any> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  
  // Check if it's our custom session token (starts with "session_")
  if (token.startsWith('session_')) {
    const session = await kv.get(`session:${token}`);
    return session;
  }
  
  // If it's the anon key, we need to get the session from a custom header
  // This will be handled separately
  return null;
}

// Helper to get session from custom header or authorization
async function getSession(c: any): Promise<any> {
  // First try custom session token header
  const sessionToken = c.req.header("X-Session-Token");
  if (sessionToken) {
    const session = await kv.get(`session:${sessionToken}`);
    return session;
  }
  
  // Fall back to Authorization header for backward compatibility
  const authHeader = c.req.header("Authorization");
  return await verifySession(authHeader);
}

// Health check endpoint
app.get("/make-server-a5c7df9b/health", (c) => {
  return c.json({ status: "ok" });
});

// Register new fuel station
app.post("/make-server-a5c7df9b/register-station", async (c) => {
  try {
    const { stationName, brand, address, adminName, adminEmail, password, customColor } = await c.req.json();
    
    if (!stationName || !brand || !address || !adminName || !adminEmail || !password) {
      return c.json({ error: "All fields are required" }, 400);
    }

    // Check if email already exists
    const existingUsers = await kv.getByPrefix("user:");
    const emailExists = existingUsers.some((u: any) => u.email === adminEmail);
    
    if (emailExists) {
      return c.json({ error: "Email already registered" }, 400);
    }

    const stationId = generateId("station");
    const userId = generateId("user");

    // Determine theme colors
    let primaryColor, secondaryColor;
    switch (brand) {
      case "Indian Oil":
        primaryColor = "#003c7e";
        secondaryColor = "#ff6600";
        break;
      case "HP":
        primaryColor = "#0066cc";
        secondaryColor = "#e31e24";
        break;
      case "BP":
        primaryColor = "#00923f";
        secondaryColor = "#ffed00";
        break;
      default:
        primaryColor = customColor || "#1e40af";
        secondaryColor = "#f59e0b";
    }

    // Create station
    await kv.set(`station:${stationId}`, {
      id: stationId,
      name: stationName,
      brand,
      address,
      theme: { primaryColor, secondaryColor },
      prices: {
        petrol: 106.50,
        diesel: 94.80
      },
      createdAt: new Date().toISOString()
    });

    // Create admin user
    const hashedPassword = await hashPassword(password);
    await kv.set(`user:${userId}`, {
      id: userId,
      stationId,
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      active: true,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      stationId, 
      userId,
      message: "Station registered successfully" 
    });
  } catch (error) {
    console.log("Error during station registration:", error);
    return c.json({ error: "Registration failed: " + error.message }, 500);
  }
});

// Login endpoint
app.post("/make-server-a5c7df9b/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }

    const hashedPassword = await hashPassword(password);
    const users = await kv.getByPrefix("user:");
    const user = users.find((u: any) => u.email === email && u.password === hashedPassword);

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    if (!user.active) {
      return c.json({ error: "Account is disabled" }, 403);
    }

    // Create session
    const sessionToken = generateId("session");
    await kv.set(`session:${sessionToken}`, {
      userId: user.id,
      stationId: user.stationId,
      role: user.role,
      createdAt: new Date().toISOString()
    });

    // Get station data
    const station = await kv.get(`station:${user.stationId}`);

    // Mark attendance for workers
    if (user.role === "worker") {
      const today = new Date().toISOString().split('T')[0];
      const attendanceKey = `attendance:${user.stationId}:${today}:${user.id}`;
      const existing = await kv.get(attendanceKey);
      
      if (!existing) {
        await kv.set(attendanceKey, {
          userId: user.id,
          userName: user.name,
          stationId: user.stationId,
          date: today,
          dutyType: user.dutyType,
          loginTime: new Date().toISOString(),
          status: "present"
        });
      }
    }

    return c.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dutyType: user.dutyType,
        baseSalary: user.baseSalary
      },
      station
    });
  } catch (error) {
    console.log("Error during login:", error);
    return c.json({ error: "Login failed: " + error.message }, 500);
  }
});

// Get current user session
app.get("/make-server-a5c7df9b/me", async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await kv.get(`user:${session.userId}`);
    const station = await kv.get(`station:${session.stationId}`);

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dutyType: user.dutyType,
        baseSalary: user.baseSalary
      },
      station
    });
  } catch (error) {
    console.log("Error fetching user session:", error);
    return c.json({ error: "Session fetch failed: " + error.message }, 500);
  }
});

// Create worker
app.post("/make-server-a5c7df9b/create-worker", async (c) => {
  try {
    console.log('=== CREATE WORKER REQUEST STARTED ===');
    
    const session = await getSession(c);
    console.log('Session verification result:', session ? 'Valid session' : 'Invalid session');
    
    if (!session || session.role !== "admin") {
      console.log('Authorization failed - session role:', session?.role);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const requestBody = await c.req.json();
    console.log('Request body received:', { ...requestBody, password: '***' });
    
    const { name, email, password, dutyType, baseSalary } = requestBody;
    
    if (!name || !email || !password || !dutyType || !baseSalary) {
      console.log('Validation failed - missing fields:', { 
        hasName: !!name, 
        hasEmail: !!email, 
        hasPassword: !!password, 
        hasDutyType: !!dutyType, 
        hasBaseSalary: !!baseSalary 
      });
      return c.json({ error: "All fields are required" }, 400);
    }

    // Check if email already exists
    console.log('Checking for existing users...');
    const existingUsers = await kv.getByPrefix("user:");
    const emailExists = existingUsers.some((u: any) => u.email === email);
    
    if (emailExists) {
      console.log('Email already exists:', email);
      return c.json({ error: "Email already registered" }, 400);
    }

    const userId = generateId("user");
    const hashedPassword = await hashPassword(password);
    
    const workerData = {
      id: userId,
      stationId: session.stationId,
      name,
      email,
      password: hashedPassword,
      role: "worker",
      dutyType,
      baseSalary: parseFloat(baseSalary),
      active: true,
      createdAt: new Date().toISOString()
    };
    
    console.log('Saving worker data:', { ...workerData, password: '***' });
    await kv.set(`user:${userId}`, workerData);
    
    console.log('Worker created successfully:', userId);
    return c.json({ success: true, userId, message: "Worker created successfully" });
  } catch (error) {
    console.error("=== CREATE WORKER ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return c.json({ error: "Worker creation failed: " + error.message }, 500);
  }
});

// Get all workers for a station
app.get("/make-server-a5c7df9b/workers", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const users = await kv.getByPrefix("user:");
    const workers = users.filter((u: any) => 
      u.stationId === session.stationId && u.role === "worker"
    ).map((w: any) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      dutyType: w.dutyType,
      baseSalary: w.baseSalary,
      active: w.active,
      createdAt: w.createdAt
    }));

    return c.json({ workers });
  } catch (error) {
    console.log("Error fetching workers:", error);
    return c.json({ error: "Failed to fetch workers: " + error.message }, 500);
  }
});

// Toggle worker active status
app.post("/make-server-a5c7df9b/toggle-worker", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { workerId } = await c.req.json();
    const worker = await kv.get(`user:${workerId}`);
    
    if (!worker || worker.stationId !== session.stationId) {
      return c.json({ error: "Worker not found" }, 404);
    }

    worker.active = !worker.active;
    await kv.set(`user:${workerId}`, worker);

    return c.json({ success: true, active: worker.active });
  } catch (error) {
    console.log("Error toggling worker status:", error);
    return c.json({ error: "Toggle failed: " + error.message }, 500);
  }
});

// Submit duty
app.post("/make-server-a5c7df9b/submit-duty", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "worker") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const dutyData = await c.req.json();
    const dutyId = generateId("duty");
    const user = await kv.get(`user:${session.userId}`);

    await kv.set(`duty:${dutyId}`, {
      id: dutyId,
      stationId: session.stationId,
      workerId: session.userId,
      workerName: user.name,
      dutyType: user.dutyType,
      date: dutyData.date,
      ...dutyData,
      submittedAt: new Date().toISOString()
    });

    return c.json({ success: true, dutyId });
  } catch (error) {
    console.log("Error submitting duty:", error);
    return c.json({ error: "Duty submission failed: " + error.message }, 500);
  }
});

// Get duties
app.get("/make-server-a5c7df9b/duties", async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const date = c.req.query("date");
    const workerId = c.req.query("workerId");

    let duties = await kv.getByPrefix("duty:");
    duties = duties.filter((d: any) => d.stationId === session.stationId);

    if (session.role === "worker") {
      duties = duties.filter((d: any) => d.workerId === session.userId);
    }

    if (date) {
      duties = duties.filter((d: any) => d.date === date);
    }

    if (workerId) {
      duties = duties.filter((d: any) => d.workerId === workerId);
    }

    duties.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return c.json({ duties });
  } catch (error) {
    console.log("Error fetching duties:", error);
    return c.json({ error: "Failed to fetch duties: " + error.message }, 500);
  }
});

// Update fuel prices
app.post("/make-server-a5c7df9b/update-prices", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { petrol, diesel } = await c.req.json();
    const station = await kv.get(`station:${session.stationId}`);
    
    station.prices = {
      petrol: parseFloat(petrol),
      diesel: parseFloat(diesel)
    };

    await kv.set(`station:${session.stationId}`, station);

    return c.json({ success: true, prices: station.prices });
  } catch (error) {
    console.log("Error updating prices:", error);
    return c.json({ error: "Price update failed: " + error.message }, 500);
  }
});

// Get dashboard stats
app.get("/make-server-a5c7df9b/dashboard-stats", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const date = c.req.query("date") || new Date().toISOString().split('T')[0];

    const duties = await kv.getByPrefix("duty:");
    const todayDuties = duties.filter((d: any) => 
      d.stationId === session.stationId && d.date === date
    );

    let totalPetrolSales = 0;
    let totalDieselSales = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalOnline = 0;
    let totalCredit = 0;
    let totalShortage = 0;
    let totalExcess = 0;

    const workerStats: any = {};

    todayDuties.forEach((duty: any) => {
      totalPetrolSales += duty.petrolTotal || 0;
      totalDieselSales += duty.dieselTotal || 0;
      totalCash += duty.cashAmount || 0;
      totalCard += duty.cardAmount || 0;
      totalOnline += duty.onlineAmount || 0;
      totalCredit += duty.creditAmount || 0;

      if (duty.difference < 0) {
        totalShortage += Math.abs(duty.difference);
      } else {
        totalExcess += duty.difference;
      }

      if (!workerStats[duty.workerId]) {
        workerStats[duty.workerId] = {
          name: duty.workerName,
          sales: 0,
          shortage: 0,
          excess: 0
        };
      }

      workerStats[duty.workerId].sales += (duty.petrolTotal || 0) + (duty.dieselTotal || 0);
      
      if (duty.difference < 0) {
        workerStats[duty.workerId].shortage += Math.abs(duty.difference);
      } else {
        workerStats[duty.workerId].excess += duty.difference;
      }
    });

    // Calculate weekly sales (last 7 days)
    const weeklySales = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date(date);
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const dayName = days[targetDate.getDay()];
      
      const dayDuties = duties.filter((d: any) => 
        d.stationId === session.stationId && d.date === dateStr
      );
      
      let petrolSum = 0;
      let dieselSum = 0;
      
      dayDuties.forEach((duty: any) => {
        petrolSum += duty.petrolTotal || 0;
        dieselSum += duty.dieselTotal || 0;
      });
      
      weeklySales.push({
        day: dayName,
        petrol: Math.round(petrolSum),
        diesel: Math.round(dieselSum)
      });
    }

    return c.json({
      totalSales: totalPetrolSales + totalDieselSales,
      petrolSales: totalPetrolSales,
      dieselSales: totalDieselSales,
      paymentBreakdown: {
        cash: totalCash,
        card: totalCard,
        online: totalOnline,
        credit: totalCredit
      },
      totalShortage,
      totalExcess,
      workerStats: Object.values(workerStats),
      dutiesCount: todayDuties.length,
      weeklySales
    });
  } catch (error) {
    console.log("Error fetching dashboard stats:", error);
    return c.json({ error: "Failed to fetch stats: " + error.message }, 500);
  }
});

// Get attendance
app.get("/make-server-a5c7df9b/attendance", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const date = c.req.query("date");
    const month = c.req.query("month");

    let attendance = await kv.getByPrefix(`attendance:${session.stationId}:`);

    if (date) {
      attendance = attendance.filter((a: any) => a.date === date);
    } else if (month) {
      attendance = attendance.filter((a: any) => a.date.startsWith(month));
    }

    return c.json({ attendance });
  } catch (error) {
    console.log("Error fetching attendance:", error);
    return c.json({ error: "Failed to fetch attendance: " + error.message }, 500);
  }
});

// Get salary report
app.get("/make-server-a5c7df9b/salary-report", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const month = c.req.query("month");
    if (!month) {
      return c.json({ error: "Month parameter required" }, 400);
    }

    const workers = await kv.getByPrefix("user:");
    const stationWorkers = workers.filter((w: any) => 
      w.stationId === session.stationId && w.role === "worker"
    );

    const duties = await kv.getByPrefix("duty:");
    const monthDuties = duties.filter((d: any) => 
      d.stationId === session.stationId && d.date.startsWith(month)
    );

    const salaryReport = stationWorkers.map((worker: any) => {
      const workerDuties = monthDuties.filter((d: any) => d.workerId === worker.id);
      
      let totalShortage = 0;
      let totalExcess = 0;
      let dutiesCount = workerDuties.length;

      workerDuties.forEach((duty: any) => {
        if (duty.difference < 0) {
          totalShortage += Math.abs(duty.difference);
        } else {
          totalExcess += duty.difference;
        }
      });

      const baseSalary = worker.baseSalary || 0;
      const finalSalary = baseSalary - totalShortage + totalExcess;

      return {
        workerId: worker.id,
        workerName: worker.name,
        baseSalary,
        totalShortage,
        totalExcess,
        dutiesCount,
        finalSalary
      };
    });

    return c.json({ salaryReport, month });
  } catch (error) {
    console.log("Error generating salary report:", error);
    return c.json({ error: "Salary report failed: " + error.message }, 500);
  }
});

// Create helper worker (no login credentials)
app.post("/make-server-a5c7df9b/create-helper", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { name, monthlySalary, phoneNumber } = await c.req.json();

    if (!name || !monthlySalary || !phoneNumber) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const helperId = generateId("helper");

    const helperData = {
      id: helperId,
      stationId: session.stationId,
      name,
      monthlySalary: Number(monthlySalary),
      phoneNumber,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`helper:${helperId}`, helperData);

    return c.json({
      success: true,
      helper: helperData
    });
  } catch (error) {
    console.log("Error creating helper:", error);
    return c.json({ error: "Failed to create helper: " + error.message }, 500);
  }
});

// Get all helpers
app.get("/make-server-a5c7df9b/helpers", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allHelpers = await kv.getByPrefix("helper:");
    const stationHelpers = allHelpers.filter((h: any) => h.stationId === session.stationId);

    return c.json({ helpers: stationHelpers });
  } catch (error) {
    console.log("Error fetching helpers:", error);
    return c.json({ error: "Failed to fetch helpers: " + error.message }, 500);
  }
});

// Get manual attendance for a date
app.get("/make-server-a5c7df9b/manual-attendance", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const date = c.req.query("date") || new Date().toISOString().split('T')[0];

    const attendanceKey = `manual_attendance:${session.stationId}:${date}`;
    const attendance = await kv.get(attendanceKey);

    return c.json({ 
      attendance: attendance?.records || [] 
    });
  } catch (error) {
    console.log("Error fetching manual attendance:", error);
    return c.json({ error: "Failed to fetch attendance: " + error.message }, 500);
  }
});

// Save manual attendance
app.post("/make-server-a5c7df9b/save-manual-attendance", async (c) => {
  try {
    const session = await getSession(c);
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { date, attendance } = await c.req.json();

    if (!date || !attendance) {
      return c.json({ error: "Date and attendance are required" }, 400);
    }

    const attendanceKey = `manual_attendance:${session.stationId}:${date}`;

    await kv.set(attendanceKey, {
      stationId: session.stationId,
      date,
      records: attendance,
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.log("Error saving manual attendance:", error);
    return c.json({ error: "Failed to save attendance: " + error.message }, 500);
  }
});

Deno.serve(app.fetch);