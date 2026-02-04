import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { stationAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';
import { Settings, Fuel, Save } from 'lucide-react';

interface FuelPriceSettingsProps {
  station: any;
  token: string;
}

export default function FuelPriceSettings({ station, token }: FuelPriceSettingsProps) {
  const [prices, setPrices] = useState({
    petrol: station.prices.petrol.toString(),
    diesel: station.prices.diesel.toString(),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!prices.petrol || !prices.diesel) {
      toast.error('Please enter both fuel prices');
      return;
    }

    if (parseFloat(prices.petrol) <= 0 || parseFloat(prices.diesel) <= 0) {
      toast.error('Prices must be greater than zero');
      return;
    }

    setSaving(true);

    try {
      await stationAPI.updateStation({
        name: station.name,
        brand: station.brand,
        address: station.address,
        theme: station.theme,
        prices: {
          petrol: parseFloat(prices.petrol),
          diesel: parseFloat(prices.diesel)
        }
      });

      toast.success('Fuel prices updated successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Fuel Price Settings</h2>
        <p className="text-gray-500 mt-1">Manage per-liter fuel prices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Prices Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" style={{ color: station.theme.primaryColor }} />
              Current Fuel Prices
            </CardTitle>
            <CardDescription>
              These prices are applied to all sales calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Petrol</p>
                  <p className="text-3xl font-bold text-green-900">₹{station.prices.petrol}</p>
                  <p className="text-xs text-green-600 mt-1">per liter</p>
                </div>
                <div className="bg-green-500 p-4 rounded-full">
                  <Fuel className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-orange-700 font-medium mb-1">Diesel</p>
                  <p className="text-3xl font-bold text-orange-900">₹{station.prices.diesel}</p>
                  <p className="text-xs text-orange-600 mt-1">per liter</p>
                </div>
                <div className="bg-orange-500 p-4 rounded-full">
                  <Fuel className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Prices Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" style={{ color: station.theme.primaryColor }} />
              Update Prices
            </CardTitle>
            <CardDescription>
              Enter new per-liter prices to update across the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="petrolPrice">Petrol Price (₹ per liter)</Label>
              <Input
                id="petrolPrice"
                type="number"
                step="0.01"
                placeholder="e.g., 106.50"
                value={prices.petrol}
                onChange={(e) => setPrices({ ...prices, petrol: e.target.value })}
                disabled={saving}
                className="text-lg h-12"
              />
              <p className="text-xs text-gray-500">
                Current: ₹{station.prices.petrol} per liter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dieselPrice">Diesel Price (₹ per liter)</Label>
              <Input
                id="dieselPrice"
                type="number"
                step="0.01"
                placeholder="e.g., 94.80"
                value={prices.diesel}
                onChange={(e) => setPrices({ ...prices, diesel: e.target.value })}
                disabled={saving}
                className="text-lg h-12"
              />
              <p className="text-xs text-gray-500">
                Current: ₹{station.prices.diesel} per liter
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 text-base font-semibold gap-2"
                style={{ backgroundColor: station.theme.primaryColor }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating Prices...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save New Prices
                  </>
                )}
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Updated prices will be applied to all future duty calculations. 
                Previously submitted duties will retain their original prices.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Station Information */}
      <Card>
        <CardHeader>
          <CardTitle>Station Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Station Name</p>
              <p className="font-semibold">{station.name}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Brand</p>
              <p className="font-semibold">{station.brand}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Theme Color</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: station.theme.primaryColor }}
                ></div>
                <span className="font-mono text-sm">{station.theme.primaryColor}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
