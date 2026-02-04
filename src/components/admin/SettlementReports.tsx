import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { dutyAPI, workerAPI, dailySalesAPI } from '../../utils/api';
import { toast } from 'sonner';
import { FileText, Download, Calendar, User } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface SettlementReportsProps {
  station: any;
  token: string;
}

export default function SettlementReports({ station, token }: SettlementReportsProps) {
  const [duties, setDuties] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'duties' | 'sales'>('duties');

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    fetchDuties();
    fetchDailySales();
  }, [selectedDate, selectedWorker]);

  const fetchWorkers = async () => {
    try {
      const response = await workerAPI.getWorkers();
      const normalized = Array.isArray(response.data) ? response.data.map((w: any) => ({
        ...w,
        dutyType: w.duty_type ?? w.dutyType,
        baseSalary: w.base_salary ?? w.baseSalary,
        active: w.is_active ?? w.active,
      })) : [];
      setWorkers(normalized);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchDailySales = async () => {
    try {
      const response = await dailySalesAPI.getDailySales();
      let salesData = Array.isArray(response.data) ? response.data : [];
      
      // Transform data to match component format
      salesData = salesData.map((sale: any) => ({
        id: sale.id,
        date: sale.sale_date,
        items: typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items,
        total: parseFloat(sale.total),
        createdBy: sale.created_by
      }));
      
      // Only filter by date if a specific date is selected and it's not today's date
      if (selectedDate && selectedDate !== new Date().toISOString().split('T')[0]) {
        salesData = salesData.filter((sale: any) => sale.date === selectedDate);
      }
      
      setDailySales(salesData);
    } catch (error) {
      console.error('Error fetching daily sales:', error);
      toast.error('Failed to load daily sales');
    }
  };

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const response = await dutyAPI.getAllDuties();
      const rawDuties = Array.isArray(response.data) ? response.data : [];

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

      const workerMap = new Map<string, any>();
      workers.forEach((w) => workerMap.set(String(w.id), w));

      const normalizeDuty = (duty: any) => {
        const pumps = parsePumpReadings(duty.pump_readings).map((p: any) => ({
          pumpNumber: p.pumpNumber ?? p.pump_number ?? p.pump_no,
          fuelType: p.fuelType ?? p.fuel_type ?? p.fuel,
          opening: p.opening ?? p.opening_reading ?? 0,
          closing: p.closing ?? p.closing_reading ?? 0,
          liters: parseFloat(p.liters ?? p.total_liters ?? 0),
          amount: parseFloat(p.amount ?? p.total_amount ?? 0),
        }));

        const petrolTotal = pumps
          .filter((p: any) => String(p.fuelType).toLowerCase() === 'petrol')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const dieselTotal = pumps
          .filter((p: any) => String(p.fuelType).toLowerCase() === 'diesel')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        const workerId = String(duty.worker_id ?? duty.workerId ?? '');
        const workerInfo = workerMap.get(workerId);

        return {
          id: duty.id,
          workerId,
          workerName: duty.worker_name || workerInfo?.name || 'Worker',
          dutyType: workerInfo?.dutyType || workerInfo?.duty_type || 'Shift',
          date: new Date(duty.shift_start || duty.created_at).toISOString().split('T')[0],
          submittedAt: duty.shift_end || duty.updated_at || duty.shift_start || duty.created_at,
          pumps,
          petrolTotal,
          dieselTotal,
          totalSales: parseFloat(duty.total_sales || 0),
          cashAmount: parseFloat(duty.cash_collected || 0),
          cardAmount: 0,
          onlineAmount: 0,
          creditAmount: 0,
          testingAmount: 0,
          totalReceived: parseFloat(duty.cash_collected || 0),
          difference: parseFloat(duty.shortage_excess || 0),
        };
      };

      let normalized = rawDuties.map(normalizeDuty);

      if (selectedWorker !== 'all') {
        normalized = normalized.filter((d) => d.workerId === String(selectedWorker));
      }
      if (selectedDate) {
        normalized = normalized.filter((d) => d.date === selectedDate);
      }

      setDuties(normalized);
    } catch (error) {
      console.error('Error fetching duties:', error);
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };
    const downloadPDF = (duty: any) => {
    const doc = new jsPDF();
    const primary = station.theme.primaryColor || '#2563eb';

    doc.setFontSize(18);
    doc.setTextColor(primary);
    doc.text(station.name, 14, 18);
    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.text(station.brand, 14, 25);
    doc.text(station.address, 14, 31);

    doc.setFontSize(14);
    doc.setTextColor(primary);
    doc.text('Duty Settlement Report', 14, 42);

    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.text(`Worker: ${duty.workerName}`, 14, 50);
    doc.text(`Date: ${duty.date}`, 14, 56);
    doc.text(`Shift: ${duty.dutyType}`, 14, 62);
    doc.text(`Submitted: ${new Date(duty.submittedAt).toLocaleString()}`, 14, 68);

    const pumpRows = duty.pumps.map((pump: any) => ([
      `Pump ${pump.pumpNumber}`,
      pump.fuelType,
      String(pump.opening),
      String(pump.closing),
      pump.liters.toFixed(2),
      `INR ${pump.amount.toFixed(2)}`
    ]));

    autoTable(doc, {
      head: [['Pump', 'Fuel', 'Opening', 'Closing', 'Liters', 'Amount']],
      body: pumpRows,
      startY: 74,
      styles: { fontSize: 9 },
      headStyles: { fillColor: primary }
    });

    const tableEndY = (doc as any).lastAutoTable?.finalY || 90;
    let y = tableEndY + 8;

    doc.setFontSize(12);
    doc.setTextColor(primary);
    doc.text('Sales Summary', 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor('#333333');
    doc.text(`Petrol Sales: INR ${(duty.petrolTotal || 0).toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Diesel Sales: INR ${(duty.dieselTotal || 0).toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Total Sales: INR ${(duty.totalSales || 0).toFixed(2)}`, 14, y);

    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(primary);
    doc.text('Payment Collection', 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor('#333333');
    doc.text(`Cash: INR ${(duty.cashAmount || 0).toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Card: INR ${(duty.cardAmount || 0).toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Online: INR ${(duty.onlineAmount || 0).toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Credit: INR ${(duty.creditAmount || 0).toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Testing Fuel: INR ${(duty.testingAmount || 0).toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Total Received: INR ${(duty.totalReceived || 0).toFixed(2)}`, 14, y);

    y += 7;
    const diff = duty.difference || 0;
    const diffLabel = diff < 0 ? 'Shortage' : 'Excess';
    doc.setFontSize(11);
    doc.setTextColor(diff < 0 ? '#ef4444' : '#10b981');
    doc.text(`${diffLabel}: INR ${Math.abs(diff).toFixed(2)}`, 14, y);

    const filename = `settlement-${duty.workerName}-${duty.date}.pdf`;
    doc.save(filename);
    toast.success('Report downloaded');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Settlement Reports</h2>
        <p className="text-gray-500 mt-1">View duty settlements and manager sales reports</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('duties')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === 'duties'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Duty Settlements
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === 'sales'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manager Sales Reports
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterDate">Filter by Date</Label>
              <Input
                id="filterDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterWorker">Filter by Worker</Label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger>
                  <SelectValue placeholder="All workers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workers</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duties List */}
      {activeTab === 'duties' && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : duties.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No Settlements Found</h3>
                <p className="text-gray-500">
                  No duty settlements for the selected date and worker
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {duties.map((duty) => (
                <Card key={duty.id}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{duty.workerName}</CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {duty.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {duty.dutyType} Shift
                          </span>
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPDF(duty)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Sales</p>
                        <p className="text-lg font-bold">₹{duty.totalSales?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Received</p>
                        <p className="text-lg font-bold">₹{duty.totalReceived?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Settlement</p>
                        <Badge 
                          variant={duty.difference < 0 ? 'destructive' : 'default'}
                          className={duty.difference < 0 ? '' : 'bg-green-500'}
                        >
                          {duty.difference < 0 ? 'Shortage' : 'Excess'}: ₹{Math.abs(duty.difference)?.toFixed(2)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pumps</p>
                        <p className="text-lg font-bold">{duty.pumps?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Daily Sales List */}
      {activeTab === 'sales' && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : dailySales.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No Sales Reports Found</h3>
                <p className="text-gray-500">
                  No manager sales reports for the selected date
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dailySales.map((sale) => (
                <Card key={sale.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Daily Sales Report</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(sale.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Sales</p>
                        <p className="text-xl font-bold">₹{sale.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sale.items.map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} × ₹{item.price} = ₹{item.total.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}









