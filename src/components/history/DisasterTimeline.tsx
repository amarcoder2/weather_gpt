import React from 'react';
import { DisasterEvent } from '../../types/disaster';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MapPin, Calendar, Users, ArrowRight } from 'lucide-react';

interface DisasterTimelineProps {
  events: DisasterEvent[];
  onSelectEvent: (event: DisasterEvent) => void;
}

export const DisasterTimeline: React.FC<DisasterTimelineProps> = ({ events, onSelectEvent }) => {
  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <Card
          key={ev.id}
          variant="glass"
          hover
          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
          onClick={() => onSelectEvent(ev)}
        >
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-400">{ev.year}</span>
              <Badge variant="purple">{ev.type}</Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {ev.state}
              </span>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">{ev.name}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-300 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div>
              <span className="text-[11px] text-slate-500 block">Reported Toll</span>
              <span className="font-bold text-red-300">{ev.casualties} lives</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Est. Loss</span>
              <span className="font-bold text-amber-300">{ev.economicImpact}</span>
            </div>

            <button className="p-2 rounded-lg bg-navy-900 border border-slate-800 text-sky-400 hover:text-white hover:bg-sky-500/20 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};
