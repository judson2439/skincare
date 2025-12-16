import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTreatmentPlans, TreatmentPlan, TreatmentPlanMilestone, TreatmentPlanAppointment } from './useTreatmentPlans';
import { useAppointments, Appointment } from './useAppointments';
import { useAuth } from '@/contexts/AuthContext';

export type NotificationType = 
  | 'milestone_approaching'
  | 'milestone_overdue'
  | 'appointment_overdue'
  | 'plan_nearing_completion'
  | 'plan_ending_soon';

export interface ProfessionalNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  data: {
    planId?: string;
    planTitle?: string;
    clientId?: string;
    clientName?: string;
    milestoneId?: string;
    milestoneTitle?: string;
    appointmentId?: string;
    targetDate?: string;
    daysUntil?: number;
    daysOverdue?: number;
    progress?: number;
  };
}

interface NotificationSettings {
  milestoneWarningDays: number; // Days before milestone to warn
  appointmentOverdueDays: number; // Days after appointment to mark overdue
  planCompletionThreshold: number; // Percentage to consider "nearing completion"
  planEndingWarningDays: number; // Days before plan ends to warn
}

const DEFAULT_SETTINGS: NotificationSettings = {
  milestoneWarningDays: 3,
  appointmentOverdueDays: 1,
  planCompletionThreshold: 80,
  planEndingWarningDays: 7,
};

export function useProfessionalNotifications(settings: Partial<NotificationSettings> = {}) {
  const { profile } = useAuth();
  const treatmentPlans = useTreatmentPlans();
  const appointmentsHook = useAppointments();
  
  const [notifications, setNotifications] = useState<ProfessionalNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());

  const isProfessional = profile?.role === 'professional';
  
  const mergedSettings: NotificationSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
  };

  // Generate notifications based on treatment plans and appointments
  const generateNotifications = useCallback(() => {
    if (!isProfessional) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const generatedNotifications: ProfessionalNotification[] = [];

    // Process treatment plans
    treatmentPlans.plans.forEach((plan) => {
      if (plan.status !== 'active') return;

      const progress = treatmentPlans.getPlanProgress(plan);
      const clientName = plan.client?.full_name || 'Unknown Client';

      // Check for approaching milestones
      plan.milestones.forEach((milestone) => {
        if (milestone.completed) return;

        const targetDate = new Date(milestone.target_date);
        const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Milestone approaching
        if (daysUntil > 0 && daysUntil <= mergedSettings.milestoneWarningDays) {
          generatedNotifications.push({
            id: `milestone-approaching-${milestone.id}`,
            type: 'milestone_approaching',
            title: 'Milestone Approaching',
            message: `"${milestone.title}" for ${clientName} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            priority: daysUntil === 1 ? 'high' : 'medium',
            timestamp: now,
            read: readNotificationIds.has(`milestone-approaching-${milestone.id}`),
            dismissed: dismissedNotificationIds.has(`milestone-approaching-${milestone.id}`),
            data: {
              planId: plan.id,
              planTitle: plan.title,
              clientId: plan.client_id,
              clientName,
              milestoneId: milestone.id,
              milestoneTitle: milestone.title,
              targetDate: milestone.target_date,
              daysUntil,
            },
          });
        }

        // Milestone overdue
        if (daysUntil < 0) {
          const daysOverdue = Math.abs(daysUntil);
          generatedNotifications.push({
            id: `milestone-overdue-${milestone.id}`,
            type: 'milestone_overdue',
            title: 'Milestone Overdue',
            message: `"${milestone.title}" for ${clientName} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
            priority: daysOverdue > 7 ? 'urgent' : 'high',
            timestamp: now,
            read: readNotificationIds.has(`milestone-overdue-${milestone.id}`),
            dismissed: dismissedNotificationIds.has(`milestone-overdue-${milestone.id}`),
            data: {
              planId: plan.id,
              planTitle: plan.title,
              clientId: plan.client_id,
              clientName,
              milestoneId: milestone.id,
              milestoneTitle: milestone.title,
              targetDate: milestone.target_date,
              daysOverdue,
            },
          });
        }
      });

      // Check for overdue appointments in treatment plans
      plan.appointments.forEach((apt) => {
        if (apt.completed) return;

        const scheduledDate = new Date(apt.scheduled_date);
        const daysOverdue = Math.ceil((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue >= mergedSettings.appointmentOverdueDays) {
          generatedNotifications.push({
            id: `plan-appointment-overdue-${apt.id}`,
            type: 'appointment_overdue',
            title: 'Appointment Overdue',
            message: `${apt.appointment_type} with ${clientName} was scheduled ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
            priority: daysOverdue > 7 ? 'urgent' : 'high',
            timestamp: now,
            read: readNotificationIds.has(`plan-appointment-overdue-${apt.id}`),
            dismissed: dismissedNotificationIds.has(`plan-appointment-overdue-${apt.id}`),
            data: {
              planId: plan.id,
              planTitle: plan.title,
              clientId: plan.client_id,
              clientName,
              appointmentId: apt.id,
              targetDate: apt.scheduled_date,
              daysOverdue,
            },
          });
        }
      });

      // Check for plans nearing completion
      if (progress.overallProgress >= mergedSettings.planCompletionThreshold && progress.overallProgress < 100) {
        generatedNotifications.push({
          id: `plan-nearing-completion-${plan.id}`,
          type: 'plan_nearing_completion',
          title: 'Plan Nearing Completion',
          message: `${clientName}'s "${plan.title}" is ${progress.overallProgress}% complete`,
          priority: 'low',
          timestamp: now,
          read: readNotificationIds.has(`plan-nearing-completion-${plan.id}`),
          dismissed: dismissedNotificationIds.has(`plan-nearing-completion-${plan.id}`),
          data: {
            planId: plan.id,
            planTitle: plan.title,
            clientId: plan.client_id,
            clientName,
            progress: progress.overallProgress,
          },
        });
      }

      // Check for plans ending soon
      const endDate = new Date(plan.end_date);
      const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilEnd > 0 && daysUntilEnd <= mergedSettings.planEndingWarningDays) {
        generatedNotifications.push({
          id: `plan-ending-soon-${plan.id}`,
          type: 'plan_ending_soon',
          title: 'Plan Ending Soon',
          message: `${clientName}'s "${plan.title}" ends in ${daysUntilEnd} day${daysUntilEnd !== 1 ? 's' : ''}`,
          priority: daysUntilEnd <= 2 ? 'high' : 'medium',
          timestamp: now,
          read: readNotificationIds.has(`plan-ending-soon-${plan.id}`),
          dismissed: dismissedNotificationIds.has(`plan-ending-soon-${plan.id}`),
          data: {
            planId: plan.id,
            planTitle: plan.title,
            clientId: plan.client_id,
            clientName,
            targetDate: plan.end_date,
            daysUntil: daysUntilEnd,
          },
        });
      }
    });

    // Process general appointments (not in treatment plans)
    appointmentsHook.appointments.forEach((apt) => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return;

      const scheduledDate = new Date(apt.start_time);
      const daysOverdue = Math.ceil((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue >= mergedSettings.appointmentOverdueDays) {
        const clientName = apt.client_name || 'Unknown Client';
        generatedNotifications.push({
          id: `appointment-overdue-${apt.id}`,
          type: 'appointment_overdue',
          title: 'Appointment Overdue',
          message: `${apt.title} with ${clientName} was scheduled ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
          priority: daysOverdue > 7 ? 'urgent' : 'high',
          timestamp: now,
          read: readNotificationIds.has(`appointment-overdue-${apt.id}`),
          dismissed: dismissedNotificationIds.has(`appointment-overdue-${apt.id}`),
          data: {
            appointmentId: apt.id,
            clientId: apt.client_id || undefined,
            clientName,
            targetDate: apt.start_time,
            daysOverdue,
          },
        });
      }
    });

    // Sort by priority and timestamp
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return generatedNotifications
      .filter(n => !n.dismissed)
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }, [
    isProfessional,
    treatmentPlans.plans,
    appointmentsHook.appointments,
    readNotificationIds,
    dismissedNotificationIds,
    mergedSettings,
  ]);

  // Update notifications when dependencies change
  useEffect(() => {
    const generated = generateNotifications();
    setNotifications(generated);
  }, [generateNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setReadNotificationIds(prev => new Set([...prev, notificationId]));
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadNotificationIds(prev => new Set([...prev, ...allIds]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setDismissedNotificationIds(prev => new Set([...prev, notificationId]));
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Dismiss all notifications
  const dismissAll = useCallback(() => {
    const allIds = new Set(notifications.map(n => n.id));
    setDismissedNotificationIds(prev => new Set([...prev, ...allIds]));
    setNotifications([]);
  }, [notifications]);

  // Computed values
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length,
    [notifications]
  );

  const urgentCount = useMemo(() => 
    notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length,
    [notifications]
  );

  const notificationsByType = useMemo(() => {
    const grouped: Record<NotificationType, ProfessionalNotification[]> = {
      milestone_approaching: [],
      milestone_overdue: [],
      appointment_overdue: [],
      plan_nearing_completion: [],
      plan_ending_soon: [],
    };

    notifications.forEach(n => {
      grouped[n.type].push(n);
    });

    return grouped;
  }, [notifications]);

  const notificationsByPriority = useMemo(() => {
    return {
      urgent: notifications.filter(n => n.priority === 'urgent'),
      high: notifications.filter(n => n.priority === 'high'),
      medium: notifications.filter(n => n.priority === 'medium'),
      low: notifications.filter(n => n.priority === 'low'),
    };
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    urgentCount,
    notificationsByType,
    notificationsByPriority,
    loading: treatmentPlans.loading || appointmentsHook.loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    refresh: () => {
      treatmentPlans.fetchPlans();
      appointmentsHook.fetchAppointments();
    },
  };
}
