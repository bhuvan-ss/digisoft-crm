import React, { useState } from 'react';
import { 
  Campaign, 
  Contact, 
  ESPProviderType, 
  EmailEventType, 
  WebhookIngestResult 
} from '../../types';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Code, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Zap, 
  Server,
  Layers
} from 'lucide-react';
import { SAMPLE_WEBHOOK_PAYLOADS } from '../../data/initialEvents';

interface WebhookSimulatorProps {
  campaigns: Campaign[];
  contacts: Contact[];
  onDispatchWebhook: (params: {
    provider: ESPProviderType;
    payload: any;
    headers: Record<string, string>;
    signingSecret?: string;
    expectedToken?: string;
  }) => WebhookIngestResult;
}

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({
  campaigns,
  contacts,
  onDispatchWebhook
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ESPProviderType>('amazon_ses');
  const [selectedEventType, setSelectedEventType] = useState<string>('delivery');
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || 'CNT-801');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || 'CMP-2026-01');
  
  // Security Toggles
  const [signatureMode, setSignatureMode] = useState<'valid' | 'tampered' | 'missing'>('valid');
  const [tokenMode, setTokenMode] = useState<'valid' | 'invalid'>('valid');
  const [isDuplicateTest, setIsDuplicateTest] = useState(false);
  const [customPayloadJson, setCustomPayloadJson] = useState<string>('');
  const [lastResult, setLastResult] = useState<WebhookIngestResult | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Generate initial payload whenever inputs change
  const generatePayload = () => {
    const contact = contacts.find(c => c.id === selectedContactId) || contacts[0];
    const email = contact?.email || 'bhuvangupta.1711@gmail.com';
    const campaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

    if (selectedProvider === 'amazon_ses') {
      const template = (SAMPLE_WEBHOOK_PAYLOADS.amazon_ses as any)[selectedEventType] || SAMPLE_WEBHOOK_PAYLOADS.amazon_ses.delivery;
      const clone = JSON.parse(JSON.stringify(template));
      if (isDuplicateTest) {
        clone.MessageId = 'ses_idempotency_fixed_duplicate_key_101';
      } else {
        clone.MessageId = `ses-msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      }

      if (typeof clone.Message === 'string') {
        try {
          const inner = JSON.parse(clone.Message);
          if (inner.mail) {
            inner.mail.destination = [email];
            inner.mail.headers = [{ name: 'X-Campaign-ID', value: campaign.id }];
            inner.mail.messageId = clone.MessageId;
          }
          if (inner.delivery) inner.delivery.recipients = [email];
          if (inner.bounce?.bouncedRecipients) inner.bounce.bouncedRecipients[0].emailAddress = email;
          if (inner.complaint?.complainedRecipients) inner.complaint.complainedRecipients[0].emailAddress = email;
          clone.Message = JSON.stringify(inner);
        } catch {
          // ignore
        }
      }
      return clone;
    } else if (selectedProvider === 'brevo') {
      const template = (SAMPLE_WEBHOOK_PAYLOADS.brevo as any)[selectedEventType] || SAMPLE_WEBHOOK_PAYLOADS.brevo.delivered;
      const clone = JSON.parse(JSON.stringify(template));
      clone.email = email;
      clone.tag = campaign.id;
      clone.id = isDuplicateTest ? 'brevo_fixed_duplicate_key_101' : `brevo_${Date.now()}`;
      clone['message-id'] = clone.id;
      return clone;
    } else {
      // SendGrid
      const template = SAMPLE_WEBHOOK_PAYLOADS.sendgrid.batch;
      const clone = JSON.parse(JSON.stringify(template));
      clone.forEach((item: any) => {
        item.email = email;
        item.campaign_id = campaign.id;
        item.sg_event_id = isDuplicateTest ? 'sg_fixed_duplicate_key_101' : `sg_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      });
      return clone;
    }
  };

  const handleApplyPreset = () => {
    const payload = generatePayload();
    setCustomPayloadJson(JSON.stringify(payload, null, 2));
    setLastResult(null);
  };

  // Initialize payload on first render if empty
  React.useEffect(() => {
    handleApplyPreset();
  }, [selectedProvider, selectedEventType, selectedContactId, selectedCampaignId, isDuplicateTest]);

  const handleExecuteWebhook = () => {
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(customPayloadJson);
    } catch (err: any) {
      alert('Invalid JSON in payload editor: ' + err.message);
      return;
    }

    // Build headers based on security settings
    const headers: Record<string, string> = {
      'content-type': 'application/json'
    };

    if (tokenMode === 'valid') {
      headers['authorization'] = selectedProvider === 'amazon_ses' 
        ? 'Bearer ses_token_v4_secret_auth' 
        : selectedProvider === 'brevo' 
          ? 'Bearer brevo_bearer_auth_prod_token' 
          : 'Bearer sg_event_webhook_token_7701';
    } else {
      headers['authorization'] = 'Bearer invalid_tampered_token_9999';
    }

    if (signatureMode === 'valid') {
      if (selectedProvider === 'brevo') {
        headers['x-sib-signature'] = 'brevo_hmac_valid_signature_hash_2026';
      } else if (selectedProvider === 'sendgrid') {
        headers['x-twilio-email-event-webhook-signature'] = 'sendgrid_ecdsa_valid_signature_token';
        headers['x-twilio-email-event-webhook-timestamp'] = String(Math.floor(Date.now() / 1000));
      }
    } else if (signatureMode === 'tampered') {
      headers['x-sib-signature'] = 'TAMPERED_INVALID_SIG';
      headers['x-twilio-email-event-webhook-signature'] = 'TAMPERED_INVALID_SIG';
      headers['x-amz-sns-signature'] = 'TAMPERED_INVALID_SIG';
      if (parsedPayload.Signature) {
        parsedPayload.Signature = 'TAMPERED_INVALID_SIG';
      }
    }

    const signingSecret = 'mock_production_signing_secret_9941';
    const expectedToken = selectedProvider === 'amazon_ses' 
      ? 'ses_token_v4_secret_auth' 
      : selectedProvider === 'brevo' 
        ? 'brevo_bearer_auth_prod_token' 
        : 'sg_event_webhook_token_7701';

    const result = onDispatchWebhook({
      provider: selectedProvider,
      payload: parsedPayload,
      headers,
      signingSecret: signatureMode !== 'missing' ? signingSecret : undefined,
      expectedToken: tokenMode === 'valid' ? expectedToken : 'wrong_token'
    });

    setLastResult(result);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(customPayloadJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 1500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Interactive Webhook Testing Studio & Security Harness</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate incoming ESP webhooks, test HMAC & ECDSA signature rejection, and verify contact suppression transitions in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            HTTP POST Engine: Ready
          </span>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* ESP Provider */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            1. Target ESP Provider:
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value as ESPProviderType);
              setSelectedEventType(e.target.value === 'sendgrid' ? 'batch' : 'delivery');
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="amazon_ses">Amazon SES (AWS SNS Notification)</option>
            <option value="brevo">Brevo (Sendinblue Event JSON)</option>
            <option value="sendgrid">SendGrid (Event Webhook Array)</option>
          </select>
        </div>

        {/* Event Type */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            2. Event Classification:
          </label>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {selectedProvider === 'amazon_ses' && (
              <>
                <option value="delivery">DELIVERED (Smtp 250 OK)</option>
                <option value="open">OPENED (Tracking Pixel Render)</option>
                <option value="click">CLICKED (Tracked Link Click)</option>
                <option value="hard_bounce">HARD BOUNCE (5.1.1 User Unknown)</option>
                <option value="complaint">COMPLAINED (FBL Abuse Report)</option>
              </>
            )}
            {selectedProvider === 'brevo' && (
              <>
                <option value="delivered">DELIVERED</option>
                <option value="open">OPENED</option>
                <option value="click">CLICKED</option>
                <option value="hard_bounce">HARD BOUNCE (Permanent)</option>
                <option value="unsubscribe">UNSUBSCRIBED (One-Click Header)</option>
              </>
            )}
            {selectedProvider === 'sendgrid' && (
              <>
                <option value="batch">Delivered + Open + Click (Batch Array)</option>
              </>
            )}
          </select>
        </div>

        {/* Target Contact */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            3. Recipient Contact:
          </label>
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email})
              </option>
            ))}
          </select>
        </div>

        {/* Campaign */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            4. Origin Campaign:
          </label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
          >
            {campaigns.map((cmp) => (
              <option key={cmp.id} value={cmp.id}>
                {cmp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Security Testing Mode Toggles */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* Signature Check */}
        <div>
          <span className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Signature Authenticity Test:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSignatureMode('valid')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                signatureMode === 'valid'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Valid Signature (200)
            </button>
            <button
              onClick={() => setSignatureMode('tampered')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                signatureMode === 'tampered'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Tampered / Mismatch (403)
            </button>
          </div>
        </div>

        {/* Authorization Token */}
        <div>
          <span className="font-semibold text-slate-700 block mb-1">
            API Authorization Token:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTokenMode('valid')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                tokenMode === 'valid'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Valid Bearer Token
            </button>
            <button
              onClick={() => setTokenMode('invalid')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                tokenMode === 'invalid'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Invalid Token (401)
            </button>
          </div>
        </div>

        {/* Idempotency Duplicate Test */}
        <div>
          <span className="font-semibold text-slate-700 block mb-1">
            Idempotency Duplicate Test:
          </span>
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isDuplicateTest}
              onChange={(e) => setIsDuplicateTest(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="text-slate-700">
              Lock fixed Event ID (Simulate repeat delivery)
            </span>
          </label>
        </div>
      </div>

      {/* JSON Payload Editor & Live Dispatch */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            Raw Inbound Webhook Payload (JSON):
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyPreset}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Preset
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleCopyPayload}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              {copiedPayload ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copiedPayload ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
        </div>

        <textarea
          value={customPayloadJson}
          onChange={(e) => setCustomPayloadJson(e.target.value)}
          rows={9}
          className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
        />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500">
          Simulated endpoint: <span className="font-mono text-slate-700 font-semibold">/api/webhooks/{selectedProvider === 'amazon_ses' ? 'ses' : selectedProvider}</span>
        </div>

        <button
          onClick={handleExecuteWebhook}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Dispatch & Ingest Webhook Event</span>
        </button>
      </div>

      {/* Result Callout */}
      {lastResult && (
        <div className={`p-4 rounded-xl border transition-all text-xs ${
          lastResult.success && lastResult.status === 'PROCESSED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : lastResult.status === 'IDEMPOTENT_DUPLICATE_SKIPPED'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              {lastResult.success && lastResult.status === 'PROCESSED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : lastResult.status === 'IDEMPOTENT_DUPLICATE_SKIPPED' ? (
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              )}
              <span>
                Status: {lastResult.status} ({lastResult.success ? 'HTTP 200 OK' : 'HTTP 403 Forbidden'})
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/70 font-semibold border border-current">
              Provider: {lastResult.provider.toUpperCase()}
            </span>
          </div>

          <p className="mt-1.5 text-xs leading-relaxed">
            {lastResult.message}
          </p>

          {/* Contact Status Updates */}
          {lastResult.contactStatusUpdated && lastResult.contactStatusUpdated.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-white/90 border border-current/20 space-y-1">
              <span className="font-bold text-[11px] uppercase tracking-wider block">
                Contact Status Automation Triggered:
              </span>
              {lastResult.contactStatusUpdated.map((upd, i) => (
                <div key={i} className="text-[11px] flex items-center gap-2">
                  <span className="font-mono text-slate-800">{upd.contactId}:</span>
                  <span className="line-through text-slate-400">{upd.previousStatus}</span>
                  <span>&rarr;</span>
                  <span className="font-bold font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                    {upd.newStatus}
                  </span>
                  <span className="text-slate-500">({upd.reason})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
