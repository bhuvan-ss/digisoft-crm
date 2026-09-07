import React from 'react';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  Eye, 
  MousePointerClick, 
  ArrowDown, 
  AlertTriangle,
  TrendingDown,
  ShieldAlert
} from 'lucide-react';
import { CampaignDeliveryFunnelStep } from '../../types';

interface DeliveryFunnelProps {
  funnelSteps: CampaignDeliveryFunnelStep[];
  bouncedTotal: number;
  complainedTotal: number;
  unsubscribedTotal: number;
}

export const DeliveryFunnel: React.FC<DeliveryFunnelProps> = ({
  funnelSteps,
  bouncedTotal,
  complainedTotal,
  unsubscribedTotal
}) => {
  const stepIcons = {
    AUDIENCE: <Users className="w-4 h-4 text-slate-600" />,
    SENT: <Send className="w-4 h-4 text-blue-600" />,
    DELIVERED: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    OPENED: <Eye className="w-4 h-4 text-indigo-600" />,
    CLICKED: <MousePointerClick className="w-4 h-4 text-purple-600" />
  };

  const stepColors = {
    AUDIENCE: 'from-slate-500 to-slate-600',
    SENT: 'from-blue-500 to-blue-600',
    DELIVERED: 'from-emerald-500 to-emerald-600',
    OPENED: 'from-indigo-500 to-indigo-600',
    CLICKED: 'from-purple-500 to-purple-600'
  };

  const maxCount = Math.max(...funnelSteps.map(s => s.count), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Transmission & Engagement Funnel</span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Audience → Conversion
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step conversion drop-off analysis from initial recipient snapshot to terminal click conversion.
          </p>
        </div>

        {/* Deliverability Risk Flags */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="font-semibold text-rose-600">{bouncedTotal}</span>
            <span className="text-[11px]">Bounced</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="font-semibold text-amber-600">{complainedTotal}</span>
            <span className="text-[11px]">Complaints</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="font-semibold text-slate-700">{unsubscribedTotal}</span>
            <span className="text-[11px]">Opt-outs</span>
          </div>
        </div>
      </div>

      {/* Funnel Bars */}
      <div className="space-y-4">
        {funnelSteps.map((step, idx) => {
          const barWidthPercent = Math.max(12, Math.round((step.count / maxCount) * 100));
          const nextStep = funnelSteps[idx + 1];

          return (
            <div key={step.stage} className="relative">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-slate-100">
                    {stepIcons[step.stage]}
                  </div>
                  <span className="text-slate-800 font-semibold">{step.label}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-900 font-bold font-mono text-sm">
                    {step.count.toLocaleString()}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] w-12 text-right">
                    {step.percentageOfSent}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-7 bg-slate-100 rounded-lg overflow-hidden relative flex items-center">
                <div
                  className={`h-full bg-gradient-to-r ${stepColors[step.stage]} transition-all duration-500 rounded-lg flex items-center px-3 justify-between`}
                  style={{ width: `${barWidthPercent}%` }}
                >
                  <span className="text-[11px] font-medium text-white/90 truncate drop-shadow-xs">
                    {step.stage}
                  </span>
                  {barWidthPercent > 35 && (
                    <span className="text-[11px] font-mono font-bold text-white drop-shadow-xs">
                      {step.count}
                    </span>
                  )}
                </div>
              </div>

              {/* Drop-off connector to next step */}
              {nextStep && (
                <div className="my-1.5 flex items-center justify-between text-[11px] text-slate-400 pl-4 pr-1">
                  <div className="flex items-center gap-1.5">
                    <ArrowDown className="w-3 h-3 text-slate-400" />
                    <span>Drop-off to next step:</span>
                    <span className="font-semibold text-rose-600 font-mono">
                      -{step.dropOffCount} contacts ({step.dropOffPercentage}%)
                    </span>
                  </div>
                  {step.stage === 'SENT' && step.dropOffPercentage > 5 && (
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                      <AlertTriangle className="w-3 h-3" />
                      Check ISP bounce reason
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Funnel Summary Insights */}
      <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <span className="text-emerald-700 font-medium block">Audience → Delivery Rate</span>
          <p className="text-lg font-bold text-emerald-900 font-mono mt-0.5">
            {funnelSteps[1]?.count > 0 
              ? `${((funnelSteps[2]?.count / funnelSteps[1]?.count) * 100).toFixed(1)}%` 
              : '100%'}
          </p>
          <span className="text-[10px] text-emerald-600">Well above the 95% deliverability benchmark</span>
        </div>

        <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
          <span className="text-indigo-700 font-medium block">Delivered → Open Rate</span>
          <p className="text-lg font-bold text-indigo-900 font-mono mt-0.5">
            {funnelSteps[2]?.count > 0 
              ? `${((funnelSteps[3]?.count / funnelSteps[2]?.count) * 100).toFixed(1)}%` 
              : '0%'}
          </p>
          <span className="text-[10px] text-indigo-600">Direct open engagement by recipients</span>
        </div>

        <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-100">
          <span className="text-purple-700 font-medium block">Click-to-Open (CTOR)</span>
          <p className="text-lg font-bold text-purple-900 font-mono mt-0.5">
            {funnelSteps[3]?.count > 0 
              ? `${((funnelSteps[4]?.count / funnelSteps[3]?.count) * 100).toFixed(1)}%` 
              : '0%'}
          </p>
          <span className="text-[10px] text-purple-600">Audience content relevance score</span>
        </div>
      </div>
    </div>
  );
};
