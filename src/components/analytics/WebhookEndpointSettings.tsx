import React, { useState } from 'react';
import { WebhookEndpointConfig } from '../../types';
import { 
  Server, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Activity, 
  ExternalLink,
  Key,
  RefreshCw,
  Lock
} from 'lucide-react';

interface WebhookEndpointSettingsProps {
  configs: WebhookEndpointConfig[];
  onUpdateConfig?: (id: string, updated: Partial<WebhookEndpointConfig>) => void;
}

export const WebhookEndpointSettings: React.FC<WebhookEndpointSettingsProps> = ({
  configs,
  onUpdateConfig
}) => {
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [copiedUrlMap, setCopiedUrlMap] = useState<Record<string, boolean>>({});
  const [copiedSecretMap, setCopiedSecretMap] = useState<Record<string, boolean>>({});

  const toggleShowSecret = (id: string) => {
    setShowSecretMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, type: 'url' | 'secret', id: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrlMap(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedUrlMap(prev => ({ ...prev, [id]: false })), 1500);
    } else {
      setCopiedSecretMap(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedSecretMap(prev => ({ ...prev, [id]: false })), 1500);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Description */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          <span>ESP Inbound Webhook Endpoints & Security Keys</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your external ESP accounts (AWS SES SNS Topics, Brevo Transactional Webhooks, SendGrid Event Webhook) with these public ingest endpoints.
        </p>
      </div>

      {/* Endpoint Cards */}
      <div className="grid grid-cols-1 gap-4">
        {configs.map((endpoint) => {
          const isSecretVisible = !!showSecretMap[endpoint.id];
          const isUrlCopied = !!copiedUrlMap[endpoint.id];
          const isSecretCopied = !!copiedSecretMap[endpoint.id];

          return (
            <div key={endpoint.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold font-mono text-xs text-indigo-700">
                    {endpoint.provider === 'amazon_ses' ? 'SES' : endpoint.provider === 'brevo' ? 'BRV' : 'SND'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{endpoint.providerName}</span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Active & Ingesting
                      </span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {endpoint.id} &bull; Created {new Date(endpoint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Telemetry Stats */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total Ingested</span>
                    <span className="font-mono font-bold text-slate-900">{endpoint.totalEventsProcessed.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Deduplicated</span>
                    <span className="font-mono font-bold text-indigo-600">{endpoint.duplicateEventsSkipped}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Signatures Rejected</span>
                    <span className="font-mono font-bold text-rose-600">{endpoint.rejectedSignaturesCount}</span>
                  </div>
                </div>
              </div>

              {/* Endpoint URL Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Webhook Target Endpoint URL (HTTPS POST):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={endpoint.endpointUrl}
                    className="flex-1 font-mono text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(endpoint.endpointUrl, 'url', endpoint.id)}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isUrlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{isUrlCopied ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* Signing Secret & Auth Token */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Signing Secret */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    Webhook Signing Secret (HMAC / ECDSA):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 flex items-center justify-between">
                      <span>{isSecretVisible ? endpoint.signingSecret : '••••••••••••••••••••••••'}</span>
                      <button
                        onClick={() => toggleShowSecret(endpoint.id)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer ml-2"
                      >
                        {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => copyToClipboard(endpoint.signingSecret, 'secret', endpoint.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                      title="Copy Secret"
                    >
                      {isSecretCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* API Bearer Token */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    Header Authorization Token:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={endpoint.verificationToken}
                    className="w-full font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  />
                </div>
              </div>

              {/* Provider Integration Guide Snippet */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                {endpoint.provider === 'amazon_ses' && (
                  <div>
                    <strong className="text-slate-800">AWS SNS Configuration:</strong> Create an Amazon SNS Topic for SES event publishing. Subscribe this HTTPS endpoint URL. The CRM automatically confirms subscription challenges upon receiving the <code className="text-indigo-600 font-mono">SubscriptionConfirmation</code> JSON.
                  </div>
                )}
                {endpoint.provider === 'brevo' && (
                  <div>
                    <strong className="text-slate-800">Brevo Settings:</strong> Navigate to <em>Transactional &rarr; Settings &rarr; Webhooks</em>. Paste the URL above, enable events (Delivered, Opened, Clicked, Hard Bounce, Complaint, Unsubscribe), and set the custom authorization header.
                  </div>
                )}
                {endpoint.provider === 'sendgrid' && (
                  <div>
                    <strong className="text-slate-800">SendGrid Mail Settings:</strong> Navigate to <em>Settings &rarr; Mail Settings &rarr; Event Webhook</em>. Paste the endpoint URL, enable Signed Event Webhook with the ECDSA verification key, and select events.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
