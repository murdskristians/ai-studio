import { useState } from 'react';
import { Modal, Button, Input, TextArea, Select } from '../ui';
import { Slider, TagInput } from '../ui';
import type { Bot, GenerationParameters } from '../../types';
import { DEFAULT_PARAMETERS, PARAMETER_LIMITS } from '../../types/parameters';
import { MODELS } from '../../constants/models';
import './BotEditorModal.css';

interface BotEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot?: Bot | null;
  onSave: (bot: Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string) => void;
}

function BotEditorModalContent({ bot, onSave, onClose, onDelete }: Omit<BotEditorModalProps, 'isOpen'>) {
  const [name, setName] = useState(bot?.name || '');
  const [description, setDescription] = useState(bot?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(bot?.systemPrompt || '');
  const [preferredModel, setPreferredModel] = useState(bot?.preferredModel || '');
  const [parameters, setParameters] = useState<GenerationParameters>(bot?.defaultParameters || DEFAULT_PARAMETERS);

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
    });

    onClose();
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
