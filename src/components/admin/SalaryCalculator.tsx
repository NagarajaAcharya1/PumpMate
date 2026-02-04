import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { dutyAPI, workerAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';
import { DollarSign, TrendingDown, TrendingUp, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalaryCalculatorProps {
  station: any;
  token: string;
}

export default function SalaryCalculator({ station, token }: SalaryCalculatorProps) {
  const [salaryReport, setSalaryReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (selectedMonth) {
      fetchSalaryReport();
    }
  }, [selectedMonth]);

  const fetchSalaryReport = async () => {
    setLoading(true);
    try {
      const [workersResponse, dutiesResponse] = await Promise.all([
        workerAPI.getWorkers(),
        dutyAPI.getAllDuties()
      ]);

      const workers = Array.isArray(workersResponse.data)
        ? workersResponse.data.map((w: any) => ({
            ...w,
            baseSalary: parseFloat(w.base_salary ?? w.baseSalary ?? 0),
            dutyType: w.duty_type ?? w.dutyType,
          }))
        : [];

      const duties = Array.isArray(dutiesResponse.data) ? dutiesResponse.data : [];

      const isInMonth = (dateStr: string, month: string) => {
        const date = new Date(dateStr);
        const monthKey = date.toISOString().slice(0, 7);
        return monthKey === month;
      };

      const report = workers.map((worker: any) => {
        const workerDuties = duties.filter((d: any) =>
          String(d.worker_id) === String(worker.id) &&
          (d.shift_start || d.created_at) &&
          isInMonth(d.shift_start || d.created_at, selectedMonth)
        );

        const totals = workerDuties.reduce(
          (acc: any, d: any) => {
            const diff = parseFloat(d.shortage_excess || 0);
            if (diff < 0) acc.shortage += Math.abs(diff);
            if (diff > 0) acc.excess += diff;
            acc.count += 1;
            return acc;
          },
          { shortage: 0, excess: 0, count: 0 }
        );

        const baseSalary = worker.baseSalary || 0;
        const finalSalary = baseSalary - totals.shortage + totals.excess;

        return {
          workerId: worker.id,
          workerName: worker.name,
          baseSalary,
          dutiesCount: totals.count,
          totalShortage: totals.shortage,
          totalExcess: totals.excess,
          finalSalary
        };
      }).filter((w: any) => w.dutiesCount > 0 || w.baseSalary > 0);

      setSalaryReport(report);
    } catch (error) {
      console.error('Error fetching salary report:', error);
      toast.error('Failed to load salary report');
    } finally {
      setLoading(false);
    }
  };
  const downloadReport = () => {
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const totalBaseSalary = salaryReport.reduce((sum, w) => sum + w.baseSalary, 0);
    const totalShortage = salaryReport.reduce((sum, w) => sum + w.totalShortage, 0);
    const totalExcess = salaryReport.reduce((sum, w) => sum + w.totalExcess, 0);
    const totalFinal = salaryReport.reduce((sum, w) => sum + w.finalSalary, 0);

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
    doc.text(`Monthly Salary Report - ${monthName}`, 14, 42);

    const rows = salaryReport.map((worker) => ([
      worker.workerName,
      `INR ${worker.baseSalary.toFixed(2)}`,
      String(worker.dutiesCount),
      `-INR ${worker.totalShortage.toFixed(2)}`,
      `+INR ${worker.totalExcess.toFixed(2)}`,
      `INR ${worker.finalSalary.toFixed(2)}`
    ]));

    autoTable(doc, {
      head: [['Worker Name', 'Base Salary', 'Duties', 'Shortage', 'Excess', 'Final Salary']],
      body: rows,
      startY: 48,
      styles: { fontSize: 9 },
      headStyles: { fillColor: primary }
    });

    const tableEndY = (doc as any).lastAutoTable?.finalY || 90;
    let y = tableEndY + 10;

    doc.setFontSize(11);
    doc.setTextColor('#333333');
    doc.text(`Total Base Salaries: INR ${totalBaseSalary.toFixed(2)}`, 14, y);
    y += 6;
    doc.setTextColor('#ef4444');
    doc.text(`Total Shortages: -INR ${totalShortage.toFixed(2)}`, 14, y);
    y += 6;
    doc.setTextColor('#10b981');
    doc.text(`Total Excess: +INR ${totalExcess.toFixed(2)}`, 14, y);
    y += 7;
    doc.setTextColor(primary);
    doc.setFontSize(12);
    doc.text(`Total Payable: INR ${totalFinal.toFixed(2)}`, 14, y);

    const filename = `salary-report-${selectedMonth}.pdf`;
    doc.save(filename);
    toast.success('Report downloaded successfully');
  };
const totalPayable = salaryReport.reduce((sum, w) => sum + w.finalSalary, 0);
  const totalShortages = salaryReport.reduce((sum, w) => sum + w.totalShortage, 0);
  const totalExcess = salaryReport.reduce((sum, w) => sum + w.totalExcess, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Salary Calculator</h2>
          <p className="text-gray-500 mt-1">Calculate month-end salaries with adjustments</p>
        </div>
        {salaryReport.length > 0 && (
          <Button
            onClick={downloadReport}
            className="gap-2"
            style={{ backgroundColor: station.theme.primaryColor }}
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        )}
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="salaryMonth">Select Month</Label>
              <Input
                id="salaryMonth"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total Payable</p>
                <p className="text-lg font-bold text-blue-600">₹{totalPayable.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Shortages</p>
                <p className="text-lg font-bold text-red-600">₹{totalShortages.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Excess</p>
                <p className="text-lg font-bold text-green-600">₹{totalExcess.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : salaryReport.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No Salary Data</h3>
            <p className="text-gray-500">
              No workers or duties found for the selected month
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {salaryReport.map((worker) => (
            <Card key={worker.workerId}>
              <CardHeader>
                <CardTitle className="text-xl">{worker.workerName}</CardTitle>
                <CardDescription>{worker.dutiesCount} duties completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Base Salary</span>
                    <span className="text-lg font-bold">₹{worker.baseSalary.toFixed(2)}</span>
                  </div>

                  {worker.totalShortage > 0 && (
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Shortage (Deduction)</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">-₹{worker.totalShortage.toFixed(2)}</span>
                    </div>
                  )}

                  {worker.totalExcess > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Excess (Bonus)</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">+₹{worker.totalExcess.toFixed(2)}</span>
                    </div>
                  )}

                  <div 
                    className="flex justify-between items-center p-4 rounded-lg text-white"
                    style={{ backgroundColor: station.theme.primaryColor }}
                  >
                    <span className="font-semibold">Final Payable Salary</span>
                    <span className="text-2xl font-bold">₹{worker.finalSalary.toFixed(2)}</span>
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










