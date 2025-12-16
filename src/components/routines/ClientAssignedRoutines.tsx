import React, { useState } from 'react';
import { useClientRoutines, AssignedRoutine, DisplayRoutineStep } from '@/hooks/useClientRoutines';
import { useClientData } from '@/hooks/useClientData';
import { useToast } from '@/hooks/use-toast';
import {
  Sun,
  Moon,
  Clock,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ClipboardList,
  User,
  MessageSquare,
  Loader2,
  Info,
  Package,
} from 'lucide-react';

interface ClientAssignedRoutinesProps {
  onCompleteRoutine?: (routineType: 'morning' | 'evening') => void;
  completingRoutine?: boolean;
}

const ClientAssignedRoutines: React.FC<ClientAssignedRoutinesProps> = ({
  onCompleteRoutine,
  completingRoutine = false,
}) => {
  const {
    loading,
    assignedRoutines,
    displayRoutine,
    hasAssignedRoutine,
    getMorningRoutine,
    getEveningRoutine,
    toggleStepCompletion,
    isTimeComplete,
    getTimeProgress,
  } = useClientRoutines();

  const clientData = useClientData();
  const { toast } = useToast();

  const [activeTime, setActiveTime] = useState<'morning' | 'evening'>('morning');
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);

  const morningSteps = getMorningRoutine();
  const eveningSteps = getEveningRoutine();
  const currentSteps = activeTime === 'morning' ? morningSteps : eveningSteps;

  const isMorningComplete = clientData.isRoutineCompletedToday('morning');
  const isEveningComplete = clientData.isRoutineCompletedToday('evening');

  const getScheduleIcon = (type: string) => {
    switch (type) {
      case 'morning': return Sun;
      case 'evening': return Moon;
      case 'daily': return Clock;
      case 'weekly': return Calendar;
      default: return Clock;
    }
  };

  const getScheduleLabel = (type: string) => {
    switch (type) {
      case 'morning': return 'Morning Routine';
      case 'evening': return 'Evening Routine';
      case 'daily': return 'Daily (AM & PM)';
      case 'weekly': return 'Weekly';
      default: return type;
    }
  };

  const getScheduleColor = (type: string) => {
    switch (type) {
      case 'morning': return 'from-amber-400 to-orange-500';
      case 'evening': return 'from-indigo-500 to-purple-500';
      case 'daily': return 'from-green-500 to-emerald-500';
      case 'weekly': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assigned Routines Overview */}
      {hasAssignedRoutine && assignedRoutines.length > 0 && (
        <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-2xl p-6 border border-[#CFAFA3]/20">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-[#CFAFA3]" />
            <h3 className="font-serif font-bold text-lg text-gray-900">Your Assigned Routines</h3>
            <span className="px-2 py-0.5 bg-[#CFAFA3]/20 text-[#CFAFA3] text-xs font-medium rounded-full">
              {assignedRoutines.length} active
            </span>
          </div>

          <div className="space-y-3">
            {assignedRoutines.map((routine) => {
              const ScheduleIcon = getScheduleIcon(routine.schedule_type);
              const isExpanded = expandedRoutine === routine.id;

              return (
                <div
                  key={routine.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  {/* Routine Header */}
                  <button
                    onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getScheduleColor(routine.schedule_type)} flex items-center justify-center`}>
                        <ScheduleIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{routine.name}</h4>
                        <p className="text-xs text-gray-500">
                          {getScheduleLabel(routine.schedule_type)} • {routine.steps.length} steps
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        Assigned {new Date(routine.assigned_at).toLocaleDateString()}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      {routine.description && (
                        <p className="text-sm text-gray-600 mb-4">{routine.description}</p>
                      )}

                      {routine.professional_notes && (
                        <div className="flex items-start gap-2 p-3 bg-[#CFAFA3]/10 rounded-lg mb-4">
                          <MessageSquare className="w-4 h-4 text-[#CFAFA3] mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-[#CFAFA3] mb-1">Note from your professional:</p>
                            <p className="text-sm text-gray-700">{routine.professional_notes}</p>
                          </div>
                        </div>
                      )}

                      <h5 className="text-sm font-medium text-gray-700 mb-3">Routine Steps</h5>
                      <div className="space-y-2">
                        {routine.steps.map((step, idx) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100"
                          >
                            <div className="w-6 h-6 rounded-full bg-[#CFAFA3] text-white text-xs flex items-center justify-center font-medium flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{step.product_name}</p>
                                {step.product_type && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {step.product_type}
                                  </span>
                                )}
                              </div>
                              {step.instructions && (
                                <p className="text-sm text-gray-500 mt-1">{step.instructions}</p>
                              )}
                              {step.duration_minutes && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Duration: {step.duration_minutes} min
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Assigned Routines - Default Routine Info */}
      {!hasAssignedRoutine && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Using Default Routine</p>
              <p className="text-sm text-blue-700 mt-1">
                You're currently using a default skincare routine. When your skincare professional assigns you a personalized routine, it will appear here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time Toggle */}
      <div className="flex items-center justify-center">
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTime('morning')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTime === 'morning'
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Morning</span>
            {isMorningComplete && <Check className="w-4 h-4 text-green-300" />}
          </button>
          <button
            onClick={() => setActiveTime('evening')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTime === 'evening'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Evening</span>
            {isEveningComplete && <Check className="w-4 h-4 text-green-300" />}
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className={`rounded-2xl p-6 text-white ${
        activeTime === 'morning' 
          ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium mb-1">
              {activeTime === 'morning' ? 'Morning' : 'Evening'} Progress
            </h3>
            <p className="text-white/70 text-sm">
              {currentSteps.filter(s => s.completed).length} of {currentSteps.length} steps completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{getTimeProgress(activeTime)}%</p>
            {(activeTime === 'morning' ? isMorningComplete : isEveningComplete) && (
              <p className="text-green-200 text-sm flex items-center gap-1 justify-end">
                <Check className="w-4 h-4" /> Complete
              </p>
            )}
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${getTimeProgress(activeTime)}%` }}
          />
        </div>
      </div>

      {/* Routine Steps */}
      <div className="space-y-3">
        {currentSteps.map((step) => (
          <div
            key={step.id}
            onClick={() => toggleStepCompletion(step.id)}
            className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${
              step.completed
                ? 'border-green-200 bg-green-50/50'
                : 'border-gray-100 hover:border-[#CFAFA3]/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-[#CFAFA3] hover:text-white'
                }`}
              >
                {step.completed ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="text-lg font-bold">{step.step}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`font-medium ${
                      step.completed ? 'text-green-700 line-through' : 'text-gray-900'
                    }`}
                  >
                    {step.product}
                  </h4>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {step.productType}
                  </span>
                </div>
                {step.instructions && (
                  <p className="text-sm text-gray-500">{step.instructions}</p>
                )}
              </div>
              <Package className="w-5 h-5 text-gray-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Complete Routine Button */}
      {onCompleteRoutine && !((activeTime === 'morning' && isMorningComplete) || (activeTime === 'evening' && isEveningComplete)) && (
        <button
          onClick={() => onCompleteRoutine(activeTime)}
          disabled={completingRoutine}
          className={`w-full py-4 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            activeTime === 'morning'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:shadow-amber-500/30'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/30'
          }`}
        >
          {completingRoutine ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {activeTime === 'morning' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              Confirm {activeTime === 'morning' ? 'Morning' : 'Evening'} Routine Complete
            </>
          )}
        </button>
      )}

      {/* Already Completed Message */}
      {((activeTime === 'morning' && isMorningComplete) || (activeTime === 'evening' && isEveningComplete)) && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            <p className="font-medium">
              {activeTime === 'morning' ? 'Morning' : 'Evening'} routine completed!
            </p>
          </div>
          <p className="text-sm text-green-600 mt-1">+50 points earned</p>
        </div>
      )}
    </div>
  );
};

export default ClientAssignedRoutines;
