import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Users, Clock, DollarSign } from 'lucide-react';
import { dutyAPI, workerAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';

interface CashierDataProps {
  station: any;
  token: string;
  onBack: () => void;
}

export default function CashierData({ station, token, onBack }: CashierDataProps) {
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersResponse, dutiesResponse] = await Promise.all([
        workerAPI.getWorkers(),
        dutyAPI.getAllDuties()
      ]);

      const workers = Array.isArray(workersResponse.data) ? workersResponse.data : [];
      const cashierList = workers.filter((w: any) => w.position === 'cashier');
      setCashiers(cashierList);

      const dutiesList = Array.isArray(dutiesResponse.data) ? dutiesResponse.data : [];
      setDuties(dutiesList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load cashier data');
    } finally {
      setLoading(false);
    }
  };

  const getCashierDuties = (cashierId: number) => {
    return duties.filter((d: any) => d.worker_id === cashierId);
  };

  const getRecentDuty = (cashierId: number) => {
    const cashierDuties = getCashierDuties(cashierId);
    return cashierDuties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Cashier Data</h2>
          <p className="text-gray-500 mt-1">View all cashier information and recent duties</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : cashiers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No Cashiers Found</h3>
            <p className="text-gray-500">No cashiers have been added to the system yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cashiers.map((cashier) => {
            const recentDuty = getRecentDuty(cashier.id);
            const totalDuties = getCashierDuties(cashier.id).length;
            
            return (
              <Card key={cashier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{cashier.name}</CardTitle>
                      <CardDescription className="mt-1">{cashier.email}</CardDescription>
                    </div>
                    <Badge 
                      variant={cashier.is_active ? 'default' : 'secondary'}
                      className={cashier.is_active ? 'bg-green-500' : 'bg-gray-400'}
                    >
                      {cashier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{cashier.duty_type || 'N/A'} Shift</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">₹{cashier.base_salary?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <h4 className="font-semibold text-sm mb-2">Duty Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Duties:</span>
                        <span className="font-medium">{totalDuties}</span>
                      </div>
                      {recentDuty && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Duty:</span>
                          <span className="font-medium">
                            {new Date(recentDuty.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {recentDuty && (
                    <div className="pt-3 border-t">
                      <h4 className="font-semibold text-sm mb-2">Recent Performance</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-green-600 font-medium">Petrol Sales</p>
                          <p className="text-green-900 font-bold">
                            {recentDuty.petrol_end - recentDuty.petrol_start || 0}L
                          </p>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-orange-600 font-medium">Diesel Sales</p>
                          <p className="text-orange-900 font-bold">
                            {recentDuty.diesel_end - recentDuty.diesel_start || 0}L
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}