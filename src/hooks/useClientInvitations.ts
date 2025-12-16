/**
 * @fileoverview Hook for managing professional-client invitations
 * Handles creating, sending, and accepting invitations to link clients with professionals
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Invitation {
  id: string;
  professional_id: string;
  invitation_code: string;
  client_email: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  accepted_by: string | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  notes: string | null;
  professional?: {
    full_name: string | null;
    email: string;
    business_name: string | null;
    avatar_url: string | null;
  };
}

export interface InvitationResult {
  success: boolean;
  error?: string;
  invitation?: Invitation;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a random 8-character alphanumeric invitation code
 */
const generateInvitationCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useClientInvitations = () => {
  const { user, profile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  /**
   * Fetches all invitations for the current professional
   */
  const fetchInvitations = useCallback(async () => {
    if (!user || profile?.role !== 'professional') {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('professional_invitations')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  // Fetch invitations on mount and when user changes
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // ========================================================================
  // PROFESSIONAL METHODS
  // ========================================================================

  /**
   * Creates a new invitation for a client
   * @param clientEmail - Optional email to send invitation to
   * @param notes - Optional notes for the invitation
   */
  const createInvitation = async (
    clientEmail?: string,
    notes?: string
  ): Promise<InvitationResult> => {
    if (!user || profile?.role !== 'professional') {
      return { success: false, error: 'Only professionals can create invitations' };
    }

    setCreating(true);
    try {
      // Generate a unique invitation code
      let code = generateInvitationCode();
      let attempts = 0;
      
      // Ensure code is unique (retry if collision)
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from('professional_invitations')
          .select('id')
          .eq('invitation_code', code)
          .maybeSingle();
        
        if (!existing) break;
        code = generateInvitationCode();
        attempts++;
      }

      // Create the invitation
      const { data, error } = await supabase
        .from('professional_invitations')
        .insert({
          professional_id: user.id,
          invitation_code: code,
          client_email: clientEmail?.toLowerCase().trim() || null,
          notes: notes || null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh invitations list
      await fetchInvitations();

      return { success: true, invitation: data };
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      return { success: false, error: error.message || 'Failed to create invitation' };
    } finally {
      setCreating(false);
    }
  };

  /**
   * Cancels an existing invitation
   * @param invitationId - The invitation ID to cancel
   */
  const cancelInvitation = async (invitationId: string): Promise<InvitationResult> => {
    if (!user || profile?.role !== 'professional') {
      return { success: false, error: 'Only professionals can cancel invitations' };
    }

    try {
      const { error } = await supabase
        .from('professional_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .eq('professional_id', user.id);

      if (error) throw error;

      await fetchInvitations();
      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      return { success: false, error: error.message || 'Failed to cancel invitation' };
    }
  };

  /**
   * Resends/regenerates an invitation with a new code
   * @param invitationId - The invitation ID to resend
   */
  const resendInvitation = async (invitationId: string): Promise<InvitationResult> => {
    if (!user || profile?.role !== 'professional') {
      return { success: false, error: 'Only professionals can resend invitations' };
    }

    try {
      const newCode = generateInvitationCode();
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('professional_invitations')
        .update({
          invitation_code: newCode,
          expires_at: newExpiry,
          status: 'pending',
        })
        .eq('id', invitationId)
        .eq('professional_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchInvitations();
      return { success: true, invitation: data };
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      return { success: false, error: error.message || 'Failed to resend invitation' };
    }
  };

  // ========================================================================
  // CLIENT METHODS
  // ========================================================================

  /**
   * Looks up an invitation by code to preview before accepting
   * @param code - The invitation code to look up
   */
  const lookupInvitation = async (code: string): Promise<{ success: boolean; invitation?: Invitation; error?: string }> => {
    try {
      const normalizedCode = code.toUpperCase().trim();

      const { data, error } = await supabase
        .from('professional_invitations')
        .select(`
          *,
          professional:professional_id (
            full_name,
            email,
            business_name,
            avatar_url
          )
        `)
        .eq('invitation_code', normalizedCode)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { success: false, error: 'Invalid or expired invitation code' };
      }

      return { success: true, invitation: data as Invitation };
    } catch (error: any) {
      console.error('Error looking up invitation:', error);
      return { success: false, error: error.message || 'Failed to look up invitation' };
    }
  };

  /**
   * Accepts an invitation and links the client to the professional
   * @param code - The invitation code to accept
   */
  const acceptInvitation = async (code: string): Promise<InvitationResult> => {
    if (!user || profile?.role !== 'client') {
      return { success: false, error: 'Only clients can accept invitations' };
    }

    setAccepting(true);
    try {
      const normalizedCode = code.toUpperCase().trim();

      // First, look up the invitation
      const { data: invitation, error: lookupError } = await supabase
        .from('professional_invitations')
        .select('*')
        .eq('invitation_code', normalizedCode)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (!invitation) {
        return { success: false, error: 'Invalid or expired invitation code' };
      }

      // Check if client is already linked to this professional
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('professional_id')
        .eq('id', user.id)
        .single();

      if (existingProfile?.professional_id === invitation.professional_id) {
        return { success: false, error: 'You are already linked to this professional' };
      }

      // Update the invitation to accepted
      const { error: updateInvError } = await supabase
        .from('professional_invitations')
        .update({
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      if (updateInvError) throw updateInvError;

      // Link the client to the professional
      const { error: linkError } = await supabase
        .from('user_profiles')
        .update({ professional_id: invitation.professional_id })
        .eq('id', user.id);

      if (linkError) throw linkError;

      return { success: true, invitation };
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: error.message || 'Failed to accept invitation' };
    } finally {
      setAccepting(false);
    }
  };

  /**
   * Gets the client's current linked professional
   */
  const getLinkedProfessional = async (): Promise<{
    success: boolean;
    professional?: {
      id: string;
      full_name: string | null;
      email: string;
      business_name: string | null;
      avatar_url: string | null;
    };
    error?: string;
  }> => {
    if (!user || profile?.role !== 'client') {
      return { success: false, error: 'Only clients can view linked professional' };
    }

    try {
      // First get the client's professional_id
      const { data: clientProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('professional_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!clientProfile?.professional_id) {
        return { success: true, professional: undefined };
      }

      // Then get the professional's details
      const { data: professional, error: profError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, business_name, avatar_url')
        .eq('id', clientProfile.professional_id)
        .single();

      if (profError) throw profError;

      return { success: true, professional };
    } catch (error: any) {
      console.error('Error getting linked professional:', error);
      return { success: false, error: error.message || 'Failed to get linked professional' };
    }
  };

  /**
   * Unlinks the client from their current professional
   */
  const unlinkFromProfessional = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || profile?.role !== 'client') {
      return { success: false, error: 'Only clients can unlink from professionals' };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ professional_id: null })
        .eq('id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error unlinking from professional:', error);
      return { success: false, error: error.message || 'Failed to unlink from professional' };
    }
  };

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');
  const expiredInvitations = invitations.filter(
    inv => inv.status === 'pending' && new Date(inv.expires_at) < new Date()
  );

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // State
    invitations,
    pendingInvitations,
    acceptedInvitations,
    expiredInvitations,
    loading,
    creating,
    accepting,

    // Professional methods
    createInvitation,
    cancelInvitation,
    resendInvitation,
    refreshInvitations: fetchInvitations,

    // Client methods
    lookupInvitation,
    acceptInvitation,
    getLinkedProfessional,
    unlinkFromProfessional,
  };
};

export default useClientInvitations;
