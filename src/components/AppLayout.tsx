// AppLayout.tsx - Main application layout component
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientData } from '@/hooks/useClientData';
import { useRoutineManagement, RoutineWithSteps, RoutineStep as RoutineStepType } from '@/hooks/useRoutineManagement';
import { useClientRoutines } from '@/hooks/useClientRoutines';
import { useProgressPhotos, PhotoWithComments } from '@/hooks/useProgressPhotos';
import { useProductCatalog, Product as CatalogProduct, PRODUCT_CATEGORIES, SKIN_TYPES } from '@/hooks/useProductCatalog';
import { useChallenges, Challenge, ChallengeLeaderboardEntry } from '@/hooks/useChallenges';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { usePhotoAnnotations, AnnotationData, PhotoAnnotation } from '@/hooks/usePhotoAnnotations';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AuthModal from '@/components/auth/AuthModal';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import ChallengesLeaderboard from '@/components/challenges/ChallengesLeaderboard';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import ProgressReport from '@/components/reports/ProgressReport';
import DailySkinCheckin from '@/components/skincare/DailySkinCheckin';
import AppointmentBooking from '@/components/appointments/AppointmentBooking';
import ProfessionalCalendar from '@/components/appointments/ProfessionalCalendar';
import ImageMarkupEditor from '@/components/photos/ImageMarkupEditor';
import AnnotationViewer from '@/components/photos/AnnotationViewer';
import PhotoComparisonPage from '@/components/photos/PhotoComparisonPage';
import SkinScanWidget from '@/components/skincare/SkinScanWidget';
import ClientManagement from '@/components/clients/ClientManagement';
import ClientProfileModal from '@/components/clients/ClientProfileModal';
import MyProductsManager from '@/components/products/MyProductsManager';
import ProfessionalProductManager from '@/components/products/ProfessionalProductManager';
import TreatmentPlanManager from '@/components/treatments/TreatmentPlanManager';
import ClientTreatmentPlans from '@/components/treatments/ClientTreatmentPlans';
import ShopifyProductImport from '@/components/products/ShopifyProductImport';
import CSVProductImport from '@/components/products/CSVProductImport';
import ProfileSettings from '@/components/settings/ProfileSettings';









import {
  LayoutDashboard,
  Sun,
  Moon,
  Package,
  Users,
  Camera,
  TrendingUp,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  Check,
  ChevronRight,
  Calendar,
  Droplets,
  Sparkles,
  Clock,
  Star,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Filter,
  BarChart3,
  LineChart,
  ArrowUp,
  ArrowDown,
  Heart,
  LogOut,
  User,
  ChevronDown,
  ScanFace,
  ExternalLink,
  Trophy,
  Flame,
  Crown,
  Medal,
  Gift,
  MessageSquare,
  Phone,
  Send,
  AlertCircle,
  ShoppingCart,
  Award,
  Target,
  Loader2,
  ClipboardList,
  UserPlus,
  Save,
  ChevronUp,
  GripVertical,
  Image,
  ChevronLeft,
  ZoomIn,
  Link,
  Tag,
  DollarSign,
  FileText,
  Beaker,
  RefreshCw,
  Zap,
  HelpCircle
} from 'lucide-react';








// Image URLs
const HERO_IMAGE = "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765037141170_ed9df5c7.png";

const PRODUCT_IMAGES = [
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033408802_2d1509f6.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033411561_b97e0aea.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033412962_b8127b53.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033412387_ccd73225.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033417209_9bd4aead.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033417647_a2a93d40.png"
];
const PROFESSIONAL_IMAGES = [
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033435474_32ef7191.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033436777_504c9ebf.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033441800_eb47cebf.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033443305_aec15e45.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765491538297_6ee501d6.png"
];

const CLIENT_IMAGES = [
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033469330_78107091.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033460880_8c5e20c5.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033472779_08fb4b93.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033468079_20484702.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033471638_05f7651f.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033469659_af60252d.jpg"
];
const BADGE_IMAGES = [
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033498073_cb9c4bf4.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033498972_258a64f0.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033499876_b417affa.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033500485_210ff0ba.png"
];

// Types
interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  daysUsed: number;
  inRoutine: boolean;
  reorderPrompted: boolean;
}

interface Client {
  id: string;
  name: string;
  image: string;
  phone: string;
  email: string;
  skinType: string;
  concerns: string[];
  currentStreak: number;
  longestStreak: number;
  level: string;
  points: number;
  compliance: number;
  lastActive: string;
  routineCompletedToday: boolean;
}

interface RoutineStep {
  id: number;
  time: 'morning' | 'evening';
  step: number;
  product: string;
  productImage: string;
  completed: boolean;
  notes: string;
  daysUsed: number;
}

interface BadgeDisplay {
  id: number;
  name: string;
  description: string;
  image: string;
  earned: boolean;
  earnedDate?: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  streak: number;
  level: string;
}

// Award Levels
const AWARD_LEVELS = [
  { name: 'Bronze', minPoints: 0, color: 'from-amber-600 to-amber-700', icon: Medal },
  { name: 'Silver', minPoints: 500, color: 'from-gray-400 to-gray-500', icon: Medal },
  { name: 'Gold', minPoints: 1500, color: 'from-yellow-400 to-amber-500', icon: Crown },
  { name: 'Platinum', minPoints: 3000, color: 'from-cyan-300 to-blue-400', icon: Crown },
  { name: 'Diamond', minPoints: 5000, color: 'from-purple-400 to-pink-500', icon: Trophy },
];

// Badge definitions for display
const BADGE_DEFINITIONS: BadgeDisplay[] = [
  { id: 1, name: "First Step", description: "Complete your first routine", image: BADGE_IMAGES[0], earned: false },
  { id: 2, name: "Week Warrior", description: "Maintain a 7-day streak", image: BADGE_IMAGES[1], earned: false },
  { id: 3, name: "Consistency Queen", description: "Maintain a 14-day streak", image: BADGE_IMAGES[2], earned: false },
  { id: 4, name: "Skincare Devotee", description: "Maintain a 30-day streak", image: BADGE_IMAGES[3], earned: false },
  { id: 5, name: "Glow Getter", description: "Complete 50 routines", image: BADGE_IMAGES[0], earned: false },
  { id: 6, name: "Radiance Master", description: "Complete 100 routines", image: BADGE_IMAGES[1], earned: false },
];

// Leaderboard data (would come from database in production)
const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: "Tracy Davis", avatar: CLIENT_IMAGES[2], points: 3200, streak: 28, level: "Platinum" },
  { rank: 2, name: "Jasmine Williams", avatar: CLIENT_IMAGES[0], points: 1850, streak: 14, level: "Gold" },
  { rank: 3, name: "Nicole Brown", avatar: CLIENT_IMAGES[4], points: 890, streak: 7, level: "Silver" },
  { rank: 4, name: "Marie Johnson", avatar: CLIENT_IMAGES[1], points: 720, streak: 5, level: "Silver" },
  { rank: 5, name: "Keisha Martin", avatar: CLIENT_IMAGES[5], points: 420, streak: 3, level: "Bronze" },
  { rank: 6, name: "Ariel Thompson", avatar: CLIENT_IMAGES[3], points: 280, streak: 0, level: "Bronze" },
];

// Initial Data
const initialProducts: Product[] = [
  { id: 1, name: "Vitamin C Brightening Serum", brand: "SkinAura Essentials", category: "Serum", image: PRODUCT_IMAGES[0], daysUsed: 23, inRoutine: true, reorderPrompted: false },
  { id: 2, name: "Hyaluronic Acid Moisturizer", brand: "Glow Labs", category: "Moisturizer", image: PRODUCT_IMAGES[1], daysUsed: 18, inRoutine: true, reorderPrompted: false },
  { id: 3, name: "Retinol Night Treatment", brand: "SkinAura PRO", category: "Treatment", image: PRODUCT_IMAGES[2], daysUsed: 12, inRoutine: true, reorderPrompted: false },
  { id: 4, name: "Gentle Foaming Cleanser", brand: "Pure Radiance", category: "Cleanser", image: PRODUCT_IMAGES[3], daysUsed: 26, inRoutine: true, reorderPrompted: true },
  { id: 5, name: "SPF 50 Mineral Sunscreen", brand: "SkinAura Essentials", category: "Sunscreen", image: PRODUCT_IMAGES[4], daysUsed: 20, inRoutine: true, reorderPrompted: false },
  { id: 6, name: "Niacinamide Pore Refiner", brand: "Glow Labs", category: "Serum", image: PRODUCT_IMAGES[5], daysUsed: 8, inRoutine: false, reorderPrompted: false },
];

const initialClients: Client[] = [
  { id: '1', name: "Jasmine Williams", image: CLIENT_IMAGES[0], phone: "+1234567890", email: "jasmine@email.com", skinType: "Combination", concerns: ["Hyperpigmentation", "Texture"], currentStreak: 14, longestStreak: 21, level: "Gold", points: 1850, compliance: 92, lastActive: "2025-12-06", routineCompletedToday: true },
  { id: '2', name: "Marie Johnson", image: CLIENT_IMAGES[1], phone: "+1234567891", email: "marie@email.com", skinType: "Oily", concerns: ["Acne", "Dark spots"], currentStreak: 5, longestStreak: 12, level: "Silver", points: 720, compliance: 68, lastActive: "2025-12-05", routineCompletedToday: false },
  { id: '3', name: "Tracy Davis", image: CLIENT_IMAGES[2], phone: "+1234567892", email: "tracy@email.com", skinType: "Dry", concerns: ["Dehydration", "Fine lines"], currentStreak: 28, longestStreak: 28, level: "Platinum", points: 3200, compliance: 96, lastActive: "2025-12-06", routineCompletedToday: true },
  { id: '4', name: "Ariel Thompson", image: CLIENT_IMAGES[3], phone: "+1234567893", email: "ariel@email.com", skinType: "Normal", concerns: ["Maintenance", "Glow"], currentStreak: 0, longestStreak: 8, level: "Bronze", points: 280, compliance: 45, lastActive: "2025-12-02", routineCompletedToday: false },
  { id: '5', name: "Nicole Brown", image: CLIENT_IMAGES[4], phone: "+1234567894", email: "nicole@email.com", skinType: "Sensitive", concerns: ["Redness", "Irritation"], currentStreak: 7, longestStreak: 15, level: "Silver", points: 890, compliance: 78, lastActive: "2025-12-06", routineCompletedToday: true },
  { id: '6', name: "Keisha Martin", image: CLIENT_IMAGES[5], phone: "+1234567895", email: "keisha@email.com", skinType: "Combination", concerns: ["Acne scars", "Uneven tone"], currentStreak: 3, longestStreak: 10, level: "Bronze", points: 420, compliance: 55, lastActive: "2025-12-04", routineCompletedToday: false },
];

const createInitialRoutine = (): RoutineStep[] => [
  { id: 1, time: 'morning', step: 1, product: "Gentle Foaming Cleanser", productImage: PRODUCT_IMAGES[3], completed: false, notes: "Lukewarm water, massage for 60 seconds", daysUsed: 26 },
  { id: 2, time: 'morning', step: 2, product: "Vitamin C Brightening Serum", productImage: PRODUCT_IMAGES[0], completed: false, notes: "Wait 1 min before next step", daysUsed: 23 },
  { id: 3, time: 'morning', step: 3, product: "Hyaluronic Acid Moisturizer", productImage: PRODUCT_IMAGES[1], completed: false, notes: "Apply to damp skin", daysUsed: 18 },
  { id: 4, time: 'morning', step: 4, product: "SPF 50 Mineral Sunscreen", productImage: PRODUCT_IMAGES[4], completed: false, notes: "Reapply every 2 hours outdoors", daysUsed: 20 },
  { id: 5, time: 'evening', step: 1, product: "Gentle Foaming Cleanser", productImage: PRODUCT_IMAGES[3], completed: false, notes: "Double cleanse if wearing makeup", daysUsed: 26 },
  { id: 6, time: 'evening', step: 2, product: "Niacinamide Pore Refiner", productImage: PRODUCT_IMAGES[5], completed: false, notes: "Focus on T-zone", daysUsed: 8 },
  { id: 7, time: 'evening', step: 3, product: "Retinol Night Treatment", productImage: PRODUCT_IMAGES[2], completed: false, notes: "Start 2x weekly, build up", daysUsed: 12 },
  { id: 8, time: 'evening', step: 4, product: "Hyaluronic Acid Moisturizer", productImage: PRODUCT_IMAGES[1], completed: false, notes: "Seal in treatment", daysUsed: 18 },
];

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const { user, profile, loading: authLoading, isSessionValid, signOut, clearSessionAndRedirect, setUser, setProfile, setSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const clientData = useClientData();
  const routineManagement = useRoutineManagement();
  const clientRoutines = useClientRoutines();
  const progressPhotos = useProgressPhotos();
  const productCatalog = useProductCatalog();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Loading timeout state - prevents infinite loading spinner
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authModalRole, setAuthModalRole] = useState<'client' | 'professional' | undefined>(undefined);

  // Helper function to extract view from URL path
  const getViewFromPath = (pathname: string): string => {
    // Extract the view from paths like /professional/dashboard or /client/routine
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1]; // Returns 'dashboard', 'clients', 'routine', etc.
    }
    return 'dashboard'; // Default to dashboard
  };

  // View State - Initialize from URL path first, then localStorage as fallback
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      // First check URL path
      const viewFromPath = getViewFromPath(location.pathname);
      if (viewFromPath && viewFromPath !== 'dashboard') {
        return viewFromPath;
      }
      // Fallback to localStorage
      const savedView = localStorage.getItem('skinaurapro_active_view');
      return savedView || 'dashboard';
    }
    return 'dashboard';
  });
  
  // Sync activeView with URL path changes
  useEffect(() => {
    const viewFromPath = getViewFromPath(location.pathname);
    // Only update if we're on a valid sub-route (not just /professional or /client)
    if (location.pathname.includes('/professional/') || location.pathname.includes('/client/')) {
      if (viewFromPath !== activeView) {
        setActiveView(viewFromPath);
      }
    }
  }, [location.pathname]);
  
  // Persist activeView to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && activeView) {
      localStorage.setItem('skinaurapro_active_view', activeView);
    }
  }, [activeView]);

  // Helper function to navigate to a view
  const navigateToView = (viewId: string) => {
    const basePath = userRole === 'client' ? '/client' : '/professional';
    navigate(`${basePath}/${viewId}`);
    setActiveView(viewId);
    if (isMobile) toggleSidebar();
  };


  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [clients] = useState<Client[]>(initialClients);
  const [routine, setRoutine] = useState<RoutineStep[]>(createInitialRoutine());
  const [searchQuery, setSearchQuery] = useState('');
  const [routineTime, setRoutineTime] = useState<'morning' | 'evening'>('morning');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [selectedClientForSMS, setSelectedClientForSMS] = useState<Client | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null);
  const [completingRoutine, setCompletingRoutine] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const [showEditRoutineModal, setShowEditRoutineModal] = useState(false);
  const [showAssignRoutineModal, setShowAssignRoutineModal] = useState(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);

  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithSteps | null>(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDescription, setNewRoutineDescription] = useState('');
  const [newRoutineSchedule, setNewRoutineSchedule] = useState<'daily' | 'morning' | 'evening' | 'weekly'>('morning');
  const [newStepProduct, setNewStepProduct] = useState('');
  const [newStepType, setNewStepType] = useState('');
  const [newStepInstructions, setNewStepInstructions] = useState('');
  const [editingStep, setEditingStep] = useState<RoutineStepType | null>(null);
  const [selectedClientForAssign, setSelectedClientForAssign] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [savingRoutine, setSavingRoutine] = useState(false);

  // Progress Photos State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPhotoType, setUploadPhotoType] = useState<'before' | 'after' | 'progress'>('progress');
  const [uploadPhotoTitle, setUploadPhotoTitle] = useState('');
  const [uploadPhotoNotes, setUploadPhotoNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithComments | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedClientForPhotos, setSelectedClientForPhotos] = useState<string>('');
  const [showMarkupEditor, setShowMarkupEditor] = useState(false);
  const [photoSearchQuery, setPhotoSearchQuery] = useState(''); // Moved to top level to fix hooks error

  // Photo Annotations Hook (for selected photo)
  const photoAnnotations = usePhotoAnnotations(selectedPhoto?.id);



  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductIngredients, setNewProductIngredients] = useState('');
  const [newProductSkinTypes, setNewProductSkinTypes] = useState<string[]>([]);
  const [newProductInstructions, setNewProductInstructions] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductUrl, setNewProductUrl] = useState('');

  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState<string>('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFilter, setProductFilter] = useState('all');
  const [showRecommendProductModal, setShowRecommendProductModal] = useState(false);
  const [selectedClientForRecommend, setSelectedClientForRecommend] = useState('');
  const [recommendationNotes, setRecommendationNotes] = useState('');
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Add Client Modal State
  // Add Client Modal State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addClientEmail, setAddClientEmail] = useState('');
  const [addingClient, setAddingClient] = useState(false);

  // Client Profile Modal State
  const [showClientProfileModal, setShowClientProfileModal] = useState(false);
  const [selectedClientForProfile, setSelectedClientForProfile] = useState<{
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone?: string;
    skin_type?: string;
    concerns?: string[];
  } | null>(null);


  // Refresh Data State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derive user role and login status from auth context
  const userRole = profile?.role || null;
  const isLoggedIn = !!user && !!profile;

  // Loading timeout effect - prevents infinite loading spinner
  useEffect(() => {
    if (authLoading) {
      const timeout = setTimeout(() => {
        console.log('Auth loading timed out - showing landing page');
        setLoadingTimedOut(true);
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimedOut(false);
    }
  }, [authLoading]);

  // Redirect authenticated users from "/" to their dashboard
  useEffect(() => {
    // Only redirect when:
    // 1. Auth is not loading
    // 2. User is logged in with a profile
    // 3. Current path is exactly "/"
    if (!authLoading && user && profile && location.pathname === '/') {
      const targetPath = profile.role === 'client' ? '/client' : '/professional';
      console.log(`[AppLayout] Authenticated user on "/", redirecting to ${targetPath}`);
      navigate(targetPath, { replace: true });
    }
  }, [authLoading, user, profile, location.pathname, navigate]);

  // Refresh all data handler
  const handleRefreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Refresh data based on role
      if (userRole === 'professional') {
        await Promise.all([
          routineManagement.refreshData(),
          progressPhotos.refreshPhotos(),
          productCatalog.refreshProducts(),
        ]);
      } else if (userRole === 'client') {
        await Promise.all([
          clientData.refreshData(),
          progressPhotos.refreshPhotos(),
          productCatalog.refreshRecommendations(),
        ]);
      }
      
      toast({
        title: 'Data Refreshed',
        description: 'All data has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get stats from database or use defaults
  const clientStats = {
    currentStreak: clientData.stats?.current_streak || 0,
    longestStreak: clientData.stats?.longest_streak || 0,
    points: clientData.stats?.points || 0,
    level: clientData.stats?.level || 'Bronze',
    totalCompletions: clientData.stats?.total_routines_completed || 0,
    rank: 1 // Would be calculated from leaderboard
  };



  // Merge earned badges from database with badge definitions
  const displayBadges: BadgeDisplay[] = BADGE_DEFINITIONS.map(badge => {
    const earnedBadge = clientData.badges.find(b => b.badge_name === badge.name);
    return {
      ...badge,
      earned: !!earnedBadge,
      earnedDate: earnedBadge?.earned_at?.split('T')[0],
    };
  });

  // Use displayBadges for rendering
  const badges = displayBadges;

  // Update routine completion status based on database
  useEffect(() => {
    if (userRole === 'client' && user) {
      const morningCompleted = clientData.isRoutineCompletedToday('morning');
      const eveningCompleted = clientData.isRoutineCompletedToday('evening');
      
      setRoutine(prev => prev.map(step => ({
        ...step,
        completed: step.time === 'morning' ? morningCompleted : eveningCompleted
      })));
    }
  }, [clientData.todayCompletions, userRole, user]);

  // Open auth modal
  const openAuthModal = (mode: 'login' | 'signup', role?: 'client' | 'professional') => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setShowAuthModal(true);
  };


  // Handle logout - clear localStorage and redirect to "/"
  const handleLogout = async () => {
    try {
      // Use signOut from AuthContext which handles clearing auth localStorage
      const { error } = await signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: 'Error',
          description: 'Failed to sign out. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Clear the active view from localStorage
      localStorage.removeItem('skinaurapro_active_view');
      
      // Close user menu
      setShowUserMenu(false);
      
      // Show success message
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };



  // Routine handlers
  const toggleRoutineStep = (stepId: number) => {
    setRoutine(prev => {
      const updated = prev.map(step => {
        if (step.id === stepId) {
          const newCompleted = !step.completed;
          // Check for reorder prompt at 25 days
          if (newCompleted && step.daysUsed >= 24) {
            const product = products.find(p => p.name === step.product);
            if (product && !product.reorderPrompted) {
              setReorderProduct(product);
              setShowReorderModal(true);
              setProducts(prods => prods.map(p => 
                p.id === product.id ? { ...p, reorderPrompted: true } : p
              ));
            }
          }
          return { ...step, completed: newCompleted, daysUsed: newCompleted ? step.daysUsed + 1 : step.daysUsed };
        }
        return step;
      });
      return updated;
    });
  };

  // SMS handler
  const sendSMSReminder = async () => {
    if (!selectedClientForSMS || !smsMessage.trim()) return;
    
    setSendingSMS(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-reminder', {
        body: {
          to: selectedClientForSMS.phone,
          message: smsMessage,
          clientName: selectedClientForSMS.name,
          professionalName: profile?.full_name || 'Your Skincare Professional'
        }
      });

      if (error) throw error;

      toast({
        title: "SMS Sent!",
        description: `Reminder sent to ${selectedClientForSMS.name}`,
      });
      setShowSMSModal(false);
      setSmsMessage('');
      setSelectedClientForSMS(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS",
        variant: "destructive"
      });
    } finally {
      setSendingSMS(false);
    }
  };

  const openSMSModal = (client: Client) => {
    setSelectedClientForSMS(client);
    setSmsMessage(`Your skin is counting on you! Don't forget to complete your ${routineTime} routine today. Consistency is key to seeing results.`);
    setShowSMSModal(true);
  };

  // Calculate routine progress
  const morningRoutine = routine.filter(r => r.time === 'morning');
  const eveningRoutine = routine.filter(r => r.time === 'evening');
  const currentRoutine = routineTime === 'morning' ? morningRoutine : eveningRoutine;
  const routineProgress = Math.round((currentRoutine.filter(r => r.completed).length / currentRoutine.length) * 100);

  // Get current level info
  const getCurrentLevel = (points: number) => {
    for (let i = AWARD_LEVELS.length - 1; i >= 0; i--) {
      if (points >= AWARD_LEVELS[i].minPoints) {
        return { current: AWARD_LEVELS[i], next: AWARD_LEVELS[i + 1] || null };
      }
    }
    return { current: AWARD_LEVELS[0], next: AWARD_LEVELS[1] };
  };

  const levelInfo = getCurrentLevel(clientStats.points);
  const pointsToNextLevel = levelInfo.next ? levelInfo.next.minPoints - clientStats.points : 0;

  // Navigation items based on role
  const clientNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routine', label: 'My Routine', icon: Clock },
    { id: 'products', label: 'My Products', icon: Package },
    { id: 'progress', label: 'Progress Photos', icon: Camera },
    { id: 'treatment-plans', label: 'Treatment Plans', icon: ClipboardList },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    { id: 'faq', label: 'Help & FAQ', icon: HelpCircle },
  ];

  const professionalNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'My Clients', icon: Users },
    { id: 'photos', label: 'Client Photos', icon: Camera },
    { id: 'routines', label: 'Manage Routines', icon: Clock },
    { id: 'treatment-plans', label: 'Treatment Plans', icon: ClipboardList },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'products', label: 'Product Library', icon: Package },
    { id: 'faq', label: 'Help & FAQ', icon: HelpCircle },
  ];

  const navItems = userRole === 'client' ? clientNavItems : professionalNavItems;




  // Get user display info
  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    if (profile?.avatar_url) return profile.avatar_url;
    // Return default avatar based on role
    return userRole === 'professional' ? PROFESSIONAL_IMAGES[0] : CLIENT_IMAGES[0];
  };

  // Show loading state while auth is initializing (with timeout fallback)
  if (authLoading && !loadingTimedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-[#2D2A3E]" />
          </div>
          <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Loading SkinAura PRO...</p>
        </div>
      </div>
    );
  }


  // Render Landing Page
  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#2D2A3E]" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-[#2D2A3E]">SkinAura</h1>
                <p className="text-xs text-[#CFAFA3] -mt-1">PRO</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://skinaura.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-[#CFAFA3] transition-colors hidden sm:block">
                SkinAura AI
              </a>
              <a href="https://skinaura.circle.so/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-[#CFAFA3] transition-colors hidden sm:block">
                Community
              </a>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 text-sm font-medium text-[#2D2A3E] hover:text-[#CFAFA3] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#CFAFA3]/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[#CFAFA3]" />
                <span className="text-sm font-medium text-[#CFAFA3]">Skincare is Selfcare</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#2D2A3E] mb-6 leading-tight">
                Your Journey to <span className="text-[#CFAFA3]">Radiant Skin</span> Starts Here
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Track your skincare routine, earn rewards for consistency, and achieve your glow goals with personalized guidance from skincare professionals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => openAuthModal('signup', 'client')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all"
                >
                  <User className="w-5 h-5" />
                  Join as Client
                </button>
                <button
                  onClick={() => openAuthModal('signup', 'professional')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#2D2A3E] text-white rounded-xl font-medium hover:bg-[#3D3A4E] transition-all"
                >
                  <Users className="w-5 h-5" />
                  Join as Professional
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Already have an account?{' '}
                <button onClick={() => openAuthModal('login')} className="text-[#CFAFA3] font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src={HERO_IMAGE} alt="SkinAura PRO" className="w-full h-[500px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D2A3E]/60 via-transparent to-transparent" />
              </div>
              {/* Floating Stats Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#2D2A3E]">14</p>
                    <p className="text-sm text-gray-500">Day Streak</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-[#2D2A3E]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#2D2A3E]">Gold</p>
                    <p className="text-sm text-gray-500">Level</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-[#2D2A3E] mb-4">Why Choose SkinAura PRO?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Designed specifically for melanin-rich skin, our platform combines AI-powered insights with gamification to keep you motivated.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-[#F9F7F5] to-white rounded-2xl p-8 border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-[#2D2A3E]" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#2D2A3E] mb-3">Track Your Routine</h3>
              <p className="text-gray-600">Log your morning and evening skincare routines with ease. Get reminders when it's time to reorder products.</p>
            </div>
            <div className="bg-gradient-to-br from-[#F9F7F5] to-white rounded-2xl p-8 border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#2D2A3E] mb-3">Build Streaks</h3>
              <p className="text-gray-600">Stay consistent and watch your streak grow. Earn badges and climb the leaderboard as you maintain your routine.</p>
            </div>
            <div className="bg-gradient-to-br from-[#F9F7F5] to-white rounded-2xl p-8 border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#2D2A3E] mb-3">Level Up</h3>
              <p className="text-gray-600">Progress through Bronze, Silver, Gold, Platinum, and Diamond levels. Unlock exclusive rewards and recognition.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Professionals Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#2D2A3E] to-[#3D3A4E]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                <Users className="w-4 h-4 text-[#CFAFA3]" />
                <span className="text-sm font-medium text-[#CFAFA3]">For Professionals</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
                Empower Your Clients to Achieve Their Skin Goals
              </h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                Monitor client compliance, send personalized SMS reminders, and track progress all in one place. Help your clients stay accountable and see real results.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white/90">
                  <Check className="w-5 h-5 text-[#CFAFA3]" />
                  Real-time client compliance tracking
                </li>
                <li className="flex items-center gap-3 text-white/90">
                  <Check className="w-5 h-5 text-[#CFAFA3]" />
                  SMS reminders via Twilio integration
                </li>
                <li className="flex items-center gap-3 text-white/90">
                  <Check className="w-5 h-5 text-[#CFAFA3]" />
                  Analytics dashboard with insights
                </li>
                <li className="flex items-center gap-3 text-white/90">
                  <Check className="w-5 h-5 text-[#CFAFA3]" />
                  Product reorder notifications
                </li>
              </ul>
              <button
                onClick={() => openAuthModal('signup', 'professional')}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all"
              >
                <Users className="w-5 h-5" />
                Start Free Trial
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {PROFESSIONAL_IMAGES.map((img, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2' : ''}`}>
                  <img src={img} alt={`Professional ${i + 1}`} className={`w-full object-cover ${i === 0 ? 'h-64' : 'h-48'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for AEO */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F9F7F5] to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-[#2D2A3E] mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about SkinAura PRO</p>
          </div>
          
          <div className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
            {/* FAQ Item 1 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                What is SkinAura PRO?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  SkinAura PRO is a professional skincare tracking platform designed for estheticians and their clients. It helps track skincare routines, manage products, analyze progress photos, and monitor client compliance with AI-powered insights specifically designed for melanin-rich skin.
                </p>
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                How does the skincare routine tracking work?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  Clients log their morning and evening skincare routines daily. The app tracks which products are used, maintains streak counts for consistency, awards points and badges for compliance, and alerts when products need reordering after 25+ days of use.
                </p>
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                Can estheticians monitor their clients' progress?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  Yes, professionals can view client compliance rates, routine completion status, progress photos, and send SMS reminders to clients who miss their routines. The platform provides analytics dashboards showing overall client performance.
                </p>
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                Is SkinAura PRO designed for melanin-rich skin?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  Yes, SkinAura PRO is specifically designed with melanin-rich skin in mind. The AI analysis and product recommendations are optimized for diverse skin tones, addressing concerns like hyperpigmentation, uneven skin tone, and texture that are common in melanin-rich skin.
                </p>
              </div>
            </div>

            {/* FAQ Item 5 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                What features are available for skincare professionals?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  Professionals get access to client management, routine template creation, treatment plan management, progress photo annotation tools, product library management, compliance analytics, SMS reminders via Twilio, and the ability to recommend products to clients.
                </p>
              </div>
            </div>

            {/* FAQ Item 6 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                How does the gamification system work?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  Clients earn points for completing routines (50 points each), with bonus points for maintaining streaks. They progress through Bronze, Silver, Gold, Platinum, and Diamond levels. Badges are awarded for milestones like first routine completion, 7-day streaks, and 30-day consistency.
                </p>
              </div>
            </div>

            {/* FAQ Item 7 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                Can I upload and track progress photos?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  Yes, clients can upload before, after, and progress photos. Professionals can view these photos, add annotations and markup to highlight areas of concern or improvement, and provide feedback directly on the images.
                </p>
              </div>
            </div>

            {/* FAQ Item 8 */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
            >
              <h3 className="font-serif font-bold text-lg text-[#2D2A3E] mb-3" itemProp="name">
                Does SkinAura PRO integrate with other tools?
              </h3>
              <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                <p className="text-gray-600" itemProp="text">
                  SkinAura PRO integrates with Twilio for SMS reminders, supports Shopify product imports, CSV product imports, and connects with the SkinAura AI skin analysis platform for advanced skin scanning capabilities.
                </p>
              </div>
            </div>
          </div>

          {/* CTA after FAQ */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Ready to transform your skincare routine?</p>
            <button
              onClick={() => openAuthModal('signup')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#2D2A3E]" />
              </div>
              <span className="font-serif font-bold text-[#2D2A3E]">SkinAura PRO</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-gray-500" aria-label="Footer navigation">
              <a href="#features" className="hover:text-[#CFAFA3] transition-colors">Features</a>
              <a href="#professionals" className="hover:text-[#CFAFA3] transition-colors">For Professionals</a>
              <a href="#faq" className="hover:text-[#CFAFA3] transition-colors">FAQ</a>
              <a href="https://skinaura.ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#CFAFA3] transition-colors">SkinAura AI</a>
              <a href="https://skinaura-ai.myshopify.com/pages/app-skin-analysis-page" target="_blank" rel="noopener noreferrer" className="hover:text-[#CFAFA3] transition-colors">SkinAura Scan</a>
              <a href="https://skinaura.circle.so/" target="_blank" rel="noopener noreferrer" className="hover:text-[#CFAFA3] transition-colors">Community</a>
              <a href="/api-docs" className="hover:text-[#CFAFA3] transition-colors flex items-center gap-1">
                <FileText className="w-3 h-3" /> API Docs
              </a>
            </nav>
            <p className="text-sm text-gray-400">© 2025 SkinAura AI. Skincare is Selfcare.</p>
          </div>
        </div>
      </footer>




      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        initialRole={authModalRole}
      />
    </div>
  );

  // Render Sidebar
  const renderSidebar = () => (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#2D2A3E] to-[#1E1B2E] text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#2D2A3E]" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold">SkinAura</h1>
              <p className="text-xs text-[#CFAFA3]">PRO</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigateToView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === item.id
                  ? 'bg-gradient-to-r from-[#CFAFA3]/20 to-transparent text-[#CFAFA3] border-l-2 border-[#CFAFA3]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>


        {/* Level Progress (Client only) */}
        {userRole === 'client' && (
          <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-[#CFAFA3]/20 to-transparent border border-[#CFAFA3]/30">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-[#CFAFA3]" />
              <span className="text-sm font-medium">{clientStats.level} Level</span>
            </div>
            <p className="text-xs text-white/60 mb-2">{clientStats.points} points</p>
            {levelInfo.next && (
              <>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#E8D5D0] rounded-full"
                    style={{ width: `${((clientStats.points - levelInfo.current.minPoints) / (levelInfo.next.minPoints - levelInfo.current.minPoints)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-white/50">{pointsToNextLevel} pts to {levelInfo.next.name}</p>
              </>
            )}
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <img src={getUserAvatar()} alt={getUserDisplayName()} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
              <p className="text-xs text-white/50 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  // Render Header
  const renderHeader = () => (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-gray-900">
              {navItems.find(n => n.id === activeView)?.label || 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-500">
              {userRole === 'client' ? `${clientStats.currentStreak} day streak` : `Welcome back, ${getUserDisplayName().split(' ')[0]}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak Badge (Client) */}
          {userRole === 'client' && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-orange-600">{clientStats.currentStreak}</span>
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#CFAFA3] rounded-full"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                <h3 className="font-medium mb-3">Notifications</h3>
                <div className="space-y-3">
                  {userRole === 'client' ? (
                    <>
                      <div className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm">Keep it up! You're on a 14-day streak</p>
                          <p className="text-xs text-gray-400">Just now</p>
                        </div>
                      </div>
                      <div className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-[#CFAFA3]/20 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-[#CFAFA3]" />
                        </div>
                        <div>
                          <p className="text-sm">Time to reorder Gentle Foaming Cleanser</p>
                          <p className="text-xs text-gray-400">2 hours ago</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm">Ariel Thompson missed 4 days</p>
                          <p className="text-xs text-gray-400">Send a reminder?</p>
                        </div>
                      </div>
                      <div className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm">Tracy Davis reached Platinum level!</p>
                          <p className="text-xs text-gray-400">Yesterday</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-xl transition-colors">
              <img src={getUserAvatar()} alt={getUserDisplayName()} className="w-8 h-8 rounded-full object-cover" />
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-sm">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <hr className="my-2" />
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-red-600">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // CLIENT VIEWS

  // Handle routine confirmation
  const handleConfirmRoutine = async (routineType: 'morning' | 'evening') => {
    if (completingRoutine) return;
    
    setCompletingRoutine(true);
    try {
      const productsUsed = currentRoutine.map(step => step.product);
      const result = await clientData.completeRoutine(routineType, productsUsed);
      
      if (result.success) {
        // Mark all steps as completed for this time
        clientRoutines.markTimeComplete(routineType);
        setRoutine(prev => prev.map(step => 
          step.time === routineType ? { ...step, completed: true } : step
        ));
        
        toast({
          title: `${routineType === 'morning' ? 'Morning' : 'Evening'} Routine Complete!`,
          description: `+${result.pointsEarned} points earned${result.streakBonus ? ` (includes ${result.streakBonus} streak bonus!)` : ''}${result.newStreak ? ` | ${result.newStreak} day streak!` : ''}${result.levelUp ? ` | Level up to ${result.levelUp}!` : ''}`,
        });
      } else {
        toast({
          title: 'Already Completed',
          description: result.error || `You've already completed your ${routineType} routine today.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete routine',
        variant: 'destructive',
      });
    } finally {
      setCompletingRoutine(false);
    }
  };

  // Check if routine is completed today
  const isMorningComplete = clientData.isRoutineCompletedToday('morning');
  const isEveningComplete = clientData.isRoutineCompletedToday('evening');
  const isTodayFullyComplete = isMorningComplete && isEveningComplete;

  // Client Dashboard
  const renderClientDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E]">
        <div className="absolute inset-0 opacity-20">
          <img src={HERO_IMAGE} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {getUserDisplayName().split(' ')[0]}!
              </h1>
              <p className="text-white/80">Keep up your amazing skincare journey. You're doing great!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-1">
                  <span className="text-2xl font-bold text-white">{clientStats.currentStreak}</span>
                </div>
                <p className="text-xs text-white/70">Day Streak</p>
              </div>
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${levelInfo.current.color} flex items-center justify-center mb-1`}>
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs text-white/70">{clientStats.level}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Routine Confirmation Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Morning Routine Card */}
        <div className={`rounded-2xl p-6 border shadow-sm transition-all ${
          isMorningComplete 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isMorningComplete ? 'bg-green-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'
              }`}>
                {isMorningComplete ? <Check className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-gray-900">Morning Routine</h3>
                <p className="text-sm text-gray-500">{morningRoutine.length} steps</p>
              </div>
            </div>
            {isMorningComplete && (
              <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full flex items-center gap-1">
                <Check className="w-4 h-4" /> Done
              </span>
            )}
          </div>
          
          {isMorningComplete ? (
            <div className="text-center py-4">
              <p className="text-green-700 font-medium">Great job completing your AM routine!</p>
              <p className="text-sm text-green-600 mt-1">+50 points earned</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-amber-600">
                    {morningRoutine.filter(r => r.completed).length}/{morningRoutine.length}
                  </span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                    style={{ width: `${(morningRoutine.filter(r => r.completed).length / morningRoutine.length) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleConfirmRoutine('morning')}
                disabled={completingRoutine}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {completingRoutine ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sun className="w-5 h-5" /> Confirm AM Routine Complete
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Evening Routine Card */}
        <div className={`rounded-2xl p-6 border shadow-sm transition-all ${
          isEveningComplete 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isEveningComplete ? 'bg-green-500' : 'bg-gradient-to-br from-indigo-500 to-purple-500'
              }`}>
                {isEveningComplete ? <Check className="w-6 h-6 text-white" /> : <Moon className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-gray-900">Evening Routine</h3>
                <p className="text-sm text-gray-500">{eveningRoutine.length} steps</p>
              </div>
            </div>
            {isEveningComplete && (
              <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full flex items-center gap-1">
                <Check className="w-4 h-4" /> Done
              </span>
            )}
          </div>
          
          {isEveningComplete ? (
            <div className="text-center py-4">
              <p className="text-green-700 font-medium">Great job completing your PM routine!</p>
              <p className="text-sm text-green-600 mt-1">+50 points earned</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-indigo-600">
                    {eveningRoutine.filter(r => r.completed).length}/{eveningRoutine.length}
                  </span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${(eveningRoutine.filter(r => r.completed).length / eveningRoutine.length) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleConfirmRoutine('evening')}
                disabled={completingRoutine}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {completingRoutine ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Moon className="w-5 h-5" /> Confirm PM Routine Complete
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Streak & Rewards Banner */}
      {isTodayFullyComplete && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl">Today's Routines Complete!</h3>
                <p className="text-white/80">You're building an amazing streak. Keep it up!</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-300" />
                <span className="text-3xl font-bold">{clientStats.currentStreak}</span>
              </div>
              <p className="text-sm text-white/70">Day Streak</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clientStats.currentStreak}</p>
          <p className="text-sm text-gray-500">Current Streak</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clientStats.longestStreak}</p>
          <p className="text-sm text-gray-500">Longest Streak</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#CFAFA3]/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-[#CFAFA3]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clientStats.points}</p>
          <p className="text-sm text-gray-500">Total Points</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clientStats.totalCompletions}</p>
          <p className="text-sm text-gray-500">Routines Done</p>
        </div>
      </div>

      {/* Today's Routine Steps (Collapsible) */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg">Today's Routine Steps</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setRoutineTime('morning')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                routineTime === 'morning' ? 'bg-white shadow text-amber-600' : 'text-gray-600'
              }`}
            >
              <Sun className="w-4 h-4" /> AM {isMorningComplete && <Check className="w-3 h-3 text-green-500" />}
            </button>
            <button
              onClick={() => setRoutineTime('evening')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                routineTime === 'evening' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
              }`}
            >
              <Moon className="w-4 h-4" /> PM {isEveningComplete && <Check className="w-3 h-3 text-green-500" />}
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {currentRoutine.map((step) => (
            <div
              key={step.id}
              onClick={() => toggleRoutineStep(step.id)}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                step.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <img src={step.productImage} alt={step.product} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${step.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                    {step.product}
                  </p>
                  {step.daysUsed >= 25 && !step.completed && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> Reorder Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{step.notes}</p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed ? 'bg-green-500' : 'bg-gray-200'
              }`}>
                {step.completed ? <Check className="w-4 h-4 text-white" /> : <span className="text-sm font-medium text-gray-600">{step.step}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Confirm Button at Bottom */}
        {!((routineTime === 'morning' && isMorningComplete) || (routineTime === 'evening' && isEveningComplete)) && (
          <button
            onClick={() => handleConfirmRoutine(routineTime)}
            disabled={completingRoutine}
            className={`w-full mt-4 py-3 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              routineTime === 'morning' 
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:shadow-amber-500/30' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/30'
            }`}
          >
            {completingRoutine ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {routineTime === 'morning' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                Confirm {routineTime === 'morning' ? 'AM' : 'PM'} Routine Complete
              </>
            )}
          </button>
        )}
      </div>

      {/* Recent Badges */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg">Recent Achievements</h3>
          <button onClick={() => setActiveView('achievements')} className="text-sm text-[#CFAFA3] hover:underline">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {badges.filter(b => b.earned).slice(0, 4).map((badge) => (
            <div key={badge.id} className="flex-shrink-0 text-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden mb-2 border-2 border-[#CFAFA3]">
                <img src={badge.image} alt={badge.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-medium text-gray-700">{badge.name}</p>
            </div>
          ))}
          {badges.filter(b => b.earned).length === 0 && (
            <p className="text-sm text-gray-500">Complete routines to earn badges!</p>
          )}
        </div>
      </div>
    </div>
  );


  // Client Routine View
  const renderClientRoutine = () => (
    <div className="space-y-6">
      {/* Time Toggle */}
      <div className="flex items-center justify-center">
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          <button
            onClick={() => setRoutineTime('morning')}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
              routineTime === 'morning'
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Sun className="w-5 h-5" /> Morning Routine
          </button>
          <button
            onClick={() => setRoutineTime('evening')}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
              routineTime === 'evening'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Moon className="w-5 h-5" /> Evening Routine
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium mb-1">{routineTime === 'morning' ? 'Morning' : 'Evening'} Progress</h3>
            <p className="text-white/60 text-sm">{currentRoutine.filter(r => r.completed).length} of {currentRoutine.length} steps completed</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{routineProgress}%</p>
            {routineProgress === 100 && <p className="text-green-400 text-sm">+50 pts</p>}
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#E8D5D0] rounded-full transition-all duration-500"
            style={{ width: `${routineProgress}%` }}
          />
        </div>
      </div>

      {/* Routine Steps */}
      <div className="space-y-4">
        {currentRoutine.map((step) => (
          <div
            key={step.id}
            className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
              step.completed ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:border-[#CFAFA3]/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => toggleRoutineStep(step.id)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-[#CFAFA3] hover:text-white'
                }`}
              >
                {step.completed ? <Check className="w-7 h-7" /> : <span className="text-xl font-bold">{step.step}</span>}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium text-lg ${step.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                    {step.product}
                  </h4>
                  {step.daysUsed >= 25 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> {step.daysUsed} days - Reorder
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{step.notes}</p>
                <p className="text-xs text-gray-400 mt-1">Used {step.daysUsed} days consecutively</p>
              </div>
              <img src={step.productImage} alt={step.product} className="w-16 h-16 rounded-xl object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Client Products View
  const renderClientProducts = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.filter(p => p.inRoutine).map((product) => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="relative h-48">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              {product.daysUsed >= 25 && (
                <div className="absolute top-3 right-3 px-3 py-1 bg-amber-500 text-white text-xs rounded-full flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> Reorder
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs text-[#CFAFA3] font-medium mb-1">{product.brand}</p>
              <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{product.category}</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#CFAFA3]">{product.daysUsed}</p>
                  <p className="text-xs text-gray-500">days used</p>
                </div>
              </div>
              {product.daysUsed >= 25 && (
                <button className="w-full mt-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                  Reorder Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Client Achievements View
  const renderClientAchievements = () => (
    <div className="space-y-6">
      {/* Level Progress */}
      <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${levelInfo.current.color} flex items-center justify-center`}>
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-sm">Current Level</p>
            <h2 className="text-3xl font-bold">{clientStats.level}</h2>
            <p className="text-white/80">{clientStats.points} points</p>
          </div>
        </div>
        {levelInfo.next && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Progress to {levelInfo.next.name}</span>
              <span className="text-white">{pointsToNextLevel} pts to go</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#E8D5D0] rounded-full"
                style={{ width: `${((clientStats.points - levelInfo.current.minPoints) / (levelInfo.next.minPoints - levelInfo.current.minPoints)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* All Levels */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg mb-4">Award Levels</h3>
        <div className="grid grid-cols-5 gap-4">
          {AWARD_LEVELS.map((level, i) => {
            const isUnlocked = clientStats.points >= level.minPoints;
            const LevelIcon = level.icon;
            return (
              <div key={level.name} className={`text-center ${!isUnlocked && 'opacity-40'}`}>
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center mb-2`}>
                  <LevelIcon className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-medium">{level.name}</p>
                <p className="text-xs text-gray-500">{level.minPoints}+ pts</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg mb-4">Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className={`p-4 rounded-xl border ${badge.earned ? 'border-[#CFAFA3] bg-[#CFAFA3]/5' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden">
                  <img src={badge.image} alt={badge.name} className={`w-full h-full object-cover ${!badge.earned && 'grayscale'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{badge.name}</p>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                  {badge.earned && badge.earnedDate && (
                    <p className="text-xs text-[#CFAFA3] mt-1">Earned {new Date(badge.earnedDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Client Leaderboard View
  const renderClientLeaderboard = () => (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6">
        <h3 className="text-white font-serif font-bold text-lg text-center mb-6">Top Performers</h3>
        <div className="flex items-end justify-center gap-4">
          {/* 2nd Place */}
          <div className="text-center">
            <img src={leaderboardData[1].avatar} alt={leaderboardData[1].name} className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-gray-400" />
            <p className="text-white text-sm font-medium">{leaderboardData[1].name.split(' ')[0]}</p>
            <p className="text-white/60 text-xs">{leaderboardData[1].points} pts</p>
            <div className="w-20 h-16 bg-gray-400 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
          </div>
          {/* 1st Place */}
          <div className="text-center">
            <div className="relative">
              <img src={leaderboardData[0].avatar} alt={leaderboardData[0].name} className="w-20 h-20 rounded-full mx-auto mb-2 border-4 border-yellow-400" />
              <Crown className="w-6 h-6 text-yellow-400 absolute -top-2 left-1/2 -translate-x-1/2" />
            </div>
            <p className="text-white font-medium">{leaderboardData[0].name.split(' ')[0]}</p>
            <p className="text-white/60 text-xs">{leaderboardData[0].points} pts</p>
            <div className="w-20 h-24 bg-yellow-400 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
          </div>
          {/* 3rd Place */}
          <div className="text-center">
            <img src={leaderboardData[2].avatar} alt={leaderboardData[2].name} className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-amber-600" />
            <p className="text-white text-sm font-medium">{leaderboardData[2].name.split(' ')[0]}</p>
            <p className="text-white/60 text-xs">{leaderboardData[2].points} pts</p>
            <div className="w-20 h-12 bg-amber-600 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-serif font-bold text-lg">Full Rankings</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {leaderboardData.map((entry, i) => (
            <div key={entry.rank} className={`flex items-center gap-4 p-4 ${entry.name === getUserDisplayName() ? 'bg-[#CFAFA3]/10' : 'hover:bg-gray-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                i === 0 ? 'bg-yellow-400 text-white' :
                i === 1 ? 'bg-gray-400 text-white' :
                i === 2 ? 'bg-amber-600 text-white' :
                'bg-gray-100 text-gray-600'
              }`}>
                {entry.rank}
              </div>
              <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-medium">{entry.name}</p>
                <p className="text-xs text-gray-500">{entry.level} Level</p>
              </div>
              <div className="flex items-center gap-2 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="font-medium">{entry.streak}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#CFAFA3]">{entry.points}</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // PROFESSIONAL VIEWS

  // Professional Dashboard
  // Professional Dashboard
  const renderProfessionalDashboard = () => {
    // Merge registered clients with demo clients for display
    const registeredClients = routineManagement.clients.map((c, idx) => ({
      id: c.id,
      name: c.full_name || c.email || 'Unknown Client',
      image: c.avatar_url || CLIENT_IMAGES[idx % CLIENT_IMAGES.length],
      phone: c.phone || '',
      email: c.email || '',
      skinType: c.skin_type || 'Not specified',
      concerns: c.concerns || [],
      currentStreak: 0,
      longestStreak: 0,
      level: 'Bronze' as const,
      points: 0,
      compliance: 0,
      lastActive: new Date().toISOString().split('T')[0],
      routineCompletedToday: false,
      isRegistered: true
    }));

    // Combine registered clients with demo clients
    const allDisplayClients = [
      ...registeredClients,
      ...clients.map(c => ({ ...c, isRegistered: false }))
    ];

    // Calculate stats based on all clients
    const totalClients = allDisplayClients.length;
    const completedToday = allDisplayClients.filter(c => c.routineCompletedToday).length;
    const needAttention = allDisplayClients.filter(c => c.compliance < 60 || !c.routineCompletedToday).length;
    const avgCompliance = allDisplayClients.length > 0 
      ? Math.round(allDisplayClients.reduce((a, c) => a + c.compliance, 0) / allDisplayClients.length)
      : 0;

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#CFAFA3]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#CFAFA3]" />
              </div>
              {registeredClients.length > 0 && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {registeredClients.length} registered
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            <p className="text-sm text-gray-500">Total Clients</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
            <p className="text-sm text-gray-500">Completed Today</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{needAttention}</p>
            <p className="text-sm text-gray-500">Need Attention</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgCompliance}%</p>
            <p className="text-sm text-gray-500">Avg Compliance</p>
          </div>
        </div>

        {/* Clients Needing Attention */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Clients Needing Attention
          </h3>
          <div className="space-y-3">
            {allDisplayClients.filter(c => !c.routineCompletedToday || c.compliance < 70).slice(0, 5).map((client) => (
              <div key={client.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                client.isRegistered ? 'bg-green-50/50 border-green-200' : 'bg-red-50 border-red-100'
              }`}>
                <img src={client.image} alt={client.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{client.name}</p>
                    {client.isRegistered && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Registered</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {!client.routineCompletedToday ? "Hasn't completed today's routine" : `${client.compliance}% compliance`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.currentStreak === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {client.currentStreak} day streak
                  </span>
                  {client.phone && (
                    <button
                      onClick={() => openSMSModal(client as Client)}
                      className="p-2 bg-[#CFAFA3] text-white rounded-lg hover:bg-[#B89A8E] transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {allDisplayClients.filter(c => !c.routineCompletedToday || c.compliance < 70).length === 0 && (
              <p className="text-center text-gray-500 py-4">All clients are on track!</p>
            )}
          </div>
        </div>

        {/* All Clients Overview */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-lg">All Clients</h3>
            <button onClick={() => setActiveView('clients')} className="text-sm text-[#CFAFA3] hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Streak</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Level</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Compliance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Today</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {allDisplayClients.slice(0, 8).map((client) => (
                  <tr key={client.id} className={`border-b border-gray-50 hover:bg-gray-50 ${
                    client.isRegistered ? 'bg-green-50/30' : ''
                  }`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={client.image} alt={client.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {client.isRegistered ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Registered</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">Demo</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="font-medium">{client.currentStreak}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.level === 'Platinum' ? 'bg-cyan-100 text-cyan-700' :
                        client.level === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                        client.level === 'Silver' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {client.level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            client.compliance >= 80 ? 'bg-green-500' :
                            client.compliance >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${client.compliance}%` }} />
                        </div>
                        <span className="text-sm">{client.compliance}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {client.routineCompletedToday ? (
                        <span className="flex items-center gap-1 text-green-600"><Check className="w-4 h-4" /> Done</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500"><X className="w-4 h-4" /> Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedClientForProfile({
                              id: client.id,
                              email: client.email,
                              full_name: client.name,
                              avatar_url: client.image,
                              phone: client.phone,
                              skin_type: client.skinType,
                              concerns: client.concerns
                            });
                            setShowClientProfileModal(true);
                          }}
                          className="p-2 hover:bg-[#CFAFA3]/10 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4 text-[#CFAFA3]" />
                        </button>
                        {client.phone && (
                          <button
                            onClick={() => openSMSModal(client as Client)}
                            className="p-2 hover:bg-[#CFAFA3]/10 rounded-lg transition-colors"
                            title="Send SMS Reminder"
                          >
                            <Phone className="w-4 h-4 text-[#CFAFA3]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  // Professional Clients View
  const renderProfessionalClients = () => {
    // Combine real database clients with demo clients, prioritizing real clients
    const realClients = routineManagement.clients.map((c, idx) => ({
      id: c.id,
      name: c.full_name || c.email || 'Unknown Client',
      image: c.avatar_url || CLIENT_IMAGES[idx % CLIENT_IMAGES.length],
      phone: c.phone || '',
      email: c.email || '',
      skinType: c.skin_type || 'Not specified',
      concerns: c.concerns || [],
      currentStreak: 0, // Would come from stats
      longestStreak: 0,
      level: 'Bronze',
      points: 0,
      compliance: 0,
      lastActive: new Date().toISOString().split('T')[0],
      routineCompletedToday: false,
      isRealClient: true
    }));

    // Only show demo clients if no real clients exist
    const displayClients = realClients.length > 0 ? realClients : clients.map(c => ({ ...c, isRealClient: false }));

    // Filter by search query
    const filteredClients = displayClients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handler to open client profile modal
    const handleViewProfile = (client: typeof displayClients[0]) => {
      setSelectedClientForProfile({
        id: client.id,
        email: client.email,
        full_name: client.name,
        avatar_url: client.image,
        phone: client.phone,
        skin_type: client.skinType,
        concerns: client.concerns
      });
      setShowClientProfileModal(true);
    };

    return (
      <div className="space-y-6">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1"
            />
          </div>
          <button 
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors">
            <Plus className="w-5 h-5" /> Add Client
          </button>
        </div>



        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#CFAFA3]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Clients Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddClientModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <UserPlus className="w-5 h-5" /> Add Your First Client
              </button>
            )}
          </div>
        )}

        {/* Clients Grid */}
        {filteredClients.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredClients.map((client) => (
              <div key={client.id} className={`bg-white rounded-2xl p-6 border shadow-sm ${
                (client as any).isRealClient ? 'border-green-200' : 'border-gray-100'
              }`}>
                {(client as any).isRealClient && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Registered Client
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-4 mb-4">
                  <img src={client.image} alt={client.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-lg">{client.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        client.level === 'Platinum' ? 'bg-cyan-100 text-cyan-700' :
                        client.level === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                        client.level === 'Silver' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {client.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{client.skinType} Skin</p>
                    <p className="text-xs text-gray-400">{client.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.concerns.slice(0, 3).map((concern, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-xs rounded-full">{concern}</span>
                      ))}
                      {client.concerns.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{client.concerns.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold">{client.currentStreak}</span>
                    </div>
                    <p className="text-xs text-gray-500">Streak</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="font-bold text-[#CFAFA3] mb-1">{client.points}</p>
                    <p className="text-xs text-gray-500">Points</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className={`font-bold mb-1 ${
                      client.compliance >= 80 ? 'text-green-600' :
                      client.compliance >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>{client.compliance}%</p>
                    <p className="text-xs text-gray-500">Compliance</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Today's Routine</p>
                    {client.routineCompletedToday ? (
                      <p className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Completed</p>
                    ) : (
                      <p className="text-sm text-red-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Pending</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewProfile(client)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4 text-gray-400 hover:text-[#CFAFA3]" />
                    </button>
                    <button
                      onClick={() => openSMSModal(client as Client)}
                      className="p-2 bg-[#CFAFA3] text-white rounded-lg hover:bg-[#B89A8E] transition-colors"
                      title="Send SMS Reminder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



  // Professional Analytics View
  const renderProfessionalAnalytics = () => (
    <div className="space-y-6">
      {/* Overview Cards - Updated with brand palette */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#cab0a5] to-[#b89a8e] rounded-2xl p-5 text-white">
          <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{Math.round(clients.reduce((a, c) => a + c.compliance, 0) / clients.length)}%</p>
          <p className="text-white/80 text-sm">Avg. Compliance</p>
        </div>
        <div className="bg-gradient-to-br from-[#a57865] to-[#8a6354] rounded-2xl p-5 text-white">
          <Flame className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{Math.round(clients.reduce((a, c) => a + c.currentStreak, 0) / clients.length)}</p>
          <p className="text-white/80 text-sm">Avg. Streak</p>
        </div>
        <div className="bg-gradient-to-br from-[#007185] to-[#005a6a] rounded-2xl p-5 text-white">
          <Trophy className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{clients.filter(c => c.level === 'Gold' || c.level === 'Platinum').length}</p>
          <p className="text-white/80 text-sm">Gold+ Clients</p>
        </div>
        <div className="bg-gradient-to-br from-[#e6d5b8] to-[#d4c4a8] rounded-2xl p-5 text-[#2D2A3E]">
          <Check className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{clients.filter(c => c.routineCompletedToday).length}/{clients.length}</p>
          <p className="text-[#2D2A3E]/70 text-sm">Completed Today</p>
        </div>
      </div>

      {/* Compliance Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg mb-6">Client Compliance Overview</h3>
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center gap-4">
              <img src={client.image} alt={client.name} className="w-8 h-8 rounded-full object-cover" />
              <div className="w-32 truncate text-sm font-medium">{client.name}</div>
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    client.compliance >= 80 ? 'bg-[#007185]' :
                    client.compliance >= 60 ? 'bg-[#a57865]' : 'bg-[#cab0a5]'
                  }`} style={{ width: `${client.compliance}%` }} />
                </div>
              </div>
              <div className="w-12 text-right font-medium">{client.compliance}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Level Distribution */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg mb-6">Client Level Distribution</h3>
        <div className="grid grid-cols-5 gap-4">
          {AWARD_LEVELS.map((level) => {
            const count = clients.filter(c => c.level === level.name).length;
            // Use brand colors for level distribution
            const brandColors = {
              'Bronze': 'from-[#a57865] to-[#8a6354]',
              'Silver': 'from-[#cab0a5] to-[#b89a8e]',
              'Gold': 'from-[#e6d5b8] to-[#d4c4a8]',
              'Platinum': 'from-[#007185] to-[#005a6a]',
              'Diamond': 'from-[#2D2A3E] to-[#3D3A4E]',
            };
            const colorClass = brandColors[level.name as keyof typeof brandColors] || level.color;
            return (
              <div key={level.name} className="text-center">
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-2`}>
                  <span className={`text-xl font-bold ${level.name === 'Gold' ? 'text-[#2D2A3E]' : 'text-white'}`}>{count}</span>
                </div>
                <p className="text-sm font-medium">{level.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );


  // Professional Routines View
  const renderProfessionalRoutines = () => {
    const handleCreateRoutine = async () => {
      if (!newRoutineName.trim()) {
        toast({ title: 'Error', description: 'Please enter a routine name', variant: 'destructive' });
        return;
      }
      setSavingRoutine(true);
      const result = await routineManagement.createRoutine(
        newRoutineName,
        newRoutineDescription,
        newRoutineSchedule
      );
      setSavingRoutine(false);
      if (result.success) {
        toast({ title: 'Success', description: 'Routine created successfully!' });
        setShowCreateRoutineModal(false);
        setNewRoutineName('');
        setNewRoutineDescription('');
        setNewRoutineSchedule('morning');
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to create routine', variant: 'destructive' });
      }
    };

    const handleAddStep = async () => {
      if (!selectedRoutine || !newStepProduct.trim()) {
        toast({ title: 'Error', description: 'Please enter a product name', variant: 'destructive' });
        return;
      }
      const result = await routineManagement.addStep(selectedRoutine.id, {
        product_name: newStepProduct,
        product_type: newStepType || undefined,
        instructions: newStepInstructions || undefined,
      });
      if (result.success) {
        toast({ title: 'Success', description: 'Step added!' });
        setNewStepProduct('');
        setNewStepType('');
        setNewStepInstructions('');
        // Refresh the selected routine
        const updated = routineManagement.routines.find(r => r.id === selectedRoutine.id);
        if (updated) setSelectedRoutine(updated);
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to add step', variant: 'destructive' });
      }
    };

    const handleDeleteStep = async (stepId: string) => {
      const result = await routineManagement.deleteStep(stepId);
      if (result.success) {
        toast({ title: 'Success', description: 'Step removed' });
        if (selectedRoutine) {
          const updated = routineManagement.routines.find(r => r.id === selectedRoutine.id);
          if (updated) setSelectedRoutine(updated);
        }
      }
    };

    const handleAssignRoutine = async () => {
      if (!selectedRoutine || !selectedClientForAssign) {
        toast({ title: 'Error', description: 'Please select a client', variant: 'destructive' });
        return;
      }
      setSavingRoutine(true);
      const result = await routineManagement.assignRoutine(
        selectedRoutine.id,
        selectedClientForAssign,
        assignmentNotes
      );
      setSavingRoutine(false);
      if (result.success) {
        toast({ title: 'Success', description: 'Routine assigned to client!' });
        setShowAssignRoutineModal(false);
        setSelectedClientForAssign('');
        setAssignmentNotes('');
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to assign routine', variant: 'destructive' });
      }
    };

    const handleDeleteRoutine = async (routineId: string) => {
      if (!confirm('Are you sure you want to delete this routine?')) return;
      const result = await routineManagement.deleteRoutine(routineId);
      if (result.success) {
        toast({ title: 'Success', description: 'Routine deleted' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete routine', variant: 'destructive' });
      }
    };

    const getScheduleLabel = (type: string) => {
      switch (type) {
        case 'morning': return 'Morning';
        case 'evening': return 'Evening';
        case 'daily': return 'Daily (AM & PM)';
        case 'weekly': return 'Weekly';
        default: return type;
      }
    };

    const getScheduleIcon = (type: string) => {
      switch (type) {
        case 'morning': return <Sun className="w-4 h-4 text-amber-500" />;
        case 'evening': return <Moon className="w-4 h-4 text-indigo-500" />;
        case 'daily': return <Clock className="w-4 h-4 text-green-500" />;
        case 'weekly': return <Calendar className="w-4 h-4 text-purple-500" />;
        default: return <Clock className="w-4 h-4" />;
      }
    };

    // Only show real database clients for assignment (not demo clients)
    // Demo clients have simple string IDs that don't exist in the database
    const assignableClients = routineManagement.clients.map(c => ({
      id: c.id,
      name: c.full_name || c.email || 'Unknown Client',
      image: c.avatar_url || CLIENT_IMAGES[0],
    }));


    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">Routine Templates</h2>
            <p className="text-gray-500">Create and manage skincare routines for your clients</p>
          </div>
          <button
            onClick={() => setShowCreateRoutineModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" /> Create Routine
          </button>
        </div>

        {/* Loading State */}
        {routineManagement.loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!routineManagement.loading && routineManagement.routines.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-[#CFAFA3]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Routines Yet</h3>
            <p className="text-gray-500 mb-6">Create your first routine template to assign to clients</p>
            <button
              onClick={() => setShowCreateRoutineModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" /> Create Your First Routine
            </button>
          </div>
        )}

        {/* Routines Grid */}
        {!routineManagement.loading && routineManagement.routines.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routineManagement.routines.map((routine) => {
              const assignedClients = routineManagement.getRoutineClients(routine.id);
              return (
                <div key={routine.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        routine.schedule_type === 'morning' ? 'bg-amber-100' :
                        routine.schedule_type === 'evening' ? 'bg-indigo-100' :
                        routine.schedule_type === 'daily' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {getScheduleIcon(routine.schedule_type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{routine.name}</h3>
                        <p className="text-xs text-gray-500">{getScheduleLabel(routine.schedule_type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedRoutine(routine);
                          setShowEditRoutineModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Routine"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Routine"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {routine.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{routine.description}</p>
                  )}

                  {/* Steps Preview */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">{routine.steps.length} Steps</p>
                    <div className="space-y-1">
                      {routine.steps.slice(0, 3).map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-[#CFAFA3]/20 text-[#CFAFA3] text-xs flex items-center justify-center font-medium">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700 truncate">{step.product_name}</span>
                        </div>
                      ))}
                      {routine.steps.length > 3 && (
                        <p className="text-xs text-gray-400 pl-7">+{routine.steps.length - 3} more steps</p>
                      )}
                    </div>
                  </div>

                  {/* Assigned Clients */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{assignedClients.length} clients</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRoutine(routine);
                        setShowAssignRoutineModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Routine Modal */}
        {showCreateRoutineModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold">Create New Routine</h3>
                <button onClick={() => setShowCreateRoutineModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Routine Name</label>
                  <input
                    type="text"
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="e.g., Anti-Aging Morning Routine"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={newRoutineDescription}
                    onChange={(e) => setNewRoutineDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                    rows={3}
                    placeholder="Describe this routine..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['morning', 'evening', 'daily', 'weekly'] as const).map((schedule) => (
                      <button
                        key={schedule}
                        onClick={() => setNewRoutineSchedule(schedule)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                          newRoutineSchedule === schedule
                            ? 'border-[#CFAFA3] bg-[#CFAFA3]/10 text-[#CFAFA3]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {getScheduleIcon(schedule)}
                        <span className="text-sm font-medium">{getScheduleLabel(schedule)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateRoutineModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoutine}
                  disabled={savingRoutine || !newRoutineName.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingRoutine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Routine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Routine Modal */}
        {showEditRoutineModal && selectedRoutine && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold">{selectedRoutine.name}</h3>
                  <p className="text-sm text-gray-500">{getScheduleLabel(selectedRoutine.schedule_type)} Routine</p>
                </div>
                <button onClick={() => { setShowEditRoutineModal(false); setSelectedRoutine(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Steps */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Routine Steps</h4>
                {selectedRoutine.steps.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No steps added yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRoutine.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-[#CFAFA3] text-white flex items-center justify-center font-medium text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{step.product_name}</p>
                          {step.product_type && <span className="text-xs text-[#CFAFA3]">{step.product_type}</span>}
                          {step.instructions && <p className="text-xs text-gray-500 mt-1">{step.instructions}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Step */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Step</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={newStepProduct}
                      onChange={(e) => setNewStepProduct(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
                      placeholder="e.g., Vitamin C Serum"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Product Type</label>
                    <select
                      value={newStepType}
                      onChange={(e) => setNewStepType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
                    >
                      <option value="">Select type...</option>
                      <option value="Cleanser">Cleanser</option>
                      <option value="Toner">Toner</option>
                      <option value="Serum">Serum</option>
                      <option value="Moisturizer">Moisturizer</option>
                      <option value="Sunscreen">Sunscreen</option>
                      <option value="Treatment">Treatment</option>
                      <option value="Eye Cream">Eye Cream</option>
                      <option value="Mask">Mask</option>
                      <option value="Oil">Oil</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Instructions</label>
                  <input
                    type="text"
                    value={newStepInstructions}
                    onChange={(e) => setNewStepInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
                    placeholder="e.g., Apply 3-4 drops to clean skin"
                  />
                </div>
                <button
                  onClick={handleAddStep}
                  disabled={!newStepProduct.trim()}
                  className="w-full py-2 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg font-medium hover:bg-[#CFAFA3]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Step
                </button>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => { setShowEditRoutineModal(false); setSelectedRoutine(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowEditRoutineModal(false);
                    setShowAssignRoutineModal(true);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Assign to Client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Routine Modal */}
        {/* Assign Routine Modal */}
        {showAssignRoutineModal && selectedRoutine && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold">Assign Routine</h3>
                  <p className="text-sm text-gray-500">{selectedRoutine.name}</p>
                </div>
                <button onClick={() => { setShowAssignRoutineModal(false); setSelectedRoutine(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
                  {assignableClients.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <p className="font-medium text-amber-800">No Clients Connected</p>
                      </div>
                      <p className="text-sm text-amber-700 mb-3">
                        You need to add clients to your practice before you can assign routines.
                      </p>
                      <button
                        onClick={() => {
                          setShowAssignRoutineModal(false);
                          setSelectedRoutine(null);
                          setShowAddClientModal(true);
                        }}
                        className="w-full py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" /> Add Your First Client
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedClientForAssign}
                      onChange={(e) => setSelectedClientForAssign(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    >
                      <option value="">Choose a client...</option>
                      {assignableClients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {assignableClients.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Client (Optional)</label>
                    <textarea
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                      rows={3}
                      placeholder="Any special instructions for this client..."
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowAssignRoutineModal(false); setSelectedRoutine(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {assignableClients.length > 0 && (
                  <button
                    onClick={handleAssignRoutine}
                    disabled={savingRoutine || !selectedClientForAssign}
                    className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingRoutine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Assign Routine
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  // Professional Product Library View
  const renderProfessionalProductLibrary = () => {
    const myProducts = productCatalog.getMyProducts();
    const allProducts = productCatalog.products;
    
    const filteredProducts = allProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = productFilter === 'all' || product.category === productFilter;
      
      return matchesSearch && matchesCategory;
    });

    const handleCreateProduct = async () => {
      if (!newProductName.trim() || !newProductBrand.trim() || !newProductCategory) {
        toast({ title: 'Error', description: 'Please fill in required fields (Name, Brand, Category)', variant: 'destructive' });
        return;
      }
      
      setSavingProduct(true);
      const result = await productCatalog.createProduct({
        name: newProductName,
        brand: newProductBrand,
        category: newProductCategory,
        description: newProductDescription || undefined,
        ingredients: newProductIngredients ? newProductIngredients.split(',').map(i => i.trim()).filter(i => i) : [],
        skin_types: newProductSkinTypes,
        usage_instructions: newProductInstructions || undefined,
        price: newProductPrice ? parseFloat(newProductPrice) : undefined,
        purchase_url: newProductUrl || undefined,
      });
      setSavingProduct(false);
      
      if (result.success) {
        toast({ title: 'Success', description: 'Product added to your library!' });
        setShowAddProductModal(false);
        resetProductForm();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to add product', variant: 'destructive' });
      }
    };

    const handleUpdateProduct = async () => {
      if (!selectedCatalogProduct || !newProductName.trim() || !newProductBrand.trim() || !newProductCategory) {
        toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
        return;
      }
      
      setSavingProduct(true);
      const result = await productCatalog.updateProduct(selectedCatalogProduct.id, {
        name: newProductName,
        brand: newProductBrand,
        category: newProductCategory,
        description: newProductDescription || undefined,
        ingredients: newProductIngredients ? newProductIngredients.split(',').map(i => i.trim()).filter(i => i) : [],
        skin_types: newProductSkinTypes,
        usage_instructions: newProductInstructions || undefined,
        price: newProductPrice ? parseFloat(newProductPrice) : undefined,
        purchase_url: newProductUrl || undefined,
      });
      setSavingProduct(false);
      
      if (result.success) {
        toast({ title: 'Success', description: 'Product updated!' });
        setShowEditProductModal(false);
        setSelectedCatalogProduct(null);
        resetProductForm();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update product', variant: 'destructive' });
      }
    };

    const handleDeleteProduct = async (productId: string) => {
      if (!confirm('Are you sure you want to delete this product?')) return;
      
      const result = await productCatalog.deleteProduct(productId);
      if (result.success) {
        toast({ title: 'Success', description: 'Product deleted' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete product', variant: 'destructive' });
      }
    };

    const resetProductForm = () => {
      setNewProductName('');
      setNewProductBrand('');
      setNewProductCategory('');
      setNewProductDescription('');
      setNewProductIngredients('');
      setNewProductSkinTypes([]);
      setNewProductInstructions('');
      setNewProductPrice('');
      setNewProductUrl('');
    };

    const openEditModal = (product: CatalogProduct) => {
      setSelectedCatalogProduct(product);
      setNewProductName(product.name);
      setNewProductBrand(product.brand);
      setNewProductCategory(product.category);
      setNewProductDescription(product.description || '');
      setNewProductIngredients(product.ingredients.join(', '));
      setNewProductSkinTypes(product.skin_types);
      setNewProductInstructions(product.usage_instructions || '');
      setNewProductPrice(product.price?.toString() || '');
      setNewProductUrl(product.purchase_url || '');
      setShowEditProductModal(true);
    };

    const toggleSkinType = (skinType: string) => {
      setNewProductSkinTypes(prev => 
        prev.includes(skinType) 
          ? prev.filter(t => t !== skinType)
          : [...prev, skinType]
      );
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">Product Library</h2>
            <p className="text-gray-500">Manage your skincare product catalog</p>
          </div>
          <button
            onClick={() => { resetProductForm(); setShowAddProductModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, brand, or ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
            >
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-[#CFAFA3]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{myProducts.length}</p>
                <p className="text-xs text-gray-500">My Products</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Beaker className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{allProducts.length}</p>
                <p className="text-xs text-gray-500">Total Products</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{new Set(allProducts.map(p => p.category)).size}</p>
                <p className="text-xs text-gray-500">Categories</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{new Set(allProducts.map(p => p.brand)).size}</p>
                <p className="text-xs text-gray-500">Brands</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {productCatalog.loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!productCatalog.loading && filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-[#CFAFA3]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
              {searchQuery || productFilter !== 'all' ? 'No Products Found' : 'No Products Yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || productFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first product to start building your catalog'}
            </p>
            {!searchQuery && productFilter === 'all' && (
              <button
                onClick={() => { resetProductForm(); setShowAddProductModal(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" /> Add Your First Product
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!productCatalog.loading && filteredProducts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  {product.professional_id === user?.id && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-[#CFAFA3] text-white text-xs rounded-full">
                      My Product
                    </div>
                  )}
                  {product.price && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 text-gray-900 text-sm font-medium rounded-full flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {product.price.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-[#CFAFA3] font-medium mb-1">{product.brand}</p>
                      <h4 className="font-medium text-gray-900 line-clamp-1">{product.name}</h4>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex-shrink-0">{product.category}</span>
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                  )}

                  {/* Skin Types */}
                  {product.skin_types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.skin_types.slice(0, 3).map((type, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-xs rounded-full">{type}</span>
                      ))}
                      {product.skin_types.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{product.skin_types.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      {product.professional_id === user?.id && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                      {product.purchase_url && (
                        <a
                          href={product.purchase_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Product"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCatalogProduct(product);
                        setShowRecommendProductModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                    >
                      <Heart className="w-4 h-4" /> Recommend
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold">Add New Product</h3>
                <button onClick={() => setShowAddProductModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="e.g., Vitamin C Brightening Serum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                  <input
                    type="text"
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="e.g., SkinAura Essentials"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  >
                    <option value="">Select category...</option>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                  placeholder="Brief product description..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Ingredients (comma-separated)</label>
                <textarea
                  value={newProductIngredients}
                  onChange={(e) => setNewProductIngredients(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                  placeholder="e.g., Vitamin C, Hyaluronic Acid, Niacinamide"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Skin Type Compatibility</label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleSkinType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        newProductSkinTypes.includes(type)
                          ? 'bg-[#CFAFA3] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Usage Instructions</label>
                <textarea
                  value={newProductInstructions}
                  onChange={(e) => setNewProductInstructions(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                  placeholder="e.g., Apply 3-4 drops to clean skin morning and evening..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase URL (Optional)</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={newProductUrl}
                    onChange={(e) => setNewProductUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={savingProduct || !newProductName.trim() || !newProductBrand.trim() || !newProductCategory}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditProductModal && selectedCatalogProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold">Edit Product</h3>
                <button onClick={() => { setShowEditProductModal(false); setSelectedCatalogProduct(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                  <input
                    type="text"
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  >
                    <option value="">Select category...</option>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Ingredients (comma-separated)</label>
                <textarea
                  value={newProductIngredients}
                  onChange={(e) => setNewProductIngredients(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Skin Type Compatibility</label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleSkinType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        newProductSkinTypes.includes(type)
                          ? 'bg-[#CFAFA3] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Usage Instructions</label>
                <textarea
                  value={newProductInstructions}
                  onChange={(e) => setNewProductInstructions(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase URL (Optional)</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={newProductUrl}
                    onChange={(e) => setNewProductUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowEditProductModal(false); setSelectedCatalogProduct(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  disabled={savingProduct || !newProductName.trim() || !newProductBrand.trim() || !newProductCategory}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommend Product Modal */}
        {showRecommendProductModal && selectedCatalogProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold">Recommend Product</h3>
                <button onClick={() => { setShowRecommendProductModal(false); setSelectedCatalogProduct(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                  {selectedCatalogProduct.image_url ? (
                    <img src={selectedCatalogProduct.image_url} alt={selectedCatalogProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#CFAFA3] font-medium">{selectedCatalogProduct.brand}</p>
                  <p className="font-medium text-gray-900">{selectedCatalogProduct.name}</p>
                  <p className="text-sm text-gray-500">{selectedCatalogProduct.category}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
                <select
                  value={selectedClientForRecommend}
                  onChange={(e) => setSelectedClientForRecommend(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                >
                  <option value="">Choose a client...</option>
                  {[...routineManagement.clients.map(c => ({ id: c.id, name: c.full_name || 'Unknown' })), ...clients.map(c => ({ id: c.id, name: c.name }))].map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Client (Optional)</label>
                <textarea
                  value={recommendationNotes}
                  onChange={(e) => setRecommendationNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Why you're recommending this product..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRecommendProductModal(false); setSelectedCatalogProduct(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedClientForRecommend || !selectedCatalogProduct) return;
                    const result = await productCatalog.recommendProduct(selectedClientForRecommend, selectedCatalogProduct.id, recommendationNotes);
                    if (result.success) {
                      toast({ title: 'Success', description: 'Product recommended to client!' });
                      setShowRecommendProductModal(false);
                      setSelectedCatalogProduct(null);
                      setSelectedClientForRecommend('');
                      setRecommendationNotes('');
                    } else {
                      toast({ title: 'Error', description: result.error || 'Failed to recommend product', variant: 'destructive' });
                    }
                  }}
                  disabled={!selectedClientForRecommend}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" /> Recommend
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Client Recommended Products View
  const renderClientRecommendedProducts = () => {
    const recommendedProducts = productCatalog.recommendations;
    const allProducts = productCatalog.products;

    const filteredProducts = allProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = productFilter === 'all' || product.category === productFilter;
      
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="space-y-6">
        {/* Recommended Products Section */}
        {recommendedProducts.length > 0 && (
          <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-2xl p-6 border border-[#CFAFA3]/20">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-[#CFAFA3]" />
              <h3 className="font-serif font-bold text-lg text-gray-900">Recommended For You</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedProducts.map((rec) => rec.product && (
                <div key={rec.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {rec.product.image_url ? (
                        <img src={rec.product.image_url} alt={rec.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#CFAFA3] font-medium">{rec.product.brand}</p>
                      <h4 className="font-medium text-gray-900 line-clamp-1">{rec.product.name}</h4>
                      <p className="text-xs text-gray-500">{rec.product.category}</p>
                      {rec.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">"{rec.notes}"</p>
                      )}
                    </div>
                  </div>
                  {rec.product.purchase_url && (
                    <a
                      href={rec.product.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-[#CFAFA3] text-white rounded-lg text-sm font-medium hover:bg-[#B89A8E] transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" /> Shop Now
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1"
            />
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* All Products */}
        <div>
          <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">Browse Products</h3>
          {productCatalog.loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {product.price && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 text-gray-900 text-sm font-medium rounded-full flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {product.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#CFAFA3] font-medium mb-1">{product.brand}</p>
                    <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{product.category}</span>
                    
                    {product.skin_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.skin_types.slice(0, 2).map((type, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-xs rounded-full">{type}</span>
                        ))}
                      </div>
                    )}

                    {product.usage_instructions && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.usage_instructions}</p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedCatalogProduct(product);
                          setShowProductDetailModal(true);
                        }}
                        className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                      {product.purchase_url && (
                        <a
                          href={product.purchase_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-[#CFAFA3] text-white rounded-lg text-sm font-medium hover:bg-[#B89A8E] transition-colors text-center"
                        >
                          Shop
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Detail Modal */}
        {showProductDetailModal && selectedCatalogProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif font-bold">Product Details</h3>
                <button onClick={() => { setShowProductDetailModal(false); setSelectedCatalogProduct(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl mb-4 overflow-hidden">
                {selectedCatalogProduct.image_url ? (
                  <img src={selectedCatalogProduct.image_url} alt={selectedCatalogProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>

              <p className="text-sm text-[#CFAFA3] font-medium">{selectedCatalogProduct.brand}</p>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedCatalogProduct.name}</h4>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">{selectedCatalogProduct.category}</span>
                {selectedCatalogProduct.price && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">${selectedCatalogProduct.price.toFixed(2)}</span>
                )}
              </div>

              {selectedCatalogProduct.description && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                  <p className="text-sm text-gray-600">{selectedCatalogProduct.description}</p>
                </div>
              )}

              {selectedCatalogProduct.skin_types.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Suitable For</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedCatalogProduct.skin_types.map((type, i) => (
                      <span key={i} className="px-3 py-1 bg-[#CFAFA3]/10 text-[#CFAFA3] text-sm rounded-full">{type}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCatalogProduct.ingredients.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Key Ingredients</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedCatalogProduct.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">{ing}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCatalogProduct.usage_instructions && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">How to Use</h5>
                  <p className="text-sm text-gray-600">{selectedCatalogProduct.usage_instructions}</p>
                </div>
              )}

              {selectedCatalogProduct.purchase_url && (
                <a
                  href={selectedCatalogProduct.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <ShoppingCart className="w-5 h-5" /> Shop Now
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // FAQ View for both clients and professionals
  const renderFAQView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Help & FAQ</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">What is SkinAura PRO?</h3>
            <p className="text-gray-600 text-sm">SkinAura PRO is a professional skincare tracking platform designed for estheticians and their clients. It helps track skincare routines, manage products, analyze progress photos, and monitor client compliance.</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">How do I track my routine?</h3>
            <p className="text-gray-600 text-sm">Simply mark your morning and evening routines as complete each day. You'll earn points and build streaks for consistency!</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">How does the gamification work?</h3>
            <p className="text-gray-600 text-sm">Complete routines to earn 50 points each, with bonus points for maintaining streaks. Progress through Bronze, Silver, Gold, Platinum, and Diamond levels.</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">Can I upload progress photos?</h3>
            <p className="text-gray-600 text-sm">Yes! Upload before, after, and progress photos to track your skincare journey. Your professional can view and provide feedback on these photos.</p>
          </div>
          
          {userRole === 'professional' && (
            <>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-2">How do I add clients?</h3>
                <p className="text-gray-600 text-sm">Go to "My Clients" and click "Add Client". Enter your client's email address - they must have already signed up as a client on SkinAura PRO.</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-2">How do I create routines for clients?</h3>
                <p className="text-gray-600 text-sm">Go to "Manage Routines" to create routine templates. Add steps with products and instructions, then assign the routine to specific clients.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );


  // Main content router
  // Main content router
  const renderContent = () => {
    // Get all display clients for TreatmentPlanManager
    const registeredClients = routineManagement.clients.map((c, idx) => ({
      id: c.id,
      name: c.full_name || c.email || 'Unknown Client',
      image: c.avatar_url || CLIENT_IMAGES[idx % CLIENT_IMAGES.length],
      phone: c.phone || '',
      email: c.email || '',
      skinType: c.skin_type || 'Not specified',
      concerns: c.concerns || [],
      currentStreak: 0,
      longestStreak: 0,
      level: 'Bronze' as const,
      points: 0,
      compliance: 0,
      lastActive: new Date().toISOString().split('T')[0],
      routineCompletedToday: false,
      isRegistered: true
    }));
    const allDisplayClients = [
      ...registeredClients,
      ...clients.map(c => ({ ...c, isRegistered: false }))
    ];
    if (userRole === 'client') {
      switch (activeView) {
        case 'dashboard': return renderClientDashboard();
        case 'routine': return renderClientRoutine();
        case 'products': return <MyProductsManager />;
        case 'progress': return renderClientProgress();
        case 'treatment-plans': return <ClientTreatmentPlans />;
        case 'achievements': return renderClientAchievements();
        case 'leaderboard': return renderClientLeaderboard();
        case 'faq': return renderFAQView();
        default: return renderClientDashboard();
      }
    } else {
      switch (activeView) {
        case 'dashboard': return renderProfessionalDashboard();
        case 'clients': return renderProfessionalClients();
        case 'photos': return renderProfessionalPhotos();
        case 'routines': return renderProfessionalRoutines();
        case 'treatment-plans': return <TreatmentPlanManager clients={allDisplayClients} />;
        case 'analytics': return renderProfessionalAnalytics();
        case 'products': return <ProfessionalProductManager />;
        case 'faq': return renderFAQView();
        default: return renderProfessionalDashboard();
      }
    }
  };






  // Handle file selection for photo upload
  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    const result = await progressPhotos.uploadPhoto(
      file,
      uploadPhotoType,
      uploadPhotoTitle || undefined,
      uploadPhotoNotes || undefined
    );

    if (result.success) {
      toast({ title: 'Success', description: 'Photo uploaded successfully!' });
      setShowUploadModal(false);
      setUploadPhotoTitle('');
      setUploadPhotoNotes('');
      setUploadPhotoType('progress');
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to upload photo', variant: 'destructive' });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Client Progress Photos View
  const renderClientProgress = () => {
    const photosByMonth = progressPhotos.getPhotosByMonth();
    const monthKeys = Object.keys(photosByMonth).sort().reverse();

    return (
      <div className="space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoFileSelect}
          className="hidden"
        />

        {/* Header with upload button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">Progress Photos</h2>
            <p className="text-gray-500">Track your skincare journey with before and after photos</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Upload className="w-5 h-5" /> Upload Photo
          </button>
        </div>

        {/* Loading State */}
        {progressPhotos.loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!progressPhotos.loading && progressPhotos.photos.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-[#CFAFA3]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Photos Yet</h3>
            <p className="text-gray-500 mb-6">Start documenting your skincare journey by uploading your first photo</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Camera className="w-5 h-5" /> Upload Your First Photo
            </button>
          </div>
        )}

        {/* Photos Timeline */}
        {!progressPhotos.loading && progressPhotos.photos.length > 0 && (
          <div className="space-y-8">
            {monthKeys.map((monthKey) => {
              const [year, month] = monthKey.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const monthPhotos = photosByMonth[monthKey];

              return (
                <div key={monthKey}>
                  <h3 className="font-serif font-bold text-lg text-gray-900 mb-4">{monthName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {monthPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowPhotoModal(true);
                        }}
                        className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square bg-gray-100"
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.title || 'Progress photo'}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              photo.photo_type === 'before' ? 'bg-blue-500 text-white' :
                              photo.photo_type === 'after' ? 'bg-green-500 text-white' :
                              'bg-purple-500 text-white'
                            }`}>
                              {photo.photo_type.charAt(0).toUpperCase() + photo.photo_type.slice(1)}
                            </span>
                            {photo.title && (
                              <p className="text-white text-sm mt-1 truncate">{photo.title}</p>
                            )}
                          </div>
                        </div>
                        {photo.comments.length > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[#CFAFA3] rounded-full flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold">Upload Progress Photo</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['before', 'after', 'progress'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setUploadPhotoType(type)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          uploadPhotoType === type
                            ? type === 'before' ? 'bg-blue-500 text-white' :
                              type === 'after' ? 'bg-green-500 text-white' :
                              'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                  <input
                    type="text"
                    value={uploadPhotoTitle}
                    onChange={(e) => setUploadPhotoTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="e.g., Week 4 Progress"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={uploadPhotoNotes}
                    onChange={(e) => setUploadPhotoNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                    rows={3}
                    placeholder="Any observations about your skin..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={progressPhotos.uploading}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {progressPhotos.uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Select Photo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Detail Modal */}
        {/* Photo Detail Modal - Client View with Annotations */}
        {showPhotoModal && selectedPhoto && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-5xl my-8">
              <button
                onClick={() => { setShowPhotoModal(false); setSelectedPhoto(null); }}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Photo with Annotations */}
                  <div className="relative bg-gray-900 min-h-[400px] md:min-h-[550px]">
                    {photoAnnotations.loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    ) : photoAnnotations.annotations.length > 0 ? (
                      <AnnotationViewer
                        imageUrl={selectedPhoto.photo_url}
                        annotations={photoAnnotations.annotations}
                        showControls={true}
                        className="h-full"
                      />
                    ) : (
                      <img
                        src={selectedPhoto.photo_url}
                        alt={selectedPhoto.title || 'Progress photo'}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Details & Comments */}
                  <div className="p-6 flex flex-col max-h-[550px]">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPhoto.photo_type === 'before' ? 'bg-blue-100 text-blue-700' :
                          selectedPhoto.photo_type === 'after' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {selectedPhoto.photo_type.charAt(0).toUpperCase() + selectedPhoto.photo_type.slice(1)}
                        </span>
                        {photoAnnotations.annotations.length > 0 && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#CFAFA3]/10 text-[#CFAFA3] flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            {photoAnnotations.annotations.length} Markup{photoAnnotations.annotations.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedPhoto.taken_at).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>

                    {selectedPhoto.title && (
                      <h3 className="font-serif font-bold text-xl text-gray-900 mb-2">{selectedPhoto.title}</h3>
                    )}

                    {selectedPhoto.notes && (
                      <p className="text-gray-600 mb-4">{selectedPhoto.notes}</p>
                    )}

                    {/* Professional Annotations Info */}
                    {photoAnnotations.annotations.length > 0 && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl border border-[#CFAFA3]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Edit className="w-5 h-5 text-[#CFAFA3]" />
                          <h4 className="font-medium text-gray-900">Professional Markup Available</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Your skincare professional has marked up this photo with feedback. 
                          Use the controls on the image to view the annotations.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {photoAnnotations.annotations.map((ann, idx) => (
                            <div key={ann.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                              <span className="w-5 h-5 rounded-full bg-[#CFAFA3] text-white text-xs flex items-center justify-center font-medium">
                                {idx + 1}
                              </span>
                              <span className="text-sm text-gray-700">{ann.title || 'Markup'}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(ann.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Professional Feedback ({selectedPhoto.comments.length})
                      </h4>

                      {selectedPhoto.comments.length === 0 && photoAnnotations.annotations.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No feedback yet</p>
                      ) : selectedPhoto.comments.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Check the image markup for visual feedback from your professional
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedPhoto.comments.map((comment) => (
                            <div key={comment.id} className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete this photo?')) return;
                          const result = await progressPhotos.deletePhoto(selectedPhoto.id);
                          if (result.success) {
                            toast({ title: 'Success', description: 'Photo deleted' });
                            setShowPhotoModal(false);
                            setSelectedPhoto(null);
                          } else {
                            toast({ title: 'Error', description: result.error || 'Failed to delete photo', variant: 'destructive' });
                          }
                        }}
                        className="w-full py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // Professional Photos View
  // Professional Photos View
  const renderProfessionalPhotos = () => {
    // Use the top-level photoSearchQuery state (defined at line 319)
    // DO NOT declare useState here - it causes React Error #310
    

    const clientLookup = new Map<string, { name: string; image: string; email: string }>();
    routineManagement.clients.forEach((c, idx) => {
      clientLookup.set(c.id, {
        name: c.full_name || c.email || 'Unknown Client',
        image: c.avatar_url || CLIENT_IMAGES[idx % CLIENT_IMAGES.length],
        email: c.email || ''
      });
    });
    
    // Also add demo clients to lookup
    clients.forEach(c => {
      if (!clientLookup.has(c.id)) {
        clientLookup.set(c.id, {
          name: c.name,
          image: c.image,
          email: c.email
        });
      }
    });
    
    // Get all clients for dropdown (registered + demo)
    const allClientsForFilter = [
      ...routineManagement.clients.map((c, idx) => ({
        id: c.id,
        name: c.full_name || c.email || 'Unknown Client',
        isRegistered: true
      })),
      ...clients.map(c => ({
        id: c.id,
        name: c.name,
        isRegistered: false
      }))
    ];
    
    // Filter photos by selected client and search query
    let filteredPhotos = selectedClientForPhotos 
      ? progressPhotos.getClientPhotos(selectedClientForPhotos)
      : progressPhotos.photos;
    
    // Apply search filter
    if (photoSearchQuery.trim()) {
      const query = photoSearchQuery.toLowerCase();
      filteredPhotos = filteredPhotos.filter(photo => {
        const clientInfo = clientLookup.get(photo.client_id);
        const clientName = clientInfo?.name.toLowerCase() || '';
        const photoTitle = photo.title?.toLowerCase() || '';
        return clientName.includes(query) || photoTitle.includes(query);
      });
    }

    // Handler to open client profile from photo
    const handleViewClientProfile = (clientId: string) => {
      const clientInfo = clientLookup.get(clientId);
      const registeredClient = routineManagement.clients.find(c => c.id === clientId);
      const demoClient = clients.find(c => c.id === clientId);
      
      if (registeredClient) {
        setSelectedClientForProfile({
          id: registeredClient.id,
          email: registeredClient.email || '',
          full_name: registeredClient.full_name,
          avatar_url: registeredClient.avatar_url,
          phone: registeredClient.phone,
          skin_type: registeredClient.skin_type,
          concerns: registeredClient.concerns
        });
      } else if (demoClient) {
        setSelectedClientForProfile({
          id: demoClient.id,
          email: demoClient.email,
          full_name: demoClient.name,
          avatar_url: demoClient.image,
          phone: demoClient.phone,
          skin_type: demoClient.skinType,
          concerns: demoClient.concerns
        });
      }
      setShowClientProfileModal(true);
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900">Client Progress Photos</h2>
            <p className="text-gray-500">View and provide feedback on client photos</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name or photo title..."
              value={photoSearchQuery}
              onChange={(e) => setPhotoSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1"
            />
            {photoSearchQuery && (
              <button onClick={() => setPhotoSearchQuery('')} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <select
            value={selectedClientForPhotos}
            onChange={(e) => setSelectedClientForPhotos(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none min-w-[200px]"
          >
            <option value="">All Clients</option>
            {allClientsForFilter.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.isRegistered ? '(Registered)' : '(Demo)'}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#CFAFA3]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{progressPhotos.photos.length}</p>
                <p className="text-xs text-gray-500">Total Photos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {progressPhotos.photos.filter(p => p.photo_type === 'before').length}
                </p>
                <p className="text-xs text-gray-500">Before Photos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Image className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {progressPhotos.photos.filter(p => p.photo_type === 'after').length}
                </p>
                <p className="text-xs text-gray-500">After Photos</p>
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
                  {new Set(progressPhotos.photos.map(p => p.client_id)).size}
                </p>
                <p className="text-xs text-gray-500">Clients with Photos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {progressPhotos.loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!progressPhotos.loading && filteredPhotos.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-[#CFAFA3]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
              {photoSearchQuery ? 'No Photos Found' : 'No Photos Yet'}
            </h3>
            <p className="text-gray-500">
              {photoSearchQuery 
                ? `No photos match "${photoSearchQuery}". Try a different search.`
                : 'Client progress photos will appear here when they upload them.'}
            </p>
          </div>
        )}

        {/* Photos Grid - Now with client names always visible */}
        {!progressPhotos.loading && filteredPhotos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => {
              const clientInfo = clientLookup.get(photo.client_id);
              const clientName = clientInfo?.name || 'Unknown Client';
              const clientImage = clientInfo?.image || CLIENT_IMAGES[0];
              const isRegistered = routineManagement.clients.some(c => c.id === photo.client_id);
              const photoTypeLabel = photo.photo_type.charAt(0).toUpperCase() + photo.photo_type.slice(1);
              const photoTypeClass = photo.photo_type === 'before' 
                ? 'bg-blue-500 text-white' 
                : photo.photo_type === 'after' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-purple-500 text-white';
              
              return (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Photo */}
                  <div
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setShowPhotoModal(true);
                    }}
                    className="relative cursor-pointer aspect-square bg-gray-100"
                  >
                    <img
                      src={photo.photo_url}
                      alt={photo.title || 'Progress photo'}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    {/* Photo type badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${photoTypeClass}`}>
                        {photoTypeLabel}
                      </span>
                    </div>
                    {/* Comment indicator */}
                    {photo.comments.length > 0 && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-[#CFAFA3] rounded-full flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {/* Date */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 rounded-lg">
                      <p className="text-white text-xs">
                        {new Date(photo.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Client Info - Always Visible */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img 
                        src={clientImage} 
                        alt={clientName} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{clientName}</p>
                          {isRegistered && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-medium flex-shrink-0">
                              Registered
                            </span>
                          )}
                        </div>
                        {photo.title && (
                          <p className="text-xs text-gray-500 truncate">{photo.title}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleViewClientProfile(photo.client_id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-[#CFAFA3] hover:bg-[#CFAFA3]/10 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" /> View Profile
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowPhotoModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#CFAFA3] text-white rounded-lg text-sm font-medium hover:bg-[#B89A8E] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> Feedback
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}





        {showPhotoModal && selectedPhoto && !showMarkupEditor && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl">
              <button
                onClick={() => { setShowPhotoModal(false); setSelectedPhoto(null); setNewComment(''); }}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="grid md:grid-cols-2">
                  {/* Photo */}
                  <div className="relative bg-black">
                    <img
                      src={selectedPhoto.photo_url}
                      alt={selectedPhoto.title || 'Progress photo'}
                      className="w-full h-[400px] md:h-[500px] object-contain"
                    />
                  </div>

                  {/* Details & Comments */}
                  <div className="p-6 flex flex-col max-h-[500px]">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPhoto.photo_type === 'before' ? 'bg-blue-100 text-blue-700' :
                          selectedPhoto.photo_type === 'after' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {selectedPhoto.photo_type.charAt(0).toUpperCase() + selectedPhoto.photo_type.slice(1)}
                        </span>
                        {/* Annotate Button */}
                        <button
                          onClick={() => setShowMarkupEditor(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                        >
                          <Edit className="w-4 h-4" /> Annotate Photo
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(selectedPhoto.taken_at).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>

                    {selectedPhoto.title && (
                      <h3 className="font-serif font-bold text-xl text-gray-900 mb-2">{selectedPhoto.title}</h3>
                    )}

                    {selectedPhoto.notes && (
                      <p className="text-gray-600 mb-4">{selectedPhoto.notes}</p>
                    )}

                    {/* Saved Annotations Section */}
                    {photoAnnotations.annotations.length > 0 && (
                      <div className="mb-4 p-3 bg-[#CFAFA3]/10 rounded-xl border border-[#CFAFA3]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Edit className="w-4 h-4 text-[#CFAFA3]" />
                          <h4 className="font-medium text-gray-900 text-sm">Image Markups ({photoAnnotations.annotations.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {photoAnnotations.annotations.map((ann) => (
                            <div key={ann.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{ann.title || 'Untitled markup'}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(ann.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowMarkupEditor(true)}
                          className="w-full mt-2 py-1.5 text-[#CFAFA3] hover:bg-[#CFAFA3]/10 rounded-lg text-sm font-medium transition-colors"
                        >
                          Add New Markup
                        </button>
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Feedback ({selectedPhoto.comments.length})
                      </h4>

                      {selectedPhoto.comments.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No feedback yet</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedPhoto.comments.map((comment) => (
                            <div key={comment.id} className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Comment */}
                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
                          placeholder="Add feedback..."
                        />
                        <button
                          onClick={async () => {
                            if (!newComment.trim()) return;
                            const result = await progressPhotos.addComment(selectedPhoto.id, newComment);
                            if (result.success) {
                              toast({ title: 'Success', description: 'Feedback added!' });
                              setNewComment('');
                              // Refresh the selected photo
                              const updated = progressPhotos.photos.find(p => p.id === selectedPhoto.id);
                              if (updated) setSelectedPhoto(updated);
                            } else {
                              toast({ title: 'Error', description: result.error || 'Failed to add feedback', variant: 'destructive' });
                            }
                          }}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Markup Editor */}
        {showMarkupEditor && selectedPhoto && (
          <ImageMarkupEditor
            imageUrl={selectedPhoto.photo_url}
            initialAnnotations={photoAnnotations.annotations.length > 0 ? photoAnnotations.annotations[0].annotation_data : undefined}
            saving={photoAnnotations.saving}
            onSave={async (annotationData) => {
              const result = await photoAnnotations.saveAnnotation(
                annotationData,
                `Markup for ${selectedPhoto.title || 'Progress Photo'}`,
                `Annotated on ${new Date().toLocaleDateString()}`
              );
              if (result.success) {
                toast({ title: 'Success', description: 'Markup saved successfully!' });
                setShowMarkupEditor(false);
              } else {
                toast({ title: 'Error', description: result.error || 'Failed to save markup', variant: 'destructive' });
              }
            }}
            onCancel={() => setShowMarkupEditor(false)}
          />
        )}
      </div>
    );
  };









  // If not logged in, show landing page
  if (!isLoggedIn) {
    return renderLandingPage();
  }

  // Main App Layout
  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      <div className="flex">
        {renderSidebar()}

        {/* Overlay for mobile */}
        {sidebarOpen && isMobile && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {renderHeader()}
          <div className="p-4 lg:p-8">
            {renderContent()}
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-100 bg-white mt-8">
            <div className="px-4 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#2D2A3E]" />
                  </div>
                  <span className="font-serif font-bold text-gray-900">SkinAura PRO</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <a href="https://skinaura.ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#CFAFA3] transition-colors">SkinAura AI</a>
                  <a href="https://skinaura-ai.myshopify.com/pages/app-skin-analysis-page" target="_blank" rel="noopener noreferrer" className="hover:text-[#CFAFA3] transition-colors">SkinAura Scan</a>
                  <a href="https://skinaura.circle.so/" target="_blank" rel="noopener noreferrer" className="hover:text-[#CFAFA3] transition-colors">Community</a>

                  <span>© 2025 SkinAura AI. Skincare is Selfcare.</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* SMS Modal */}
      {showSMSModal && selectedClientForSMS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Send SMS Reminder</h3>
              <button onClick={() => setShowSMSModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <img src={selectedClientForSMS.image} alt={selectedClientForSMS.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-medium">{selectedClientForSMS.name}</p>
                <p className="text-sm text-gray-500">{selectedClientForSMS.phone}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                rows={4}
                placeholder="Enter your message..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSMSModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendSMSReminder}
                disabled={sendingSMS || !smsMessage.trim()}
                className="flex-1 py-3 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingSMS ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send SMS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Modal */}
      {showReorderModal && reorderProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-2">Time to Reorder!</h3>
              <p className="text-gray-600">You've been using this product consistently for 25+ days. Time to stock up!</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <img src={reorderProduct.image} alt={reorderProduct.name} className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <p className="text-xs text-[#CFAFA3] font-medium">{reorderProduct.brand}</p>
                <p className="font-medium">{reorderProduct.name}</p>
                <p className="text-sm text-gray-500">{reorderProduct.daysUsed} days of consistent use</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReorderModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Remind Later
              </button>
              <button
                onClick={() => {
                  setShowReorderModal(false);
                  // Would link to product purchase page
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Reorder Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Add Client to Your Practice</h3>
              <button onClick={() => { setShowAddClientModal(false); setAddClientEmail(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-[#CFAFA3]" />
              </div>
              <p className="text-center text-gray-600 text-sm">
                Enter your client's email address to connect them to your practice. They must have already signed up as a client on SkinAura PRO.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Email Address</label>
              <input
                type="email"
                value={addClientEmail}
                onChange={(e) => setAddClientEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                placeholder="client@email.com"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddClientModal(false); setAddClientEmail(''); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!addClientEmail.trim()) {
                    toast({ title: 'Error', description: 'Please enter an email address', variant: 'destructive' });
                    return;
                  }
                  setAddingClient(true);
                  const result = await routineManagement.addClientByEmail(addClientEmail.trim());
                  setAddingClient(false);
                  if (result.success) {
                    toast({ title: 'Success', description: `${result.client?.full_name || 'Client'} has been added to your practice!` });
                    setShowAddClientModal(false);
                    setAddClientEmail('');
                  } else {
                    toast({ title: 'Error', description: result.error || 'Failed to add client', variant: 'destructive' });
                  }
                }}
                disabled={addingClient || !addClientEmail.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingClient ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Add Client
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">
                <strong>Note:</strong> If your client hasn't signed up yet, ask them to create an account at SkinAura PRO first, then you can add them using their email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Client Profile Modal */}
      {showClientProfileModal && selectedClientForProfile && (
        <ClientProfileModal
          isOpen={showClientProfileModal}
          onClose={() => {
            setShowClientProfileModal(false);
            setSelectedClientForProfile(null);
          }}
          client={selectedClientForProfile}
        />
      )}
    </div>
  );
};

export default AppLayout;
