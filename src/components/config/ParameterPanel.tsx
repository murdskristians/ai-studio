import { Slider, TagInput, Input, Button } from '../ui';
import type { GenerationParameters } from '../../types';
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS } from '../../types/parameters';
import './ParameterPanel.css';

interface ParameterPanelProps {
  parameters: GenerationParameters;
  onChange: (params: GenerationParameters) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ParameterPanel({ parameters, onChange, collapsed, onToggleCollapse }: ParameterPanelProps) {
  const updateParam = <K extends keyof GenerationParameters>(key: K, value: GenerationParameters[K]) => {
    onChange({ ...parameters, [key]: value });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_PARAMETERS);
  };

  if (collapsed) {
    return (
      <div className="parameter-panel collapsed">
        <button className="panel-toggle" onClick={onToggleCollapse} title="Expand parameters">
          {/* Arrow pointing left when collapsed (to expand/open) */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="parameter-panel">
      <div className="panel-header">
        {onToggleCollapse && (
          <button className="panel-toggle" onClick={onToggleCollapse} title="Collapse panel">
            {/* Arrow pointing right when open (to collapse/close) */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h3 className="panel-title">Parameters</h3>
        <Button variant="ghost" size="sm" onClick={resetToDefaults}>
          Reset
        </Button>
      </div>

      <div className="panel-content">
        <Slider
          label="Temperature"
          value={parameters.temperature}
          min={PARAMETER_LIMITS.temperature.min}
          max={PARAMETER_LIMITS.temperature.max}
          step={PARAMETER_LIMITS.temperature.step}
          onChange={(value) => updateParam('temperature', value)}
          description="Lower = more focused, Higher = more creative"
        />

        <Slider
          label="Top P"
          value={parameters.topP}
          min={PARAMETER_LIMITS.topP.min}
          max={PARAMETER_LIMITS.topP.max}
          step={PARAMETER_LIMITS.topP.step}
          onChange={(value) => updateParam('topP', value)}
          description="Nucleus sampling threshold"
        />

        <Slider
          label="Top K"
          value={parameters.topK}
          min={PARAMETER_LIMITS.topK.min}
          max={PARAMETER_LIMITS.topK.max}
          step={PARAMETER_LIMITS.topK.step}
          onChange={(value) => updateParam('topK', value)}
          description="Number of tokens to consider"
        />

        <Input
          label="Max Output Tokens"
          type="number"
          value={parameters.maxTokens}
          min={PARAMETER_LIMITS.maxTokens.min}
          max={PARAMETER_LIMITS.maxTokens.max}
          onChange={(e) => updateParam('maxTokens', parseInt(e.target.value) || PARAMETER_LIMITS.maxTokens.min)}
        />

        <TagInput
          label="Stop Sequences"
          tags={parameters.stopSequences}
          onChange={(tags) => updateParam('stopSequences', tags)}
          placeholder="Type and press Enter"
          maxTags={5}
        />
      </div>
    </div>
  );
}
