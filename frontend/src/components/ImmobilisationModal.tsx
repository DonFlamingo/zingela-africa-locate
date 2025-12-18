import { useState } from 'react';
import type { Device, Command } from '../models/types';
import { createCommand } from '../services/commands';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ImmobilisationModalProps {
  device: Device;
  organizationId: string;
  userId: string;
  type: 'IMMOBILISE' | 'RESTORE_POWER';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (command: Command) => void;
}

export function ImmobilisationModal({
  device,
  organizationId,
  userId,
  type,
  isOpen,
  onClose,
  onSuccess,
}: ImmobilisationModalProps) {
  const [step, setStep] = useState(1);
  const [checklist, setChecklist] = useState({
    vehicleStationary: false,
    userAuthorized: false,
    actionAudited: false,
  });
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isImmobilise = type === 'IMMOBILISE';
  const requiredConfirmation = isImmobilise ? 'IMMOBILISE' : 'RESTORE POWER';
  const canProceed = step === 1
    ? checklist.vehicleStationary && checklist.userAuthorized && checklist.actionAudited
    : step === 2
    ? reason.trim().length > 0
    : confirmation === requiredConfirmation;

  const handleChecklistChange = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    try {
      const command = createCommand({
        type,
        status: 'requested',
        deviceId: device.id,
        organizationId,
        userId,
        reason: reason.trim(),
      });

      onSuccess(command);
      handleClose();
    } catch (error) {
      console.error('Failed to create command:', error);
      alert('Failed to create command. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setChecklist({
      vehicleStationary: false,
      userAuthorized: false,
      actionAudited: false,
    });
    setReason('');
    setConfirmation('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-iot-surface rounded-lg border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isImmobilise ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              <AlertTriangle className={`w-6 h-6 ${isImmobilise ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isImmobilise ? 'Immobilise Vehicle' : 'Restore Vehicle Power'}
              </h2>
              <p className="text-sm text-gray-400">{device.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Safety Warning & Checklist */}
          {step === 1 && (
            <>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-400 mb-2">Safety Warning</h3>
                    <p className="text-sm text-gray-300">
                      {isImmobilise
                        ? 'Immobilising a vehicle will disable its engine. This action should only be performed when the vehicle is stationary and you have proper authorization. This action will be audited.'
                        : 'Restoring power to a vehicle will re-enable its engine. Ensure you have proper authorization before proceeding.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-white">Mandatory Checklist</h3>
                {[
                  { key: 'vehicleStationary' as const, label: 'Vehicle is stationary' },
                  { key: 'userAuthorized' as const, label: 'I am authorized to perform this action' },
                  { key: 'actionAudited' as const, label: 'I understand this action will be audited' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={() => handleChecklistChange(item.key)}
                      className="w-5 h-5 rounded border-gray-600 text-iot-accent focus:ring-iot-accent"
                    />
                    <span className="text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Reason */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for {isImmobilise ? 'Immobilisation' : 'Power Restoration'} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for this action..."
                  className="input w-full h-32 resize-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-sm text-amber-400 mb-2">
                  Type <strong className="font-mono">{requiredConfirmation}</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                  placeholder={requiredConfirmation}
                  className="input w-full font-mono text-center text-lg"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded ${
                  s <= step ? 'bg-iot-accent' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <button
            onClick={handleClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed || isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className={`${isImmobilise ? 'btn-danger' : 'btn-primary'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Submitting...' : isImmobilise ? 'Request Immobilisation' : 'Request Power Restoration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

