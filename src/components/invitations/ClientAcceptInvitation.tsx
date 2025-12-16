/**
 * @fileoverview Component for clients to accept professional invitations
 * Allows entering invitation codes and viewing/managing linked professional
 */

import React, { useState, useEffect } from 'react';
import { useClientInvitations, Invitation } from '@/hooks/useClientInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus,
  Link,
  Check,
  X,
  Loader2,
  User,
  Building,
  Mail,
  Unlink,
  Search,
  Sparkles,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface ClientAcceptInvitationProps {
  initialCode?: string;
  onAccepted?: () => void;
}

const ClientAcceptInvitation: React.FC<ClientAcceptInvitationProps> = ({
  initialCode,
  onAccepted,
}) => {
  const { profile, refreshProfile } = useAuth();
  const {
    lookupInvitation,
    acceptInvitation,
    getLinkedProfessional,
    unlinkFromProfessional,
    accepting,
  } = useClientInvitations();
  
  const { toast } = useToast();
  
  // State
  const [inviteCode, setInviteCode] = useState(initialCode || '');
  const [lookingUp, setLookingUp] = useState(false);
  const [foundInvitation, setFoundInvitation] = useState<Invitation | null>(null);
  const [linkedProfessional, setLinkedProfessional] = useState<{
    id: string;
    full_name: string | null;
    email: string;
    business_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [loadingProfessional, setLoadingProfessional] = useState(true);
  const [unlinking, setUnlinking] = useState(false);

  // Fetch linked professional on mount
  useEffect(() => {
    const fetchLinkedProfessional = async () => {
      setLoadingProfessional(true);
      const result = await getLinkedProfessional();
      if (result.success && result.professional) {
        setLinkedProfessional(result.professional);
      }
      setLoadingProfessional(false);
    };

    fetchLinkedProfessional();
  }, []);

  // Auto-lookup if initial code provided
  useEffect(() => {
    if (initialCode) {
      handleLookupInvitation();
    }
  }, [initialCode]);

  // Handle looking up an invitation
  const handleLookupInvitation = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation code',
        variant: 'destructive',
      });
      return;
    }

    setLookingUp(true);
    setFoundInvitation(null);

    const result = await lookupInvitation(inviteCode);

    if (result.success && result.invitation) {
      setFoundInvitation(result.invitation);
    } else {
      toast({
        title: 'Invalid Code',
        description: result.error || 'This invitation code is invalid or has expired.',
        variant: 'destructive',
      });
    }

    setLookingUp(false);
  };

  // Handle accepting an invitation
  const handleAcceptInvitation = async () => {
    if (!foundInvitation) return;

    const result = await acceptInvitation(foundInvitation.invitation_code);

    if (result.success) {
      toast({
        title: 'Connected!',
        description: `You are now connected with ${foundInvitation.professional?.full_name || 'your skincare professional'}.`,
      });
      
      // Refresh profile to get updated professional_id
      await refreshProfile();
      
      // Refresh linked professional
      const profResult = await getLinkedProfessional();
      if (profResult.success && profResult.professional) {
        setLinkedProfessional(profResult.professional);
      }
      
      setFoundInvitation(null);
      setInviteCode('');
      onAccepted?.();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to accept invitation',
        variant: 'destructive',
      });
    }
  };

  // Handle unlinking from professional
  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to disconnect from your skincare professional? You can reconnect later with a new invitation code.')) {
      return;
    }

    setUnlinking(true);
    const result = await unlinkFromProfessional();

    if (result.success) {
      toast({
        title: 'Disconnected',
        description: 'You have been disconnected from your skincare professional.',
      });
      setLinkedProfessional(null);
      await refreshProfile();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to disconnect',
        variant: 'destructive',
      });
    }

    setUnlinking(false);
  };

  // Format code input (uppercase, max 8 chars)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setInviteCode(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-serif font-bold text-gray-900">My Skincare Professional</h2>
        <p className="text-sm text-gray-500">Connect with your skincare professional for personalized guidance</p>
      </div>

      {/* Loading State */}
      {loadingProfessional && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
        </div>
      )}

      {/* Linked Professional Card */}
      {!loadingProfessional && linkedProfessional && (
        <div className="bg-gradient-to-br from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-2xl p-6 border border-[#CFAFA3]/20">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Connected</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-[#CFAFA3] to-[#B89A8E] flex items-center justify-center">
              {linkedProfessional.avatar_url ? (
                <img
                  src={linkedProfessional.avatar_url}
                  alt={linkedProfessional.full_name || 'Professional'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-bold text-lg text-gray-900">
                {linkedProfessional.full_name || 'Skincare Professional'}
              </h3>
              {linkedProfessional.business_name && (
                <p className="text-sm text-[#CFAFA3] flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {linkedProfessional.business_name}
                </p>
              )}
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {linkedProfessional.email}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#CFAFA3]/20">
            <p className="text-sm text-gray-600 mb-3">
              Your skincare professional can view your progress photos, assign routines, and provide personalized recommendations.
            </p>
            <button
              onClick={handleUnlink}
              disabled={unlinking}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {unlinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Enter Invitation Code Section */}
      {!loadingProfessional && !linkedProfessional && !foundInvitation && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
              <Link className="w-8 h-8 text-[#CFAFA3]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-gray-900 mb-2">
              Connect with Your Professional
            </h3>
            <p className="text-gray-500 text-sm">
              Enter the invitation code provided by your skincare professional to connect with them.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invitation Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={handleCodeChange}
                  className="w-full px-4 py-4 text-center font-mono text-2xl tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none uppercase"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                8-character code (letters and numbers)
              </p>
            </div>

            <button
              onClick={handleLookupInvitation}
              disabled={lookingUp || inviteCode.length < 8}
              className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {lookingUp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find Invitation
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#CFAFA3]" />
              Don't have a code?
            </h4>
            <p className="text-sm text-gray-600">
              Ask your skincare professional for an invitation code. They can generate one from their SkinAura PRO dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Found Invitation - Confirm Connection */}
      {foundInvitation && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-serif font-bold text-lg text-gray-900 mb-2">
              Invitation Found!
            </h3>
            <p className="text-gray-500 text-sm">
              Confirm to connect with this skincare professional.
            </p>
          </div>

          {/* Professional Info */}
          <div className="bg-gradient-to-br from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl p-4 mb-6 border border-[#CFAFA3]/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-[#CFAFA3] to-[#B89A8E] flex items-center justify-center">
                {foundInvitation.professional?.avatar_url ? (
                  <img
                    src={foundInvitation.professional.avatar_url}
                    alt={foundInvitation.professional.full_name || 'Professional'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h4 className="font-serif font-bold text-gray-900">
                  {foundInvitation.professional?.full_name || 'Skincare Professional'}
                </h4>
                {foundInvitation.professional?.business_name && (
                  <p className="text-sm text-[#CFAFA3] flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {foundInvitation.professional.business_name}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {foundInvitation.professional?.email}
                </p>
              </div>
            </div>
          </div>

          {/* What this means */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              What this means
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your professional can view your progress photos</li>
              <li>• They can assign personalized skincare routines</li>
              <li>• They can recommend products for your skin type</li>
              <li>• You can disconnect at any time</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setFoundInvitation(null);
                setInviteCode('');
              }}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Connect
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAcceptInvitation;
