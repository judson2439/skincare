// DailyLog.tsx - Daily skincare tracking component for clients
import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Heart,
  Star,
  Check,
  Loader2,
  Save
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientData } from '@/hooks/useClientData';
import { useDailySkinCheckin } from '@/hooks/useDailySkinCheckin';
import { useProgressPhotos } from '@/hooks/useProgressPhotos';
import { useToast } from '@/hooks/use-toast';

interface RoutineItem {
  id: string;
  name: string;
  completed: boolean;
  time: 'morning' | 'evening' | 'both';
}

interface DailyLogProps {
  assignedRoutineSteps?: Array<{
    id: string;
    product_name: string;
    product_type?: string;
    instructions?: string;
  }>;
}

const DailyLog: React.FC<DailyLogProps> = ({ assignedRoutineSteps = [] }) => {
  const { user, profile } = useAuth();
  const clientData = useClientData();
  const dailyCheckin = useDailySkinCheckin();
  const progressPhotos = useProgressPhotos();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default routine items if no assigned routine
  const defaultRoutineItems: RoutineItem[] = [
    { id: '1', name: 'Gentle cleanser', completed: false, time: 'both' },
    { id: '2', name: 'Vitamin C serum', completed: false, time: 'morning' },
    { id: '3', name: 'Moisturizer', completed: false, time: 'both' },
    { id: '4', name: 'SPF 30+', completed: false, time: 'morning' },
    { id: '5', name: 'Double cleanse', completed: false, time: 'evening' },
    { id: '6', name: 'Toner', completed: false, time: 'both' },
    { id: '7', name: 'Treatment serum', completed: false, time: 'evening' },
    { id: '8', name: 'Night moisturizer', completed: false, time: 'evening' },
  ];

  // State
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>(
    assignedRoutineSteps.length > 0
      ? assignedRoutineSteps.map((step) => ({
          id: step.id,
          name: step.product_name,
          completed: false,
          time: 'both' as const
        }))
      : defaultRoutineItems
  );
  const [skinRating, setSkinRating] = useState(0);
  const [dailyNotes, setDailyNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load today's checkin data
  useEffect(() => {
    if (dailyCheckin.todayCheckin) {
      setSkinRating(dailyCheckin.todayCheckin.skin_rating || 0);
      setDailyNotes(dailyCheckin.todayCheckin.notes || '');
    }
  }, [dailyCheckin.todayCheckin]);

  // Toggle routine item
  const toggleRoutineItem = (id: string) => {
    setRoutineItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    const result = await progressPhotos.uploadPhoto(
      file,
      'progress',
      `Daily Photo - ${new Date().toLocaleDateString()}`,
      'Daily skin check-in photo'
    );
    setUploadingPhoto(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Photo uploaded successfully!' });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to upload photo', variant: 'destructive' });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save daily notes
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    // Get skin feel based on rating
    const skinFeelOptions = skinRating >= 4 ? ['glowing', 'hydrated'] : 
                           skinRating >= 3 ? ['balanced'] : 
                           skinRating >= 2 ? ['dry', 'dull'] : 
                           ['irritated'];
    
    const result = await dailyCheckin.submitCheckin(
      skinRating,
      skinFeelOptions,
      dailyNotes || undefined
    );
    setSavingNotes(false);

    if (result.success) {
      toast({ title: 'Saved!', description: 'Your daily log has been saved.' });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to save notes', variant: 'destructive' });
    }
  };

  // Split routine items into two columns
  const leftColumnItems = routineItems.filter((_, idx) => idx % 2 === 0);
  const rightColumnItems = routineItems.filter((_, idx) => idx % 2 === 1);

  return (
    <div className="space-y-6">
      {/* Routine Checklist */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg text-gray-900 mb-6">Today's Skincare Routine</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            {leftColumnItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  onClick={() => toggleRoutineItem(item.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    item.completed
                      ? 'bg-teal-500 border-teal-500'
                      : 'border-gray-300 group-hover:border-teal-400'
                  }`}
                >
                  {item.completed && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-gray-700 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                  {item.name}
                </span>
              </label>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {rightColumnItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  onClick={() => toggleRoutineItem(item.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    item.completed
                      ? 'bg-teal-500 border-teal-500'
                      : 'border-gray-300 group-hover:border-teal-400'
                  }`}
                >
                  {item.completed && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-gray-700 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                  {item.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Skin Photo Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Camera className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="font-serif font-bold text-lg text-gray-900">Daily Skin Photo</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Track your skin's progress with daily photos</p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Upload Area */}
          <div
            onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
          >
            {uploadingPhoto ? (
              <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <button
              disabled={uploadingPhoto}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50"
            >
              {uploadingPhoto ? 'Uploading...' : "Upload Today's Photo"}
            </button>
            <p className="text-xs text-gray-400 mt-3">Consistent photos help track your skin's journey</p>
          </div>
        </div>

        {/* How's Your Skin Today Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Heart className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="font-serif font-bold text-lg text-gray-900">How's Your Skin Today?</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Rate your skin's feel and add notes</p>

          {/* Skin Satisfaction Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Skin Satisfaction Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSkinRating(rating)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= skinRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Daily Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily Notes</label>
            <textarea
              value={dailyNotes}
              onChange={(e) => setDailyNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none resize-none text-sm"
              rows={3}
              placeholder="How does your skin feel today? Any observations or concerns..."
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="w-full py-3 bg-gradient-to-r from-amber-300 to-orange-300 text-gray-800 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingNotes ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Notes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyLog;
