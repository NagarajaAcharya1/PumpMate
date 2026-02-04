import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { dutyAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';
import { Fuel, Plus, Trash2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Badge } from '../ui/badge';

interface DutyEntryFormProps {
  user: any;
  station: any;
  token: string;
  onBack: () => void;
}

interface Pump {
  id: string;
  pumpNumber: string;
  fuelType: 'Petrol' | 'Diesel';
  opening: string;
  closing: string;
  liters: number;
  amount: number;
}

export default function DutyEntryForm({ user, station, token, onBack }: DutyEntryFormProps) {
  const [pumps, setPumps] = useState<Pump[]>([
    {
      id: '1',
      pumpNumber: '1',
      fuelType: 'Petrol',
      opening: '',
      closing: '',
      liters: 0,
      amount: 0,
    }
  ]);

  const [payments, setPayments] = useState({
    cash: '',
    card: '',
    online: '',
    credit: '',
    testing: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const addPump = () => {
    setPumps([
      ...pumps,
      {
        id: Date.now().toString(),
        pumpNumber: (pumps.length + 1).toString(),
        fuelType: 'Petrol',
        opening: '',
        closing: '',
        liters: 0,
        amount: 0,
      }
    ]);
  };

  const removePump = (id: string) => {
    if (pumps.length > 1) {
      setPumps(pumps.filter(p => p.id !== id));
    }
  };

  const updatePump = (id: string, field: string, value: string) => {
    setPumps(pumps.map(pump => {
      if (pump.id === id) {
        const updated = { ...pump, [field]: value };
        
        // Auto-calculate when opening or closing changes
        if (field === 'opening' || field === 'closing' || field === 'fuelType') {
          const opening = parseFloat(field === 'opening' ? value : updated.opening) || 0;
          const closing = parseFloat(field === 'closing' ? value : updated.closing) || 0;
          updated.liters = Math.max(0, closing - opening);
          
          const price = updated.fuelType === 'Petrol' ? station.prices.petrol : station.prices.diesel;
          updated.amount = updated.liters * price;
        }
        
        return updated;
      }
      return pump;
    }));
  };

  const calculateTotals = () => {
    const petrolPumps = pumps.filter(p => p.fuelType === 'Petrol');
    const dieselPumps = pumps.filter(p => p.fuelType === 'Diesel');
    
    const petrolTotal = petrolPumps.reduce((sum, p) => sum + p.amount, 0);
    const dieselTotal = dieselPumps.reduce((sum, p) => sum + p.amount, 0);
    const totalSales = petrolTotal + dieselTotal;
    
    const cashAmount = parseFloat(payments.cash) || 0;
    const cardAmount = parseFloat(payments.card) || 0;
    const onlineAmount = parseFloat(payments.online) || 0;
    const creditAmount = parseFloat(payments.credit) || 0;
    const testingAmount = parseFloat(payments.testing) || 0;
    
    const totalReceived = cashAmount + cardAmount + onlineAmount + creditAmount - testingAmount;
    const difference = totalReceived - totalSales;
    
    return {
      petrolTotal,
      dieselTotal,
      totalSales,
      cashAmount,
      cardAmount,
      onlineAmount,
      creditAmount,
      testingAmount,
      totalReceived,
      difference
    };
  };

  const validateForm = () => {
    // Check all pumps have valid readings
    for (const pump of pumps) {
      if (!pump.opening || !pump.closing) {
        toast.error(`Pump ${pump.pumpNumber}: Please enter both opening and closing readings`);
        return false;
      }
      
      const opening = parseFloat(pump.opening);
      const closing = parseFloat(pump.closing);
      
      if (closing < opening) {
        toast.error(`Pump ${pump.pumpNumber}: Closing reading cannot be less than opening`);
        return false;
      }
    }
    
    // Check at least one payment method has value
    if (!payments.cash && !payments.card && !payments.online && !payments.credit) {
      toast.error('Please enter at least one payment amount');
      return false;
    }
    
    return true;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowSummary(true);
    }
  };

  const handleSubmit = async () => {
    const totals = calculateTotals();
    const today = new Date().toISOString().split('T')[0];

    setSubmitting(true);

    try {
      const pumpReadings = pumps.map(p => ({
        pumpNumber: p.pumpNumber,
        fuelType: p.fuelType,
        opening: parseFloat(p.opening),
        closing: parseFloat(p.closing),
        liters: p.liters,
        amount: p.amount,
        total_amount: p.amount
      }));

      const startResponse = await dutyAPI.startDuty(pumpReadings);
      const dutyId = startResponse.data?.id;

      if (!dutyId) {
        toast.error('Failed to create duty session');
        return;
      }

      await dutyAPI.endDuty(dutyId, {
        pump_readings: pumpReadings,
        cash_collected: totals.totalReceived,
        notes: JSON.stringify({
          date: today,
          payments,
          totals
        })
      });

      toast.success('Duty submitted successfully!');
      onBack();
    } catch (error) {
      console.error('Error submitting duty:', error);
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (showSummary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setShowSummary(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold">Duty Summary</h2>
            <p className="text-gray-500 mt-1">Review before final submission</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pump Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pumps.map((pump) => (
                <div key={pump.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Pump {pump.pumpNumber} - {pump.fuelType}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Opening: {pump.opening} | Closing: {pump.closing}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{pump.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{pump.liters.toFixed(2)}L</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span>Petrol Sales</span>
                <span className="font-bold">₹{totals.petrolTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                <span>Diesel Sales</span>
                <span className="font-bold">₹{totals.dieselTotal.toFixed(2)}</span>
              </div>
              <div 
                className="flex justify-between p-4 rounded-lg text-white"
                style={{ backgroundColor: station.theme.primaryColor }}
              >
                <span className="font-semibold">Total Sales</span>
                <span className="font-bold text-xl">₹{totals.totalSales.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Cash</span>
                <span className="font-bold">₹{totals.cashAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Card</span>
                <span className="font-bold">₹{totals.cardAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Online</span>
                <span className="font-bold">₹{totals.onlineAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Credit</span>
                <span className="font-bold">₹{totals.creditAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Testing Fuel</span>
                <span className="font-bold text-red-600">-₹{totals.testingAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total Received</span>
                <span className="font-bold text-lg">₹{totals.totalReceived.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={totals.difference < 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {totals.difference < 0 ? (
                  <AlertCircle className="h-8 w-8 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Final Settlement</p>
                  <p className={`text-2xl font-bold ${totals.difference < 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {totals.difference < 0 ? 'Shortage' : 'Excess'}: ₹{Math.abs(totals.difference).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowSummary(false)}
            disabled={submitting}
          >
            Edit Details
          </Button>
          <Button
            className="flex-1"
            style={{ backgroundColor: station.theme.primaryColor }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Submit Duty</h2>
          <p className="text-gray-500 mt-1">Enter pump readings and payment details</p>
        </div>
      </div>

      {/* Pump Readings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pump Readings</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addPump}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Pump
            </Button>
          </div>
          <CardDescription>Enter opening and closing meter readings for each pump</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pumps.map((pump, index) => (
            <div key={pump.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Pump {pump.pumpNumber}</h4>
                {pumps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePump(pump.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Pump Number</Label>
                  <Input
                    type="text"
                    value={pump.pumpNumber}
                    onChange={(e) => updatePump(pump.id, 'pumpNumber', e.target.value)}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select
                    value={pump.fuelType}
                    onValueChange={(value) => updatePump(pump.id, 'fuelType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Opening Reading</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pump.opening}
                    onChange={(e) => updatePump(pump.id, 'opening', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Closing Reading</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pump.closing}
                    onChange={(e) => updatePump(pump.id, 'closing', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {pump.liters > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Calculated:</span>
                    <div className="text-right">
                      <p className="font-bold text-blue-900">{pump.liters.toFixed(2)} liters</p>
                      <p className="text-sm text-blue-700">₹{pump.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Collection</CardTitle>
          <CardDescription>Enter amounts received through each payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cash">Cash Amount (₹)</Label>
              <Input
                id="cash"
                type="number"
                step="0.01"
                value={payments.cash}
                onChange={(e) => setPayments({ ...payments, cash: e.target.value })}
                placeholder="0.00"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card">Card Amount (₹)</Label>
              <Input
                id="card"
                type="number"
                step="0.01"
                value={payments.card}
                onChange={(e) => setPayments({ ...payments, card: e.target.value })}
                placeholder="0.00"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="online">Online Payment (₹)</Label>
              <Input
                id="online"
                type="number"
                step="0.01"
                value={payments.online}
                onChange={(e) => setPayments({ ...payments, online: e.target.value })}
                placeholder="0.00"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit">Credit Amount (₹)</Label>
              <Input
                id="credit"
                type="number"
                step="0.01"
                value={payments.credit}
                onChange={(e) => setPayments({ ...payments, credit: e.target.value })}
                placeholder="0.00"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testing">Testing Fuel (₹)</Label>
              <Input
                id="testing"
                type="number"
                step="0.01"
                value={payments.testing}
                onChange={(e) => setPayments({ ...payments, testing: e.target.value })}
                placeholder="0.00"
                className="h-12 text-lg"
              />
              <p className="text-xs text-gray-500">Daily mandatory fuel testing amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      {totals.totalSales > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold">₹{totals.totalSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Received</p>
                <p className="text-2xl font-bold">₹{totals.totalReceived.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Difference</p>
                <Badge variant={totals.difference < 0 ? 'destructive' : 'default'} className="text-lg px-3 py-1">
                  {totals.difference < 0 ? 'Shortage' : 'Excess'}: ₹{Math.abs(totals.difference).toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onBack}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          style={{ backgroundColor: station.theme.primaryColor }}
          onClick={handlePreview}
        >
          Preview Summary
        </Button>
      </div>
    </div>
  );
}
