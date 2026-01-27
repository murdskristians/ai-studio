import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Input, TextArea, Select } from '../ui';
import { Slider, TagInput } from '../ui';
import type { Bot, GenerationParameters, TrainingExample } from '../../types';
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS } from '../../types/parameters';
import { MODELS } from '../../constants/models';
import './BotEditorModal.css';

const CREATE_BOT_DRAFT_KEY = 'ai-studio-create-bot-draft';

interface CreateBotDraft {
  name: string;
  description: string;
  systemPrompt: string;
  preferredModel: string;
  parameters: GenerationParameters;
  trainingExamples: TrainingExample[];
}

function loadDraftFromStorage(): CreateBotDraft | null {
  try {
    const saved = localStorage.getItem(CREATE_BOT_DRAFT_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function clearDraftFromStorage(): void {
  localStorage.removeItem(CREATE_BOT_DRAFT_KEY);
}

interface BotEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot?: Bot | null;
  onSave: (bot: Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string) => void;
}

function BotEditorModalContent({ bot, onSave, onClose, onDelete }: Omit<BotEditorModalProps, 'isOpen'>) {
  const isNewBot = !bot;

  // Load draft once on mount (only for new bots) - use useState to ensure it's captured once
  const [savedDraft] = useState<CreateBotDraft | null>(() =>
    isNewBot ? loadDraftFromStorage() : null
  );

  const [name, setName] = useState(() => bot?.name || savedDraft?.name || '');
  const [description, setDescription] = useState(() => bot?.description || savedDraft?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(() => bot?.systemPrompt || savedDraft?.systemPrompt || '');
  const [preferredModel, setPreferredModel] = useState(() => bot?.preferredModel || savedDraft?.preferredModel || '');
  const [parameters, setParameters] = useState<GenerationParameters>(() => {
    const baseParams = bot?.defaultParameters || savedDraft?.parameters || DEFAULT_PARAMETERS;
    // Ensure stopSequences is always an array (may be lost in JSON serialization)
    return {
      ...DEFAULT_PARAMETERS,
      ...baseParams,
      stopSequences: Array.isArray(baseParams.stopSequences) ? baseParams.stopSequences : [],
    };
  });
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>(() =>
    bot?.trainingExamples || savedDraft?.trainingExamples || []
  );
  const [newExampleInput, setNewExampleInput] = useState('');
  const [newExampleOutput, setNewExampleOutput] = useState('');

  // Save draft to localStorage whenever form data changes (only for new bots)
  const saveDraft = useCallback(() => {
    if (!isNewBot) return;

    const draft: CreateBotDraft = {
      name,
      description,
      systemPrompt,
      preferredModel,
      parameters,
      trainingExamples,
    };

    try {
      localStorage.setItem(CREATE_BOT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage errors
    }
  }, [isNewBot, name, description, systemPrompt, preferredModel, parameters, trainingExamples]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  const handleSave = () => {
    if (!name.trim()) return;

    const model = MODELS.find(m => m.id === preferredModel);

    onSave({
      name: name.trim(),
      description: description.trim(),
      systemPrompt,
      preferredModel: preferredModel || undefined,
      preferredProvider: model?.provider,
      defaultParameters: parameters,
      trainingExamples,
    });

    // Clear draft from localStorage when bot is created successfully
    if (isNewBot) {
      clearDraftFromStorage();
    }

    onClose();
  };

  const handleAddExample = () => {
    if (!newExampleInput.trim() || !newExampleOutput.trim()) return;

    const newExample: TrainingExample = {
      id: `example-${Date.now()}`,
      input: newExampleInput.trim(),
      output: newExampleOutput.trim(),
      enabled: true,
    };

    setTrainingExamples([...trainingExamples, newExample]);
    setNewExampleInput('');
    setNewExampleOutput('');
  };

  const handleRemoveExample = (id: string) => {
    setTrainingExamples(trainingExamples.filter(ex => ex.id !== id));
  };

  const handleDelete = () => {
    if (bot && onDelete && confirm('Are you sure you want to delete this bot?')) {
      onDelete(bot.id);
      onClose();
    }
  };

  const modelOptions = MODELS.map(m => ({
    value: m.id,
    label: m.name,
    group: m.provider === 'gemini' ? 'Google Gemini' : m.provider === 'groq' ? 'Groq' : 'OpenRouter',
  }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={bot ? 'Edit Bot' : 'Create Bot'}
      size="lg"
      footer={
        <>
          {bot && onDelete && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {bot ? 'Save Changes' : 'Create Bot'}
          </Button>
        </>
      }
    >
      <div className="ai-studio-bot-editor-form">
        <div className="ai-studio-form-section">
          <h4 className="ai-studio-form-section-title">Basic Info</h4>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Bot"
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of what this bot does"
          />
        </div>

        <div className="ai-studio-form-section">
          <h4 className="ai-studio-form-section-title">System Instructions</h4>
          <TextArea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant that..."
            rows={5}
          />
        </div>

        <div className="ai-studio-form-section">
          <h4 className="ai-studio-form-section-title">Preferred Model</h4>
          <Select
            value={preferredModel}
            onChange={setPreferredModel}
            options={[{ value: '', label: 'No preference' }, ...modelOptions]}
          />
        </div>

        <div className="ai-studio-form-section">
          <h4 className="ai-studio-form-section-title">Default Parameters</h4>
          <div className="ai-studio-parameters-grid">
            <Slider
              label="Temperature"
              value={parameters.temperature}
              min={PARAMETER_LIMITS.temperature.min}
              max={PARAMETER_LIMITS.temperature.max}
              step={PARAMETER_LIMITS.temperature.step}
              onChange={(value) => setParameters({ ...parameters, temperature: value })}
            />
            <Slider
              label="Top P"
              value={parameters.topP}
              min={PARAMETER_LIMITS.topP.min}
              max={PARAMETER_LIMITS.topP.max}
              step={PARAMETER_LIMITS.topP.step}
              onChange={(value) => setParameters({ ...parameters, topP: value })}
            />
            <Input
              label="Max Tokens"
              type="number"
              value={parameters.maxTokens}
              onChange={(e) => setParameters({ ...parameters, maxTokens: parseInt(e.target.value) || 1 })}
            />
            <TagInput
              label="Stop Sequences"
              tags={parameters.stopSequences}
              onChange={(tags) => setParameters({ ...parameters, stopSequences: tags })}
            />
          </div>
        </div>

        <div className="ai-studio-form-section">
          <h4 className="ai-studio-form-section-title">Examples</h4>

          {/* List of existing examples */}
          {trainingExamples.length > 0 && (
            <div className="ai-studio-examples-list">
              {trainingExamples.map((example) => (
                <div key={example.id} className="ai-studio-example-item">
                  <div className="ai-studio-example-content">
                    <div className="ai-studio-example-field">
                      <span className="ai-studio-example-label">Input:</span>
                      <span className="ai-studio-example-text">{example.input}</span>
                    </div>
                    <div className="ai-studio-example-field">
                      <span className="ai-studio-example-label">Output:</span>
                      <span className="ai-studio-example-text">{example.output}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ai-studio-example-remove"
                    onClick={() => handleRemoveExample(example.id)}
                    title="Remove example"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new example form */}
          <div className="ai-studio-example-form">
            <div className="ai-studio-example-inputs">
              <TextArea
                value={newExampleInput}
                onChange={(e) => setNewExampleInput(e.target.value)}
                placeholder="Example input (user message)"
                rows={2}
              />
              <TextArea
                value={newExampleOutput}
                onChange={(e) => setNewExampleOutput(e.target.value)}
                placeholder="Example output (assistant response)"
                rows={2}
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleAddExample}
              disabled={!newExampleInput.trim() || !newExampleOutput.trim()}
            >
              Add Example
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function BotEditorModal({ isOpen, onClose, bot, onSave, onDelete }: BotEditorModalProps) {
  if (!isOpen) {
    return null;
  }
  
  return (
    <BotEditorModalContent
      key={bot?.id || 'new'}
      bot={bot}
      onSave={onSave}
      onClose={onClose}
      onDelete={onDelete}
    />
  );
}
