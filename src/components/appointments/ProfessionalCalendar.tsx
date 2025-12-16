import React, { useState, useEffect } from 'react';
import { useAppointments, Appointment, AppointmentType, AvailabilitySlot, DAYS_OF_WEEK } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  User,
  Phone,
  Mail,
  Bell,
  Settings,
  Ban,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';

interface ProfessionalCalendarProps {
  onSendReminder?: (appointment: Appointment) => void;
}

const ProfessionalCalendar: React.FC<ProfessionalCalendarProps> = ({ onSendReminder }) => {
  const { toast } = useToast();
  const appointmentsHook = useAppointments();
  
  const [view, setView] = useState<'calendar' | 'list' | 'settings'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  
  // Form states
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [newTypeDuration, setNewTypeDuration] = useState(30);
  const [newTypePrice, setNewTypePrice] = useState('');
  const [newTypeIsVirtual, setNewTypeIsVirtual] = useState(false);
  const [newTypeColor, setNewTypeColor] = useState('#CFAFA3');
  const [savingType, setSavingType] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);

  // Availability form
  const [availabilitySlots, setAvailabilitySlots] = useState<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Block time form
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);

  // Initialize availability slots from database
  useEffect(() => {
    if (appointmentsHook.availability.length > 0) {
      setAvailabilitySlots(appointmentsHook.availability.map(a => ({
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time
      })));
    }
  }, [appointmentsHook.availability]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    return appointmentsHook.getAppointmentsByDate(date);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Appointment Type handlers
  const handleSaveType = async () => {
    if (!newTypeName.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setSavingType(true);
    
    if (editingType) {
      const result = await appointmentsHook.updateAppointmentType(editingType.id, {
        name: newTypeName,
        description: newTypeDescription || undefined,
        duration_minutes: newTypeDuration,
        price: newTypePrice ? parseFloat(newTypePrice) : undefined,
        is_virtual: newTypeIsVirtual,
        color: newTypeColor
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Appointment type updated!' });
        resetTypeForm();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } else {
      const result = await appointmentsHook.createAppointmentType(
        newTypeName,
        newTypeDuration,
        {
          description: newTypeDescription || undefined,
          price: newTypePrice ? parseFloat(newTypePrice) : undefined,
          is_virtual: newTypeIsVirtual,
          color: newTypeColor
        }
      );

      if (result.success) {
        toast({ title: 'Success', description: 'Appointment type created!' });
        resetTypeForm();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    }

    setSavingType(false);
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment type?')) return;
    
    const result = await appointmentsHook.deleteAppointmentType(id);
    if (result.success) {
      toast({ title: 'Success', description: 'Appointment type deleted' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const resetTypeForm = () => {
    setNewTypeName('');
    setNewTypeDescription('');
    setNewTypeDuration(30);
    setNewTypePrice('');
    setNewTypeIsVirtual(false);
    setNewTypeColor('#CFAFA3');
    setEditingType(null);
    setShowTypeModal(false);
  };

  const openEditType = (type: AppointmentType) => {
    setEditingType(type);
    setNewTypeName(type.name);
    setNewTypeDescription(type.description || '');
    setNewTypeDuration(type.duration_minutes);
    setNewTypePrice(type.price?.toString() || '');
    setNewTypeIsVirtual(type.is_virtual);
    setNewTypeColor(type.color);
    setShowTypeModal(true);
  };

  // Availability handlers
  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    const result = await appointmentsHook.setAvailabilitySlots(availabilitySlots);
    setSavingAvailability(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Availability updated!' });
      setShowAvailabilityModal(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const addAvailabilitySlot = (dayOfWeek: number) => {
    setAvailabilitySlots(prev => [...prev, {
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00'
    }]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (index: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailabilitySlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  // Block time handlers
  const handleBlockTime = async () => {
    if (!blockStartDate || !blockStartTime || !blockEndDate || !blockEndTime) {
      toast({ title: 'Error', description: 'Please fill in all date/time fields', variant: 'destructive' });
      return;
    }

    setSavingBlock(true);
    const startTime = new Date(`${blockStartDate}T${blockStartTime}`).toISOString();
    const endTime = new Date(`${blockEndDate}T${blockEndTime}`).toISOString();

    const result = await appointmentsHook.blockTime(startTime, endTime, blockReason);
    setSavingBlock(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Time blocked!' });
      setShowBlockTimeModal(false);
      setBlockStartDate('');
      setBlockStartTime('');
      setBlockEndDate('');
      setBlockEndTime('');
      setBlockReason('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  // Appointment action handlers
  const handleConfirmAppointment = async (id: string) => {
    const result = await appointmentsHook.confirmAppointment(id);
    if (result.success) {
      toast({ title: 'Success', description: 'Appointment confirmed!' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    const result = await appointmentsHook.cancelAppointment(id, 'Cancelled by professional');
    if (result.success) {
      toast({ title: 'Success', description: 'Appointment cancelled' });
      setShowAppointmentModal(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    const result = await appointmentsHook.completeAppointment(id);
    if (result.success) {
      toast({ title: 'Success', description: 'Appointment marked as completed!' });
      setShowAppointmentModal(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'no_show': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Render Calendar View
  const renderCalendarView = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-serif font-bold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.value} className="text-center text-sm font-medium text-gray-500 py-2">
              {day.short}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentDate).map((date, index) => {
            const appointments = date ? getAppointmentsForDate(date) : [];
            const isSelected = selectedDate?.toDateString() === date?.toDateString();
            const isToday = date?.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                onClick={() => date && setSelectedDate(date)}
                disabled={!date}
                className={`min-h-[80px] p-2 rounded-lg text-left transition-all ${
                  !date
                    ? ''
                    : isSelected
                    ? 'bg-[#CFAFA3]/20 border-2 border-[#CFAFA3]'
                    : isToday
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {date && (
                  <>
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </span>
                    {appointments.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {appointments.slice(0, 2).map((appt, i) => (
                          <div
                            key={i}
                            className="text-xs px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: `${appt.appointment_type?.color || '#CFAFA3'}30` }}
                          >
                            {formatTime(appt.start_time)}
                          </div>
                        ))}
                        {appointments.length > 2 && (
                          <div className="text-xs text-gray-500">+{appointments.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Appointments */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg mb-4">
          {selectedDate ? formatDate(selectedDate) : 'Select a Date'}
        </h3>

        {selectedDate && (
          <>
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getAppointmentsForDate(selectedDate).map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => {
                      setSelectedAppointment(appt);
                      setShowAppointmentModal(true);
                    }}
                    className="w-full p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{appt.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                        </p>
                        {appt.client_name && (
                          <p className="text-sm text-gray-600 mt-1">{appt.client_name}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Render Settings View
  const renderSettingsView = () => (
    <div className="space-y-6">
      {/* Appointment Types */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg">Appointment Types</h3>
          <button
            onClick={() => {
              resetTypeForm();
              setShowTypeModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-xl text-sm font-medium hover:bg-[#B89A8E] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Type
          </button>
        </div>

        {appointmentsHook.appointmentTypes.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No appointment types yet</p>
            <p className="text-sm text-gray-400">Create your first appointment type to start accepting bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointmentsHook.appointmentTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    {type.is_virtual ? (
                      <Video className="w-5 h-5" style={{ color: type.color }} />
                    ) : (
                      <MapPin className="w-5 h-5" style={{ color: type.color }} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{type.name}</p>
                    <p className="text-sm text-gray-500">
                      {type.duration_minutes} min
                      {type.price && ` • $${type.price}`}
                      {type.is_virtual && ' • Virtual'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditType(type)}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id)}
                    className="p-2 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg">Weekly Availability</h3>
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-xl text-sm font-medium hover:bg-[#B89A8E] transition-colors"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>

        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const daySlots = appointmentsHook.availability.filter(s => s.day_of_week === day.value);
            return (
              <div key={day.value} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-700 w-24">{day.label}</span>
                <div className="flex-1 text-right">
                  {daySlots.length === 0 ? (
                    <span className="text-gray-400">Unavailable</span>
                  ) : (
                    daySlots.map((slot, i) => (
                      <span key={i} className="text-gray-600">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        {i < daySlots.length - 1 && ', '}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Block Time */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg">Blocked Time</h3>
          <button
            onClick={() => setShowBlockTimeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-xl text-sm font-medium hover:bg-[#B89A8E] transition-colors"
          >
            <Ban className="w-4 h-4" /> Block Time
          </button>
        </div>

        {appointmentsHook.blockedTimes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No blocked time slots</p>
        ) : (
          <div className="space-y-2">
            {appointmentsHook.blockedTimes.map((block) => (
              <div key={block.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(block.start_time).toLocaleDateString()} - {new Date(block.end_time).toLocaleDateString()}
                  </p>
                  {block.reason && <p className="text-sm text-gray-500">{block.reason}</p>}
                </div>
                <button
                  onClick={() => appointmentsHook.unblockTime(block.id)}
                  className="p-2 hover:bg-red-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Appointments</h2>
          <p className="text-gray-500">Manage your schedule and availability</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'calendar' ? 'bg-white shadow text-[#CFAFA3]' : 'text-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" /> Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-white shadow text-[#CFAFA3]' : 'text-gray-600'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" /> Upcoming
            </button>
            <button
              onClick={() => setView('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'settings' ? 'bg-white shadow text-[#CFAFA3]' : 'text-gray-600'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" /> Settings
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {appointmentsHook.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
        </div>
      )}

      {/* Content */}
      {!appointmentsHook.loading && (
        <>
          {view === 'calendar' && renderCalendarView()}
          {view === 'list' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-4">Upcoming Appointments</h3>
              {appointmentsHook.getUpcomingAppointments().length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointmentsHook.getUpcomingAppointments().map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#CFAFA3]">
                            {new Date(appt.start_time).getDate()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(appt.start_time).toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appt.title}</p>
                          <p className="text-sm text-gray-500">
                            {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                          </p>
                          {appt.client_name && (
                            <p className="text-sm text-gray-600">{appt.client_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                        {appt.status === 'scheduled' && (
                          <button
                            onClick={() => handleConfirmAppointment(appt.id)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            title="Confirm"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {onSendReminder && (
                          <button
                            onClick={() => onSendReminder(appt)}
                            className="p-2 bg-[#CFAFA3]/20 text-[#CFAFA3] rounded-lg hover:bg-[#CFAFA3]/30"
                            title="Send Reminder"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {view === 'settings' && renderSettingsView()}
        </>
      )}

      {/* Appointment Detail Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Appointment Details</h3>
              <button onClick={() => setShowAppointmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium text-gray-900">{selectedAppointment.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedAppointment.start_time).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">
                    {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>

              {selectedAppointment.client_name && (
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.client_name}</p>
                  {selectedAppointment.client_email && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {selectedAppointment.client_email}
                    </p>
                  )}
                  {selectedAppointment.client_phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedAppointment.client_phone}
                    </p>
                  )}
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              {selectedAppointment.status === 'scheduled' && (
                <button
                  onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                  className="flex-1 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm
                </button>
              )}
              {(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
                <>
                  <button
                    onClick={() => handleCompleteAppointment(selectedAppointment.id)}
                    className="flex-1 py-2 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Complete
                  </button>
                  <button
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    className="py-2 px-4 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">
                {editingType ? 'Edit Appointment Type' : 'New Appointment Type'}
              </h3>
              <button onClick={resetTypeForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="e.g., Skin Consultation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTypeDescription}
                  onChange={(e) => setNewTypeDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                  <select
                    value={newTypeDuration}
                    onChange={(e) => setNewTypeDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={newTypePrice}
                    onChange={(e) => setNewTypePrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTypeIsVirtual}
                    onChange={(e) => setNewTypeIsVirtual(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#CFAFA3] focus:ring-[#CFAFA3]"
                  />
                  <span className="text-sm text-gray-700">Virtual appointment</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {['#CFAFA3', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTypeColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newTypeColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetTypeForm}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveType}
                disabled={savingType || !newTypeName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingType ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Set Weekly Availability</h3>
              <button onClick={() => setShowAvailabilityModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = availabilitySlots.filter(s => s.day_of_week === day.value);
                return (
                  <div key={day.value} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">{day.label}</span>
                      <button
                        onClick={() => addAvailabilitySlot(day.value)}
                        className="text-sm text-[#CFAFA3] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add slot
                      </button>
                    </div>
                    {daySlots.length === 0 ? (
                      <p className="text-sm text-gray-400">Unavailable</p>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map((slot, i) => {
                          const slotIndex = availabilitySlots.findIndex(
                            s => s.day_of_week === slot.day_of_week && s.start_time === slot.start_time && s.end_time === slot.end_time
                          );
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateAvailabilitySlot(slotIndex, 'start_time', e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              />
                              <span className="text-gray-400">to</span>
                              <input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateAvailabilitySlot(slotIndex, 'end_time', e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              />
                              <button
                                onClick={() => removeAvailabilitySlot(slotIndex)}
                                className="p-2 hover:bg-red-100 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvailability}
                disabled={savingAvailability}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Availability
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Modal */}
      {showBlockTimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Block Time</h3>
              <button onClick={() => setShowBlockTimeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="e.g., Vacation, Personal time"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBlockTimeModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockTime}
                disabled={savingBlock}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Block Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalCalendar;
