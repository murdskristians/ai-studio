import { Select } from '../ui';
import { MODELS } from '../../constants/models';
import type { ProviderType } from '../../types';
import './ModelSelector.css';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  availableProviders?: ProviderType[];
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
  gemini: 'Google Gemini',
  groq: 'Groq',
  openrouter: 'OpenRouter',
};

export function ModelSelector({ value, onChange, availableProviders }: ModelSelectorProps) {
  const filteredModels = availableProviders
    ? MODELS.filter(m => availableProviders.includes(m.provider))
    : MODELS;

  const options = filteredModels.map(model => ({
    value: model.id,
    label: model.name,
    group: PROVIDER_LABELS[model.provider],
  }));

  return (
    <div className="ai-studio-model-selector">
      <Select
        value={value}
        onChange={onChange}
        options={options}
      />
    </div>
  );
}
