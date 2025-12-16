import React, { useState } from 'react';
import { useProfessionalNotifications, ProfessionalNotification, NotificationType } from '@/hooks/useProfessionalNotifications';
import {
  Bell,
  BellOff,
  X,
  Check,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  Target,
  Flag,
  ChevronRight,
  Loader2,
  Trash2,
  Filter,
  RefreshCw,
  ClipboardList,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface ProfessionalNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToClient?: (clientId: string) => void;
  onNavigateToPlan?: (planId: string) => void;
}

const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  milestone_approaching: {
    icon: Flag,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Milestone Approaching',
  },
  milestone_overdue: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Milestone Overdue',
  },
  appointment_overdue: {
    icon: Calendar,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Appointment Overdue',
  },
  plan_nearing_completion: {
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Plan Nearing Completion',
  },
  plan_ending_soon: {
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Plan Ending Soon',
  },
};

const PRIORITY_CONFIG = {
  urgent: {
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'bg-red-500 text-white',
    label: 'Urgent',
  },
  high: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badge: 'bg-orange-500 text-white',
    label: 'High',
  },
  medium: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badge: 'bg-amber-500 text-white',
    label: 'Medium',
  },
  low: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    badge: 'bg-gray-400 text-white',
    label: 'Low',
  },
};

const ProfessionalNotificationCenter: React.FC<ProfessionalNotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateToClient,
  onNavigateToPlan,
}) => {
  const {
    notifications,
    unreadCount,
    urgentCount,
    notificationsByType,
    notificationsByPriority,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    refresh,
  } = useProfessionalNotifications();

  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [showFilters, setShowFilters] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    return true;
  });

  const handleNotificationClick = (notification: ProfessionalNotification) => {
    markAsRead(notification.id);
    
    if (notification.data.planId && onNavigateToPlan) {
      onNavigateToPlan(notification.data.planId);
      onClose();
    } else if (notification.data.clientId && onNavigateToClient) {
      onNavigateToClient(notification.data.clientId);
      onClose();
    }
  };

  const renderNotificationCard = (notification: ProfessionalNotification) => {
    const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type];
    const priorityConfig = PRIORITY_CONFIG[notification.priority];
    const Icon = typeConfig.icon;

    return (
      <div
        key={notification.id}
        className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
          notification.read 
            ? 'bg-white border-gray-100' 
            : `${priorityConfig.bgColor} ${priorityConfig.borderColor}`
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        {/* Unread indicator */}
        {!notification.read && (
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#CFAFA3]" />
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl ${typeConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${typeConfig.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityConfig.badge}`}>
                {priorityConfig.label}
              </span>
            </div>
            
            <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
              {notification.message}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-2">
              {notification.data.clientName && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  {notification.data.clientName}
                </span>
              )}
              {notification.data.planTitle && (
                <span className="flex items-center gap-1 text-xs text-[#CFAFA3]">
                  <ClipboardList className="w-3 h-3" />
                  {notification.data.planTitle}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notification.id);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            {!notification.read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mark as read"
              >
                <Check className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* View action */}
        <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-[#CFAFA3] font-medium flex items-center gap-1">
            View details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50">
      <div className="bg-white w-full max-w-lg h-full overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CFAFA3]/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#CFAFA3]" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                {urgentCount > 0 && (
                  <span className="ml-2 text-red-600 font-medium">
                    {urgentCount} urgent
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-[#CFAFA3] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#CFAFA3] text-sm font-medium hover:bg-[#CFAFA3]/10 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={dismissAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0 space-y-4">
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Filter by Type</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === 'all' 
                      ? 'bg-[#CFAFA3] text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Types
                </button>
                {(Object.keys(NOTIFICATION_TYPE_CONFIG) as NotificationType[]).map(type => {
                  const config = NOTIFICATION_TYPE_CONFIG[type];
                  const count = notificationsByType[type].length;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterType === type 
                          ? 'bg-[#CFAFA3] text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <config.icon className="w-3 h-3" />
                      {config.label}
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          filterType === type ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Filter by Priority</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterPriority('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterPriority === 'all' 
                      ? 'bg-[#CFAFA3] text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Priorities
                </button>
                {(['urgent', 'high', 'medium', 'low'] as const).map(priority => {
                  const config = PRIORITY_CONFIG[priority];
                  const count = notificationsByPriority[priority].length;
                  return (
                    <button
                      key={priority}
                      onClick={() => setFilterPriority(priority)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterPriority === priority 
                          ? config.badge
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {config.label}
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          filterPriority === priority ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BellOff className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {notifications.length === 0 ? 'No Notifications' : 'No Matching Notifications'}
              </h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                {notifications.length === 0 
                  ? 'All your treatment plans and appointments are on track!'
                  : 'Try adjusting your filters to see more notifications.'}
              </p>
              {notifications.length > 0 && filterType !== 'all' && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterPriority('all');
                  }}
                  className="mt-4 text-sm text-[#CFAFA3] font-medium hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(renderNotificationCard)}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {notifications.length > 0 && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-red-600">{notificationsByPriority.urgent.length}</p>
                <p className="text-xs text-gray-500">Urgent</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">{notificationsByPriority.high.length}</p>
                <p className="text-xs text-gray-500">High</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{notificationsByPriority.medium.length}</p>
                <p className="text-xs text-gray-500">Medium</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600">{notificationsByPriority.low.length}</p>
                <p className="text-xs text-gray-500">Low</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalNotificationCenter;
