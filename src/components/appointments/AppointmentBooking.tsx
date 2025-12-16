import React, { useState, useEffect } from 'react';
import { useAppointments, AppointmentType, TimeSlot, DAYS_OF_WEEK } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  X
} from 'lucide-react';

interface AppointmentBookingProps {
  professionalId: string;
  professionalName: string;
  professionalImage?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  professionalId,
  professionalName,
  professionalImage,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const appointments = useAppointments();
  
  const [step, setStep] = useState(1); // 1: Select Type, 2: Select Date/Time, 3: Enter Details, 4: Confirmation
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  
  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch appointment types
  useEffect(() => {
    const fetchTypes = async () => {
      await appointments.fetchAppointmentTypes(professionalId);
    };
    fetchTypes();
  }, [professionalId]);

  useEffect(() => {
    setAppointmentTypes(appointments.appointmentTypes);
  }, [appointments.appointmentTypes]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && selectedType) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedType]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedType) return;
    
    setLoadingSlots(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const slots = await appointments.getAvailableSlots(
      professionalId,
      dateStr,
      selectedType.duration_minutes
    );
    setAvailableSlots(slots);
    setLoadingSlots(false);
  };

  const handleSelectType = (type: AppointmentType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBook = async () => {
    if (!selectedType || !selectedSlot) return;

    setBooking(true);
    const result = await appointments.createAppointment(
      professionalId,
      selectedType.id,
      selectedSlot.start_time,
      selectedSlot.end_time,
      {
        title: selectedType.name,
        description: selectedType.description || undefined,
        is_virtual: selectedType.is_virtual,
        client_name: clientName || undefined,
        client_email: clientEmail || undefined,
        client_phone: clientPhone || undefined,
        notes: notes || undefined
      }
    );
    setBooking(false);

    if (result.success) {
      setStep(4);
      toast({
        title: 'Appointment Booked!',
        description: 'You will receive a confirmation shortly.',
      });
      onSuccess?.();
    } else {
      toast({
        title: 'Booking Failed',
        description: result.error || 'Unable to book appointment',
        variant: 'destructive'
      });
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render Step 1: Select Appointment Type
  const renderSelectType = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-serif font-bold text-gray-900">Select Consultation Type</h3>
      
      {appointmentTypes.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No appointment types available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointmentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelectType(type)}
              className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#CFAFA3] hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
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
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    {type.description && (
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {type.duration_minutes} min
                      </span>
                      {type.is_virtual && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          Virtual
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {type.price && (
                  <span className="text-lg font-bold text-[#CFAFA3]">
                    ${type.price.toFixed(0)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Render Step 2: Select Date and Time
  const renderSelectDateTime = () => (
    <div className="space-y-4">
      <button
        onClick={() => setStep(1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#CFAFA3]"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${selectedType?.color}20` }}
        >
          {selectedType?.is_virtual ? (
            <Video className="w-5 h-5" style={{ color: selectedType?.color }} />
          ) : (
            <MapPin className="w-5 h-5" style={{ color: selectedType?.color }} />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{selectedType?.name}</p>
          <p className="text-sm text-gray-500">{selectedType?.duration_minutes} minutes</p>
        </div>
      </div>

      <h3 className="text-lg font-serif font-bold text-gray-900">Select Date & Time</h3>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.value} className="text-center text-xs font-medium text-gray-500 py-2">
              {day.short}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentMonth).map((date, index) => (
            <button
              key={index}
              onClick={() => date && !isDateDisabled(date) && setSelectedDate(date)}
              disabled={!date || isDateDisabled(date)}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all ${
                !date
                  ? ''
                  : isDateDisabled(date)
                  ? 'text-gray-300 cursor-not-allowed'
                  : selectedDate?.toDateString() === date.toDateString()
                  ? 'bg-[#CFAFA3] text-white font-medium'
                  : 'hover:bg-[#CFAFA3]/10 text-gray-700'
              }`}
            >
              {date?.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Available Times for {formatDate(selectedDate)}
          </h4>
          
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No available times for this date</p>
              <p className="text-sm text-gray-400">Please select another date</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSlot(slot)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedSlot?.start_time === slot.start_time
                      ? 'bg-[#CFAFA3] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-[#CFAFA3]/20'
                  }`}
                >
                  {formatTime(slot.start_time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Step 3: Enter Details
  const renderEnterDetails = () => (
    <div className="space-y-4">
      <button
        onClick={() => setStep(2)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#CFAFA3]"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl border border-[#CFAFA3]/20">
        <h4 className="font-medium text-gray-900 mb-2">Appointment Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            {selectedType?.is_virtual ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            <span>{selectedType?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{selectedDate && formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {selectedSlot && formatTime(selectedSlot.start_time)} - {selectedSlot && formatTime(selectedSlot.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>with {professionalName}</span>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-serif font-bold text-gray-900">Your Information</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" /> Full Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" /> Email
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" /> Phone Number
          </label>
          <input
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" /> Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
            rows={3}
            placeholder="Any specific concerns or questions..."
          />
        </div>
      </div>

      <button
        onClick={handleBook}
        disabled={booking}
        className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {booking ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Booking...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" /> Confirm Booking
            {selectedType?.price && <span>(${selectedType.price.toFixed(0)})</span>}
          </>
        )}
      </button>
    </div>
  );

  // Render Step 4: Confirmation
  const renderConfirmation = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
      <p className="text-gray-500 mb-6">
        Your appointment has been scheduled. You'll receive a confirmation email shortly.
      </p>

      <div className="p-4 bg-gray-50 rounded-xl text-left mb-6">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            {selectedType?.is_virtual ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            <span className="font-medium">{selectedType?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{selectedDate && formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {selectedSlot && formatTime(selectedSlot.start_time)} - {selectedSlot && formatTime(selectedSlot.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>with {professionalName}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="px-6 py-3 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors"
      >
        Done
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {professionalImage && (
            <img
              src={professionalImage}
              alt={professionalName}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="font-serif font-bold text-gray-900">Book Appointment</h2>
            <p className="text-sm text-gray-500">with {professionalName}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              s <= step ? 'bg-[#CFAFA3]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      {step === 1 && renderSelectType()}
      {step === 2 && renderSelectDateTime()}
      {step === 3 && renderEnterDetails()}
      {step === 4 && renderConfirmation()}
    </div>
  );
};

export default AppointmentBooking;
