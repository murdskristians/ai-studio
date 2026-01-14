import { Slider, TagInput, Input, Button, Toggle } from '../ui';
import type { GenerationParameters, Bot } from '../../types';
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS } from '../../types/parameters';
import './ParameterPanel.css';

interface ParameterPanelProps {
  parameters: GenerationParameters;
  onChange: (params: GenerationParameters) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentBot?: Bot | null;
  onBotNameChange?: (name: string) => void;
}

export function ParameterPanel({ parameters, onChange, collapsed, onToggleCollapse, currentBot, onBotNameChange }: ParameterPanelProps) {
  const updateParam = <K extends keyof GenerationParameters>(key: K, value: GenerationParameters[K]) => {
    onChange({ ...parameters, [key]: value });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_PARAMETERS);
  };

  if (collapsed) {
    return (
      <div className="ai-studio-parameter-panel collapsed">
        <button className="ai-studio-panel-toggle" onClick={onToggleCollapse} title="Expand parameters">
          {/* Arrow pointing left when collapsed (to expand/open) */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="ai-studio-parameter-panel">
      <div className="ai-studio-panel-header">
        {onToggleCollapse && (
          <button className="ai-studio-panel-toggle" onClick={onToggleCollapse} title="Collapse panel">
            {/* Arrow pointing right when open (to collapse/close) */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h3 className="ai-studio-panel-title">Parameters</h3>
        <Button variant="ghost" size="sm" onClick={resetToDefaults}>
          Reset
        </Button>
      </div>

      {currentBot && (
        <div className="ai-studio-bot-name-section">
          <label className="ai-studio-bot-name-label">Bot Name</label>
          <input
            type="text"
            className="ai-studio-bot-name-input"
            value={currentBot.name}
            onChange={(e) => onBotNameChange?.(e.target.value)}
          />
        </div>
      )}

      <div className="ai-studio-panel-content">
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

        <Input
          label="Max Output Tokens"
          type="number"
          value={parameters.maxTokens}
          min={PARAMETER_LIMITS.maxTokens.min}
          max={PARAMETER_LIMITS.maxTokens.max}
          onChange={(e) => updateParam('maxTokens', parseInt(e.target.value) || PARAMETER_LIMITS.maxTokens.min)}
        />

        <Toggle
          label="Thinking Mode"
          checked={parameters.thinkingMode}
          onChange={(checked) => updateParam('thinkingMode', checked)}
          description="Enable extended reasoning for complex tasks"
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
