import { useState } from 'react';
import { Slider, TagInput, Input, Button, Toggle } from '../ui';
import { SystemPromptEditor } from './SystemPromptEditor';
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
  systemPrompt?: string;
  onSystemPromptChange?: (value: string) => void;
  hideBotName?: boolean;
  // External control for comparison mode
  parametersCollapsedProp?: boolean;
  onParametersToggle?: () => void;
  systemPromptCollapsedProp?: boolean;
  onSystemPromptToggle?: () => void;
}

export function ParameterPanel({
  parameters,
  onChange,
  collapsed,
  onToggleCollapse,
  currentBot,
  onBotNameChange,
  systemPrompt,
  onSystemPromptChange,
  hideBotName,
  parametersCollapsedProp,
  onParametersToggle,
  systemPromptCollapsedProp,
  onSystemPromptToggle,
}: ParameterPanelProps) {
  const [systemPromptCollapsedInternal, setSystemPromptCollapsedInternal] = useState(true);
  const [parametersCollapsedInternal, setParametersCollapsedInternal] = useState(false);

  // Use external props if provided, otherwise use internal state
  const isExternallyControlled = parametersCollapsedProp !== undefined;
  const parametersCollapsed = isExternallyControlled ? parametersCollapsedProp : parametersCollapsedInternal;
  const systemPromptCollapsed = isExternallyControlled ? (systemPromptCollapsedProp ?? true) : systemPromptCollapsedInternal;

  const handleSystemPromptToggle = () => {
    if (onSystemPromptToggle) {
      onSystemPromptToggle();
    } else {
      const newState = !systemPromptCollapsedInternal;
      setSystemPromptCollapsedInternal(newState);
      if (!newState) {
        setParametersCollapsedInternal(true);
      }
    }
  };

  const handleParametersToggle = () => {
    if (onParametersToggle) {
      onParametersToggle();
    } else {
      const newState = !parametersCollapsedInternal;
      setParametersCollapsedInternal(newState);
      if (!newState) {
        setSystemPromptCollapsedInternal(true);
      }
    }
  };

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

  const bothCollapsed = parametersCollapsed && systemPromptCollapsed;

  return (
    <div className="ai-studio-parameter-panel">
      {!hideBotName && (
        <div className="ai-studio-bot-name-section">
          <div className="ai-studio-bot-name-wrapper">
            {onToggleCollapse && (
              <button className="ai-studio-panel-toggle" onClick={onToggleCollapse} title="Collapse panel">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {currentBot ? (
              <input
                type="text"
                className="ai-studio-bot-name-input"
                value={currentBot.name}
                onChange={(e) => onBotNameChange?.(e.target.value)}
              />
            ) : (
              <span className="ai-studio-bot-name-text">Default Assistant</span>
            )}
          </div>
        </div>
      )}

      <div className={`ai-studio-parameters-section ${bothCollapsed ? 'both-collapsed' : ''} ${!parametersCollapsed && systemPromptCollapsed ? 'expanded' : ''}`}>
        <div className="ai-studio-parameters-header">
          <h3 className="ai-studio-parameters-title" onClick={handleParametersToggle}>Parameters</h3>
          <div className="ai-studio-parameters-header-actions">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); resetToDefaults(); }}>
              Reset
            </Button>
            <button className="ai-studio-parameters-toggle" onClick={handleParametersToggle} aria-label={parametersCollapsed ? 'Expand' : 'Collapse'}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d={parametersCollapsed ? "M4 6L8 10L12 6" : "M4 10L8 6L12 10"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        {!parametersCollapsed && (
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
        )}
      </div>

      {systemPrompt !== undefined && onSystemPromptChange && (
        <div className={`ai-studio-system-prompt-section ${bothCollapsed ? 'both-collapsed' : ''} ${!systemPromptCollapsed && parametersCollapsed ? 'expanded' : ''}`}>
          <SystemPromptEditor
            value={systemPrompt}
            onChange={onSystemPromptChange}
            collapsed={systemPromptCollapsed}
            onToggleCollapse={handleSystemPromptToggle}
          />
        </div>
      )}
    </div>
  );
}
