import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  Settings,
  LogOut,
  Fuel
} from 'lucide-react';
import AdminDashboardHome from './admin/AdminDashboardHome';
import WorkerManagement from './admin/WorkerManagement';
import SettlementReports from './admin/SettlementReports';
import AttendanceView from './admin/AttendanceView';
import SalaryCalculator from './admin/SalaryCalculator';
import FuelPriceSettings from './admin/FuelPriceSettings';

interface AdminDashboardProps {
  user: any;
  station: any;
  token: string;
  onLogout: () => void;
}

type TabType = 'dashboard' | 'workers' | 'settlements' | 'attendance' | 'salary' | 'settings';

export default function AdminDashboard({ user, station, token, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workers' as TabType, label: 'Workers', icon: Users },
    { id: 'settlements' as TabType, label: 'Settlements', icon: FileText },
    { id: 'attendance' as TabType, label: 'Attendance', icon: Calendar },
    { id: 'salary' as TabType, label: 'Salary', icon: DollarSign },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

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
              <p className="text-xs text-gray-500">{station.brand}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive 
                      ? 'text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive ? {
                    backgroundColor: station.theme.primaryColor,
                  } : {}}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
          <div className="grid grid-cols-6 gap-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-600'
                  }`}
                  style={isActive ? {
                    backgroundColor: station.theme.primaryColor,
                  } : {}}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {activeTab === 'dashboard' && (
            <AdminDashboardHome station={station} token={token} />
          )}
          {activeTab === 'workers' && (
            <WorkerManagement station={station} token={token} />
          )}
          {activeTab === 'settlements' && (
            <SettlementReports station={station} token={token} />
          )}
          {activeTab === 'attendance' && (
            <AttendanceView station={station} token={token} />
          )}
          {activeTab === 'salary' && (
            <SalaryCalculator station={station} token={token} />
          )}
          {activeTab === 'settings' && (
            <FuelPriceSettings station={station} token={token} />
          )}
        </main>
      </div>
    </div>
  );
}
