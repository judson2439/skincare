import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AssignedRoutineStep {
  id: string;
  routine_id: string;
  step_order: number;
  product_name: string;
  product_type: string | null;
  instructions: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

export interface AssignedRoutine {
  id: string;
  name: string;
  description: string | null;
  schedule_type: 'daily' | 'morning' | 'evening' | 'weekly';
  schedule_days: string[] | null;
  steps: AssignedRoutineStep[];
  assignment_id: string;
  assigned_at: string;
  professional_notes: string | null;
}

export interface DisplayRoutineStep {
  id: string;
  time: 'morning' | 'evening';
  step: number;
  product: string;
  productType: string;
  instructions: string;
  completed: boolean;
  routineId: string;
}

// Default routine for clients without assigned routines
const DEFAULT_ROUTINE_STEPS: DisplayRoutineStep[] = [
  { id: 'default-1', time: 'morning', step: 1, product: 'Gentle Cleanser', productType: 'Cleanser', instructions: 'Massage onto damp skin for 60 seconds', completed: false, routineId: 'default' },
  { id: 'default-2', time: 'morning', step: 2, product: 'Vitamin C Serum', productType: 'Serum', instructions: 'Apply 3-4 drops, wait 1 minute', completed: false, routineId: 'default' },
  { id: 'default-3', time: 'morning', step: 3, product: 'Moisturizer', productType: 'Moisturizer', instructions: 'Apply to damp skin', completed: false, routineId: 'default' },
  { id: 'default-4', time: 'morning', step: 4, product: 'SPF 50 Sunscreen', productType: 'Sunscreen', instructions: 'Apply generously, reapply every 2 hours', completed: false, routineId: 'default' },
  { id: 'default-5', time: 'evening', step: 1, product: 'Gentle Cleanser', productType: 'Cleanser', instructions: 'Double cleanse if wearing makeup', completed: false, routineId: 'default' },
  { id: 'default-6', time: 'evening', step: 2, product: 'Niacinamide Serum', productType: 'Serum', instructions: 'Focus on T-zone and problem areas', completed: false, routineId: 'default' },
  { id: 'default-7', time: 'evening', step: 3, product: 'Retinol Treatment', productType: 'Treatment', instructions: 'Use 2-3x weekly, build up tolerance', completed: false, routineId: 'default' },
  { id: 'default-8', time: 'evening', step: 4, product: 'Night Moisturizer', productType: 'Moisturizer', instructions: 'Seal in treatments', completed: false, routineId: 'default' },
];

export function useClientRoutines() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignedRoutines, setAssignedRoutines] = useState<AssignedRoutine[]>([]);
  const [displayRoutine, setDisplayRoutine] = useState<DisplayRoutineStep[]>(DEFAULT_ROUTINE_STEPS);
  const [hasAssignedRoutine, setHasAssignedRoutine] = useState(false);

  const isClient = profile?.role === 'client';

  // Fetch assigned routines for the client
  const fetchAssignedRoutines = useCallback(async () => {
    if (!user || !isClient) return;

    try {
      // Get active assignments for this client
      const { data: assignments, error: assignError } = await supabase
        .from('client_routine_assignments')
        .select('*')
        .eq('client_id', user.id)
        .eq('is_active', true);

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setAssignedRoutines([]);
        setHasAssignedRoutine(false);
        setDisplayRoutine(DEFAULT_ROUTINE_STEPS);
        return;
      }

      // Fetch routine details for each assignment
      const routinesWithSteps: AssignedRoutine[] = [];
      
      for (const assignment of assignments) {
        try {
          // Fetch routine template
          const { data: routine, error: routineError } = await supabase
            .from('routine_templates')
            .select('*')
            .eq('id', assignment.routine_id)
            .maybeSingle();

          if (routineError || !routine) {
            console.warn('Routine not found for assignment:', assignment.id);
            continue;
          }

          // Fetch steps
          const { data: steps, error: stepsError } = await supabase
            .from('routine_steps')
            .select('*')
            .eq('routine_id', assignment.routine_id)
            .order('step_order', { ascending: true });

          if (stepsError) {
            console.warn('Error fetching steps for routine:', assignment.routine_id);
            continue;
          }

          routinesWithSteps.push({
            id: routine.id,
            name: routine.name,
            description: routine.description,
            schedule_type: routine.schedule_type,
            schedule_days: routine.schedule_days,
            steps: steps || [],
            assignment_id: assignment.id,
            assigned_at: assignment.assigned_at,
            professional_notes: assignment.notes,
          });
        } catch (err) {
          console.warn('Error processing assignment:', assignment.id, err);
          continue;
        }
      }

      setAssignedRoutines(routinesWithSteps);
      setHasAssignedRoutine(routinesWithSteps.length > 0);

      // Convert to display format
      const displaySteps = convertToDisplayFormat(routinesWithSteps);
      setDisplayRoutine(displaySteps.length > 0 ? displaySteps : DEFAULT_ROUTINE_STEPS);
    } catch (error) {
      console.error('Error fetching assigned routines:', error);
      setDisplayRoutine(DEFAULT_ROUTINE_STEPS);
    }
  }, [user, isClient]);


  // Convert assigned routines to display format
  const convertToDisplayFormat = (routines: AssignedRoutine[]): DisplayRoutineStep[] => {
    const morningSteps: DisplayRoutineStep[] = [];
    const eveningSteps: DisplayRoutineStep[] = [];

    routines.forEach((routine) => {
      routine.steps.forEach((step) => {
        const displayStep: DisplayRoutineStep = {
          id: step.id,
          time: routine.schedule_type === 'evening' ? 'evening' : 'morning',
          step: step.step_order,
          product: step.product_name,
          productType: step.product_type || 'Product',
          instructions: step.instructions || '',
          completed: false,
          routineId: routine.id,
        };

        // Assign to morning or evening based on schedule type
        if (routine.schedule_type === 'evening') {
          eveningSteps.push(displayStep);
        } else if (routine.schedule_type === 'morning') {
          morningSteps.push(displayStep);
        } else if (routine.schedule_type === 'daily') {
          // For daily routines, add to both morning and evening
          morningSteps.push({ ...displayStep, time: 'morning', id: `${step.id}-am` });
          eveningSteps.push({ ...displayStep, time: 'evening', id: `${step.id}-pm` });
        }
      });
    });

    // Sort by step order
    morningSteps.sort((a, b) => a.step - b.step);
    eveningSteps.sort((a, b) => a.step - b.step);

    // Re-number steps
    morningSteps.forEach((step, index) => {
      step.step = index + 1;
    });
    eveningSteps.forEach((step, index) => {
      step.step = index + 1;
    });

    // If no steps were added, use defaults
    if (morningSteps.length === 0 && eveningSteps.length === 0) {
      return DEFAULT_ROUTINE_STEPS;
    }

    // If only one time has steps, add defaults for the other
    if (morningSteps.length === 0) {
      return [
        ...DEFAULT_ROUTINE_STEPS.filter(s => s.time === 'morning'),
        ...eveningSteps,
      ];
    }

    if (eveningSteps.length === 0) {
      return [
        ...morningSteps,
        ...DEFAULT_ROUTINE_STEPS.filter(s => s.time === 'evening'),
      ];
    }

    return [...morningSteps, ...eveningSteps];
  };

  // Get morning routine steps
  const getMorningRoutine = (): DisplayRoutineStep[] => {
    return displayRoutine.filter(step => step.time === 'morning');
  };

  // Get evening routine steps
  const getEveningRoutine = (): DisplayRoutineStep[] => {
    return displayRoutine.filter(step => step.time === 'evening');
  };

  // Toggle step completion (local state only - actual completion is tracked in useClientData)
  const toggleStepCompletion = (stepId: string) => {
    setDisplayRoutine(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    );
  };

  // Reset completion status (for new day)
  const resetCompletions = () => {
    setDisplayRoutine(prev =>
      prev.map(step => ({ ...step, completed: false }))
    );
  };

  // Mark all steps for a time period as complete
  const markTimeComplete = (time: 'morning' | 'evening') => {
    setDisplayRoutine(prev =>
      prev.map(step =>
        step.time === time ? { ...step, completed: true } : step
      )
    );
  };

  // Mark all steps for a time period as incomplete
  const markTimeIncomplete = (time: 'morning' | 'evening') => {
    setDisplayRoutine(prev =>
      prev.map(step =>
        step.time === time ? { ...step, completed: false } : step
      )
    );
  };

  // Check if all steps for a time period are complete
  const isTimeComplete = (time: 'morning' | 'evening'): boolean => {
    const timeSteps = displayRoutine.filter(step => step.time === time);
    return timeSteps.length > 0 && timeSteps.every(step => step.completed);
  };

  // Get progress percentage for a time period
  const getTimeProgress = (time: 'morning' | 'evening'): number => {
    const timeSteps = displayRoutine.filter(step => step.time === time);
    if (timeSteps.length === 0) return 0;
    const completed = timeSteps.filter(step => step.completed).length;
    return Math.round((completed / timeSteps.length) * 100);
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      if (!user || !isClient) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchAssignedRoutines();
      setLoading(false);
    };

    loadData();
  }, [user, isClient, fetchAssignedRoutines]);

  return {
    loading,
    assignedRoutines,
    displayRoutine,
    hasAssignedRoutine,
    getMorningRoutine,
    getEveningRoutine,
    toggleStepCompletion,
    resetCompletions,
    markTimeComplete,
    markTimeIncomplete,
    isTimeComplete,
    getTimeProgress,
    refreshRoutines: fetchAssignedRoutines,
  };
}
