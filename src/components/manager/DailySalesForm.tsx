import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { dailySalesAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';

interface DailySalesFormProps {
  station: any;
  token: string;
  onBack: () => void;
}

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function DailySalesForm({ station, token, onBack }: DailySalesFormProps) {
  const [salesItems, setSalesItems] = useState<SaleItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    price: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const commonItems = [
    'Engine Oil (1L)',
    'Engine Oil (5L)',
    'Brake Oil',
    'Coolant',
    'Car Tyre',
    'Bike Tyre',
    'Battery',
    'Air Freshener',
    'Car Wash',
    'Puncture Repair'
  ];

  const addSaleItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.price) {
      toast.error('Please fill all fields');
      return;
    }

    const quantity = parseFloat(newItem.quantity);
    const price = parseFloat(newItem.price);
    const total = quantity * price;

    const item: SaleItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity,
      price,
      total
    };

    setSalesItems([...salesItems, item]);
    setNewItem({ name: '', quantity: '', price: '' });
  };

  const removeSaleItem = (id: string) => {
    setSalesItems(salesItems.filter(item => item.id !== id));
  };

  const getTotalSales = () => {
    return salesItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async () => {
    if (salesItems.length === 0) {
      toast.error('Please add at least one sale item');
      return;
    }

    setSubmitting(true);
    try {
      const salesData = {
        date: new Date().toISOString().split('T')[0],
        items: salesItems,
        total: getTotalSales()
      };
      
      await dailySalesAPI.createDailySales(salesData);
      
      toast.success('Daily sales saved successfully!');
      setSalesItems([]);
      onBack();
    } catch (error) {
      console.error('Error saving sales:', error);
      toast.error('Failed to save daily sales');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Daily Sales Entry</h2>
          <p className="text-gray-500 mt-1">Record oil, tyre and other item sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Item */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Sale Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                placeholder="Select or type item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                list="common-items"
              />
              <datalist id="common-items">
                {commonItems.map(item => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 2"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Unit (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 500"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
            </div>

            <Button 
              onClick={addSaleItem}
              className="w-full"
              style={{ backgroundColor: station.theme.primaryColor }}
            >
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Today's Sales Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items added yet</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {salesItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × ₹{item.price} = ₹{item.total.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSaleItem(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Sales:</span>
                    <span>₹{getTotalSales().toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                  style={{ backgroundColor: station.theme.primaryColor }}
                >
                  {submitting ? 'Saving...' : 'Save Daily Sales'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}