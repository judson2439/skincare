import React, { useState } from 'react';
import { useTreatmentPlans, TreatmentPlan, CreateTreatmentPlanInput } from '@/hooks/useTreatmentPlans';
import { useRoutineManagement } from '@/hooks/useRoutineManagement';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  X,
  Calendar,
  Target,
  Package,
  Clock,
  Users,
  ChevronRight,
  Edit,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Flag,
  CheckCircle2,
  Circle,
  Sparkles,
  ClipboardList,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

const CLIENT_IMAGES = [
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033469330_78107091.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033460880_8c5e20c5.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033472779_08fb4b93.png",
];

interface TreatmentPlanManagerProps {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    image: string;
  }>;
}

const TreatmentPlanManager: React.FC<TreatmentPlanManagerProps> = ({ clients }) => {
  const { toast } = useToast();
  const treatmentPlans = useTreatmentPlans();
  const routineManagement = useRoutineManagement();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);

  // Create plan form state
  const [newPlanClientId, setNewPlanClientId] = useState('');
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanStartDate, setNewPlanStartDate] = useState('');
  const [newPlanEndDate, setNewPlanEndDate] = useState('');
  const [newPlanGoals, setNewPlanGoals] = useState<string[]>([]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newPlanNotes, setNewPlanNotes] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Add items state
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  // Milestone form
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  // Product form
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productInstructions, setProductInstructions] = useState('');
  const [productPriority, setProductPriority] = useState<'essential' | 'recommended' | 'optional'>('recommended');

  // Routine form
  const [routineName, setRoutineName] = useState('');
  const [routineType, setRoutineType] = useState('');
  const [routineNotes, setRoutineNotes] = useState('');

  // Appointment form
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentDuration, setAppointmentDuration] = useState('60');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  const resetCreateForm = () => {
    setNewPlanClientId('');
    setNewPlanTitle('');
    setNewPlanDescription('');
    setNewPlanStartDate('');
    setNewPlanEndDate('');
    setNewPlanGoals([]);
    setNewGoalInput('');
    setNewPlanNotes('');
  };

  const handleCreatePlan = async () => {
    if (!newPlanClientId || !newPlanTitle || !newPlanStartDate || !newPlanEndDate) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSavingPlan(true);
    const result = await treatmentPlans.createPlan({
      client_id: newPlanClientId,
      title: newPlanTitle,
      description: newPlanDescription || undefined,
      start_date: newPlanStartDate,
      end_date: newPlanEndDate,
      goals: newPlanGoals,
      notes: newPlanNotes || undefined,
    });
    setSavingPlan(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Treatment plan created!' });
      setShowCreateModal(false);
      resetCreateForm();
      if (result.plan) {
        setSelectedPlan(result.plan);
        setShowDetailModal(true);
      }
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to create plan', variant: 'destructive' });
    }
  };

  const handleAddGoal = () => {
    if (newGoalInput.trim()) {
      setNewPlanGoals([...newPlanGoals, newGoalInput.trim()]);
      setNewGoalInput('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setNewPlanGoals(newPlanGoals.filter((_, i) => i !== index));
  };

  const handleAddMilestone = async () => {
    if (!selectedPlan || !milestoneTitle || !milestoneDate) return;

    const result = await treatmentPlans.addMilestone(selectedPlan.id, {
      title: milestoneTitle,
      description: milestoneDescription || undefined,
      target_date: milestoneDate,
    });

    if (result.success) {
      toast({ title: 'Success', description: 'Milestone added!' });
      setMilestoneTitle('');
      setMilestoneDescription('');
      setMilestoneDate('');
      setShowAddMilestone(false);
      // Refresh selected plan
      const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
      if (updated) setSelectedPlan(updated);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleAddProduct = async () => {
    if (!selectedPlan || !productName) return;

    const result = await treatmentPlans.addProduct(selectedPlan.id, {
      product_name: productName,
      product_brand: productBrand || undefined,
      product_category: productCategory || undefined,
      usage_instructions: productInstructions || undefined,
      priority: productPriority,
    });

    if (result.success) {
      toast({ title: 'Success', description: 'Product added!' });
      setProductName('');
      setProductBrand('');
      setProductCategory('');
      setProductInstructions('');
      setProductPriority('recommended');
      setShowAddProduct(false);
      const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
      if (updated) setSelectedPlan(updated);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleAddRoutine = async () => {
    if (!selectedPlan || !routineName) return;

    const result = await treatmentPlans.addRoutine(selectedPlan.id, {
      routine_name: routineName,
      routine_type: routineType || undefined,
      notes: routineNotes || undefined,
    });

    if (result.success) {
      toast({ title: 'Success', description: 'Routine added!' });
      setRoutineName('');
      setRoutineType('');
      setRoutineNotes('');
      setShowAddRoutine(false);
      const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
      if (updated) setSelectedPlan(updated);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleAddAppointment = async () => {
    if (!selectedPlan || !appointmentType || !appointmentDate) return;

    const result = await treatmentPlans.addAppointment(selectedPlan.id, {
      appointment_type: appointmentType,
      scheduled_date: appointmentDate,
      scheduled_time: appointmentTime || undefined,
      duration_minutes: parseInt(appointmentDuration) || 60,
      notes: appointmentNotes || undefined,
    });

    if (result.success) {
      toast({ title: 'Success', description: 'Appointment scheduled!' });
      setAppointmentType('');
      setAppointmentDate('');
      setAppointmentTime('');
      setAppointmentDuration('60');
      setAppointmentNotes('');
      setShowAddAppointment(false);
      const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
      if (updated) setSelectedPlan(updated);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async (planId: string, status: TreatmentPlan['status']) => {
    const result = await treatmentPlans.updatePlanStatus(planId, status);
    if (result.success) {
      toast({ title: 'Success', description: `Plan ${status}` });
      const updated = treatmentPlans.plans.find(p => p.id === planId);
      if (updated) setSelectedPlan(updated);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this treatment plan?')) return;
    
    const result = await treatmentPlans.deletePlan(planId);
    if (result.success) {
      toast({ title: 'Success', description: 'Plan deleted' });
      setShowDetailModal(false);
      setSelectedPlan(null);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: TreatmentPlan['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-700';
      case 'recommended': return 'bg-blue-100 text-blue-700';
      case 'optional': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Combine real clients with available clients prop
  const allClients = [
    ...routineManagement.clients.map((c, idx) => ({
      id: c.id,
      name: c.full_name || c.email || 'Unknown',
      email: c.email || '',
      image: c.avatar_url || CLIENT_IMAGES[idx % CLIENT_IMAGES.length],
    })),
    ...clients.filter(c => !routineManagement.clients.some(rc => rc.id === c.id)),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Treatment Plans</h2>
          <p className="text-gray-500">Create comprehensive treatment plans for your clients</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Create Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#CFAFA3]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{treatmentPlans.plans.length}</p>
              <p className="text-xs text-gray-500">Total Plans</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {treatmentPlans.plans.filter(p => p.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {treatmentPlans.plans.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(treatmentPlans.plans.map(p => p.client_id)).size}
              </p>
              <p className="text-xs text-gray-500">Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {treatmentPlans.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!treatmentPlans.loading && treatmentPlans.plans.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-[#CFAFA3]" />
          </div>
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Treatment Plans Yet</h3>
          <p className="text-gray-500 mb-6">Create your first treatment plan to help clients achieve their skincare goals</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" /> Create Your First Plan
          </button>
        </div>
      )}

      {/* Plans Grid */}
      {!treatmentPlans.loading && treatmentPlans.plans.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treatmentPlans.plans.map((plan) => {
            const progress = treatmentPlans.getPlanProgress(plan);
            const client = allClients.find(c => c.id === plan.client_id);

            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowDetailModal(true);
                }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={client?.image || CLIENT_IMAGES[0]}
                      alt={client?.name || 'Client'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-1">{plan.title}</h3>
                      <p className="text-xs text-gray-500">{client?.name || 'Unknown Client'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-[#CFAFA3]">{progress.overallProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] rounded-full transition-all"
                      style={{ width: `${progress.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-900">{progress.completedMilestones}/{progress.totalMilestones}</p>
                    <p className="text-xs text-gray-500">Milestones</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-900">{plan.products.length}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-900">{progress.daysRemaining}</p>
                    <p className="text-xs text-gray-500">Days Left</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>{new Date(plan.start_date).toLocaleDateString()}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{new Date(plan.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Create Treatment Plan</h3>
              <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Client *</label>
                {allClients.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <p className="text-sm text-amber-800">No clients available. Add clients first.</p>
                    </div>
                  </div>
                ) : (
                  <select
                    value={newPlanClientId}
                    onChange={(e) => setNewPlanClientId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  >
                    <option value="">Choose a client...</option>
                    {allClients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Plan Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Title *</label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="e.g., 12-Week Acne Treatment Plan"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Describe the treatment plan..."
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={newPlanStartDate}
                    onChange={(e) => setNewPlanStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={newPlanEndDate}
                    onChange={(e) => setNewPlanEndDate(e.target.value)}
                    min={newPlanStartDate}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goals</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="Add a goal..."
                  />
                  <button
                    onClick={handleAddGoal}
                    className="px-4 py-2 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-xl hover:bg-[#CFAFA3]/20 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {newPlanGoals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newPlanGoals.map((goal, idx) => (
                      <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-full text-sm">
                        <Target className="w-3 h-3" />
                        {goal}
                        <button onClick={() => handleRemoveGoal(idx)} className="ml-1 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newPlanNotes}
                  onChange={(e) => setNewPlanNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={savingPlan || !newPlanClientId || !newPlanTitle || !newPlanStartDate || !newPlanEndDate}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Detail Modal */}
      {showDetailModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={allClients.find(c => c.id === selectedPlan.client_id)?.image || CLIENT_IMAGES[0]}
                    alt="Client"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-serif font-bold text-gray-900">{selectedPlan.title}</h3>
                    <p className="text-sm text-gray-500">
                      {allClients.find(c => c.id === selectedPlan.client_id)?.name || 'Unknown Client'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPlan.status)}`}>
                    {selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1)}
                  </span>
                  <button onClick={() => { setShowDetailModal(false); setSelectedPlan(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Overall Progress</span>
                  <span className="font-medium text-[#CFAFA3]">{treatmentPlans.getPlanProgress(selectedPlan).overallProgress}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] rounded-full transition-all"
                    style={{ width: `${treatmentPlans.getPlanProgress(selectedPlan).overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
                {selectedPlan.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedPlan.id, 'paused')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedPlan.id, 'completed')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Complete
                    </button>
                  </>
                )}
                {selectedPlan.status === 'paused' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPlan.id, 'active')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                <button
                  onClick={() => handleDeletePlan(selectedPlan.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description & Goals */}
              {(selectedPlan.description || selectedPlan.goals.length > 0) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  {selectedPlan.description && (
                    <p className="text-gray-600 mb-3">{selectedPlan.description}</p>
                  )}
                  {selectedPlan.goals.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlan.goals.map((goal, idx) => (
                          <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-white text-[#CFAFA3] rounded-full text-sm border border-[#CFAFA3]/20">
                            <Target className="w-3 h-3" />
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-[#CFAFA3]" />
                    Milestones ({selectedPlan.milestones.length})
                  </h4>
                  <button
                    onClick={() => setShowAddMilestone(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {showAddMilestone && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Milestone title"
                      />
                      <input
                        type="date"
                        value={milestoneDate}
                        onChange={(e) => setMilestoneDate(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={milestoneDescription}
                      onChange={(e) => setMilestoneDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
                      placeholder="Description (optional)"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddMilestone(false)} className="px-3 py-1.5 text-gray-600 text-sm">Cancel</button>
                      <button
                        onClick={handleAddMilestone}
                        disabled={!milestoneTitle || !milestoneDate}
                        className="px-3 py-1.5 bg-[#CFAFA3] text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        Add Milestone
                      </button>
                    </div>
                  </div>
                )}

                {selectedPlan.milestones.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No milestones yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPlan.milestones.map((milestone) => (
                      <div key={milestone.id} className={`flex items-center gap-3 p-3 rounded-xl border ${milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                        <button
                          onClick={async () => {
                            await treatmentPlans.updateMilestone(milestone.id, { completed: !milestone.completed });
                            const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
                            if (updated) setSelectedPlan(updated);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-green-500 text-white' : 'border-2 border-gray-300'}`}
                        >
                          {milestone.completed && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${milestone.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>{milestone.title}</p>
                          {milestone.description && <p className="text-xs text-gray-500">{milestone.description}</p>}
                        </div>
                        <span className="text-xs text-gray-500">{new Date(milestone.target_date).toLocaleDateString()}</span>
                        <button
                          onClick={async () => {
                            await treatmentPlans.deleteMilestone(milestone.id);
                            const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
                            if (updated) setSelectedPlan(updated);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#CFAFA3]" />
                    Recommended Products ({selectedPlan.products.length})
                  </h4>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {showAddProduct && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Product name *"
                      />
                      <input
                        type="text"
                        value={productBrand}
                        onChange={(e) => setProductBrand(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Brand"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <select
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Category</option>
                        <option value="Cleanser">Cleanser</option>
                        <option value="Toner">Toner</option>
                        <option value="Serum">Serum</option>
                        <option value="Moisturizer">Moisturizer</option>
                        <option value="Sunscreen">Sunscreen</option>
                        <option value="Treatment">Treatment</option>
                      </select>
                      <select
                        value={productPriority}
                        onChange={(e) => setProductPriority(e.target.value as any)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="essential">Essential</option>
                        <option value="recommended">Recommended</option>
                        <option value="optional">Optional</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={productInstructions}
                      onChange={(e) => setProductInstructions(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
                      placeholder="Usage instructions"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddProduct(false)} className="px-3 py-1.5 text-gray-600 text-sm">Cancel</button>
                      <button
                        onClick={handleAddProduct}
                        disabled={!productName}
                        className="px-3 py-1.5 bg-[#CFAFA3] text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>
                )}

                {selectedPlan.products.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No products yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPlan.products.map((product) => (
                      <div key={product.id} className="p-3 bg-white rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{product.product_name}</p>
                            {product.product_brand && <p className="text-xs text-[#CFAFA3]">{product.product_brand}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(product.priority)}`}>
                            {product.priority}
                          </span>
                        </div>
                        {product.usage_instructions && (
                          <p className="text-xs text-gray-500 mb-2">{product.usage_instructions}</p>
                        )}
                        <button
                          onClick={async () => {
                            await treatmentPlans.deleteProduct(product.id);
                            const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
                            if (updated) setSelectedPlan(updated);
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Routines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-[#CFAFA3]" />
                    Routines ({selectedPlan.routines.length})
                  </h4>
                  <button
                    onClick={() => setShowAddRoutine(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {showAddRoutine && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Routine name *"
                      />
                      <select
                        value={routineType}
                        onChange={(e) => setRoutineType(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Type</option>
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={routineNotes}
                      onChange={(e) => setRoutineNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
                      placeholder="Notes"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddRoutine(false)} className="px-3 py-1.5 text-gray-600 text-sm">Cancel</button>
                      <button
                        onClick={handleAddRoutine}
                        disabled={!routineName}
                        className="px-3 py-1.5 bg-[#CFAFA3] text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        Add Routine
                      </button>
                    </div>
                  </div>
                )}

                {selectedPlan.routines.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No routines yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPlan.routines.map((routine) => (
                      <div key={routine.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{routine.routine_name}</p>
                          {routine.routine_type && <span className="text-xs text-[#CFAFA3]">{routine.routine_type}</span>}
                        </div>
                        <button
                          onClick={async () => {
                            await treatmentPlans.deleteRoutine(routine.id);
                            const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
                            if (updated) setSelectedPlan(updated);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#CFAFA3]" />
                    Scheduled Appointments ({selectedPlan.appointments.length})
                  </h4>
                  <button
                    onClick={() => setShowAddAppointment(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {showAddAppointment && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Appointment type *"
                      />
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <select
                        value={appointmentDuration}
                        onChange={(e) => setAppointmentDuration(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
                      placeholder="Notes"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddAppointment(false)} className="px-3 py-1.5 text-gray-600 text-sm">Cancel</button>
                      <button
                        onClick={handleAddAppointment}
                        disabled={!appointmentType || !appointmentDate}
                        className="px-3 py-1.5 bg-[#CFAFA3] text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                )}

                {selectedPlan.appointments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No appointments scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPlan.appointments.map((apt) => (
                      <div key={apt.id} className={`flex items-center gap-3 p-3 rounded-xl border ${apt.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                        <button
                          onClick={async () => {
                            await treatmentPlans.updateAppointment(apt.id, { completed: !apt.completed });
                            const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
                            if (updated) setSelectedPlan(updated);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${apt.completed ? 'bg-green-500 text-white' : 'border-2 border-gray-300'}`}
                        >
                          {apt.completed && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${apt.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>{apt.appointment_type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(apt.scheduled_date).toLocaleDateString()}
                            {apt.scheduled_time && ` at ${apt.scheduled_time}`}
                            {` • ${apt.duration_minutes} min`}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            await treatmentPlans.deleteAppointment(apt.id);
                            const updated = treatmentPlans.plans.find(p => p.id === selectedPlan.id);
                            if (updated) setSelectedPlan(updated);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentPlanManager;
