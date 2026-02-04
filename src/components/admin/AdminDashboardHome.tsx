import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { dutyAPI } from '../../utils/api';
import { 
  TrendingUp, 
  Fuel, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminDashboardHomeProps {
  station: any;
  token: string;
}

export default function AdminDashboardHome({ station, token }: AdminDashboardHomeProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await dutyAPI.getAllDuties();
      const duties = Array.isArray(response.data) ? response.data : [];

      const parsePumpReadings = (pumpReadings: any) => {
        if (!pumpReadings) return [];
        if (Array.isArray(pumpReadings)) return pumpReadings;
        if (typeof pumpReadings === 'string') {
          try {
            const parsed = JSON.parse(pumpReadings);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const isSameDate = (dateStr: string, target: string) => {
        const dateOnly = new Date(dateStr).toISOString().split('T')[0];
        return dateOnly === target;
      };

      const selectedDuties = duties.filter((d: any) => d.shift_start && isSameDate(d.shift_start, selectedDate));

      let totalSales = 0;
      let totalShortage = 0;
      let totalExcess = 0;
      let petrolSales = 0;
      let dieselSales = 0;

      const workerStatsMap = new Map<string, { name: string; sales: number; shortage: number; excess: number }>();

      selectedDuties.forEach((duty: any) => {
        const sales = parseFloat(duty.total_sales || 0);
        const diff = parseFloat(duty.shortage_excess || 0);
        totalSales += sales;
        if (diff < 0) totalShortage += Math.abs(diff);
        if (diff > 0) totalExcess += diff;

        const pumps = parsePumpReadings(duty.pump_readings);
        if (pumps.length > 0) {
          pumps.forEach((p: any) => {
            const fuel = (p.fuelType || p.fuel_type || p.fuel || '').toLowerCase();
            const amount = parseFloat(p.amount ?? p.total_amount ?? 0);
            if (fuel === 'petrol') petrolSales += amount;
            if (fuel === 'diesel') dieselSales += amount;
          });
        }

        const key = String(duty.worker_id ?? duty.workerId ?? 'unknown');
        const existing = workerStatsMap.get(key) || {
          name: duty.worker_name || duty.workerName || 'Worker',
          sales: 0,
          shortage: 0,
          excess: 0
        };
        existing.sales += sales;
        if (diff < 0) existing.shortage += Math.abs(diff);
        if (diff > 0) existing.excess += diff;
        workerStatsMap.set(key, existing);
      });

      // Weekly sales data (last 7 days ending selectedDate)
      const weeklySales: Array<{ day: string; petrol: number; diesel: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateKey = d.toISOString().split('T')[0];
        const dayDuties = duties.filter((duty: any) => duty.shift_start && isSameDate(duty.shift_start, dateKey));
        let dayPetrol = 0;
        let dayDiesel = 0;
        dayDuties.forEach((duty: any) => {
          const pumps = parsePumpReadings(duty.pump_readings);
          if (pumps.length > 0) {
            pumps.forEach((p: any) => {
              const fuel = (p.fuelType || p.fuel_type || p.fuel || '').toLowerCase();
              const amount = parseFloat(p.amount ?? p.total_amount ?? 0);
              if (fuel === 'petrol') dayPetrol += amount;
              if (fuel === 'diesel') dayDiesel += amount;
            });
          }
        });
        weeklySales.push({ day: label, petrol: dayPetrol, diesel: dayDiesel });
      }

      const statsPayload = {
        totalSales,
        petrolSales,
        dieselSales,
        totalShortage,
        totalExcess,
        dutiesCount: selectedDuties.length,
        paymentBreakdown: {
          cash: selectedDuties.reduce((sum: number, d: any) => sum + parseFloat(d.cash_collected || 0), 0),
          card: 0,
          online: 0,
          credit: 0,
        },
        weeklySales,
        workerStats: Array.from(workerStatsMap.values())
      };

      setStats(statsPayload);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Sales',
      value: `₹${stats?.totalSales?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: station.theme.primaryColor,
      bgColor: `${station.theme.primaryColor}15`,
    },
    {
      title: 'Petrol Sales',
      value: `₹${stats?.petrolSales?.toFixed(2) || '0.00'}`,
      icon: Fuel,
      color: '#10b981',
      bgColor: '#10b98115',
    },
    {
      title: 'Diesel Sales',
      value: `₹${stats?.dieselSales?.toFixed(2) || '0.00'}`,
      icon: Fuel,
      color: '#f59e0b',
      bgColor: '#f59e0b15',
    },
    {
      title: 'Shortage',
      value: `₹${stats?.totalShortage?.toFixed(2) || '0.00'}`,
      icon: AlertTriangle,
      color: '#ef4444',
      bgColor: '#ef444415',
    },
  ];

  // Weekly sales data
  const weeklySalesData = stats?.weeklySales || [
    { day: 'Mon', petrol: 2200, diesel: 1800 },
    { day: 'Tue', petrol: 1900, diesel: 2000 },
    { day: 'Wed', petrol: 2500, diesel: 1900 },
    { day: 'Thu', petrol: 2300, diesel: 2100 },
    { day: 'Fri', petrol: 2900, diesel: 2500 },
    { day: 'Sat', petrol: 3200, diesel: 2800 },
    { day: 'Sun', petrol: 3000, diesel: 2600 },
  ];

  // Payment methods data for donut chart
  const paymentMethodsData = [
    { name: 'Cash', value: stats?.paymentBreakdown?.cash || 5200, color: '#1e5ca8' },
    { name: 'Card', value: stats?.paymentBreakdown?.card || 3800, color: '#f39c12' },
    { name: 'Online', value: stats?.paymentBreakdown?.online || 2400, color: '#27ae60' },
    { name: 'Credit', value: stats?.paymentBreakdown?.credit || 1100, color: '#e74c3c' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-gray-500 mt-1">Overview of your fuel station operations</p>
        </div>
        <div className="w-full sm:w-auto">
          <Label htmlFor="date" className="text-sm mb-2 block">Select Date</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold mt-2">{card.value}</p>
                  </div>
                  <div 
                    className="p-3 rounded-full"
                    style={{ backgroundColor: card.bgColor }}
                  >
                    <Icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => `₹${value}`}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '14px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="petrol" 
                  fill="#2563eb" 
                  name="Petrol"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="diesel" 
                  fill="#f97316" 
                  name="Diesel"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => `₹${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {paymentMethodsData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Breakdown</CardTitle>
            <CardDescription>How customers paid today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Cash</span>
              <span className="font-bold text-green-700">₹{stats?.paymentBreakdown?.cash?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Card</span>
              <span className="font-bold text-blue-700">₹{stats?.paymentBreakdown?.card?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Online</span>
              <span className="font-bold text-purple-700">₹{stats?.paymentBreakdown?.online?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="font-medium">Credit</span>
              <span className="font-bold text-orange-700">₹{stats?.paymentBreakdown?.credit?.toFixed(2) || '0.00'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Worker Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Performance</CardTitle>
            <CardDescription>Today's worker-wise summary</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.workerStats && stats.workerStats.length > 0 ? (
              <div className="space-y-3">
                {stats.workerStats.map((worker: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">{worker.name}</span>
                      <span className="text-sm font-medium">₹{worker.sales.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      {worker.shortage > 0 && (
                        <span className="text-red-600">
                          Shortage: ₹{worker.shortage.toFixed(2)}
                        </span>
                      )}
                      {worker.excess > 0 && (
                        <span className="text-green-600">
                          Excess: ₹{worker.excess.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No duty submissions for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Excess Amount</p>
                <p className="text-xl font-bold text-green-600">₹{stats?.totalExcess?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Duties Submitted</p>
                <p className="text-xl font-bold">{stats?.dutiesCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8" style={{ color: station.theme.primaryColor }}>
              </CreditCard>
              <div>
                <p className="text-sm text-gray-500">Current Fuel Prices</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-sm font-semibold">P: ₹{station.prices.petrol}</span>
                  <span className="text-sm font-semibold">D: ₹{station.prices.diesel}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const FileText = ({ className, style }: any) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
