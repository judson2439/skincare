import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface RoutineTemplate {
  id: string;
  professional_id: string;
  name: string;
  description: string | null;
  schedule_type: 'daily' | 'morning' | 'evening' | 'weekly';
  schedule_days: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineStep {
  id: string;
  routine_id: string;
  step_order: number;
  product_name: string;
  product_type: string | null;
  instructions: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface RoutineAssignment {
  id: string;
  routine_id: string;
  client_id: string;
  professional_id: string;
  assigned_at: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface RoutineWithSteps extends RoutineTemplate {
  steps: RoutineStep[];
}

export interface AssignedRoutine extends RoutineAssignment {
  routine: RoutineWithSteps;
}

export interface ClientForAssignment {
  id: string;
  full_name: string | null;
  email: string | null;
  skin_type: string | null;
  skin_concerns: string[] | null;
  concerns?: string[];
  avatar_url: string | null;
  phone?: string | null;
}

export function useRoutineManagement() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState<RoutineWithSteps[]>([]);
  const [assignments, setAssignments] = useState<RoutineAssignment[]>([]);
  const [clients, setClients] = useState<ClientForAssignment[]>([]);
  
  // Use refs to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const isProfessional = profile?.role === 'professional';

  // Fetch all routines created by the professional
  const fetchRoutines = useCallback(async () => {
    if (!user || !isProfessional) return;

    try {
      const { data: routineData, error: routineError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (routineError) {
        console.warn('Error fetching routines (table may not exist):', routineError);
        setRoutines([]);
        return;
      }

      // Fetch steps for each routine
      const routinesWithSteps: RoutineWithSteps[] = await Promise.all(
        (routineData || []).map(async (routine) => {
          const { data: steps, error: stepsError } = await supabase
            .from('routine_steps')
            .select('*')
            .eq('routine_id', routine.id)
            .order('step_order', { ascending: true });

          if (stepsError) {
            console.warn('Error fetching routine steps:', stepsError);
            return { ...routine, steps: [] };
          }

          return {
            ...routine,
            steps: steps || [],
          };
        })
      );

      setRoutines(routinesWithSteps);
    } catch (error) {
      console.warn('Error fetching routines:', error);
      setRoutines([]);
    }
  }, [user?.id, isProfessional]);


  // Fetch all assignments
  const fetchAssignments = useCallback(async () => {
    if (!user || !isProfessional) return;

    try {
      const { data, error } = await supabase
        .from('client_routine_assignments')
        .select('*')
        .eq('professional_id', user.id);

      if (error) {
        console.warn('Error fetching assignments:', error);
        setAssignments([]);
        return;
      }
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  }, [user?.id, isProfessional]);

  // Fetch clients linked to this professional
  const fetchClients = useCallback(async () => {
    if (!user || !isProfessional) return;

    try {
      // Get client IDs from relationships
      const { data: relationships, error: relError } = await supabase
        .from('client_professional_relationships')
        .select('client_id')
        .eq('professional_id', user.id)
        .eq('status', 'active');

      if (relError) {
        console.warn('Error fetching relationships:', relError);
        setClients([]);
        return;
      }

      if (!relationships || relationships.length === 0) {
        setClients([]);
        return;
      }

      const clientIds = relationships.map(r => r.client_id);

      // Fetch client profiles
      const { data: clientProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, skin_type, concerns, avatar_url, phone');

      if (profileError) {
        console.warn('Error fetching client profiles:', profileError);
        setClients([]);
        return;
      }

      // Filter to only clients in our relationships
      const filteredClients = (clientProfiles || []).filter(p => clientIds.includes(p.id));
      setClients(filteredClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  }, [user?.id, isProfessional]);

  // Create a new routine template
  const createRoutine = async (
    name: string,
    description: string,
    scheduleType: 'daily' | 'morning' | 'evening' | 'weekly',
    scheduleDays?: string[]
  ): Promise<{ success: boolean; routine?: RoutineTemplate; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { data, error } = await supabase
        .from('routine_templates')
        .insert({
          professional_id: user.id,
          name,
          description,
          schedule_type: scheduleType,
          schedule_days: scheduleDays || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRoutines();
      return { success: true, routine: data };
    } catch (error: any) {
      console.error('Error creating routine:', error);
      return { success: false, error: error.message };
    }
  };

  // Update a routine template
  const updateRoutine = async (
    routineId: string,
    updates: Partial<Pick<RoutineTemplate, 'name' | 'description' | 'schedule_type' | 'schedule_days' | 'is_active'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { error } = await supabase
        .from('routine_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', routineId)
        .eq('professional_id', user.id);

      if (error) throw error;

      await fetchRoutines();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating routine:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a routine template
  const deleteRoutine = async (routineId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { error } = await supabase
        .from('routine_templates')
        .delete()
        .eq('id', routineId)
        .eq('professional_id', user.id);

      if (error) throw error;

      await fetchRoutines();
      await fetchAssignments();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting routine:', error);
      return { success: false, error: error.message };
    }
  };

  // Add a step to a routine
  const addStep = async (
    routineId: string,
    step: {
      product_name: string;
      product_type?: string;
      instructions?: string;
      duration_minutes?: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; step?: RoutineStep; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      // Get current max step order
      const routine = routines.find(r => r.id === routineId);
      const maxOrder = routine?.steps.reduce((max, s) => Math.max(max, s.step_order), 0) || 0;

      const { data, error } = await supabase
        .from('routine_steps')
        .insert({
          routine_id: routineId,
          step_order: maxOrder + 1,
          product_name: step.product_name,
          product_type: step.product_type || null,
          instructions: step.instructions || null,
          duration_minutes: step.duration_minutes || null,
          notes: step.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRoutines();
      return { success: true, step: data };
    } catch (error: any) {
      console.error('Error adding step:', error);
      return { success: false, error: error.message };
    }
  };

  // Update a step
  const updateStep = async (
    stepId: string,
    updates: Partial<Pick<RoutineStep, 'product_name' | 'product_type' | 'instructions' | 'duration_minutes' | 'notes' | 'step_order'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { error } = await supabase
        .from('routine_steps')
        .update(updates)
        .eq('id', stepId);

      if (error) throw error;

      await fetchRoutines();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating step:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a step
  const deleteStep = async (stepId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { error } = await supabase
        .from('routine_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;

      await fetchRoutines();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting step:', error);
      return { success: false, error: error.message };
    }
  };

  // Reorder steps
  const reorderSteps = async (
    routineId: string,
    stepIds: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      // Update each step with new order
      await Promise.all(
        stepIds.map((stepId, index) =>
          supabase
            .from('routine_steps')
            .update({ step_order: index + 1 })
            .eq('id', stepId)
        )
      );

      await fetchRoutines();
      return { success: true };
    } catch (error: any) {
      console.error('Error reordering steps:', error);
      return { success: false, error: error.message };
    }
  };

  // Assign a routine to a client
  const assignRoutine = async (
    routineId: string,
    clientId: string,
    notes?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; assignment?: RoutineAssignment; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      // Check if already assigned
      const existing = assignments.find(
        a => a.routine_id === routineId && a.client_id === clientId && a.is_active
      );

      if (existing) {
        return { success: false, error: 'Routine already assigned to this client' };
      }

      const { data, error } = await supabase
        .from('client_routine_assignments')
        .insert({
          routine_id: routineId,
          client_id: clientId,
          professional_id: user.id,
          notes: notes || null,
          start_date: startDate || new Date().toISOString().split('T')[0],
          end_date: endDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAssignments();
      return { success: true, assignment: data };
    } catch (error: any) {
      console.error('Error assigning routine:', error);
      return { success: false, error: error.message };
    }
  };

  // Unassign a routine from a client
  const unassignRoutine = async (assignmentId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { error } = await supabase
        .from('client_routine_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId)
        .eq('professional_id', user.id);

      if (error) throw error;

      await fetchAssignments();
      return { success: true };
    } catch (error: any) {
      console.error('Error unassigning routine:', error);
      return { success: false, error: error.message };
    }
  };

  // Add a client to the professional's practice by email
  const addClientByEmail = async (email: string): Promise<{ success: boolean; client?: ClientForAssignment; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      // Find the user by email
      const { data: clientProfile, error: findError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, skin_type, concerns, avatar_url, role, phone')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (findError) throw findError;

      if (!clientProfile) {
        return { success: false, error: 'No user found with that email address' };
      }

      if (clientProfile.role !== 'client') {
        return { success: false, error: 'This user is not registered as a client' };
      }

      // Check if relationship already exists
      const { data: existingRelation, error: checkError } = await supabase
        .from('client_professional_relationships')
        .select('id, status')
        .eq('client_id', clientProfile.id)
        .eq('professional_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRelation) {
        if (existingRelation.status === 'active') {
          return { success: false, error: 'This client is already connected to your practice' };
        }
        // Reactivate existing relationship
        const { error: updateError } = await supabase
          .from('client_professional_relationships')
          .update({ status: 'active' })
          .eq('id', existingRelation.id);

        if (updateError) throw updateError;
      } else {
        // Create new relationship
        const { error: insertError } = await supabase
          .from('client_professional_relationships')
          .insert({
            client_id: clientProfile.id,
            professional_id: user.id,
            status: 'active'
          });

        if (insertError) throw insertError;
      }

      // Refresh clients list
      await fetchClients();

      return { 
        success: true, 
        client: {
          id: clientProfile.id,
          full_name: clientProfile.full_name,
          email: clientProfile.email,
          skin_type: clientProfile.skin_type,
          skin_concerns: null,
          concerns: clientProfile.concerns,
          avatar_url: clientProfile.avatar_url,
          phone: clientProfile.phone
        }
      };
    } catch (error: any) {
      console.error('Error adding client:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove a client from the professional's practice
  const removeClient = async (clientId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { error } = await supabase
        .from('client_professional_relationships')
        .update({ status: 'inactive' })
        .eq('client_id', clientId)
        .eq('professional_id', user.id);

      if (error) throw error;

      await fetchClients();
      return { success: true };
    } catch (error: any) {
      console.error('Error removing client:', error);
      return { success: false, error: error.message };
    }
  };

  // Get assignments for a specific client
  const getClientAssignments = (clientId: string): RoutineAssignment[] => {
    return assignments.filter(a => a.client_id === clientId && a.is_active);
  };

  // Get clients assigned to a specific routine
  const getRoutineClients = (routineId: string): string[] => {
    return assignments
      .filter(a => a.routine_id === routineId && a.is_active)
      .map(a => a.client_id);
  };

  // Initial data fetch - only run once when user and profile are ready
  useEffect(() => {
    const loadData = async () => {
      // Only fetch if we have a user and profile, and haven't fetched yet
      if (!user || !profile) {
        setLoading(false);
        return;
      }
      
      if (!isProfessional) {
        setLoading(false);
        return;
      }
      
      // Prevent duplicate fetches
      if (hasFetchedRef.current || isFetchingRef.current) {
        return;
      }
      
      hasFetchedRef.current = true;
      isFetchingRef.current = true;
      setLoading(true);
      
      try {
        await Promise.all([
          fetchRoutines(),
          fetchAssignments(),
          fetchClients(),
        ]);
      } catch (error) {
        console.error('Error loading routine management data:', error);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    loadData();
    
    // Reset the fetch flag when user changes (logout/login)
    if (!user) {
      hasFetchedRef.current = false;
      setRoutines([]);
      setAssignments([]);
      setClients([]);
    }
  }, [user, profile, isProfessional, fetchRoutines, fetchAssignments, fetchClients]);

  // Manual refresh function that resets the fetch flag
  const refreshData = useCallback(async () => {
    if (!user || !isProfessional) return;
    
    hasFetchedRef.current = false;
    isFetchingRef.current = false;
    setLoading(true);
    
    try {
      await Promise.all([
        fetchRoutines(),
        fetchAssignments(),
        fetchClients(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isProfessional, fetchRoutines, fetchAssignments, fetchClients]);

  return {
    loading,
    routines,
    assignments,
    clients,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    assignRoutine,
    unassignRoutine,
    addClientByEmail,
    removeClient,
    getClientAssignments,
    getRoutineClients,
    refreshData,
  };
}
