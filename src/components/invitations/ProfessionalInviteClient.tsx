/**
 * @fileoverview Component for professionals to invite clients
 * Allows creating invitation codes and sending invites via email
 */

import React, { useState, useEffect } from 'react';
import { useClientInvitations, Invitation } from '@/hooks/useClientInvitations';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  X,
  Loader2,
  Link,
  Clock,
  RefreshCw,
  Trash2,
  Send,
  Users,
  QrCode,
  Share2,
} from 'lucide-react';

interface ProfessionalInviteClientProps {
  onInviteSent?: () => void;
}

const ProfessionalInviteClient: React.FC<ProfessionalInviteClientProps> = ({ onInviteSent }) => {
  const {
    invitations,
    pendingInvitations,
    acceptedInvitations,
    loading,
    creating,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    refreshInvitations,
  } = useClientInvitations();
  
  const { toast } = useToast();
  
  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Created invitation state
  const [newInvitation, setNewInvitation] = useState<Invitation | null>(null);

  // Reset copied state after delay
  useEffect(() => {
    if (copiedCode) {
      const timer = setTimeout(() => setCopiedCode(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copiedCode]);

  // Handle creating a new invitation
  const handleCreateInvitation = async () => {
    const result = await createInvitation(
      clientEmail.trim() || undefined,
      inviteNotes.trim() || undefined
    );

    if (result.success && result.invitation) {
      setNewInvitation(result.invitation);
      toast({
        title: 'Invitation Created!',
        description: `Share the code ${result.invitation.invitation_code} with your client.`,
      });
      setClientEmail('');
      setInviteNotes('');
      onInviteSent?.();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create invitation',
        variant: 'destructive',
      });
    }
  };

  // Copy invitation code to clipboard
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: 'Copied!',
        description: 'Invitation code copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Copy full invitation link
  const copyInviteLink = async (code: string) => {
    try {
      const link = `${window.location.origin}?invite=${code}`;
      await navigator.clipboard.writeText(link);
      setCopiedCode(code);
      toast({
        title: 'Copied!',
        description: 'Invitation link copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Handle cancelling an invitation
  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    const result = await cancelInvitation(invitationId);
    if (result.success) {
      toast({
        title: 'Invitation Cancelled',
        description: 'The invitation has been cancelled.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  // Handle resending an invitation
  const handleResendInvitation = async (invitationId: string) => {
    const result = await resendInvitation(invitationId);
    if (result.success && result.invitation) {
      toast({
        title: 'Invitation Renewed',
        description: `New code: ${result.invitation.invitation_code}`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  // Format expiry time
  const formatExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Client Invitations</h2>
          <p className="text-sm text-gray-500">Invite clients to connect with your practice</p>
        </div>
        <button
          onClick={() => {
            setNewInvitation(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <UserPlus className="w-5 h-5" /> Invite Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingInvitations.length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{acceptedInvitations.length}</p>
              <p className="text-xs text-gray-500">Accepted</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#CFAFA3]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && invitations.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-[#CFAFA3]" />
          </div>
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Invitations Yet</h3>
          <p className="text-gray-500 mb-6">
            Create an invitation to connect with your clients
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <UserPlus className="w-5 h-5" /> Create Your First Invitation
          </button>
        </div>
      )}

      {/* Invitations List */}
      {!loading && invitations.length > 0 && (
        <div className="space-y-4">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#B89A8E] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {invitation.invitation_code.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">
                              {invitation.invitation_code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(invitation.invitation_code)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === invitation.invitation_code ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {invitation.client_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {invitation.client_email}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-amber-600">
                              <Clock className="w-3 h-3" />
                              {formatExpiry(invitation.expires_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyInviteLink(invitation.invitation_code)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Copy invite link"
                        >
                          <Link className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Renew invitation"
                        >
                          <RefreshCw className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel invitation"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    {invitation.notes && (
                      <p className="mt-2 text-sm text-gray-500 italic">"{invitation.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Invitations */}
          {acceptedInvitations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Accepted Invitations ({acceptedInvitations.length})
              </h3>
              <div className="space-y-3">
                {acceptedInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white rounded-xl p-4 border border-green-200 shadow-sm opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500 line-through">
                              {invitation.invitation_code}
                            </span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Accepted
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {invitation.client_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {invitation.client_email}
                              </span>
                            )}
                            {invitation.accepted_at && (
                              <span>
                                Accepted {new Date(invitation.accepted_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">
                {newInvitation ? 'Invitation Created!' : 'Invite a Client'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewInvitation(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newInvitation ? (
              // Show created invitation
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    Share this code with your client to connect them to your practice.
                  </p>
                </div>

                {/* Invitation Code Display */}
                <div className="bg-gradient-to-br from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl p-6 text-center border border-[#CFAFA3]/20">
                  <p className="text-sm text-gray-500 mb-2">Invitation Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-3xl font-bold text-[#2D2A3E] tracking-widest">
                      {newInvitation.invitation_code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(newInvitation.invitation_code)}
                      className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      {copiedCode === newInvitation.invitation_code ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-[#CFAFA3]" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatExpiry(newInvitation.expires_at)}
                  </p>
                </div>

                {/* Share Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => copyToClipboard(newInvitation.invitation_code)}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copy Code
                  </button>
                  <button
                    onClick={() => copyInviteLink(newInvitation.invitation_code)}
                    className="flex items-center justify-center gap-2 py-3 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Copy Link
                  </button>
                </div>

                <button
                  onClick={() => {
                    setNewInvitation(null);
                    setShowCreateModal(false);
                  }}
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              // Create invitation form
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-[#CFAFA3]" />
                  </div>
                  <p className="text-gray-600 text-sm">
                    Create an invitation code for your client. They can use this code to connect with your practice.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                      placeholder="client@email.com"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    If provided, we'll track which email this invitation was sent to.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={inviteNotes}
                    onChange={(e) => setInviteNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                    rows={2}
                    placeholder="e.g., New client from consultation on Dec 13"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInvitation}
                    disabled={creating}
                    className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Create Invitation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalInviteClient;
