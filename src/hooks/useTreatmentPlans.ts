import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface TreatmentPlanMilestone {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  target_date: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface TreatmentPlanProduct {
  id: string;
  plan_id: string;
  product_name: string;
  product_brand: string | null;
  product_category: string | null;
  usage_instructions: string | null;
  priority: 'essential' | 'recommended' | 'optional';
  created_at: string;
}

export interface TreatmentPlanRoutine {
  id: string;
  plan_id: string;
  routine_name: string;
  routine_type: string | null;
  notes: string | null;
  created_at: string;
}

export interface TreatmentPlanAppointment {
  id: string;
  plan_id: string;
  appointment_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  professional_id: string;
  client_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  goals: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  milestones: TreatmentPlanMilestone[];
  products: TreatmentPlanProduct[];
  routines: TreatmentPlanRoutine[];
  appointments: TreatmentPlanAppointment[];
  client?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface CreateTreatmentPlanInput {
  client_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  goals?: string[];
  notes?: string;
  status?: 'draft' | 'active';
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  target_date: string;
  notes?: string;
}

export interface CreateProductInput {
  product_name: string;
  product_brand?: string;
  product_category?: string;
  usage_instructions?: string;
  priority?: 'essential' | 'recommended' | 'optional';
}

export interface CreateRoutineInput {
  routine_name: string;
  routine_type?: string;
  notes?: string;
}

export interface CreateAppointmentInput {
  appointment_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes?: number;
  notes?: string;
}

export const useTreatmentPlans = () => {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isProfessional = profile?.role === 'professional';

  // Fetch all treatment plans
  const fetchPlans = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch plans based on role
      const query = supabase
        .from('treatment_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (isProfessional) {
        query.eq('professional_id', user.id);
      } else {
        query.eq('client_id', user.id);
      }

      const { data: plansData, error: plansError } = await query;

      if (plansError) throw plansError;

      // Fetch related data for each plan
      const plansWithDetails = await Promise.all(
        (plansData || []).map(async (plan) => {
          // Fetch milestones
          const { data: milestones } = await supabase
            .from('treatment_plan_milestones')
            .select('*')
            .eq('plan_id', plan.id)
            .order('order_index', { ascending: true });

          // Fetch products
          const { data: products } = await supabase
            .from('treatment_plan_products')
            .select('*')
            .eq('plan_id', plan.id)
            .order('priority', { ascending: true });

          // Fetch routines
          const { data: routines } = await supabase
            .from('treatment_plan_routines')
            .select('*')
            .eq('plan_id', plan.id);

          // Fetch appointments
          const { data: appointments } = await supabase
            .from('treatment_plan_appointments')
            .select('*')
            .eq('plan_id', plan.id)
            .order('scheduled_date', { ascending: true });

          // Fetch client info if professional
          let client = undefined;
          if (isProfessional) {
            const { data: clientData } = await supabase
              .from('user_profiles')
              .select('id, full_name, email, avatar_url')
              .eq('id', plan.client_id)
              .single();
            client = clientData || undefined;
          }

          return {
            ...plan,
            milestones: milestones || [],
            products: products || [],
            routines: routines || [],
            appointments: appointments || [],
            client,
          } as TreatmentPlan;
        })
      );

      setPlans(plansWithDetails);
    } catch (err: any) {
      console.error('Error fetching treatment plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isProfessional]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Create a new treatment plan
  const createPlan = async (input: CreateTreatmentPlanInput): Promise<{ success: boolean; plan?: TreatmentPlan; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can create treatment plans' };
    }

    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .insert({
          professional_id: user.id,
          client_id: input.client_id,
          title: input.title,
          description: input.description || null,
          start_date: input.start_date,
          end_date: input.end_date,
          goals: input.goals || [],
          notes: input.notes || null,
          status: input.status || 'active',
        })
        .select()
        .single();

      if (error) throw error;

      const newPlan: TreatmentPlan = {
        ...data,
        milestones: [],
        products: [],
        routines: [],
        appointments: [],
      };

      setPlans(prev => [newPlan, ...prev]);
      return { success: true, plan: newPlan };
    } catch (err: any) {
      console.error('Error creating treatment plan:', err);
      return { success: false, error: err.message };
    }
  };

  // Update a treatment plan
  const updatePlan = async (planId: string, updates: Partial<CreateTreatmentPlanInput>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can update treatment plans' };
    }

    try {
      const { error } = await supabase
        .from('treatment_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .eq('professional_id', user.id);

      if (error) throw error;

      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ));
      return { success: true };
    } catch (err: any) {
      console.error('Error updating treatment plan:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a treatment plan
  const deletePlan = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can delete treatment plans' };
    }

    try {
      const { error } = await supabase
        .from('treatment_plans')
        .delete()
        .eq('id', planId)
        .eq('professional_id', user.id);

      if (error) throw error;

      setPlans(prev => prev.filter(p => p.id !== planId));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting treatment plan:', err);
      return { success: false, error: err.message };
    }
  };

  // Update plan status
  const updatePlanStatus = async (planId: string, status: TreatmentPlan['status']): Promise<{ success: boolean; error?: string }> => {
    return updatePlan(planId, { status } as any);
  };

  // Add milestone to plan
  const addMilestone = async (planId: string, input: CreateMilestoneInput): Promise<{ success: boolean; milestone?: TreatmentPlanMilestone; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can add milestones' };
    }

    try {
      // Get current max order_index
      const plan = plans.find(p => p.id === planId);
      const maxOrder = plan?.milestones.reduce((max, m) => Math.max(max, m.order_index), -1) ?? -1;

      const { data, error } = await supabase
        .from('treatment_plan_milestones')
        .insert({
          plan_id: planId,
          title: input.title,
          description: input.description || null,
          target_date: input.target_date,
          notes: input.notes || null,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, milestones: [...p.milestones, data] } : p
      ));
      return { success: true, milestone: data };
    } catch (err: any) {
      console.error('Error adding milestone:', err);
      return { success: false, error: err.message };
    }
  };

  // Update milestone
  const updateMilestone = async (milestoneId: string, updates: Partial<CreateMilestoneInput & { completed: boolean }>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const updateData: any = { ...updates };
      if (updates.completed !== undefined) {
        updateData.completed_at = updates.completed ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from('treatment_plan_milestones')
        .update(updateData)
        .eq('id', milestoneId);

      if (error) throw error;

      setPlans(prev => prev.map(p => ({
        ...p,
        milestones: p.milestones.map(m => 
          m.id === milestoneId ? { ...m, ...updateData } : m
        ),
      })));
      return { success: true };
    } catch (err: any) {
      console.error('Error updating milestone:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete milestone
  const deleteMilestone = async (milestoneId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can delete milestones' };
    }

    try {
      const { error } = await supabase
        .from('treatment_plan_milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;

      setPlans(prev => prev.map(p => ({
        ...p,
        milestones: p.milestones.filter(m => m.id !== milestoneId),
      })));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting milestone:', err);
      return { success: false, error: err.message };
    }
  };

  // Add product to plan
  const addProduct = async (planId: string, input: CreateProductInput): Promise<{ success: boolean; product?: TreatmentPlanProduct; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can add products' };
    }

    try {
      const { data, error } = await supabase
        .from('treatment_plan_products')
        .insert({
          plan_id: planId,
          product_name: input.product_name,
          product_brand: input.product_brand || null,
          product_category: input.product_category || null,
          usage_instructions: input.usage_instructions || null,
          priority: input.priority || 'recommended',
        })
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, products: [...p.products, data] } : p
      ));
      return { success: true, product: data };
    } catch (err: any) {
      console.error('Error adding product:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete product from plan
  const deleteProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can delete products' };
    }

    try {
      const { error } = await supabase
        .from('treatment_plan_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setPlans(prev => prev.map(p => ({
        ...p,
        products: p.products.filter(prod => prod.id !== productId),
      })));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting product:', err);
      return { success: false, error: err.message };
    }
  };

  // Add routine to plan
  const addRoutine = async (planId: string, input: CreateRoutineInput): Promise<{ success: boolean; routine?: TreatmentPlanRoutine; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can add routines' };
    }

    try {
      const { data, error } = await supabase
        .from('treatment_plan_routines')
        .insert({
          plan_id: planId,
          routine_name: input.routine_name,
          routine_type: input.routine_type || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, routines: [...p.routines, data] } : p
      ));
      return { success: true, routine: data };
    } catch (err: any) {
      console.error('Error adding routine:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete routine from plan
  const deleteRoutine = async (routineId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can delete routines' };
    }

    try {
      const { error } = await supabase
        .from('treatment_plan_routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;

      setPlans(prev => prev.map(p => ({
        ...p,
        routines: p.routines.filter(r => r.id !== routineId),
      })));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting routine:', err);
      return { success: false, error: err.message };
    }
  };

  // Add appointment to plan
  const addAppointment = async (planId: string, input: CreateAppointmentInput): Promise<{ success: boolean; appointment?: TreatmentPlanAppointment; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can add appointments' };
    }

    try {
      const { data, error } = await supabase
        .from('treatment_plan_appointments')
        .insert({
          plan_id: planId,
          appointment_type: input.appointment_type,
          scheduled_date: input.scheduled_date,
          scheduled_time: input.scheduled_time || null,
          duration_minutes: input.duration_minutes || 60,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, appointments: [...p.appointments, data].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)) } : p
      ));
      return { success: true, appointment: data };
    } catch (err: any) {
      console.error('Error adding appointment:', err);
      return { success: false, error: err.message };
    }
  };

  // Update appointment
  const updateAppointment = async (appointmentId: string, updates: Partial<CreateAppointmentInput & { completed: boolean }>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const updateData: any = { ...updates };
      if (updates.completed !== undefined) {
        updateData.completed_at = updates.completed ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from('treatment_plan_appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;

      setPlans(prev => prev.map(p => ({
        ...p,
        appointments: p.appointments.map(a => 
          a.id === appointmentId ? { ...a, ...updateData } : a
        ),
      })));
      return { success: true };
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can delete appointments' };
    }

    try {
      const { error } = await supabase
        .from('treatment_plan_appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setPlans(prev => prev.map(p => ({
        ...p,
        appointments: p.appointments.filter(a => a.id !== appointmentId),
      })));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting appointment:', err);
      return { success: false, error: err.message };
    }
  };

  // Get plans for a specific client
  const getClientPlans = (clientId: string) => {
    return plans.filter(p => p.client_id === clientId);
  };

  // Get active plans
  const getActivePlans = () => {
    return plans.filter(p => p.status === 'active');
  };

  // Calculate plan progress
  const getPlanProgress = (plan: TreatmentPlan) => {
    const totalMilestones = plan.milestones.length;
    const completedMilestones = plan.milestones.filter(m => m.completed).length;
    const totalAppointments = plan.appointments.length;
    const completedAppointments = plan.appointments.filter(a => a.completed).length;

    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    const appointmentProgress = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    // Overall progress is weighted average
    const totalItems = totalMilestones + totalAppointments;
    const completedItems = completedMilestones + completedAppointments;
    const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Days progress
    const startDate = new Date(plan.start_date);
    const endDate = new Date(plan.end_date);
    const today = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

    return {
      milestoneProgress: Math.round(milestoneProgress),
      appointmentProgress: Math.round(appointmentProgress),
      overallProgress: Math.round(overallProgress),
      daysProgress: Math.round(daysProgress),
      completedMilestones,
      totalMilestones,
      completedAppointments,
      totalAppointments,
      daysRemaining: Math.max(0, totalDays - elapsedDays),
    };
  };

  return {
    plans,
    loading,
    error,
    isProfessional,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    updatePlanStatus,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addProduct,
    deleteProduct,
    addRoutine,
    deleteRoutine,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getClientPlans,
    getActivePlans,
    getPlanProgress,
  };
};
