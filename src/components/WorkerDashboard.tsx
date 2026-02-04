import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogOut, Fuel, Calendar, Clock, Plus, FileText } from 'lucide-react';
import { dutyAPI } from '../utils/api';
import DutyEntryForm from './worker/DutyEntryForm';
import PreviousDuties from './worker/PreviousDuties';

interface WorkerDashboardProps {
  user: any;
  station: any;
  token: string;
  onLogout: () => void;
}

type ViewType = 'home' | 'new-duty' | 'history';

export default function WorkerDashboard({ user, station, token, onLogout }: WorkerDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [todayDutySubmitted, setTodayDutySubmitted] = useState(false);

  useEffect(() => {
    checkTodayDuty();
  }, []);

  const checkTodayDuty = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await dutyAPI.getMyDuties();
      const duties = Array.isArray(response.data) ? response.data : [];
      const hasTodayDuty = duties.some((d: any) => {
        const date = new Date(d.shift_start || d.created_at).toISOString().split('T')[0];
        return date === today;
      });
      setTodayDutySubmitted(hasTodayDuty);
    } catch (error) {
      console.error('Error checking today duty:', error);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white border-b sticky top-0 z-40 shadow-sm"
        style={{ 
          borderBottomColor: station.theme.primaryColor,
          borderBottomWidth: '3px'
        }}
      >
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${station.theme.primaryColor}15` }}
            >
              <Fuel 
                className="h-6 w-6" 
                style={{ color: station.theme.primaryColor }}
              />
            </div>
            <div>
              <h1 className="font-bold text-lg">{station.name}</h1>
              <p className="text-xs text-gray-500">{user.dutyType} Shift Worker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{currentTime}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto pb-24 lg:pb-6">
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card 
              className="border-l-4"
              style={{ borderLeftColor: station.theme.primaryColor }}
            >
              <CardHeader>
                <CardTitle className="text-2xl">Welcome, {user.name}!</CardTitle>
                <CardDescription className="text-base mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {getCurrentDate()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium mb-1">Your Shift</p>
                    <p className="text-2xl font-bold text-blue-900">{user.dutyType}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium mb-1">Base Salary</p>
                    <p className="text-2xl font-bold text-purple-900">₹{user.baseSalary?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium mb-1">Today's Status</p>
                    <p className="text-lg font-bold text-green-900">
                      {todayDutySubmitted ? 'Duty Submitted ✓' : 'Pending'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Fuel Prices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5" style={{ color: station.theme.primaryColor }} />
                  Today's Fuel Prices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-2">Petrol</p>
                    <p className="text-4xl font-bold text-green-900">₹{station.prices.petrol}</p>
                    <p className="text-xs text-green-600 mt-1">per liter</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                    <p className="text-sm text-orange-700 font-medium mb-2">Diesel</p>
                    <p className="text-4xl font-bold text-orange-900">₹{station.prices.diesel}</p>
                    <p className="text-xs text-orange-600 mt-1">per liter</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-32 text-xl font-semibold flex-col gap-3"
                style={{ backgroundColor: station.theme.primaryColor }}
                onClick={() => setCurrentView('new-duty')}
                disabled={todayDutySubmitted}
              >
                <Plus className="h-12 w-12" />
                {todayDutySubmitted ? 'Duty Already Submitted' : 'Submit New Duty'}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-32 text-xl font-semibold flex-col gap-3"
                onClick={() => setCurrentView('history')}
              >
                <FileText className="h-12 w-12" />
                View Previous Duties
              </Button>
            </div>
          </div>
        )}

        {currentView === 'new-duty' && (
          <DutyEntryForm
            user={user}
            station={station}
            token={token}
            onBack={() => {
              setCurrentView('home');
              setTodayDutySubmitted(true);
            }}
          />
        )}

        {currentView === 'history' && (
          <PreviousDuties
            user={user}
            station={station}
            token={token}
            onBack={() => setCurrentView('home')}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {currentView !== 'home' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCurrentView('home')}
          >
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}
