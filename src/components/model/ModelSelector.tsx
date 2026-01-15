import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Select, SelectHandle } from '../ui';
import { MODELS } from '../../constants/models';
import type { ProviderType } from '../../types';
import './ModelSelector.css';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  availableProviders?: ProviderType[];
}

export interface ModelSelectorHandle {
  focus: () => void;
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
  gemini: 'Google Gemini',
  groq: 'Groq',
  openrouter: 'OpenRouter',
};

export const ModelSelector = forwardRef<ModelSelectorHandle, ModelSelectorProps>(function ModelSelector({ value, onChange, availableProviders }, ref) {
  const selectRef = useRef<SelectHandle>(null);

  useImperativeHandle(ref, () => ({
    focus: () => selectRef.current?.focus(),
  }));

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
        ref={selectRef}
        value={value}
        onChange={onChange}
        options={options}
      />
    </div>
  );
});
