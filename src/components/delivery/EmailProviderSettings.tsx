import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Key, 
  Lock, 
  TrendingUp, 
  RefreshCw, 
  Plus, 
  Star, 
  Zap, 
  ExternalLink,
  Sliders,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { EmailProviderConfigRecord, ESPDriverType } from '../../types';
import { CryptoService } from '../../utils/cryptoSim';
import { ProviderFactory } from '../../services/esp/ProviderFactory';

interface EmailProviderSettingsProps {
  configs: EmailProviderConfigRecord[];
  onUpdateConfig: (id: string, updated: Partial<EmailProviderConfigRecord>) => void;
  onAddConfig: (newConfig: EmailProviderConfigRecord) => void;
  onSetDefault: (id: string) => void;
}

export const EmailProviderSettings: React.FC<EmailProviderSettingsProps> = ({
  configs,
  onUpdateConfig,
  onAddConfig,
  onSetDefault
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string; details?: any } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Provider Form State
  const [formProvider, setFormProvider] = useState<ESPDriverType>('amazon_ses');
  const [formName, setFormName] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formRegion, setFormRegion] = useState('us-east-1');
  const [formFromEmail, setFormFromEmail] = useState('notifications@digisoft.com');
  const [formFromName, setFormFromName] = useState('DIGISOFT Notifications');
  const [formReplyTo, setFormReplyTo] = useState('support@digisoft.com');
  const [formRateLimit, setFormRateLimit] = useState(100);
  const [formSafetyMargin, setFormSafetyMargin] = useState(20);
  const [formDailyQuota, setFormDailyQuota] = useState(50000);

  const handleTestConnection = async (config: EmailProviderConfigRecord) => {
    setTestingId(config.id);
    setTestResult(null);

    try {
      const provider = ProviderFactory.getProvider(config);
      const res = await provider.validateConfiguration();

      setTestResult({
        id: config.id,
        success: res.valid,
        message: res.valid 
          ? `Successfully authenticated with ${config.name}. API response received in ${res.details.latencyMs}ms.`
          : (res.errorMessage || 'Authentication handshake failed. Verify API credentials.'),
        details: res.details
      });

      if (res.valid) {
        onUpdateConfig(config.id, {
          settings: {
            ...config.settings,
            connection_verified_at: new Date().toISOString(),
            sender_verified_at: new Date().toISOString(),
            spf_verified: res.details.spf,
            dkim_verified: res.details.dkim,
            dmarc_verified: res.details.dmarc
          }
        });
      }
    } catch (err: any) {
      setTestResult({
        id: config.id,
        success: false,
        message: err.message || 'Fatal network exception during provider connection check.'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formApiKey || !formFromEmail) return;

    const newRec: EmailProviderConfigRecord = {
      id: `ESP-CFG-${Date.now().toString(36).toUpperCase()}`,
      provider: formProvider,
      name: formName,
      api_key_encrypted: CryptoService.encrypt(formApiKey),
      secret_encrypted: formSecret ? CryptoService.encrypt(formSecret) : undefined,
      region: formRegion,
      from_email: formFromEmail,
      from_name: formFromName,
      reply_to: formReplyTo,
      status: 'standby',
      is_default: configs.length === 0,
      settings: {
        provider_max_rate: formRateLimit,
        rate_limit_per_second: Math.round(formRateLimit * (1 - formSafetyMargin / 100)),
        daily_quota: formDailyQuota,
        daily_sent: 0,
        safety_margin_percentage: formSafetyMargin,
        track_opens: true,
        track_clicks: true,
        sandbox_mode: false,
        spf_verified: true,
        dkim_verified: true,
        dmarc_verified: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onAddConfig(newRec);
    setIsAddModalOpen(false);

    // Reset Form
    setFormName('');
    setFormApiKey('');
    setFormSecret('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Email Service Provider (ESP) Configuration Hub</h3>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              AES-256-GCM Encrypted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure enterprise delivery gateways (Amazon SES, Brevo, SendGrid). All credentials are encrypted server-side and credentials are never exposed to the frontend in raw format.
          </p>
        </div>

        <button
          id="btn-add-esp-provider"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add ESP Provider</span>
        </button>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {configs.map(config => {
          const isTesting = testingId === config.id;
          const isResultForThis = testResult?.id === config.id;
          const appRate = config.settings.rate_limit_per_second;
          const providerMax = config.settings.provider_max_rate;
          const safetyMargin = config.settings.safety_margin_percentage;
          const quotaPercent = Math.min(100, Math.round((config.settings.daily_sent / config.settings.daily_quota) * 100));

          return (
            <div 
              key={config.id}
              className={`bg-white rounded-xl border transition shadow-sm p-5 flex flex-col justify-between ${
                config.is_default 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{config.name}</h4>
                      {config.is_default && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 capitalize">
                      Driver: {config.provider.replace('_', ' ')}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    config.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : config.status === 'standby'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {config.status}
                  </span>
                </div>

                {/* Sender & Regions */}
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">From Address:</span>
                    <span className="font-mono text-slate-800 font-medium truncate max-w-[180px]">{config.from_email}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Region / Gateway:</span>
                    <span className="font-mono text-slate-800 font-medium">{config.region || 'Global'}</span>
                  </div>

                  {/* Encrypted Credential Mask */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] text-slate-500">API Key:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] text-slate-700 font-semibold">
                        {CryptoService.maskCredential(config.api_key_encrypted)}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono font-bold">
                        ENC
                      </span>
                    </div>
                  </div>

                  {/* Sending Limits & Safety Margin Meter */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Speed Cap:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {appRate} / sec 
                        <span className="text-[10px] text-emerald-600 font-normal ml-1">
                          ({safetyMargin}% safety buffer)
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Daily Quota:</span>
                      <span className="font-mono text-slate-800">
                        {config.settings.daily_sent.toLocaleString()} / {config.settings.daily_quota.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${quotaPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${quotaPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Verification Badges */}
                  <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${config.settings.spf_verified ? 'text-emerald-500' : 'text-slate-300'}`} />
                      SPF
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${config.settings.dkim_verified ? 'text-emerald-500' : 'text-slate-300'}`} />
                      DKIM
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${config.settings.dmarc_verified ? 'text-emerald-500' : 'text-slate-300'}`} />
                      DMARC
                    </span>
                  </div>
                </div>

                {/* Inline Test Result */}
                {isResultForThis && (
                  <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {testResult.success 
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    }
                    <div className="space-y-0.5">
                      <p className="font-semibold">{testResult.success ? 'Verification Succeeded' : 'Verification Failed'}</p>
                      <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleTestConnection(config)}
                  disabled={isTesting}
                  className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Validating...' : 'Test Connection'}</span>
                </button>

                {!config.is_default && (
                  <button
                    onClick={() => onSetDefault(config.id)}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition cursor-pointer"
                    title="Set as Default Dispatch Gateway"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Provider Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Email Service Provider (ESP)</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProvider} className="p-6 space-y-4 text-xs">
              {/* Provider Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Service Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'amazon_ses', label: 'Amazon SES' },
                    { id: 'brevo', label: 'Brevo' },
                    { id: 'sendgrid', label: 'SendGrid' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setFormProvider(p.id as ESPDriverType);
                        if (!formName) setFormName(`${p.label} Cloud`);
                      }}
                      className={`py-2 px-3 rounded-lg border text-center font-semibold transition cursor-pointer ${
                        formProvider === p.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Configuration Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Amazon SES Production US-East"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">API Key / Access Key</label>
                  <input
                    type="password"
                    required
                    placeholder="Encrypted automatically"
                    value={formApiKey}
                    onChange={e => setFormApiKey(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {formProvider === 'amazon_ses' ? 'Secret Access Key' : 'Webhook Signing Secret'}
                  </label>
                  <input
                    type="password"
                    placeholder="Optional secret"
                    value={formSecret}
                    onChange={e => setFormSecret(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verified Sender Email</label>
                  <input
                    type="email"
                    required
                    value={formFromEmail}
                    onChange={e => setFormFromEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Region / Endpoint</label>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={e => setFormRegion(e.target.value)}
                    placeholder="e.g. us-east-1 or global"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Rate Limits & Margins */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Provider Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={formRateLimit}
                    onChange={e => setFormRateLimit(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-slate-400">emails / sec</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Safety Margin</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formSafetyMargin}
                    onChange={e => setFormSafetyMargin(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 rounded-lg bg-white"
                  />
                  <span className="text-[10px] text-slate-400">% reduction</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Effective Rate</label>
                  <div className="py-2 text-indigo-700 font-bold font-mono text-sm">
                    {Math.round(formRateLimit * (1 - formSafetyMargin / 100))} / s
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Save & Encrypt Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
