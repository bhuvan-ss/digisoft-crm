import React from 'react';
import { Campaign, Contact, EmailProviderConfigRecord, ESPConfig } from '../types';
import { DeliveryEngineHub } from './delivery/DeliveryEngineHub';

interface DeliverabilityCenterProps {
  campaigns?: Campaign[];
  contacts?: Contact[];
  providerConfigs?: EmailProviderConfigRecord[];
  espConfigs: Record<string, ESPConfig>;
  onUpdateConfig?: (provider: string, config: Partial<ESPConfig>) => void;
  onUpdateProviderConfig?: (id: string, updated: Partial<EmailProviderConfigRecord>) => void;
  onAddProviderConfig?: (newConfig: EmailProviderConfigRecord) => void;
  onSetDefaultProvider?: (id: string) => void;
  onUpdateCampaign?: (campaign: Campaign) => void;
  onSimulateWebhook: (event: 'open' | 'click' | 'bounce_soft' | 'bounce_hard' | 'complaint') => void;
}

export const DeliverabilityCenter: React.FC<DeliverabilityCenterProps> = ({
  campaigns = [],
  contacts = [],
  providerConfigs = [],
  espConfigs,
  onUpdateConfig,
  onUpdateProviderConfig = () => {},
  onAddProviderConfig = () => {},
  onSetDefaultProvider = () => {},
  onUpdateCampaign,
  onSimulateWebhook
}) => {
  return (
    <DeliveryEngineHub
      campaigns={campaigns}
      contacts={contacts}
      providerConfigs={providerConfigs}
      espConfigs={espConfigs}
      onUpdateProviderConfig={onUpdateProviderConfig}
      onAddProviderConfig={onAddProviderConfig}
      onSetDefaultProvider={onSetDefaultProvider}
      onUpdateCampaign={onUpdateCampaign}
      onSimulateWebhook={onSimulateWebhook}
    />
  );
};
