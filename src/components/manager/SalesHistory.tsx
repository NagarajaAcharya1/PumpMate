import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { dailySalesAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';

interface SalesHistoryProps {
  station: any;
  token: string;
  onBack: () => void;
}

export default function SalesHistory({ station, token, onBack }: SalesHistoryProps) {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const response = await dailySalesAPI.getDailySales();
      const salesData = Array.isArray(response.data) ? response.data : [];
      
      // Transform data to match component format
      const transformedData = salesData.map((sale: any) => ({
        id: sale.id,
        date: sale.sale_date,
        items: typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items,
        total: parseFloat(sale.total)
      }));
      
      setSalesData(transformedData);
    } catch (error) {
      console.error('Error fetching sales history:', error);
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const getTotalRevenue = () => {
    return salesData.reduce((sum, day) => sum + day.total, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Sales History</h2>
          <p className="text-gray-500 mt-1">View past sales records and revenue</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹{getTotalRevenue().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sales Days</p>
                <p className="text-2xl font-bold">{salesData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Daily Sales</p>
                <p className="text-2xl font-bold">
                  ₹{salesData.length > 0 ? Math.round(getTotalRevenue() / salesData.length).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Records */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : salesData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No Sales Records</h3>
            <p className="text-gray-500">Start recording daily sales to see history here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {salesData.map((dayData) => (
            <Card key={dayData.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date(dayData.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-xl font-bold">₹{dayData.total.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayData.items.map((item: any, index: number) => (
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
    </div>
  );
}