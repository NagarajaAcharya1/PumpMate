import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  TrendingUp, 
  Users, 
  Calculator, 
  FileText, 
  Shield, 
  Smartphone,
  CheckCircle,
  Fuel,
  Clock,
  IndianRupee,
  BarChart3,
  Calendar
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const features = [
    {
      icon: Fuel,
      title: 'Daily Sales Management',
      description: 'Track pump readings, fuel sales, and payments across multiple pumps in real-time'
    },
    {
      icon: Users,
      title: 'Worker Management',
      description: 'Create profiles, assign shifts, manage duties with role-based access control'
    },
    {
      icon: Calculator,
      title: 'Auto Calculations',
      description: 'Automatic shortage/excess calculation, zero manual math, error-free settlements'
    },
    {
      icon: Calendar,
      title: 'Attendance Tracking',
      description: 'Login-based automatic attendance marking with shift-wise time tracking'
    },
    {
      icon: IndianRupee,
      title: 'Salary Processing',
      description: 'Month-end salary calculation with base + excess - shortage adjustments'
    },
    {
      icon: FileText,
      title: 'Professional Reports',
      description: 'Download branded PDF reports for duties, settlements, and salary slips'
    }
  ];

  const benefits = [
    'Paperless digital operations',
    'Brand-based automatic theming',
    'Mobile & desktop responsive',
    'Secure authentication & sessions',
    'Real-time dashboard analytics',
    'Multi-payment method tracking',
    'Worker performance insights',
    'Complete audit trail'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Fuel className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FuelStation Pro</h1>
              <p className="text-xs text-gray-500">Petrol Bunk Management</p>
            </div>
          </div>
          <Button onClick={onLogin} variant="outline" className="gap-2">
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Complete Digital Solution for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Indian Petrol Bunks
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Manage daily sales, duty settlements, worker attendance, and salary calculations with automatic error-free calculations. Built specifically for fuel station operations in India.
          </p>
          <div className="flex justify-center">
            <Button onClick={onLogin} size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Login to Dashboard
              <TrendingUp className="ml-2 size-5" />
            </Button>
          </div>

          {/* Brand Trust Badges */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-gray-500 mb-4">SUPPORTED FUEL BRANDS</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
              <div className="text-center">
                <div className="font-bold text-lg" style={{ color: '#003c7e' }}>INDIAN OIL</div>
                <p className="text-xs text-gray-500">Auto Theme</p>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg" style={{ color: '#0066cc' }}>HP</div>
                <p className="text-xs text-gray-500">Auto Theme</p>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg" style={{ color: '#00923f' }}>BP</div>
                <p className="text-xs text-gray-500">Auto Theme</p>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-gray-700">CUSTOM</div>
                <p className="text-xs text-gray-500">Your Colors</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Fuel Station Needs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete platform designed to handle real-world petrol bunk operations with precision and efficiency
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Fuel Stations Choose Us
              </h2>
              <p className="text-lg text-blue-100">
                Enterprise-grade features built for Indian petrol bunk operations
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <CheckCircle className="size-6 text-green-300 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Workflow, Powerful Results
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From registration to month-end salary processing, everything is automated
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Register Station</h3>
              <p className="text-gray-600 text-sm">Create account with brand selection</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Add Workers</h3>
              <p className="text-gray-600 text-sm">Create worker profiles & set shifts</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Daily Operations</h3>
              <p className="text-gray-600 text-sm">Workers submit pump readings</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-pink-600">4</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Auto Reports</h3>
              <p className="text-gray-600 text-sm">Get settlements & salary PDFs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                <BarChart3 className="size-10" />
                100%
              </div>
              <p className="text-gray-600 font-medium">Automated Calculations</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                <Clock className="size-10" />
                24/7
              </div>
              <p className="text-gray-600 font-medium">Real-Time Access</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                <Smartphone className="size-10" />
                100%
              </div>
              <p className="text-gray-600 font-medium">Mobile Responsive</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Access Your Fuel Station Dashboard
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Professional fuel station management system for daily operations
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={onLogin} 
                size="lg" 
                className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
              >
                Login to Dashboard
                <TrendingUp className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Fuel className="size-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">FuelStation Pro</span>
          </div>
          <p className="text-sm mb-2">Complete Petrol Bunk Management Solution for India 🇮🇳</p>
          <p className="text-xs text-gray-500">Production-Ready SaaS Platform • Built with React & Supabase</p>
        </div>
      </footer>
    </div>
  );
}
