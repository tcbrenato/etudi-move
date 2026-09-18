import { useState } from 'react';
import { X, CheckCircle2, Smartphone, Banknote, Info, Clock, Ruler } from 'lucide-react';
import { Spinner } from '@/components/ui/Feedback';
import { PAYMENT_METHODS, formatFcfa, isMobileMoney, paymentMethodLabel } from '@/utils/format';
import type { BookingReceipt } from '@/lib/bookings';
import type { PaymentMethod, TripWithDriver } from '@/types';

interface PaymentModalProps {
  trip: TripWithDriver;
  defaultPhone: string;
  onConfirm: (method: PaymentMethod, phone: string | null) => Promise<BookingReceipt>;
  onClose: () => void;
}

type Step = 'form' | 'processing' | 'success';

export function PaymentModal({ trip, defaultPhone, onConfirm, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('mtn_momo');
  const [phone, setPhone] = useState(defaultPhone);
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  const mobile = isMobileMoney(method);
  const busy = step === 'processing';

  async function handlePay() {
    setError('');
    if (mobile && phone.replace(/\D/g, '').length < 8) {
      setError('Entrez un numéro Mobile Money valide.');
      return;
    }
    setStep('processing');
    try {
      if (mobile) await new Promise(resolve => setTimeout(resolve, 2500));
      const result = await onConfirm(method, mobile ? phone.trim() : null);
      setReceipt(result);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le paiement a échoué.');
      setStep('form');
    }
  }

  const when = new Date(trip.departure_time).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {step === 'success' && receipt ? (
          <div className="text-center py-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-success-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-800">Réservation envoyée</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {trip.driver_first_name} a été notifié et doit maintenant accepter votre demande.
            </p>

            <div className="mt-5 rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Montant</span>
                <span className="font-semibold text-neutral-800">{formatFcfa(receipt.fare)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Moyen</span>
                <span className="text-neutral-800">{paymentMethodLabel(method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Statut</span>
                <span className="text-neutral-800">
                  {receipt.payment_status === 'paid' ? 'Payé' : 'À payer au conducteur'}
                </span>
              </div>
              {receipt.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Référence</span>
                  <span className="font-mono text-neutral-800">{receipt.payment_reference}</span>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              Si le conducteur refuse ou si vous annulez, un paiement Mobile Money est remboursé automatiquement.
            </p>

            <button type="button" onClick={onClose} className="btn-primary w-full mt-5">
              Terminé
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Réserver ce trajet</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {trip.origin_address.split(',')[0]} → {trip.destination_address.split(',')[0]}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="btn-ghost !p-1.5"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {when}
              </span>
              <span className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />≈ {trip.distance_km.toLocaleString('fr-FR')} km
              </span>
              <span>
                Conducteur : {trip.driver_first_name} {trip.driver_last_name}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-primary-50 border border-primary-100 p-4 flex items-end justify-between">
              <div>
                <p className="text-xs text-primary-700">Tarif du trajet</p>
                <p className="text-2xl font-bold text-primary-800">{formatFcfa(trip.fare)}</p>
              </div>
              <p className="text-xs text-primary-700 text-right">
                Minimum 200 F
                <br />
                puis selon la distance
              </p>
            </div>

            <p className="label mt-5">Moyen de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    method === m.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {m.id === 'cash' ? (
                    <Banknote className="h-4 w-4 shrink-0" />
                  ) : (
                    <Smartphone className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    {m.label}
                    <span className="block text-xs font-normal text-neutral-400">{m.hint}</span>
                  </span>
                </button>
              ))}
            </div>

            {mobile && (
              <div className="mt-4">
                <label className="label">Numéro {paymentMethodLabel(method)}</label>
                <input
                  type="tel"
                  className="input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+229 00 00 00 00"
                  disabled={busy}
                />
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-error-600">
                {error} Aucun montant n'a été débité.
              </p>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Mode démo : le paiement est simulé, aucun argent n'est réellement débité.</span>
            </div>

            {busy ? (
              <div className="mt-4 rounded-lg bg-neutral-50 p-4 text-center text-sm text-neutral-600">
                <Spinner className="text-xl text-primary-600" />
                <p className="mt-2 font-medium">
                  {mobile ? `Demande envoyée au ${phone}` : 'Enregistrement de la réservation…'}
                </p>
                {mobile && (
                  <p className="text-xs text-neutral-400">Validez le paiement sur votre téléphone…</p>
                )}
              </div>
            ) : (
              <button type="button" onClick={handlePay} className="btn-primary w-full mt-4">
                {mobile
                  ? `Payer ${formatFcfa(trip.fare)}`
                  : `Réserver (${formatFcfa(trip.fare)} à payer au conducteur)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
