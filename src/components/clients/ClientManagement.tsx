import React, { useState, useMemo } from 'react';
import { useRoutineManagement, ClientForAssignment, RoutineAssignment } from '@/hooks/useRoutineManagement';
import { useProgressPhotos } from '@/hooks/useProgressPhotos';
import { useClientNotes } from '@/hooks/useClientNotes';
import { useTreatmentHistory } from '@/hooks/useTreatmentHistory';
import { useToast } from '@/hooks/use-toast';
import BulkClientImport from './BulkClientImport';
import ClientNotesSection from './ClientNotesSection';
import TreatmentHistory from './TreatmentHistory';
import PhotoComparison from '../photos/PhotoComparison';
import {
  Users,
  Search,
  Filter,
  Plus,
  UserPlus,
  Eye,
  Camera,
  ClipboardList,
  Trash2,
  X,
  Loader2,
  Mail,
  Droplets,
  AlertCircle,
  ChevronRight,
  Calendar,
  User,
  MoreVertical,
  Check,
  MessageSquare,
  Phone,
  ExternalLink,
  Sparkles,
  Upload,
  FileSpreadsheet,
  StickyNote,
  History,
  Layers
} from 'lucide-react';





// Default avatar images
const DEFAULT_AVATARS = [
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033469330_78107091.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033460880_8c5e20c5.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033472779_08fb4b93.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033468079_20484702.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033471638_05f7651f.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033469659_af60252d.jpg"
];

const SKIN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Oily': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Dry': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Combination': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Normal': { bg: 'bg-green-100', text: 'text-green-700' },
  'Sensitive': { bg: 'bg-pink-100', text: 'text-pink-700' },
};

interface ClientManagementProps {
  onViewClientPhotos?: (clientId: string) => void;
  onViewClientRoutines?: (clientId: string) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({
  onViewClientPhotos,
  onViewClientRoutines,
}) => {
  const routineManagement = useRoutineManagement();
  const progressPhotos = useProgressPhotos();
  const clientNotes = useClientNotes();
  const treatmentHistory = useTreatmentHistory();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>('all');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showClientDetailModal, setShowClientDetailModal] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientForAssignment | null>(null);
  const [addClientEmail, setAddClientEmail] = useState('');
  const [addingClient, setAddingClient] = useState(false);
  const [removingClient, setRemovingClient] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);



  // Get clients from the hook
  const clients = routineManagement.clients;

  // Get existing client emails for bulk import duplicate check
  const existingClientEmails = useMemo(() => {
    return clients.map(c => c.email?.toLowerCase() || '').filter(Boolean);
  }, [clients]);



  // Get unique skin types for filter
  const uniqueSkinTypes = useMemo(() => {
    const types = new Set<string>();
    clients.forEach(client => {
      if (client.skin_type) {
        types.add(client.skin_type);
      }
    });
    return Array.from(types).sort();
  }, [clients]);

  // Filter clients based on search and filters
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        (client.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.skin_concerns?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

      // Skin type filter
      const matchesSkinType = skinTypeFilter === 'all' || client.skin_type === skinTypeFilter;

      return matchesSearch && matchesSkinType;
    });
  }, [clients, searchQuery, skinTypeFilter]);

  // Get client's assigned routines
  const getClientRoutineCount = (clientId: string): number => {
    return routineManagement.getClientAssignments(clientId).length;
  };

  // Get client's photo count
  const getClientPhotoCount = (clientId: string): number => {
    return progressPhotos.getClientPhotos(clientId).length;
  };

  // Get avatar with fallback
  const getClientAvatar = (client: ClientForAssignment, index: number): string => {
    if (client.avatar_url) return client.avatar_url;
    return DEFAULT_AVATARS[index % DEFAULT_AVATARS.length];
  };

  // Handle add client
  const handleAddClient = async () => {
    if (!addClientEmail.trim()) {
      toast({ title: 'Error', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    setAddingClient(true);
    const result = await routineManagement.addClientByEmail(addClientEmail.trim());
    setAddingClient(false);

    if (result.success) {
      toast({ 
        title: 'Client Added!', 
        description: `${result.client?.full_name || 'Client'} has been added to your practice.` 
      });
      setShowAddClientModal(false);
      setAddClientEmail('');
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to add client', variant: 'destructive' });
    }
  };

  // Handle remove client
  const handleRemoveClient = async () => {
    if (!selectedClient) return;

    setRemovingClient(true);
    const result = await routineManagement.removeClient(selectedClient.id);
    setRemovingClient(false);

    if (result.success) {
      toast({ 
        title: 'Client Removed', 
        description: `${selectedClient.full_name || 'Client'} has been removed from your practice.` 
      });
      setShowRemoveConfirmModal(false);
      setShowClientDetailModal(false);
      setSelectedClient(null);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to remove client', variant: 'destructive' });
    }
  };

  // Open client detail modal
  const openClientDetail = (client: ClientForAssignment) => {
    setSelectedClient(client);
    setShowClientDetailModal(true);
    setActiveDropdown(null);
  };

  // Toggle dropdown menu
  const toggleDropdown = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === clientId ? null : clientId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-500">Manage your connected clients and their skincare journeys</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#CFAFA3] text-[#CFAFA3] rounded-xl font-medium hover:bg-[#CFAFA3]/10 transition-all"
          >
            <Upload className="w-5 h-5" /> Bulk Import
          </button>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all"
          >
            <UserPlus className="w-5 h-5" /> Add Client
          </button>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#CFAFA3]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              <p className="text-xs text-gray-500">Total Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{routineManagement.assignments.filter(a => a.is_active).length}</p>
              <p className="text-xs text-gray-500">Active Routines</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{progressPhotos.photos.length}</p>
              <p className="text-xs text-gray-500">Progress Photos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{uniqueSkinTypes.length}</p>
              <p className="text-xs text-gray-500">Skin Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or skin concern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm flex-1"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={skinTypeFilter}
            onChange={(e) => setSkinTypeFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
          >
            <option value="all">All Skin Types</option>
            {uniqueSkinTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {routineManagement.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!routineManagement.loading && clients.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CFAFA3]/20 to-[#E8D5D0]/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-[#CFAFA3]" />
          </div>
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Clients Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start building your practice by adding your first client. They'll need to sign up for SkinAura PRO first, then you can connect with them using their email.
          </p>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all"
          >
            <UserPlus className="w-5 h-5" /> Add Your First Client
          </button>
        </div>
      )}

      {/* No Results State */}
      {!routineManagement.loading && clients.length > 0 && filteredClients.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => { setSearchQuery(''); setSkinTypeFilter('all'); }}
            className="text-[#CFAFA3] font-medium hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Clients Grid */}
      {!routineManagement.loading && filteredClients.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredClients.map((client, index) => {
            const routineCount = getClientRoutineCount(client.id);
            const photoCount = getClientPhotoCount(client.id);
            const noteCount = clientNotes.getNoteCount(client.id);
            const treatmentCount = treatmentHistory.getTreatmentCount(client.id);
            const skinTypeStyle = client.skin_type ? SKIN_TYPE_COLORS[client.skin_type] : null;

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Card Header with gradient */}
                <div className="relative h-24 bg-gradient-to-br from-[#CFAFA3]/30 via-[#E8D5D0]/20 to-[#F9F7F5]">
                  <div className="absolute -bottom-10 left-6">
                    <div className="relative">
                      <img
                        src={getClientAvatar(client, index)}
                        alt={client.full_name || 'Client'}
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                      {/* Client name badge on photo */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-md border border-gray-100 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-800 max-w-[80px] truncate block">
                          {client.full_name?.split(' ')[0] || 'Client'}
                        </span>
                      </div>
                      {client.skin_type && (
                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${skinTypeStyle?.bg || 'bg-gray-100'} flex items-center justify-center border-2 border-white`}>
                          <Droplets className={`w-3 h-3 ${skinTypeStyle?.text || 'text-gray-600'}`} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Indicators row */}
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    {noteCount > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                        <StickyNote className="w-3 h-3" />
                        <span>{noteCount}</span>
                      </div>
                    )}
                    {treatmentCount > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                        <History className="w-3 h-3" />
                        <span>{treatmentCount}</span>
                      </div>
                    )}
                    {photoCount >= 2 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium" title="Photos available for comparison">
                        <Layers className="w-3 h-3" />
                        <span>{photoCount}</span>
                      </div>
                    )}
                  </div>

                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => toggleDropdown(client.id, e)}
                      className="p-2 bg-white/80 hover:bg-white rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {activeDropdown === client.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                        <button
                          onClick={() => openClientDetail(client)}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                        {onViewClientRoutines && (
                          <button
                            onClick={() => { onViewClientRoutines(client.id); setActiveDropdown(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                          >
                            <ClipboardList className="w-4 h-4" /> View Routines
                          </button>
                        )}
                        {onViewClientPhotos && (
                          <button
                            onClick={() => { onViewClientPhotos(client.id); setActiveDropdown(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                          >
                            <Camera className="w-4 h-4" /> View Photos
                          </button>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowRemoveConfirmModal(true);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-sm text-red-600"
                        >
                          <Trash2 className="w-4 h-4" /> Remove Client
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="pt-12 px-6 pb-6">
                  {/* Name and Email */}
                  <div className="mb-4">
                    <h3 className="font-serif font-bold text-lg text-gray-900 mb-1">
                      {client.full_name || 'Unnamed Client'}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {client.email}
                    </p>
                  </div>

                  {/* Skin Type Badge */}
                  {client.skin_type && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${skinTypeStyle?.bg || 'bg-gray-100'} ${skinTypeStyle?.text || 'text-gray-700'}`}>
                        <Droplets className="w-3 h-3" />
                        {client.skin_type} Skin
                      </span>
                    </div>
                  )}

                  {/* Skin Concerns */}
                  {client.skin_concerns && client.skin_concerns.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Skin Concerns</p>
                      <div className="flex flex-wrap gap-1">
                        {client.skin_concerns.slice(0, 4).map((concern, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-xs rounded-full"
                          >
                            {concern}
                          </span>
                        ))}
                        {client.skin_concerns.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{client.skin_concerns.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <ClipboardList className="w-4 h-4 text-[#CFAFA3]" />
                      <span className="font-medium">{routineCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Camera className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{photoCount}</span>
                    </div>
                    {treatmentCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <History className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{treatmentCount}</span>
                      </div>
                    )}
                    {noteCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <StickyNote className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">{noteCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => openClientDetail(client)}
                    className="w-full mt-4 py-2.5 bg-gray-50 hover:bg-[#CFAFA3]/10 text-gray-700 hover:text-[#CFAFA3] rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    View Full Profile <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}




      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Add Client to Your Practice</h3>
              <button 
                onClick={() => { setShowAddClientModal(false); setAddClientEmail(''); }} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CFAFA3]/20 to-[#E8D5D0]/20 flex items-center justify-center mx-auto mb-4">
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                placeholder="client@email.com"
                autoFocus
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
                onClick={handleAddClient}
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

            {/* Help Text */}
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> If your client hasn't signed up yet, ask them to create an account at SkinAura PRO first as a "Client", then you can add them using their email.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {showClientDetailModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header with gradient */}
            <div className="relative h-32 bg-gradient-to-br from-[#CFAFA3]/40 via-[#E8D5D0]/30 to-[#F9F7F5]">
              <button 
                onClick={() => { setShowClientDetailModal(false); setSelectedClient(null); }} 
                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute -bottom-12 left-8">
                <img
                  src={getClientAvatar(selectedClient, 0)}
                  alt={selectedClient.full_name || 'Client'}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              </div>
            </div>

            {/* Content */}
            <div className="pt-16 px-8 pb-8">
              {/* Name and Email */}
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
                  {selectedClient.full_name || 'Unnamed Client'}
                </h2>
                <p className="text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {selectedClient.email}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Skin Type */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-[#CFAFA3]" />
                    <h4 className="font-medium text-gray-900">Skin Type</h4>
                  </div>
                  {selectedClient.skin_type ? (
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${SKIN_TYPE_COLORS[selectedClient.skin_type]?.bg || 'bg-gray-100'} ${SKIN_TYPE_COLORS[selectedClient.skin_type]?.text || 'text-gray-700'}`}>
                      {selectedClient.skin_type}
                    </span>
                  ) : (
                    <p className="text-sm text-gray-500">Not specified</p>
                  )}
                </div>

                {/* Stats */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#CFAFA3]" />
                    <h4 className="font-medium text-gray-900">Activity</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xl font-bold text-gray-900">{getClientRoutineCount(selectedClient.id)}</p>
                      <p className="text-xs text-gray-500">Routines</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{getClientPhotoCount(selectedClient.id)}</p>
                      <p className="text-xs text-gray-500">Photos</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{clientNotes.getNoteCount(selectedClient.id)}</p>
                      <p className="text-xs text-gray-500">Notes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skin Concerns */}
              {selectedClient.skin_concerns && selectedClient.skin_concerns.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#CFAFA3]" />
                    Skin Concerns
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.skin_concerns.map((concern, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-sm rounded-full font-medium"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
                {onViewClientRoutines && (
                  <button
                    onClick={() => { onViewClientRoutines(selectedClient.id); setShowClientDetailModal(false); }}
                    className="flex items-center justify-center gap-2 py-3 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-xl font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                  >
                    <ClipboardList className="w-5 h-5" /> View Routines
                  </button>
                )}
                {onViewClientPhotos && (
                  <button
                    onClick={() => { onViewClientPhotos(selectedClient.id); setShowClientDetailModal(false); }}
                    className="flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition-colors"
                  >
                    <Camera className="w-5 h-5" /> View Photos
                  </button>
                )}
              </div>

              {/* Client Notes Section */}
              <ClientNotesSection 
                clientId={selectedClient.id} 
                clientName={selectedClient.full_name?.split(' ')[0] || 'this client'} 
              />

              {/* Photo Comparison Section */}
              <PhotoComparison
                clientId={selectedClient.id}
                clientName={selectedClient.full_name || 'this client'}
              />

              {/* Treatment History Section */}
              <TreatmentHistory 
                clientId={selectedClient.id} 
                clientName={selectedClient.full_name || 'this client'} 
              />


              {/* Remove Button */}
              <button
                onClick={() => setShowRemoveConfirmModal(true)}
                className="w-full mt-6 py-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Remove from Practice
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Remove Confirmation Modal */}
      {showRemoveConfirmModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Remove Client?</h3>
              <p className="text-gray-600">
                Are you sure you want to remove <strong>{selectedClient.full_name || 'this client'}</strong> from your practice? 
                This will disconnect them but won't delete their account or data.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirmModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveClient}
                disabled={removingClient}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {removingClient ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Remove Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkClientImport
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportComplete={() => routineManagement.refreshData()}
        existingClientEmails={existingClientEmails}
      />
    </div>
  );
};

export default ClientManagement;
