import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { authAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { Fuel, Building2, MapPin, User, Mail, Lock } from 'lucide-react';

interface RegisterPageProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    stationName: '',
    brand: '',
    address: '',
    adminName: '',
    adminEmail: '',
    password: '',
    customColor: '#1e40af',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.stationName || !formData.brand || !formData.address || 
        !formData.adminName || !formData.adminEmail || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.adminName,
        email: formData.adminEmail,
        password: formData.password,
        role: 'admin',
        stationData: {
          name: formData.stationName,
          brand: formData.brand,
          address: formData.address
        }
      });

      toast.success('Registration successful!');
      onRegister();
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full">
              <Fuel className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Register Your Fuel Station</CardTitle>
          <CardDescription className="text-base">
            Set up your digital management system in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stationName">Fuel Station Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="stationName"
                    placeholder="e.g., City Center Fuel Station"
                    value={formData.stationName}
                    onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                    className="pl-10 h-12 text-base"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select 
                  value={formData.brand} 
                  onValueChange={(value) => setFormData({ ...formData, brand: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indian Oil">Indian Oil</SelectItem>
                    <SelectItem value="HP">Hindustan Petroleum (HP)</SelectItem>
                    <SelectItem value="BP">Bharat Petroleum (BP)</SelectItem>
                    <SelectItem value="Custom">Custom / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.brand === 'Custom' && (
              <div className="space-y-2">
                <Label htmlFor="customColor">Theme Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="customColor"
                    type="color"
                    value={formData.customColor}
                    onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                    className="h-12 w-20 rounded border cursor-pointer"
                    disabled={loading}
                  />
                  <Input
                    value={formData.customColor}
                    onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                    className="h-12 text-base"
                    disabled={loading}
                    placeholder="#1e40af"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="address">Station Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="address"
                  placeholder="Complete address with city, state, PIN"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Admin Account Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="adminName"
                      placeholder="Your full name"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="pl-10 h-12 text-base"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="pl-10 h-12 text-base"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-12 text-base"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating your account...
                </div>
              ) : (
                'Register Station'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
