import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { helperAPI, workerAPI } from '../../utils/api';
import { toast } from 'sonner@2.0.3';
import { UserPlus, Mail, Lock, DollarSign, Clock, Power, Users } from 'lucide-react';

interface WorkerManagementProps {
  station: any;
  token: string;
}

export default function WorkerManagement({ station, token }: WorkerManagementProps) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dutyType: '',
    baseSalary: '',
    position: 'cashier',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const normalizeWorker = (worker: any) => ({
    id: String(worker.id),
    name: worker.name,
    email: worker.email,
    role: worker.role,
    position: worker.position,
    dutyType: worker.duty_type,
    baseSalary: parseFloat(worker.base_salary || 0),
    phone: worker.phone,
    active: worker.is_active,
  });

  const normalizeHelper = (helper: any) => ({
    id: String(helper.id),
    name: helper.name,
    phone: helper.phone,
    dutyType: helper.duty_type,
    monthlySalary: parseFloat(helper.monthly_salary || 0),
  });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const [workersResponse, helpersResponse] = await Promise.all([
        workerAPI.getWorkers(),
        helperAPI.getHelpers()
      ]);

      const normalized = Array.isArray(workersResponse.data)
        ? workersResponse.data.map(normalizeWorker).filter((w: any) => w.role !== 'admin')
        : [];
      setWorkers(normalized);

      const normalizedHelpers = Array.isArray(helpersResponse.data)
        ? helpersResponse.data.map(normalizeHelper)
        : [];
      setHelpers(normalizedHelpers);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();

    const isHelper = formData.position === 'helper';

    if (!formData.name || !formData.baseSalary || (!isHelper && (!formData.email || !formData.password)) || (isHelper && !formData.phone) || (!isHelper && formData.position !== 'manager' && !formData.dutyType)) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Creating worker with data:', { ...formData, password: '***' });

      if (isHelper) {
        await helperAPI.createHelper({
          name: formData.name,
          monthlySalary: parseFloat(formData.baseSalary),
          phoneNumber: formData.phone,
          dutyType: formData.dutyType,
        });
        toast.success('Helper created successfully!');
      } else {
        const response = await workerAPI.createWorker({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'worker',
          position: formData.position,
          duty_type: formData.position === 'manager' ? null : formData.dutyType,
          base_salary: parseFloat(formData.baseSalary),
          phone: formData.phone
        });

        console.log('Worker creation response:', response.data);
        
        if (response.data.needsReauth) {
          // Admin was logged out during worker creation, need to re-login
          toast.success('Worker created! Please log in again.');
          window.location.href = '/login';
          return;
        }
        
        toast.success('Worker created successfully!');
      }

      setDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        dutyType: '',
        baseSalary: '',
        position: 'cashier',
      });
      fetchWorkers();
    } catch (error: any) {
      console.error('Error creating worker:', error);
      toast.error(error.response?.data?.error || 'Failed to create worker');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWorkerStatus = async (workerId: string) => {
    try {
      await workerAPI.toggleWorkerStatus(workerId);
      toast.success('Worker status updated');
      fetchWorkers();
    } catch (error) {
      console.error('Error toggling worker:', error);
      toast.error('Failed to update worker status');
    }
  };

  const deleteWorker = async (workerId: string, workerName: string) => {
    const confirmed = window.confirm(`Remove ${workerName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await workerAPI.deleteWorker(workerId);
      toast.success('Worker removed');
      fetchWorkers();
    } catch (error) {
      console.error('Error deleting worker:', error);
      toast.error('Failed to remove worker');
    }
  };

  const deleteHelper = async (helperId: string, helperName: string) => {
    const confirmed = window.confirm(`Remove ${helperName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await helperAPI.deleteHelper(helperId);
      toast.success('Helper removed');
      fetchWorkers();
    } catch (error) {
      console.error('Error deleting helper:', error);
      toast.error('Failed to remove helper');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Worker Management</h2>
          <p className="text-gray-500 mt-1">Manage your fuel station workers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2"
              style={{ backgroundColor: station.theme.primaryColor }}
            >
              <UserPlus className="h-4 w-4" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Worker</DialogTitle>
              <DialogDescription>
                Add a new cashier/worker to your fuel station
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="helper">Helper</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workerName">Worker Name</Label>
                <Input
                  id="workerName"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                />
              </div>

              {formData.position !== 'helper' && (
                <div className="space-y-2">
                  <Label htmlFor="workerEmail">Email / Login ID</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="workerEmail"
                      type="email"
                      placeholder="worker@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {formData.position !== 'helper' && (
                <div className="space-y-2">
                  <Label htmlFor="workerPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="workerPassword"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {formData.position === 'helper' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              )}

              {formData.position !== 'helper' && formData.position !== 'manager' && (
                <div className="space-y-2">
                  <Label htmlFor="dutyType">Duty Timings</Label>
                  <Select
                    value={formData.dutyType}
                    onValueChange={(value) => setFormData({ ...formData, dutyType: value })}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duty timings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day">Day Shift</SelectItem>
                      <SelectItem value="Night">Night Shift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="baseSalary">Base Monthly Salary (₹)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="baseSalary"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                style={{ backgroundColor: station.theme.primaryColor }}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Worker'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No Workers Added</h3>
            <p className="text-gray-500 mb-4">
              Start by adding your first worker to the system
            </p>
            <Button 
              onClick={() => setDialogOpen(true)}
              style={{ backgroundColor: station.theme.primaryColor }}
            >
              Add First Worker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <Card key={worker.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{worker.name}</CardTitle>
                    <CardDescription className="mt-1">{worker.email}</CardDescription>
                  </div>
                  <Badge 
                    variant={worker.active ? 'default' : 'secondary'}
                    className={worker.active ? 'bg-green-500' : 'bg-gray-400'}
                  >
                    {worker.active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{worker.dutyType} Shift</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{worker.position || 'cashier'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">₹{worker.baseSalary?.toLocaleString()} / month</span>
                </div>
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => toggleWorkerStatus(worker.id)}
                  >
                    <Power className="h-4 w-4" />
                    {worker.active ? 'Disable' : 'Enable'} Worker
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => deleteWorker(worker.id, worker.name)}
                  >
                    Remove Worker
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Helpers</h3>
          {helpers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No Helpers Added</h3>
                <p className="text-gray-500 mb-4">
                  Add helpers using the Position dropdown in Add Worker
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {helpers.map((helper) => (
                <Card key={helper.id}>
                  <CardHeader>
                    <div>
                      <CardTitle className="text-lg">{helper.name}</CardTitle>
                      <CardDescription className="mt-1">{helper.phone || 'No phone'}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{helper.dutyType || 'Shift'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">helper</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">₹{helper.monthlySalary?.toLocaleString()} / month</span>
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteHelper(helper.id, helper.name)}
                      >
                        Remove Helper
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}