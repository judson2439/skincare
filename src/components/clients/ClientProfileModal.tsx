import React, { useState, useEffect } from 'react';
import { useSkinAnalysis, SkinAnalysis } from '@/hooks/useSkinAnalysis';
import { useClientNotes } from '@/hooks/useClientNotes';
import { useRoutineManagement, RoutineWithSteps, RoutineAssignment } from '@/hooks/useRoutineManagement';
import { useClientProducts, ClientProduct, PRODUCT_CATEGORIES } from '@/hooks/useClientProducts';
import { useTreatmentPlans, TreatmentPlan } from '@/hooks/useTreatmentPlans';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  User,
  Mail,
  Phone,
  Droplets,
  AlertCircle,
  Calendar,
  Flame,
  Trophy,
  Medal,
  Crown,
  Star,
  Check,
  Clock,
  Camera,
  Edit,
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Target,
  Zap,
  Sparkles,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronDown,
  BarChart3,
  ScanFace,
  Award,
  History,
  Plus,
  Trash2,
  Sun,
  Moon,
  Package,
  ShoppingBag,
  Filter,
  Image as ImageIcon,
  ClipboardList,
  Flag,
  Play,
  Pause
} from 'lucide-react';

// Types
interface ClientProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone?: string;
  skin_type?: string;
  concerns?: string[];
}

interface ClientStats {
  current_streak: number;
  longest_streak: number;
  points: number;
  level: string;
  total_routines_completed: number;
  compliance_rate: number;
}

interface AssignedRoutineDisplay {
  id: string;
  routine_id: string;
  routine_name: string;
  schedule_type: string;
  assigned_at: string;
  is_active: boolean;
  completion_rate: number;
  last_completed?: string;
  steps: {
    id: string;
    step_order: number;
    product_name: string;
    product_type: string | null;
    instructions: string | null;
  }[];
  professional_notes?: string | null;
}

interface Badge {
  id: string;
  badge_name: string;
  badge_description: string;
  earned_at: string;
}

interface PhotoRecord {
  id: string;
  photo_url: string;
  photo_type: string;
  title?: string;
  taken_at: string;
}

interface ClientProfileModalProps {
  client: ClientProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedClient: ClientProfile) => void;
}

// Award Levels
const AWARD_LEVELS = [
  { name: 'Bronze', minPoints: 0, color: 'from-amber-600 to-amber-700', icon: Medal },
  { name: 'Silver', minPoints: 500, color: 'from-gray-400 to-gray-500', icon: Medal },
  { name: 'Gold', minPoints: 1500, color: 'from-yellow-400 to-amber-500', icon: Crown },
  { name: 'Platinum', minPoints: 3000, color: 'from-cyan-300 to-blue-400', icon: Crown },
  { name: 'Diamond', minPoints: 5000, color: 'from-purple-400 to-pink-500', icon: Trophy },
];

const SKIN_TYPES = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
const COMMON_CONCERNS = [
  'Acne', 'Hyperpigmentation', 'Dark spots', 'Fine lines', 'Wrinkles',
  'Dehydration', 'Redness', 'Texture', 'Large pores', 'Uneven tone',
  'Acne scars', 'Dullness', 'Sun damage', 'Melasma'
];

const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  client,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { toast } = useToast();
  const skinAnalysis = useSkinAnalysis();
  const clientNotes = useClientNotes();
  const routineManagement = useRoutineManagement();
  const clientProducts = useClientProducts();
  const treatmentPlans = useTreatmentPlans();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'products' | 'treatment-plans' | 'photos' | 'analysis' | 'notes'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<ClientProfile>(client);
  const [saving, setSaving] = useState(false);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [assignedRoutines, setAssignedRoutines] = useState<AssignedRoutineDisplay[]>([]);
  const [clientPhotos, setClientPhotos] = useState<PhotoRecord[]>([]);
  const [clientAnalyses, setClientAnalyses] = useState<SkinAnalysis[]>([]);
  const [clientBadges, setClientBadges] = useState<Badge[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
  // Client products state
  const [clientProductsList, setClientProductsList] = useState<ClientProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Get notes for this client
  const notes = clientNotes.getNotesForClient(client.id);
  
  // Get treatment plans for this client
  const clientTreatmentPlans = treatmentPlans.getClientPlans(client.id);

  // Reset state when client changes
  useEffect(() => {
    setEditedClient(client);
    setActiveTab('overview');
    setIsEditing(false);
    setExpandedRoutine(null);
    setExpandedPlan(null);
    setClientProductsList([]);
    setProductCategoryFilter('all');
  }, [client.id]);

  // Fetch client data including routines
  useEffect(() => {
    if (isOpen && client.id && !routineManagement.loading) {
      fetchClientData();
    }
  }, [isOpen, client.id, routineManagement.loading, routineManagement.assignments, routineManagement.routines]);

  // Fetch client products when products tab is selected
  useEffect(() => {
    if (isOpen && client.id && activeTab === 'products') {
      fetchClientProductsData();
    }
  }, [isOpen, client.id, activeTab]);

  const fetchClientProductsData = async () => {
    setLoadingProducts(true);
    try {
      const result = await clientProducts.fetchClientProducts(client.id);
      if (result.success && result.products) {
        setClientProductsList(result.products);
      }
    } catch (error) {
      console.error('Error fetching client products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchClientData = async () => {
    setLoadingData(true);
    try {
      // Fetch skin analyses for this client
      const analyses = await skinAnalysis.getClientAnalyses(client.id);
      setClientAnalyses(analyses);

      // Get assigned routines for this client from the routine management hook
      const clientAssignments = routineManagement.getClientAssignments(client.id);
      
      // Map assignments to display format with full routine details
      const routinesWithDetails: AssignedRoutineDisplay[] = clientAssignments.map(assignment => {
        const routine = routineManagement.routines.find(r => r.id === assignment.routine_id);
        return {
          id: assignment.id,
          routine_id: assignment.routine_id,
          routine_name: routine?.name || 'Unknown Routine',
          schedule_type: routine?.schedule_type || 'daily',
          assigned_at: assignment.assigned_at,
          is_active: assignment.is_active,
          completion_rate: 0, // Would need to calculate from completion logs
          steps: routine?.steps || [],
          professional_notes: assignment.notes
        };
      });

      setAssignedRoutines(routinesWithDetails);

      // For now, set mock stats - in production these would come from the database
      setClientStats({
        current_streak: 0,
        longest_streak: 0,
        points: 0,
        level: 'Bronze',
        total_routines_completed: 0,
        compliance_rate: 0
      });


    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoadingData(false);
    }
  };


  // Handle save client edits
  const handleSaveClient = async () => {
    setSaving(true);
    try {
      // In production, this would update the database
      if (onUpdate) {
        onUpdate(editedClient);
      }
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Client profile updated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update client',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const result = await clientNotes.addNote(client.id, newNote);
      if (result.success) {
        setNewNote('');
        toast({
          title: 'Success',
          description: 'Note added successfully'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add note',
        variant: 'destructive'
      });
    } finally {
      setAddingNote(false);
    }
  };

  // Get current level info
  const getCurrentLevel = (points: number) => {
    for (let i = AWARD_LEVELS.length - 1; i >= 0; i--) {
      if (points >= AWARD_LEVELS[i].minPoints) {
        return { current: AWARD_LEVELS[i], next: AWARD_LEVELS[i + 1] || null };
      }
    }
    return { current: AWARD_LEVELS[0], next: AWARD_LEVELS[1] };
  };

  // Get score level for skin analysis
  const getScoreLevel = (score: number | null): 'low' | 'moderate' | 'high' => {
    if (score === null) return 'low';
    if (score < 30) return 'low';
    if (score < 60) return 'moderate';
    return 'high';
  };

  const getScoreColor = (score: number | null): string => {
    const level = getScoreLevel(score);
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-amber-600 bg-amber-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  // Get schedule icon
  const getScheduleIcon = (scheduleType: string) => {
    switch (scheduleType) {
      case 'morning': return Sun;
      case 'evening': return Moon;
      default: return Clock;
    }
  };

  // Get schedule label
  const getScheduleLabel = (scheduleType: string) => {
    switch (scheduleType) {
      case 'morning': return 'Morning';
      case 'evening': return 'Evening';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return scheduleType;
    }
  };

  // Treatment plan helpers
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
      case 'essential': return 'bg-red-100 text-red-700 border-red-200';
      case 'recommended': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'optional': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Filter products by category
  const filteredProducts = productCategoryFilter === 'all' 
    ? clientProductsList 
    : clientProductsList.filter(p => p.category === productCategoryFilter);

  // Get unique categories from client's products
  const productCategories = [...new Set(clientProductsList.map(p => p.category).filter(Boolean))];

  if (!isOpen) return null;

  const levelInfo = clientStats ? getCurrentLevel(clientStats.points) : getCurrentLevel(0);
  const latestAnalysis = clientAnalyses[0] || null;
  
  // Get active and completed treatment plans
  const activePlans = clientTreatmentPlans.filter(p => p.status === 'active');
  const completedPlans = clientTreatmentPlans.filter(p => p.status === 'completed');

  // Products Summary Component for Overview tab
  const ProductsSummarySection = () => {
    if (clientProductsList.length === 0 && !loadingProducts) {
      return (
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-[#CFAFA3]" />
            Client's Products
          </h3>
          <div className="text-center py-4">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No products added yet</p>
            <p className="text-xs text-gray-400 mt-1">Client hasn't added any products to their collection</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#CFAFA3]" />
            Client's Products
          </h3>
          <span className="px-2 py-0.5 bg-[#CFAFA3]/20 text-[#CFAFA3] text-xs font-medium rounded-full">
            {clientProductsList.length} products
          </span>
        </div>
        
        {loadingProducts ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-[#CFAFA3] animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {clientProductsList.slice(0, 4).map(product => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-lg p-3 border border-gray-100"
                >
                  <div className="flex items-start gap-2">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                      {product.brand && (
                        <p className="text-xs text-[#CFAFA3] truncate">{product.brand}</p>
                      )}
                      {product.category && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {clientProductsList.length > 4 && (
              <p className="text-xs text-gray-500 text-center mb-2">
                +{clientProductsList.length - 4} more products
              </p>
            )}
            
            <button
              onClick={() => setActiveTab('products')}
              className="w-full py-2 text-sm text-[#CFAFA3] hover:text-[#B89A8E] font-medium flex items-center justify-center gap-1"
            >
              View all products
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    );
  };

  // Routine Summary Component for Overview tab
  const RoutineSummarySection = () => {
    if (assignedRoutines.length === 0) {
      return (
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#CFAFA3]" />
            Assigned Routines
          </h3>
          <div className="text-center py-4">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No routines assigned yet</p>
            <button
              onClick={() => setActiveTab('routines')}
              className="mt-2 text-sm text-[#CFAFA3] hover:text-[#B89A8E] font-medium"
            >
              Assign a routine
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#CFAFA3]" />
            Assigned Routines
          </h3>
          <span className="px-2 py-0.5 bg-[#CFAFA3]/20 text-[#CFAFA3] text-xs font-medium rounded-full">
            {assignedRoutines.length} active
          </span>
        </div>
        
        <div className="space-y-3">
          {assignedRoutines.map(routine => {
            const ScheduleIcon = getScheduleIcon(routine.schedule_type);
            return (
              <div 
                key={routine.id} 
                className="bg-white rounded-lg p-4 border border-gray-100 hover:border-[#CFAFA3]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      routine.schedule_type === 'morning' ? 'bg-amber-100' :
                      routine.schedule_type === 'evening' ? 'bg-indigo-100' :
                      'bg-[#CFAFA3]/20'
                    }`}>
                      <ScheduleIcon className={`w-4 h-4 ${
                        routine.schedule_type === 'morning' ? 'text-amber-600' :
                        routine.schedule_type === 'evening' ? 'text-indigo-600' :
                        'text-[#CFAFA3]'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{routine.routine_name}</h4>
                      <p className="text-xs text-gray-500">{getScheduleLabel(routine.schedule_type)} Routine</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                
                {/* Quick view of steps */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">{routine.steps.length} steps:</p>
                  <div className="flex flex-wrap gap-1">
                    {routine.steps.slice(0, 4).map((step, idx) => (
                      <span 
                        key={step.id} 
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {step.product_name}
                      </span>
                    ))}
                    {routine.steps.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                        +{routine.steps.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <button
          onClick={() => setActiveTab('routines')}
          className="mt-3 w-full py-2 text-sm text-[#CFAFA3] hover:text-[#B89A8E] font-medium flex items-center justify-center gap-1"
        >
          View all routine details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Treatment Plans Summary Component for Overview tab
  const TreatmentPlansSummarySection = () => {
    if (clientTreatmentPlans.length === 0) {
      return (
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-[#CFAFA3]" />
            Treatment Plans
          </h3>
          <div className="text-center py-4">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No treatment plans yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a treatment plan for this client</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#CFAFA3]" />
            Treatment Plans
          </h3>
          <span className="px-2 py-0.5 bg-[#CFAFA3]/20 text-[#CFAFA3] text-xs font-medium rounded-full">
            {activePlans.length} active
          </span>
        </div>
        
        <div className="space-y-3">
          {activePlans.slice(0, 2).map(plan => {
            const progress = treatmentPlans.getPlanProgress(plan);
            return (
              <div 
                key={plan.id} 
                className="bg-white rounded-lg p-4 border border-gray-100 hover:border-[#CFAFA3]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{plan.title}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
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
                
                {/* Quick stats */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                  <span>{progress.completedMilestones}/{progress.totalMilestones} milestones</span>
                  <span>{plan.products.length} products</span>
                  <span>{progress.daysRemaining} days left</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {clientTreatmentPlans.length > 2 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            +{clientTreatmentPlans.length - 2} more plans
          </p>
        )}
        
        <button
          onClick={() => setActiveTab('treatment-plans')}
          className="mt-3 w-full py-2 text-sm text-[#CFAFA3] hover:text-[#B89A8E] font-medium flex items-center justify-center gap-1"
        >
          View all treatment plans
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              {client.avatar_url ? (
                <img
                  src={client.avatar_url}
                  alt={client.full_name || 'Client'}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                  <User className="w-8 h-8 text-[#2D2A3E]" />
                </div>
              )}
              {clientStats && (
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${levelInfo.current.color} flex items-center justify-center`}>
                  <levelInfo.current.icon className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900">
                {client.full_name || 'Unknown Client'}
              </h2>
              <p className="text-sm text-gray-500">{client.email}</p>
              {clientStats && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${levelInfo.current.color} text-white`}>
                    {clientStats.level}
                  </span>
                  <span className="text-xs text-gray-400">{clientStats.points} points</span>
                  {assignedRoutines.length > 0 && (
                    <span className="text-xs text-gray-400">
                      • {assignedRoutines.length} routine{assignedRoutines.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {clientProductsList.length > 0 && (
                    <span className="text-xs text-gray-400">
                      • {clientProductsList.length} product{clientProductsList.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {clientTreatmentPlans.length > 0 && (
                    <span className="text-xs text-gray-400">
                      • {clientTreatmentPlans.length} plan{clientTreatmentPlans.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
            ) : (
              <button
                onClick={handleSaveClient}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-xl hover:bg-[#B89A8E] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'routines', label: 'Routines', icon: Clock, count: assignedRoutines.length },
            { id: 'products', label: 'Products', icon: ShoppingBag, count: clientProductsList.length },
            { id: 'treatment-plans', label: 'Treatment Plans', icon: ClipboardList, count: clientTreatmentPlans.length },
            { id: 'photos', label: 'Photos', icon: Camera },
            { id: 'analysis', label: 'Skin Analysis', icon: ScanFace },
            { id: 'notes', label: 'Notes', icon: FileText, count: notes.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#CFAFA3] text-[#CFAFA3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 bg-[#CFAFA3]/20 text-[#CFAFA3] text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Client Info Section */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#CFAFA3]" />
                        Client Information
                      </h3>
                    </div>
                    
                    {isEditing ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editedClient.full_name || ''}
                            onChange={(e) => setEditedClient({ ...editedClient, full_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={editedClient.phone || ''}
                            onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Skin Type</label>
                          <select
                            value={editedClient.skin_type || ''}
                            onChange={(e) => setEditedClient({ ...editedClient, skin_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                          >
                            <option value="">Select skin type...</option>
                            {SKIN_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Concerns</label>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {COMMON_CONCERNS.map(concern => (
                              <button
                                key={concern}
                                onClick={() => {
                                  const concerns = editedClient.concerns || [];
                                  if (concerns.includes(concern)) {
                                    setEditedClient({ ...editedClient, concerns: concerns.filter(c => c !== concern) });
                                  } else {
                                    setEditedClient({ ...editedClient, concerns: [...concerns, concern] });
                                  }
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  (editedClient.concerns || []).includes(concern)
                                    ? 'bg-[#CFAFA3] text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {concern}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-medium text-gray-900">{client.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Droplets className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Skin Type</p>
                            <p className="text-sm font-medium text-gray-900">{client.skin_type || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Concerns</p>
                            {client.concerns && client.concerns.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {client.concerns.map((concern, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-xs rounded-full">
                                    {concern}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-gray-900">None specified</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Treatment Plans Summary Section - NEW */}
                  <TreatmentPlansSummarySection />

                  {/* Products Summary Section */}
                  <ProductsSummarySection />

                  {/* Routine Summary Section */}
                  <RoutineSummarySection />

                  {/* Stats Section */}
                  {clientStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Flame className="w-4 h-4 text-orange-500" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{clientStats.current_streak}</p>
                        <p className="text-xs text-gray-500">Current Streak</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-purple-600" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{clientStats.longest_streak}</p>
                        <p className="text-xs text-gray-500">Longest Streak</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{clientStats.total_routines_completed}</p>
                        <p className="text-xs text-gray-500">Routines Done</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-[#CFAFA3]" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{clientStats.compliance_rate}%</p>
                        <p className="text-xs text-gray-500">Compliance</p>
                      </div>
                    </div>
                  )}

                  {/* Level Progress */}
                  {clientStats && (
                    <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-xl p-5 text-white">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${levelInfo.current.color} flex items-center justify-center`}>
                          <levelInfo.current.icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Current Level</p>
                          <h3 className="text-2xl font-bold">{clientStats.level}</h3>
                          <p className="text-white/80 text-sm">{clientStats.points} points</p>
                        </div>
                      </div>
                      {levelInfo.next && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/60">Progress to {levelInfo.next.name}</span>
                            <span className="text-white">{levelInfo.next.minPoints - clientStats.points} pts to go</span>
                          </div>
                          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#E8D5D0] rounded-full"
                              style={{ width: `${((clientStats.points - levelInfo.current.minPoints) / (levelInfo.next.minPoints - levelInfo.current.minPoints)) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badges */}
                  {clientBadges.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                        <Award className="w-4 h-4 text-[#CFAFA3]" />
                        Earned Badges
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {clientBadges.map(badge => (
                          <div key={badge.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                            <Star className="w-4 h-4 text-amber-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{badge.badge_name}</p>
                              <p className="text-xs text-gray-500">{new Date(badge.earned_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Routines Tab - ENHANCED */}
              {activeTab === 'routines' && (
                <div className="space-y-4">
                  {assignedRoutines.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Routines Assigned</h3>
                      <p className="text-gray-500 text-sm mb-4">Assign a routine to this client to track their progress</p>
                      <p className="text-xs text-gray-400">
                        Go to the Routines section to create and assign routines
                      </p>
                    </div>
                  ) : (
                    assignedRoutines.map(routine => {
                      const ScheduleIcon = getScheduleIcon(routine.schedule_type);
                      const isExpanded = expandedRoutine === routine.id;
                      
                      return (
                        <div key={routine.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                          {/* Routine Header */}
                          <div 
                            className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  routine.schedule_type === 'morning' ? 'bg-amber-100' :
                                  routine.schedule_type === 'evening' ? 'bg-indigo-100' :
                                  'bg-[#CFAFA3]/20'
                                }`}>
                                  <ScheduleIcon className={`w-5 h-5 ${
                                    routine.schedule_type === 'morning' ? 'text-amber-600' :
                                    routine.schedule_type === 'evening' ? 'text-indigo-600' :
                                    'text-[#CFAFA3]'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{routine.routine_name}</h4>
                                  <p className="text-sm text-gray-500">{getScheduleLabel(routine.schedule_type)} Routine • {routine.steps.length} steps</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  routine.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {routine.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            
                            {/* Assigned date */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Assigned {new Date(routine.assigned_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              {routine.professional_notes && (
                                <span className="text-xs text-[#CFAFA3] flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  Has notes
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded Content - Steps */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50 p-5">
                              {/* Professional Notes */}
                              {routine.professional_notes && (
                                <div className="mb-4 p-3 bg-[#CFAFA3]/10 rounded-lg border border-[#CFAFA3]/20">
                                  <p className="text-xs text-[#CFAFA3] font-medium mb-1">Professional Notes</p>
                                  <p className="text-sm text-gray-700">{routine.professional_notes}</p>
                                </div>
                              )}
                              
                              {/* Steps List */}
                              <h5 className="text-sm font-medium text-gray-700 mb-3">Routine Steps</h5>
                              <div className="space-y-2">
                                {routine.steps.map((step, idx) => (
                                  <div 
                                    key={step.id} 
                                    className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-[#CFAFA3] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                                      {step.step_order}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 text-sm">{step.product_name}</span>
                                        {step.product_type && (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            {step.product_type}
                                          </span>
                                        )}
                                      </div>
                                      {step.instructions && (
                                        <p className="text-xs text-gray-500 mt-1">{step.instructions}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Header with filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Client's Products</h3>
                      <p className="text-sm text-gray-500">Products {client.full_name || 'this client'} is currently using</p>
                    </div>
                    {productCategories.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                          value={productCategoryFilter}
                          onChange={(e) => setProductCategoryFilter(e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                        >
                          <option value="all">All Categories</option>
                          {productCategories.map(cat => (
                            <option key={cat} value={cat!}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Loading State */}
                  {loadingProducts && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
                    </div>
                  )}

                  {/* Empty State */}
                  {!loadingProducts && clientProductsList.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Added</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        This client hasn't added any products to their collection yet. 
                        Once they add products, you'll be able to see them here.
                      </p>
                    </div>
                  )}

                  {/* Products Grid */}
                  {!loadingProducts && filteredProducts.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Product Image */}
                          <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                            {/* Added via badge */}
                            <div className="absolute top-3 left-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.added_via === 'photo'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-[#CFAFA3]/20 text-[#CFAFA3]'
                              }`}>
                                {product.added_via === 'photo' ? 'Photo' : 'Manual'}
                              </span>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            {product.brand && (
                              <p className="text-xs text-[#CFAFA3] font-medium mb-1">{product.brand}</p>
                            )}
                            <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">{product.name}</h4>
                            {product.category && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {product.category}
                              </span>
                            )}
                            {product.notes && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.notes}</p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                              <span className="text-xs text-gray-400">
                                Added {new Date(product.created_at).toLocaleDateString()}
                              </span>
                              {product.days_used > 0 && (
                                <span className="text-xs text-[#CFAFA3]">
                                  {product.days_used} days used
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No results after filter */}
                  {!loadingProducts && clientProductsList.length > 0 && filteredProducts.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No products found in this category</p>
                      <button
                        onClick={() => setProductCategoryFilter('all')}
                        className="mt-2 text-sm text-[#CFAFA3] hover:text-[#B89A8E] font-medium"
                      >
                        Show all products
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Treatment Plans Tab - NEW */}
              {activeTab === 'treatment-plans' && (
                <div className="space-y-6">
                  {/* Loading State */}
                  {treatmentPlans.loading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
                    </div>
                  )}

                  {/* Empty State */}
                  {!treatmentPlans.loading && clientTreatmentPlans.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Treatment Plans</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Create a personalized treatment plan for this client to track their skincare journey.
                      </p>
                    </div>
                  )}

                  {/* Active Plans */}
                  {!treatmentPlans.loading && activePlans.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Play className="w-5 h-5 text-green-600" />
                        Active Plans ({activePlans.length})
                      </h3>
                      <div className="space-y-4">
                        {activePlans.map((plan) => {
                          const progress = treatmentPlans.getPlanProgress(plan);
                          const isExpanded = expandedPlan === plan.id;

                          return (
                            <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              {/* Plan Header */}
                              <div
                                onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-serif font-bold text-lg text-gray-900">{plan.title}</h4>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                                        Active
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>

                                {/* Progress Overview */}
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                  <div className="text-center">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#CFAFA3] to-[#B89A8E] flex items-center justify-center mb-1">
                                      <span className="text-lg font-bold text-white">{progress.overallProgress}%</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Overall</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-1">
                                      <span className="text-lg font-bold text-purple-600">{progress.completedMilestones}/{progress.totalMilestones}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Milestones</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-1">
                                      <span className="text-lg font-bold text-blue-600">{plan.products.length}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Products</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-1">
                                      <span className="text-lg font-bold text-amber-600">{progress.daysRemaining}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Days Left</p>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-medium text-[#CFAFA3]">{progress.overallProgress}%</span>
                                  </div>
                                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] rounded-full transition-all"
                                      style={{ width: `${progress.overallProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="border-t border-gray-100 p-6 space-y-6 bg-gray-50/50">
                                  {/* Description & Goals */}
                                  {(plan.description || plan.goals.length > 0) && (
                                    <div>
                                      {plan.description && (
                                        <p className="text-gray-600 mb-3">{plan.description}</p>
                                      )}
                                      {plan.goals.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                            <Target className="w-4 h-4 text-[#CFAFA3]" /> Goals
                                          </h5>
                                          <div className="flex flex-wrap gap-2">
                                            {plan.goals.map((goal, idx) => (
                                              <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#CFAFA3] rounded-full text-sm border border-[#CFAFA3]/20">
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
                                  {plan.milestones.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                                        <Flag className="w-4 h-4 text-[#CFAFA3]" /> Milestones
                                      </h5>
                                      <div className="space-y-2">
                                        {plan.milestones.map((milestone) => (
                                          <div
                                            key={milestone.id}
                                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                              milestone.completed 
                                                ? 'bg-green-50 border-green-200' 
                                                : 'bg-white border-gray-100'
                                            }`}
                                          >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                              milestone.completed 
                                                ? 'bg-green-500 text-white' 
                                                : 'border-2 border-gray-300'
                                            }`}>
                                              {milestone.completed && <Check className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                              <p className={`font-medium ${milestone.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                                                {milestone.title}
                                              </p>
                                              {milestone.description && (
                                                <p className="text-sm text-gray-500">{milestone.description}</p>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm text-gray-500">
                                                {new Date(milestone.target_date).toLocaleDateString()}
                                              </p>
                                              {milestone.completed && milestone.completed_at && (
                                                <p className="text-xs text-green-600">
                                                  Completed {new Date(milestone.completed_at).toLocaleDateString()}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Products */}
                                  {plan.products.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                                        <Package className="w-4 h-4 text-[#CFAFA3]" /> Recommended Products
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {plan.products.map((product) => (
                                          <div key={product.id} className={`p-4 rounded-xl border ${getPriorityColor(product.priority)}`}>
                                            <div className="flex items-start justify-between mb-2">
                                              <div>
                                                <p className="font-medium text-gray-900">{product.product_name}</p>
                                                {product.product_brand && (
                                                  <p className="text-xs text-gray-500">{product.product_brand}</p>
                                                )}
                                              </div>
                                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                                product.priority === 'essential' ? 'bg-red-200 text-red-800' :
                                                product.priority === 'recommended' ? 'bg-blue-200 text-blue-800' :
                                                'bg-gray-200 text-gray-700'
                                              }`}>
                                                {product.priority}
                                              </span>
                                            </div>
                                            {product.product_category && (
                                              <span className="inline-block px-2 py-0.5 bg-white/50 rounded text-xs text-gray-600 mb-2">
                                                {product.product_category}
                                              </span>
                                            )}
                                            {product.usage_instructions && (
                                              <p className="text-sm text-gray-600">{product.usage_instructions}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Routines */}
                                  {plan.routines.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-[#CFAFA3]" /> Assigned Routines
                                      </h5>
                                      <div className="space-y-2">
                                        {plan.routines.map((routine) => (
                                          <div key={routine.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/10 flex items-center justify-center">
                                              <Clock className="w-5 h-5 text-[#CFAFA3]" />
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-900">{routine.routine_name}</p>
                                              {routine.routine_type && (
                                                <span className="text-xs text-[#CFAFA3] capitalize">{routine.routine_type}</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Appointments */}
                                  {plan.appointments.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-[#CFAFA3]" /> Scheduled Appointments
                                      </h5>
                                      <div className="space-y-2">
                                        {plan.appointments.map((apt) => (
                                          <div
                                            key={apt.id}
                                            className={`flex items-center gap-3 p-4 rounded-xl border ${
                                              apt.completed 
                                                ? 'bg-green-50 border-green-200' 
                                                : new Date(apt.scheduled_date) < new Date() 
                                                  ? 'bg-red-50 border-red-200'
                                                  : 'bg-white border-gray-100'
                                            }`}
                                          >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                              apt.completed 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-[#CFAFA3]/10'
                                            }`}>
                                              {apt.completed ? (
                                                <Check className="w-5 h-5" />
                                              ) : (
                                                <Calendar className="w-5 h-5 text-[#CFAFA3]" />
                                              )}
                                            </div>
                                            <div className="flex-1">
                                              <p className={`font-medium ${apt.completed ? 'text-green-700' : 'text-gray-900'}`}>
                                                {apt.appointment_type}
                                              </p>
                                              <p className="text-sm text-gray-500">
                                                {new Date(apt.scheduled_date).toLocaleDateString('en-US', { 
                                                  weekday: 'long', 
                                                  month: 'long', 
                                                  day: 'numeric' 
                                                })}
                                                {apt.scheduled_time && ` at ${apt.scheduled_time}`}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <span className="text-sm text-gray-500">{apt.duration_minutes} min</span>
                                              {apt.completed && (
                                                <p className="text-xs text-green-600">Completed</p>
                                              )}
                                              {!apt.completed && new Date(apt.scheduled_date) < new Date() && (
                                                <p className="text-xs text-red-600">Overdue</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {plan.notes && (
                                    <div className="p-4 bg-[#CFAFA3]/5 rounded-xl border border-[#CFAFA3]/20">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Professional Notes</h5>
                                      <p className="text-sm text-gray-600">{plan.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed Plans */}
                  {!treatmentPlans.loading && completedPlans.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Check className="w-5 h-5 text-blue-600" />
                        Completed Plans ({completedPlans.length})
                      </h3>
                      <div className="space-y-3">
                        {completedPlans.map((plan) => {
                          const progress = treatmentPlans.getPlanProgress(plan);

                          return (
                            <div
                              key={plan.id}
                              onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{plan.title}</h4>
                                    <p className="text-xs text-gray-500">
                                      Completed {new Date(plan.updated_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-blue-600">{progress.completedMilestones}/{progress.totalMilestones} milestones</p>
                                    <p className="text-xs text-gray-500">{progress.overallProgress}% completed</p>
                                  </div>
                                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedPlan === plan.id ? 'rotate-90' : ''}`} />
                                </div>
                              </div>

                              {/* Expanded view for completed plans */}
                              {expandedPlan === plan.id && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  {plan.goals.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Achieved Goals</p>
                                      <div className="flex flex-wrap gap-2">
                                        {plan.goals.map((goal, idx) => (
                                          <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                                            <Check className="w-3 h-3" />
                                            {goal}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <p className="text-sm text-gray-500">
                                    Duration: {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  {clientPhotos.length === 0 ? (
                    <div className="text-center py-12">
                      <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Progress Photos</h3>
                      <p className="text-gray-500 text-sm">Client hasn't uploaded any progress photos yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {clientPhotos.map(photo => (
                        <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                          <img
                            src={photo.photo_url}
                            alt={photo.title || 'Progress photo'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                photo.photo_type === 'before' ? 'bg-blue-500 text-white' :
                                photo.photo_type === 'after' ? 'bg-green-500 text-white' :
                                'bg-purple-500 text-white'
                              }`}>
                                {photo.photo_type}
                              </span>
                              <p className="text-white text-xs mt-1">
                                {new Date(photo.taken_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Skin Analysis Tab - SkinAura AI Integration */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {clientAnalyses.length === 0 ? (
                    <div className="text-center py-12">
                      <ScanFace className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Skin Analyses</h3>
                      <p className="text-gray-500 text-sm">Client hasn't completed any skin scans yet</p>
                    </div>

                  ) : (
                    <>
                      {/* Latest Analysis */}
                      {latestAnalysis && (
                        <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6 text-white">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-white/60 text-sm">Latest Skin Analysis</p>
                              <p className="text-xs text-white/40">
                                {new Date(latestAnalysis.created_at).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <ScanFace className="w-5 h-5 text-[#CFAFA3]" />
                              <span className="text-xs text-white/60">SkinAura AI</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-white/60 text-sm">Overall Score</p>
                              <p className="text-4xl font-bold">{latestAnalysis.overall_score ?? 'N/A'}</p>
                            </div>
                            {latestAnalysis.skin_age && (
                              <div>
                                <p className="text-white/60 text-sm">Estimated Skin Age</p>
                                <p className="text-4xl font-bold">{latestAnalysis.skin_age} <span className="text-lg font-normal">years</span></p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}


                      {/* Score Grid */}
                      {latestAnalysis && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { key: 'dark_circle_score', label: 'Dark Circles', icon: Eye },
                            { key: 'eye_bag_score', label: 'Eye Bags', icon: Eye },
                            { key: 'wrinkles_score', label: 'Wrinkles', icon: Target },
                            { key: 'acnes_score', label: 'Acne', icon: AlertCircle },
                            { key: 'pores_score', label: 'Pores', icon: Zap },
                            { key: 'pigment_score', label: 'Pigmentation', icon: Sparkles },
                            { key: 'eye_wrinkles_score', label: 'Eye Wrinkles', icon: Eye },
                            { key: 'deep_wrinkles_score', label: 'Deep Wrinkles', icon: Target },
                          ].map(({ key, label, icon: Icon }) => {
                            const score = (latestAnalysis as any)[key];
                            const level = getScoreLevel(score);
                            const colorClass = getScoreColor(score);
                            
                            return (
                              <div key={key} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
                                    {level}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{label}</p>
                                <div className="flex items-end gap-1">
                                  <span className="text-xl font-bold text-gray-900">{score ?? 'N/A'}</span>
                                  <span className="text-xs text-gray-400 mb-0.5">/100</span>
                                </div>
                                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      level === 'low' ? 'bg-green-500' :
                                      level === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${score ?? 0}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Recommendations */}
                      {latestAnalysis?.recommendations && latestAnalysis.recommendations.length > 0 && (
                        <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl p-5 border border-[#CFAFA3]/20">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-[#CFAFA3]" />
                            AI Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {latestAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <div className="w-5 h-5 rounded-full bg-[#CFAFA3] text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                  {idx + 1}
                                </div>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Analysis History */}
                      {clientAnalyses.length > 1 && (
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                            <History className="w-4 h-4 text-gray-400" />
                            Analysis History
                          </h4>
                          <div className="space-y-2">
                            {clientAnalyses.slice(1).map((analysis, idx) => (
                              <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
                                    <ScanFace className="w-5 h-5 text-[#CFAFA3]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Scan #{clientAnalyses.length - idx - 1}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(analysis.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-[#CFAFA3]">{analysis.overall_score ?? 'N/A'}</p>
                                  <p className="text-xs text-gray-500">Overall</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Add Note Form */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-3">Add Private Note</h4>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none mb-3"
                      rows={3}
                      placeholder="Add a private note about this client's treatment, progress, or concerns..."
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Note
                    </button>
                  </div>

                  {/* Notes List */}
                  {clientNotes.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Notes Yet</h3>
                      <p className="text-gray-500 text-sm">Add your first note about this client</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div key={note.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              Note
                            </span>
                            <button
                              onClick={async () => {
                                if (confirm('Delete this note?')) {
                                  const result = await clientNotes.deleteNote(note.id);
                                  if (result.success) {
                                    toast({ title: 'Note deleted' });
                                  }
                                }
                              }}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(note.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfileModal;
