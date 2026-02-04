import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { dutyAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';
import { FileText, Calendar, Download, ArrowLeft } from 'lucide-react';

interface PreviousDutiesProps {
  user: any;
  station: any;
  token: string;
  onBack: () => void;
}

export default function PreviousDuties({ user, station, token, onBack }: PreviousDutiesProps) {
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchDuties();
  }, [filterDate]);

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const response = await dutyAPI.getMyDuties();
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

      let normalized = rawDuties.map((duty: any) => {
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

        return {
          id: duty.id,
          workerName: duty.worker_name || user.name,
          dutyType: user.dutyType || 'Shift',
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
      });

      if (filterDate) {
        normalized = normalized.filter((d: any) => d.date === filterDate);
      }

      setDuties(normalized);
    } catch (error) {
      console.error('Error fetching duties:', error);
      toast.error('Failed to load duties');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (duty: any) => {
    const html = generateDutyPDF(duty);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duty-${duty.date}-${user.name.replace(/\s+/g, '-')}.html`;
    a.click();
    toast.success('Report downloaded');
  };

  const generateDutyPDF = (duty: any) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Duty Report - ${duty.date}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid ${station.theme.primaryColor};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: ${station.theme.primaryColor};
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
    }
    .info-item {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
    }
    .info-item label {
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid #ddd;
    }
    th {
      background: ${station.theme.primaryColor};
      color: white;
      font-weight: bold;
    }
    tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    .totals {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ddd;
    }
    .totals-row:last-child {
      border-bottom: none;
      font-size: 18px;
      font-weight: bold;
      padding-top: 15px;
    }
    .shortage {
      color: #ef4444;
      font-weight: bold;
    }
    .excess {
      color: #10b981;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${station.name}</h1>
    <p>${station.brand}</p>
    <p>${station.address}</p>
  </div>

  <h2 style="color: ${station.theme.primaryColor}; margin-bottom: 20px;">Duty Report</h2>

  <div class="info-grid">
    <div class="info-item">
      <label>Worker</label>
      <span>${duty.workerName}</span>
    </div>
    <div class="info-item">
      <label>Date</label>
      <span>${duty.date}</span>
    </div>
    <div class="info-item">
      <label>Shift</label>
      <span>${duty.dutyType}</span>
    </div>
    <div class="info-item">
      <label>Submitted At</label>
      <span>${new Date(duty.submittedAt).toLocaleString()}</span>
    </div>
  </div>

  <h3 style="color: ${station.theme.primaryColor};">Pump Readings</h3>
  <table>
    <thead>
      <tr>
        <th>Pump</th>
        <th>Fuel</th>
        <th>Opening</th>
        <th>Closing</th>
        <th>Liters</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${duty.pumps.map((pump: any) => `
        <tr>
          <td>Pump ${pump.pumpNumber}</td>
          <td>${pump.fuelType}</td>
          <td>${pump.opening}</td>
          <td>${pump.closing}</td>
          <td>${pump.liters.toFixed(2)}</td>
          <td>₹${pump.amount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Petrol Sales:</span>
      <span>₹${duty.petrolTotal?.toFixed(2) || '0.00'}</span>
    </div>
    <div class="totals-row">
      <span>Diesel Sales:</span>
      <span>₹${duty.dieselTotal?.toFixed(2) || '0.00'}</span>
    </div>
    <div class="totals-row">
      <span><strong>Total Sales:</strong></span>
      <span><strong>₹${duty.totalSales?.toFixed(2) || '0.00'}</strong></span>
    </div>
  </div>

  <h3 style="color: ${station.theme.primaryColor};">Payment Collection</h3>
  <div class="totals">
    <div class="totals-row">
      <span>Cash:</span>
      <span>₹${duty.cashAmount?.toFixed(2) || '0.00'}</span>
    </div>
    <div class="totals-row">
      <span>Card:</span>
      <span>₹${duty.cardAmount?.toFixed(2) || '0.00'}</span>
    </div>
    <div class="totals-row">
      <span>Online:</span>
      <span>₹${duty.onlineAmount?.toFixed(2) || '0.00'}</span>
    </div>
    <div class="totals-row">
      <span>Credit:</span>
      <span>₹${duty.creditAmount?.toFixed(2) || '0.00'}</span>
    </div>
    <div class="totals-row">
      <span>Testing Fuel:</span>
      <span>₹${duty.testingAmount?.toFixed(2) || '0.00'}</span>
    </div>
    <div class="totals-row">
      <span><strong>Total Received:</strong></span>
      <span><strong>₹${duty.totalReceived?.toFixed(2) || '0.00'}</strong></span>
    </div>
    <div class="totals-row">
      <span><strong>Settlement:</strong></span>
      <span class="${duty.difference < 0 ? 'shortage' : 'excess'}">
        <strong>${duty.difference < 0 ? 'Shortage' : 'Excess'}: ₹${Math.abs(duty.difference)?.toFixed(2) || '0.00'}</strong>
      </span>
    </div>
  </div>

  <div class="footer">
    <p>Generated by Fuel Station Manager • ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Previous Duties</h2>
          <p className="text-gray-500 mt-1">View and download your duty history</p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="filterDate">Filter by Date</Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {filterDate && (
              <Button
                variant="outline"
                onClick={() => setFilterDate('')}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duties List */}
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
            <h3 className="text-xl font-semibold mb-2">No Duties Found</h3>
            <p className="text-gray-500">
              {filterDate ? 'No duties found for the selected date' : 'You haven\'t submitted any duties yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duties.map((duty) => (
            <Card key={duty.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {duty.date}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {duty.dutyType} Shift • Submitted: {new Date(duty.submittedAt).toLocaleString()}
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-lg font-bold">₹{duty.totalSales?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Received</p>
                    <p className="text-lg font-bold">₹{duty.totalReceived?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Petrol</p>
                    <p className="text-lg font-bold">₹{duty.petrolTotal?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Diesel</p>
                    <p className="text-lg font-bold">₹{duty.dieselTotal?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Settlement</p>
                    <Badge 
                      variant={duty.difference < 0 ? 'destructive' : 'default'}
                      className={duty.difference < 0 ? '' : 'bg-green-500'}
                    >
                      {duty.difference < 0 ? 'Short' : 'Excess'}: ₹{Math.abs(duty.difference)?.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
