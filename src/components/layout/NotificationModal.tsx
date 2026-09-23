'use client';

import React from 'react';
import Link from 'next/link';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MOCK_ALERTS } from '../../data/mockAlerts';
import { useLanguage } from '../../context/LanguageContext';
import { Clock, MapPin, ArrowRight, BellOff } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('notifications.title', 'Operational Alert Center (IMD Bulletins)')}
      maxWidth="lg"
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-400">
          {t(
            'notifications.subtitle',
            'Showing real-time disaster warnings and meteorological advisories broadcasted by IMD National Weather Forecasting Centre.'
          )}
        </p>

        {MOCK_ALERTS.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <BellOff className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              {t('notifications.empty', 'No Active Notifications')}
            </p>
            <p className="text-xs text-slate-500">
              {t('notifications.emptyDesc', 'All operational alerts and bulletins have been acknowledged.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {MOCK_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'Critical' ? 'danger' : 'warning'}>
                      {alert.severity}
                    </Badge>
                    <span className="text-xs font-bold text-white">{alert.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {alert.issuedTime}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2">{alert.description}</p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    {alert.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
          <Link href="/alerts" onClick={onClose}>
            <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              {t('notifications.viewAll', 'Open Disaster Alert Center')}
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
};
