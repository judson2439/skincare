import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientNotification {
  id: string;
  client_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export function useClientNotifications() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user || profile?.role !== 'client') return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_notifications')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || profile?.role !== 'client') return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('client_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_notifications',
          filter: `client_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as ClientNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_notifications',
          filter: `client_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as ClientNotification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.read).length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('client_notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('client_id', user.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      return { success: true };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('client_notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('client_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      return { success: true };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      const { error } = await supabase
        .from('client_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('client_id', user.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  };

  // Get notifications by type
  const getNotificationsByType = useCallback((type: string): ClientNotification[] => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback((): ClientNotification[] => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType,
    getUnreadNotifications,
    refreshNotifications: fetchNotifications
  };
}
