import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
 
import { toast } from 'sonner@2.0.3';
import { Calendar as CalendarIcon, Save, Users } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { attendanceAPI, helperAPI, workerAPI } from '../../utils/api';

interface AttendanceViewProps {
  station: any;
  token: string;
}

interface Helper {
  id: string;
  name: string;
  monthlySalary: number;
  phoneNumber: string;
  stationId: string;
  dutyType?: string;
}

interface AttendanceRecord {
  workerType: 'worker' | 'helper';
  workerId: string;
  present: boolean;
}

export default function AttendanceView({ station }: AttendanceViewProps) {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkersAndAttendance();
  }, [selectedDate]);

  const normalizeWorker = (worker: any) => ({
    ...worker,
    active: worker.is_active ?? worker.active,
    dutyType: worker.duty_type ?? worker.dutyType,
    baseSalary: worker.base_salary ?? worker.baseSalary,
  });

  const normalizeHelper = (helper: any) => ({
    id: String(helper.id),
    name: helper.name,
    monthlySalary: parseFloat(helper.monthly_salary ?? helper.monthlySalary ?? 0),
    phoneNumber: helper.phone ?? helper.phoneNumber ?? '',
    stationId: helper.station_id ?? helper.stationId ?? '',
    dutyType: helper.duty_type ?? helper.dutyType ?? '',
  });

  const fetchWorkersAndAttendance = async () => {
    setLoading(true);
    try {
      const [helpersResponse, workersResponse, attendanceResponse] = await Promise.all([
        helperAPI.getHelpers(),
        workerAPI.getWorkers(),
        attendanceAPI.getManualAttendance(selectedDate),
      ]);

      const helpersData = Array.isArray(helpersResponse.data)
        ? helpersResponse.data.map(normalizeHelper)
        : [];
      setHelpers(helpersData);

      const workersData = Array.isArray(workersResponse.data)
        ? workersResponse.data.map(normalizeWorker)
        : [];
      setCashiers(workersData);

      const attendanceData = attendanceResponse.data?.attendance || [];
      const attendanceMap: { [key: string]: boolean } = {};
      attendanceData.forEach((record: AttendanceRecord) => {
        const key = `${record.workerType}:${record.workerId}`;
        attendanceMap[key] = record.present;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (workerType: 'worker' | 'helper', workerId: string) => {
    const key = `${workerType}:${workerId}`;
    setAttendance(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceRecords: AttendanceRecord[] = [
        ...helpers.map(helper => ({
          workerType: 'helper',
          workerId: helper.id,
          present: !!attendance[`helper:${helper.id}`]
        })),
        ...cashiers.map(cashier => ({
          workerType: 'worker',
          workerId: String(cashier.id),
          present: !!attendance[`worker:${cashier.id}`]
        }))
      ];

      await attendanceAPI.saveManualAttendance(selectedDate, attendanceRecords);
      toast.success('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalWorkers = helpers.length + cashiers.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Attendance Management</h2>
          <p className="text-gray-500 mt-1">Mark daily attendance for all workers</p>
        </div>
      </div>

      {/* Date Selector and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <Label htmlFor="attendanceDate" className="text-sm mb-2 block">Select Date</Label>
            <Input
              id="attendanceDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div 
              className="p-3 rounded-full"
              style={{ backgroundColor: `${station.theme.primaryColor}15` }}
            >
              <Users className="h-6 w-6" style={{ color: station.theme.primaryColor }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Workers</p>
              <p className="text-2xl font-bold">{totalWorkers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Sheet */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : totalWorkers === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No Workers Added</h3>
            <p className="text-gray-500 mb-4">
              Add cashiers in Worker Management or add helpers here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Attendance Sheet - {new Date(selectedDate).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</CardTitle>
              <Button 
                onClick={handleSaveAttendance}
                disabled={saving}
                className="gap-2"
                style={{ backgroundColor: station.theme.primaryColor }}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Cashiers Section */}
              {cashiers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <div 
                      className="w-1 h-6 rounded"
                      style={{ backgroundColor: station.theme.primaryColor }}
                    />
                    Cashiers ({cashiers.length})
                  </h3>
                  <div className="space-y-2">
                    {cashiers.map((cashier) => (
                      <div 
                        key={cashier.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            id={`cashier-${cashier.id}`}
                            checked={!!attendance[`worker:${cashier.id}`]}
                            onCheckedChange={() => toggleAttendance('worker', String(cashier.id))}
                          />
                          <label 
                            htmlFor={`cashier-${cashier.id}`}
                            className="cursor-pointer flex-1"
                          >
                            <p className="font-medium">{cashier.name}</p>
                            <p className="text-sm text-gray-500">{cashier.dutyType} Shift â€¢ â‚¹{cashier.baseSalary?.toLocaleString()}/month</p>
                          </label>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          attendance[`worker:${cashier.id}`] 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {attendance[`worker:${cashier.id}`] ? 'Present' : 'Absent'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Helpers Section */}
              {helpers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-orange-500 rounded" />
                    Helpers / Fueling Workers ({helpers.length})
                  </h3>
                  <div className="space-y-2">
                    {helpers.map((helper) => (
                      <div 
                        key={helper.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            id={`helper-${helper.id}`}
                            checked={!!attendance[`helper:${helper.id}`]}
                            onCheckedChange={() => toggleAttendance('helper', helper.id)}
                          />
                          <label 
                            htmlFor={`helper-${helper.id}`}
                            className="cursor-pointer flex-1"
                          >
                            <p className="font-medium">{helper.name}</p>
                            <p className="text-sm text-gray-500">{helper.phoneNumber} â€¢ {helper.dutyType || 'Shift'} â€¢ â‚¹{helper.monthlySalary?.toLocaleString()}/month</p>
                          </label>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          attendance[`helper:${helper.id}`] 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {attendance[`helper:${helper.id}`] ? 'Present' : 'Absent'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
