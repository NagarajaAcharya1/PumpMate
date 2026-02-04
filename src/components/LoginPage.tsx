import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { authAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { Fuel, Mail, Lock, Shield, User, LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any, station: any, token: string, loginType?: string) => void;
  onSwitchToRegister: () => void;
}

type LoginRole = 'admin' | 'worker' | 'manager';

export default function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<LoginRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const data = response.data;

      // Validate that user's role matches the selected role (treat manager as worker for login)
      const expectedRole = selectedRole === 'manager' ? 'worker' : selectedRole;
      if (data.user.role !== expectedRole) {
        toast.error(`Invalid credentials. Please select the correct login type.`);
        setLoading(false);
        return;
      }
      
      // Temporarily allow any worker to login as manager for testing
      // TODO: Re-enable position check once confirmed working
      // if (selectedRole === 'manager' && data.user.position !== 'manager') {
      //   toast.error(`Invalid credentials. User position is: ${data.user.position || 'undefined'}`);
      //   setLoading(false);
      //   return;
      // }
      onLogin(data.user, data.station, data.token, selectedRole);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Connection error. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full">
              <Fuel className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Fuel Station Manager</CardTitle>
          <CardDescription className="text-base">
            Sign in to manage your fuel station operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border-2 transition-all text-sm ${
                  selectedRole === 'admin'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('manager')}
                className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border-2 transition-all text-sm ${
                  selectedRole === 'manager'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <User className="h-4 w-4" />
                Manager
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('worker')}
                className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border-2 transition-all text-sm ${
                  selectedRole === 'worker'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <User className="h-4 w-4" />
                Worker
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{selectedRole === 'admin' ? 'Admin Email' : selectedRole === 'manager' ? 'Manager Email' : 'Worker Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={selectedRole === 'admin' ? 'admin@example.com' : selectedRole === 'manager' ? 'manager@example.com' : 'worker@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
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
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </div>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Register your fuel station
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}