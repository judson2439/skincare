/**
 * @fileoverview Interactive API Documentation Page
 * 
 * This page provides comprehensive documentation for all available API endpoints
 * in the SkinAura PRO application. It includes:
 * - Endpoint listings with descriptions
 * - Parameter documentation
 * - Example request/response bodies
 * - Interactive "Try It" feature for testing endpoints
 * 
 * @module pages/ApiDocs
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Book,
  Code,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Search,
  Filter,
  Sparkles,
  Send,
  Shield,
  Key,
  FileJson,
  Terminal,
  ExternalLink,
  Info,
  Zap
} from 'lucide-react';

/**
 * Represents an API endpoint parameter
 * @interface EndpointParameter
 */
interface EndpointParameter {
  /** Parameter name */
  name: string;
  /** Parameter data type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Whether the parameter is required */
  required: boolean;
  /** Description of the parameter */
  description: string;
  /** Example value for the parameter */
  example?: any;
  /** Default value if not provided */
  defaultValue?: any;
}

/**
 * Represents an API endpoint definition
 * @interface ApiEndpoint
 */
interface ApiEndpoint {
  /** Unique identifier for the endpoint */
  id: string;
  /** Display name of the endpoint */
  name: string;
  /** Edge function name */
  functionName: string;
  /** HTTP method (POST for edge functions) */
  method: 'POST';
  /** Brief description of what the endpoint does */
  description: string;
  /** Detailed documentation */
  details?: string;
  /** Category for grouping */
  category: 'authentication' | 'notifications' | 'appointments' | 'photos' | 'products' | 'analytics';
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** Request parameters */
  parameters: EndpointParameter[];
  /** Example request body */
  exampleRequest: object;
  /** Example response body */
  exampleResponse: object;
  /** Response status codes */
  responseCodes: { code: number; description: string }[];
}

/**
 * API endpoint definitions for all available edge functions
 * @constant
 */
const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'secure-auth',
    name: 'Secure Authentication',
    functionName: 'secure-auth',
    method: 'POST',
    description: 'Handle secure user authentication with JWT tokens stored in httpOnly cookies',
    details: 'This endpoint provides secure authentication with CSRF protection, input validation, and XSS sanitization. It supports signup, signin, signout, password reset, and session verification.',
    category: 'authentication',
    requiresAuth: false,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'Authentication action to perform', example: 'signin' },
      { name: 'email', type: 'string', required: true, description: 'User email address', example: 'user@example.com' },
      { name: 'password', type: 'string', required: true, description: 'User password (min 8 chars)', example: 'SecurePass123!' },
      { name: 'role', type: 'string', required: false, description: 'User role (for signup)', example: 'client', defaultValue: 'client' },
      { name: 'fullName', type: 'string', required: false, description: 'Full name (for signup)', example: 'John Doe' },
      { name: 'csrfToken', type: 'string', required: false, description: 'CSRF token for protected actions' }
    ],
    exampleRequest: {
      action: 'signin',
      email: 'user@example.com',
      password: 'SecurePass123!'
    },
    exampleResponse: {
      success: true,
      user: {
        id: 'uuid-here',
        email: 'user@example.com',
        role: 'client'
      },
      csrfToken: 'generated-csrf-token'
    },
    responseCodes: [
      { code: 200, description: 'Authentication successful' },
      { code: 400, description: 'Invalid request parameters' },
      { code: 401, description: 'Invalid credentials' },
      { code: 429, description: 'Rate limit exceeded' }
    ]
  },
  {
    id: 'send-sms-reminder',
    name: 'Send SMS Reminder',
    functionName: 'send-sms-reminder',
    method: 'POST',
    description: 'Send SMS reminders to clients via Twilio integration',
    details: 'Sends personalized SMS messages to clients reminding them about their skincare routines. Uses Twilio for message delivery.',
    category: 'notifications',
    requiresAuth: true,
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Recipient phone number (E.164 format)', example: '+1234567890' },
      { name: 'message', type: 'string', required: true, description: 'SMS message content (max 160 chars)', example: 'Don\'t forget your evening routine!' },
      { name: 'clientName', type: 'string', required: false, description: 'Client name for personalization', example: 'Sarah' },
      { name: 'professionalName', type: 'string', required: false, description: 'Professional name for signature', example: 'Dr. Smith' }
    ],
    exampleRequest: {
      to: '+1234567890',
      message: 'Hi Sarah! Don\'t forget your evening skincare routine today.',
      clientName: 'Sarah',
      professionalName: 'Dr. Smith'
    },
    exampleResponse: {
      success: true,
      messageId: 'SM1234567890abcdef',
      status: 'sent'
    },
    responseCodes: [
      { code: 200, description: 'SMS sent successfully' },
      { code: 400, description: 'Invalid phone number or message' },
      { code: 401, description: 'Unauthorized - authentication required' },
      { code: 500, description: 'Twilio service error' }
    ]
  },
  {
    id: 'check-send-reminders',
    name: 'Check & Send Scheduled Reminders',
    functionName: 'check-send-reminders',
    method: 'POST',
    description: 'Check for pending reminders and send them automatically',
    details: 'This endpoint is typically called by a scheduled job to check for clients who need reminders and send them automatically based on their preferences.',
    category: 'notifications',
    requiresAuth: true,
    parameters: [
      { name: 'dryRun', type: 'boolean', required: false, description: 'If true, only check without sending', example: false, defaultValue: false },
      { name: 'limit', type: 'number', required: false, description: 'Maximum reminders to process', example: 100, defaultValue: 100 }
    ],
    exampleRequest: {
      dryRun: false,
      limit: 50
    },
    exampleResponse: {
      success: true,
      processed: 12,
      sent: 10,
      skipped: 2,
      errors: []
    },
    responseCodes: [
      { code: 200, description: 'Reminders processed successfully' },
      { code: 401, description: 'Unauthorized' },
      { code: 500, description: 'Processing error' }
    ]
  },
  {
    id: 'manage-appointments',
    name: 'Manage Appointments',
    functionName: 'manage-appointments',
    method: 'POST',
    description: 'Create, update, cancel, and retrieve appointments',
    details: 'Comprehensive appointment management including scheduling, rescheduling, cancellation, and availability checking.',
    category: 'appointments',
    requiresAuth: true,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'Action to perform (create, update, cancel, list, check-availability)', example: 'create' },
      { name: 'appointmentId', type: 'string', required: false, description: 'Appointment ID (for update/cancel)', example: 'apt-123' },
      { name: 'clientId', type: 'string', required: false, description: 'Client ID', example: 'client-456' },
      { name: 'professionalId', type: 'string', required: false, description: 'Professional ID', example: 'pro-789' },
      { name: 'dateTime', type: 'string', required: false, description: 'Appointment date/time (ISO 8601)', example: '2025-12-15T10:00:00Z' },
      { name: 'duration', type: 'number', required: false, description: 'Duration in minutes', example: 60, defaultValue: 60 },
      { name: 'type', type: 'string', required: false, description: 'Appointment type', example: 'consultation' },
      { name: 'notes', type: 'string', required: false, description: 'Additional notes', example: 'First-time client' }
    ],
    exampleRequest: {
      action: 'create',
      clientId: 'client-456',
      professionalId: 'pro-789',
      dateTime: '2025-12-15T10:00:00Z',
      duration: 60,
      type: 'consultation',
      notes: 'Discuss skincare routine'
    },
    exampleResponse: {
      success: true,
      appointment: {
        id: 'apt-new-123',
        clientId: 'client-456',
        professionalId: 'pro-789',
        dateTime: '2025-12-15T10:00:00Z',
        duration: 60,
        status: 'confirmed'
      }
    },
    responseCodes: [
      { code: 200, description: 'Action completed successfully' },
      { code: 400, description: 'Invalid parameters' },
      { code: 401, description: 'Unauthorized' },
      { code: 404, description: 'Appointment not found' },
      { code: 409, description: 'Time slot not available' }
    ]
  },
  {
    id: 'notify-photo-feedback',
    name: 'Notify Photo Feedback',
    functionName: 'notify-photo-feedback',
    method: 'POST',
    description: 'Send notifications when professionals provide feedback on client photos',
    details: 'Notifies clients via SMS or push notification when their skincare professional has reviewed and provided feedback on their progress photos.',
    category: 'photos',
    requiresAuth: true,
    parameters: [
      { name: 'photoId', type: 'string', required: true, description: 'Progress photo ID', example: 'photo-123' },
      { name: 'clientId', type: 'string', required: true, description: 'Client ID to notify', example: 'client-456' },
      { name: 'feedbackType', type: 'string', required: true, description: 'Type of feedback (comment, annotation, both)', example: 'comment' },
      { name: 'message', type: 'string', required: false, description: 'Custom notification message', example: 'Your professional has reviewed your photo!' },
      { name: 'notificationMethod', type: 'string', required: false, description: 'How to notify (sms, push, both)', example: 'both', defaultValue: 'both' }
    ],
    exampleRequest: {
      photoId: 'photo-123',
      clientId: 'client-456',
      feedbackType: 'annotation',
      message: 'Dr. Smith has marked up your progress photo with feedback!',
      notificationMethod: 'both'
    },
    exampleResponse: {
      success: true,
      notificationsSent: {
        sms: true,
        push: true
      }
    },
    responseCodes: [
      { code: 200, description: 'Notification sent successfully' },
      { code: 400, description: 'Invalid parameters' },
      { code: 401, description: 'Unauthorized' },
      { code: 404, description: 'Photo or client not found' }
    ]
  },
  {
    id: 'faceage-skin-scan',
    name: 'AI Skin Analysis',
    functionName: 'faceage-skin-scan',
    method: 'POST',
    description: 'Perform AI-powered skin analysis using the FaceAge API',
    details: 'Analyzes uploaded skin photos using advanced AI to detect skin conditions, estimate skin age, and provide personalized recommendations.',
    category: 'analytics',
    requiresAuth: true,
    parameters: [
      { name: 'imageUrl', type: 'string', required: true, description: 'URL of the image to analyze', example: 'https://example.com/photo.jpg' },
      { name: 'imageBase64', type: 'string', required: false, description: 'Base64 encoded image (alternative to URL)' },
      { name: 'analysisType', type: 'string', required: false, description: 'Type of analysis (full, quick, age-only)', example: 'full', defaultValue: 'full' },
      { name: 'includeRecommendations', type: 'boolean', required: false, description: 'Include product recommendations', example: true, defaultValue: true }
    ],
    exampleRequest: {
      imageUrl: 'https://example.com/skin-photo.jpg',
      analysisType: 'full',
      includeRecommendations: true
    },
    exampleResponse: {
      success: true,
      analysis: {
        skinAge: 32,
        actualAge: 35,
        skinType: 'combination',
        concerns: ['fine_lines', 'uneven_tone', 'dehydration'],
        scores: {
          hydration: 65,
          elasticity: 72,
          texture: 78,
          clarity: 70
        },
        recommendations: [
          'Increase hydration with hyaluronic acid serum',
          'Add retinol for fine lines',
          'Use vitamin C for uneven tone'
        ]
      }
    },
    responseCodes: [
      { code: 200, description: 'Analysis completed successfully' },
      { code: 400, description: 'Invalid image or parameters' },
      { code: 401, description: 'Unauthorized' },
      { code: 422, description: 'Could not process image' },
      { code: 500, description: 'AI service error' }
    ]
  },
  {
    id: 'send-push-notification',
    name: 'Send Push Notification',
    functionName: 'send-push-notification',
    method: 'POST',
    description: 'Send push notifications to client devices',
    details: 'Sends push notifications to registered client devices for routine reminders, feedback alerts, and other important updates.',
    category: 'notifications',
    requiresAuth: true,
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'User ID to send notification to', example: 'user-123' },
      { name: 'title', type: 'string', required: true, description: 'Notification title', example: 'Routine Reminder' },
      { name: 'body', type: 'string', required: true, description: 'Notification body text', example: 'Time for your evening routine!' },
      { name: 'data', type: 'object', required: false, description: 'Additional data payload', example: { screen: 'routine' } },
      { name: 'badge', type: 'number', required: false, description: 'Badge count for app icon', example: 1 }
    ],
    exampleRequest: {
      userId: 'user-123',
      title: 'Routine Reminder',
      body: 'Time for your evening skincare routine!',
      data: { screen: 'routine', routineType: 'evening' },
      badge: 1
    },
    exampleResponse: {
      success: true,
      delivered: true,
      messageId: 'push-msg-456'
    },
    responseCodes: [
      { code: 200, description: 'Notification sent successfully' },
      { code: 400, description: 'Invalid parameters' },
      { code: 401, description: 'Unauthorized' },
      { code: 404, description: 'User not found or no device registered' }
    ]
  },
  {
    id: 'shopify-import',
    name: 'Shopify Product Import',
    functionName: 'shopify-import',
    method: 'POST',
    description: 'Import products from a Shopify store',
    details: 'Connects to a Shopify store and imports product catalog including names, descriptions, prices, images, and variants.',
    category: 'products',
    requiresAuth: true,
    parameters: [
      { name: 'action', type: 'string', required: true, description: 'Action to perform (import, sync, list)', example: 'import' },
      { name: 'productIds', type: 'array', required: false, description: 'Specific product IDs to import', example: ['prod-1', 'prod-2'] },
      { name: 'collectionId', type: 'string', required: false, description: 'Import from specific collection', example: 'col-123' },
      { name: 'includeVariants', type: 'boolean', required: false, description: 'Include product variants', example: true, defaultValue: true },
      { name: 'overwriteExisting', type: 'boolean', required: false, description: 'Overwrite existing products', example: false, defaultValue: false }
    ],
    exampleRequest: {
      action: 'import',
      collectionId: 'skincare-collection',
      includeVariants: true,
      overwriteExisting: false
    },
    exampleResponse: {
      success: true,
      imported: 25,
      skipped: 3,
      errors: [],
      products: [
        { id: 'prod-1', name: 'Vitamin C Serum', status: 'imported' },
        { id: 'prod-2', name: 'Moisturizer', status: 'imported' }
      ]
    },
    responseCodes: [
      { code: 200, description: 'Import completed successfully' },
      { code: 400, description: 'Invalid parameters' },
      { code: 401, description: 'Unauthorized or invalid Shopify credentials' },
      { code: 500, description: 'Shopify API error' }
    ]
  }
];

/**
 * Category configuration for filtering and display
 * @constant
 */
const CATEGORIES = [
  { id: 'all', name: 'All Endpoints', icon: Book },
  { id: 'authentication', name: 'Authentication', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Send },
  { id: 'appointments', name: 'Appointments', icon: Zap },
  { id: 'photos', name: 'Photos', icon: FileJson },
  { id: 'products', name: 'Products', icon: Code },
  { id: 'analytics', name: 'Analytics', icon: Terminal }
];

/**
 * Interactive API Documentation Page Component
 * 
 * Provides comprehensive documentation for all API endpoints with
 * interactive testing capabilities.
 * 
 * @component
 * @example
 * ```tsx
 * <ApiDocs />
 * ```
 */
const ApiDocs: React.FC = () => {
  const { user } = useAuth();
  
  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // State for expanded endpoints
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  
  // State for Try It panel
  const [tryItEndpoint, setTryItEndpoint] = useState<ApiEndpoint | null>(null);
  const [tryItParams, setTryItParams] = useState<Record<string, any>>({});
  const [tryItResponse, setTryItResponse] = useState<any>(null);
  const [tryItLoading, setTryItLoading] = useState(false);
  const [tryItError, setTryItError] = useState<string | null>(null);
  
  // State for auth token
  const [authToken, setAuthToken] = useState('');
  
  // State for copied indicators
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /**
   * Filters endpoints based on search query and category
   * @returns {ApiEndpoint[]} Filtered list of endpoints
   */
  const filteredEndpoints = API_ENDPOINTS.filter(endpoint => {
    const matchesSearch = searchQuery === '' ||
      endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.functionName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  /**
   * Toggles the expanded state of an endpoint
   * @param {string} endpointId - The endpoint ID to toggle
   */
  const toggleEndpoint = useCallback((endpointId: string) => {
    setExpandedEndpoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(endpointId)) {
        newSet.delete(endpointId);
      } else {
        newSet.add(endpointId);
      }
      return newSet;
    });
  }, []);

  /**
   * Opens the Try It panel for an endpoint
   * @param {ApiEndpoint} endpoint - The endpoint to test
   */
  const openTryIt = useCallback((endpoint: ApiEndpoint) => {
    setTryItEndpoint(endpoint);
    setTryItParams(endpoint.exampleRequest);
    setTryItResponse(null);
    setTryItError(null);
  }, []);

  /**
   * Executes the API call for the Try It feature
   */
  const executeTryIt = useCallback(async () => {
    if (!tryItEndpoint) return;
    
    setTryItLoading(true);
    setTryItError(null);
    setTryItResponse(null);
    
    try {
      const { data, error } = await supabase.functions.invoke(tryItEndpoint.functionName, {
        body: tryItParams
      });
      
      if (error) {
        setTryItError(error.message || 'Request failed');
        setTryItResponse({ error: error.message, details: error });
      } else {
        setTryItResponse(data);
      }
    } catch (err: any) {
      setTryItError(err.message || 'An unexpected error occurred');
      setTryItResponse({ error: err.message });
    } finally {
      setTryItLoading(false);
    }
  }, [tryItEndpoint, tryItParams]);

  /**
   * Copies text to clipboard
   * @param {string} text - Text to copy
   * @param {string} id - Identifier for showing copied state
   */
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  /**
   * Renders the parameter type badge
   * @param {string} type - Parameter type
   */
  const renderTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      string: 'bg-green-100 text-green-700',
      number: 'bg-blue-100 text-blue-700',
      boolean: 'bg-purple-100 text-purple-700',
      object: 'bg-amber-100 text-amber-700',
      array: 'bg-pink-100 text-pink-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-[#CFAFA3] transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to App</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                  <Book className="w-5 h-5 text-[#2D2A3E]" />
                </div>
                <div>
                  <h1 className="font-serif text-lg font-bold text-[#2D2A3E]">API Documentation</h1>
                  <p className="text-xs text-gray-500">SkinAura PRO v1.0</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Authenticated</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Not Authenticated</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm flex-1"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categories
                </h3>
                <div className="space-y-1">
                  {CATEGORIES.map(category => {
                    const Icon = category.icon;
                    const count = category.id === 'all' 
                      ? API_ENDPOINTS.length 
                      : API_ENDPOINTS.filter(e => e.category === category.id).length;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-[#CFAFA3]/10 text-[#CFAFA3]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{category.name}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedCategory === category.id
                            ? 'bg-[#CFAFA3]/20 text-[#CFAFA3]'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auth Token Input */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Authentication
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Enter your auth token for authenticated endpoints
                </p>
                <input
                  type="password"
                  placeholder="Bearer token..."
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Introduction */}
            <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold mb-2">SkinAura PRO API</h2>
                  <p className="text-white/80 text-sm mb-4">
                    Welcome to the SkinAura PRO API documentation. This API provides endpoints for authentication, 
                    notifications, appointments, photo analysis, and product management.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                      <Code className="w-4 h-4" />
                      <span>Base URL: Supabase Edge Functions</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Auth: JWT + httpOnly Cookies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Endpoints List */}
            <div className="space-y-4">
              {filteredEndpoints.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredEndpoints.map(endpoint => {
                  const isExpanded = expandedEndpoints.has(endpoint.id);
                  
                  return (
                    <div
                      key={endpoint.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Endpoint Header */}
                      <div
                        onClick={() => toggleEndpoint(endpoint.id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-[#CFAFA3] text-white text-xs font-bold rounded">
                            {endpoint.method}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{endpoint.name}</h3>
                              {endpoint.requiresAuth ? (
                                <Lock className="w-4 h-4 text-amber-500" title="Requires authentication" />
                              ) : (
                                <Unlock className="w-4 h-4 text-green-500" title="Public endpoint" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 font-mono">{endpoint.functionName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTryIt(endpoint);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Try It
                          </button>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-6 space-y-6">
                          {/* Description */}
                          <div>
                            <p className="text-gray-600">{endpoint.description}</p>
                            {endpoint.details && (
                              <p className="text-sm text-gray-500 mt-2">{endpoint.details}</p>
                            )}
                          </div>

                          {/* Parameters */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <FileJson className="w-4 h-4" />
                              Parameters
                            </h4>
                            <div className="bg-gray-50 rounded-xl overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Name</th>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Type</th>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Required</th>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.parameters.map((param, idx) => (
                                    <tr key={param.name} className={idx % 2 === 0 ? 'bg-white' : ''}>
                                      <td className="py-2 px-4 font-mono text-[#CFAFA3]">{param.name}</td>
                                      <td className="py-2 px-4">{renderTypeBadge(param.type)}</td>
                                      <td className="py-2 px-4">
                                        {param.required ? (
                                          <span className="text-red-500 font-medium">Yes</span>
                                        ) : (
                                          <span className="text-gray-400">No</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-4 text-gray-600">
                                        {param.description}
                                        {param.defaultValue !== undefined && (
                                          <span className="text-gray-400 ml-1">
                                            (default: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(param.defaultValue)}</code>)
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Example Request */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Example Request
                              </h4>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(endpoint.exampleRequest, null, 2), `req-${endpoint.id}`)}
                                className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-[#CFAFA3] transition-colors text-sm"
                              >
                                {copiedId === `req-${endpoint.id}` ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="bg-[#2D2A3E] text-white p-4 rounded-xl overflow-x-auto text-sm">
                              <code>{JSON.stringify(endpoint.exampleRequest, null, 2)}</code>
                            </pre>
                          </div>

                          {/* Example Response */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                Example Response
                              </h4>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(endpoint.exampleResponse, null, 2), `res-${endpoint.id}`)}
                                className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-[#CFAFA3] transition-colors text-sm"
                              >
                                {copiedId === `res-${endpoint.id}` ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="bg-[#2D2A3E] text-green-400 p-4 rounded-xl overflow-x-auto text-sm">
                              <code>{JSON.stringify(endpoint.exampleResponse, null, 2)}</code>
                            </pre>
                          </div>

                          {/* Response Codes */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              Response Codes
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {endpoint.responseCodes.map(rc => (
                                <div
                                  key={rc.code}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                    rc.code >= 200 && rc.code < 300
                                      ? 'bg-green-50 text-green-700'
                                      : rc.code >= 400 && rc.code < 500
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  <span className="font-mono font-bold">{rc.code}</span>
                                  <span>{rc.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Try It Panel */}
      {tryItEndpoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Try It: {tryItEndpoint.name}</h3>
                  <p className="text-white/80 text-sm font-mono">{tryItEndpoint.functionName}</p>
                </div>
              </div>
              <button
                onClick={() => setTryItEndpoint(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Auth Warning */}
              {tryItEndpoint.requiresAuth && !user && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Authentication Required</p>
                    <p className="text-sm text-amber-700">
                      This endpoint requires authentication. Please sign in to test this endpoint.
                    </p>
                  </div>
                </div>
              )}

              {/* Request Body Editor */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Request Body</h4>
                <textarea
                  value={JSON.stringify(tryItParams, null, 2)}
                  onChange={(e) => {
                    try {
                      setTryItParams(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full h-48 px-4 py-3 bg-[#2D2A3E] text-green-400 font-mono text-sm rounded-xl focus:ring-2 focus:ring-[#CFAFA3] outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Execute Button */}
              <button
                onClick={executeTryIt}
                disabled={tryItLoading || (tryItEndpoint.requiresAuth && !user)}
                className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {tryItLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Execute Request
                  </>
                )}
              </button>

              {/* Response */}
              {(tryItResponse || tryItError) && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      {tryItError ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          Error Response
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Success Response
                        </>
                      )}
                    </h4>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(tryItResponse, null, 2), 'try-it-response')}
                      className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-[#CFAFA3] transition-colors text-sm"
                    >
                      {copiedId === 'try-it-response' ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className={`p-4 rounded-xl overflow-x-auto text-sm ${
                    tryItError
                      ? 'bg-red-50 text-red-700'
                      : 'bg-[#2D2A3E] text-green-400'
                  }`}>
                    <code>{JSON.stringify(tryItResponse, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDocs;
