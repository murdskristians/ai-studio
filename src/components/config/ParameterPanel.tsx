import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Slider, TagInput, Input, Button, Toggle, Modal } from '../ui';
import { ModelSelector, ModelSelectorHandle } from '../model';
import { SystemPromptEditor } from './SystemPromptEditor';
import { TrainingExamplesEditor } from './TrainingExamplesEditor';
import type { GenerationParameters, Bot, TrainingExample } from '../../types';
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS } from '../../types/parameters';
import './ParameterPanel.css';

interface ParameterPanelProps {
  parameters: GenerationParameters;
  onChange: (params: GenerationParameters) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentBot?: Bot | null;
  onBotNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
  systemPrompt?: string;
  onSystemPromptChange?: (value: string) => void;
  trainingExamples?: TrainingExample[];
  onTrainingExamplesChange?: (examples: TrainingExample[]) => void;
  hideBotName?: boolean;
  // Model selection
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  // External control for comparison mode
  parametersCollapsedProp?: boolean;
  onParametersToggle?: () => void;
  systemPromptCollapsedProp?: boolean;
  onSystemPromptToggle?: () => void;
  examplesCollapsedProp?: boolean;
  onExamplesToggle?: () => void;
}

export interface ParameterPanelHandle {
  focusModelSelector: () => void;
}

export const ParameterPanel = forwardRef<ParameterPanelHandle, ParameterPanelProps>(function ParameterPanel({
  parameters,
  onChange,
  collapsed,
  onToggleCollapse,
  currentBot,
  onBotNameChange,
  onDescriptionChange,
  systemPrompt,
  onSystemPromptChange,
  trainingExamples,
  onTrainingExamplesChange,
  hideBotName,
  selectedModel,
  onModelChange,
  parametersCollapsedProp,
  onParametersToggle,
  systemPromptCollapsedProp,
  onSystemPromptToggle,
  examplesCollapsedProp,
  onExamplesToggle,
}, ref) {
  const [systemPromptCollapsedInternal, setSystemPromptCollapsedInternal] = useState(true);
  const [parametersCollapsedInternal, setParametersCollapsedInternal] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');
  const [examplesCollapsedInternal, setExamplesCollapsedInternal] = useState(true);
  const modelSelectorRef = useRef<ModelSelectorHandle>(null);

  // Use external props if provided, otherwise use internal state
  const isExternallyControlled = parametersCollapsedProp !== undefined;
  const parametersCollapsed = isExternallyControlled ? parametersCollapsedProp : parametersCollapsedInternal;
  const systemPromptCollapsed = isExternallyControlled ? (systemPromptCollapsedProp ?? true) : systemPromptCollapsedInternal;
  const examplesCollapsed = isExternallyControlled ? (examplesCollapsedProp ?? true) : examplesCollapsedInternal;

  useImperativeHandle(ref, () => ({
    focusModelSelector: () => {
      // Expand parameters section if collapsed
      if (parametersCollapsedInternal && !isExternallyControlled) {
        setParametersCollapsedInternal(false);
        setSystemPromptCollapsedInternal(true);
        setExamplesCollapsedInternal(true);
      }
      // Focus the model selector after a short delay to allow expansion
      setTimeout(() => {
        modelSelectorRef.current?.focus();
      }, 50);
    },
  }));

  const handleSystemPromptToggle = () => {
    if (onSystemPromptToggle) {
      onSystemPromptToggle();
    } else {
      const newState = !systemPromptCollapsedInternal;
      setSystemPromptCollapsedInternal(newState);
      if (!newState) {
        setParametersCollapsedInternal(true);
        setExamplesCollapsedInternal(true);
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
        setExamplesCollapsedInternal(true);
      }
    }
  };

  const handleExamplesToggle = () => {
    if (onExamplesToggle) {
      onExamplesToggle();
    } else {
      const newState = !examplesCollapsedInternal;
      setExamplesCollapsedInternal(newState);
      if (!newState) {
        setParametersCollapsedInternal(true);
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

  const allCollapsed = parametersCollapsed && systemPromptCollapsed && examplesCollapsed;

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

      <div className={`ai-studio-parameters-section ${allCollapsed ? 'both-collapsed' : ''} ${!parametersCollapsed && systemPromptCollapsed && examplesCollapsed ? 'expanded' : ''}`}>
        <div className="ai-studio-parameters-header">
          <h3 className="ai-studio-parameters-title" onClick={handleParametersToggle}>Parameters</h3>
          <div className="ai-studio-parameters-header-actions">
            {currentBot && onDescriptionChange && (
              <button
                className="ai-studio-parameters-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDescription(currentBot.description || '');
                  setDescriptionModalOpen(true);
                }}
                title="Edit description"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5H2.5C1.94772 1.5 1.5 1.94772 1.5 2.5V13.5C1.5 14.0523 1.94772 14.5 2.5 14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 9L4 12H7L14 5L11 2L4 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <button
              className="ai-studio-parameters-icon-btn"
              onClick={(e) => { e.stopPropagation(); resetToDefaults(); }}
              title="Reset to defaults"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2V6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.5 9.5C3.1 12.5 5.8 14.5 9 14C12.2 13.5 14.5 10.5 14 7.3C13.5 4.1 10.8 1.8 7.5 2C5.3 2.2 3.4 3.5 2.4 5.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
            {selectedModel && onModelChange && (
              <div className="ai-studio-param-group">
                <label className="ai-studio-param-label">AI Model</label>
                <ModelSelector
                  ref={modelSelectorRef}
                  value={selectedModel}
                  onChange={onModelChange}
                />
              </div>
            )}

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
        <div className={`ai-studio-system-prompt-section ${allCollapsed ? 'both-collapsed' : ''} ${!systemPromptCollapsed && parametersCollapsed && examplesCollapsed ? 'expanded' : ''}`}>
          <SystemPromptEditor
            value={systemPrompt}
            onChange={onSystemPromptChange}
            collapsed={systemPromptCollapsed}
            onToggleCollapse={handleSystemPromptToggle}
          />
        </div>
      )}

      {trainingExamples !== undefined && onTrainingExamplesChange && (
        <div className={`ai-studio-examples-section ${allCollapsed ? 'both-collapsed' : ''} ${!examplesCollapsed && parametersCollapsed && systemPromptCollapsed ? 'expanded' : ''}`}>
          <TrainingExamplesEditor
            examples={trainingExamples}
            onChange={onTrainingExamplesChange}
            collapsed={examplesCollapsed}
            onToggleCollapse={handleExamplesToggle}
          />
        </div>
      )}

      <Modal
        isOpen={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
        title="Bot Description"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              className="cancel-btn"
              onClick={() => setDescriptionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDescriptionChange?.(editingDescription);
                setDescriptionModalOpen(false);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="ai-studio-description-editor">
          <textarea
            className="ai-studio-description-textarea"
            value={editingDescription}
            onChange={(e) => setEditingDescription(e.target.value)}
            placeholder="Enter a description for this bot..."
            rows={6}
          />
        </div>
      </Modal>
    </div>
  );
});
