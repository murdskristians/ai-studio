import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { useApp } from '../../contexts';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModalContent({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useApp();

  const [geminiKey, setGeminiKey] = useState(settings.apiKeys.gemini || '');
  const [groqKey, setGroqKey] = useState(settings.apiKeys.groq || '');
  const [openrouterKey, setOpenrouterKey] = useState(settings.apiKeys.openrouter || '');

  const handleSave = () => {
    updateSettings({
      apiKeys: {
        gemini: geminiKey.trim() || undefined,
        groq: groqKey.trim() || undefined,
        openrouter: openrouterKey.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Settings"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </>
      }
    >
      <div className="settings-form">
        <div className="settings-section">
          <h4 className="settings-section-title">API Keys</h4>
          <p className="settings-description">
            Enter your API keys to enable different AI providers. Keys are stored locally in your browser.
          </p>

          <div className="api-key-field">
            <div className="provider-header">
              <span className="provider-icon gemini">G</span>
              <span className="provider-name">Google Gemini</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="get-key-link"
              >
                Get API Key
              </a>
            </div>
            <Input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
            />
          </div>

          <div className="api-key-field">
            <div className="provider-header">
              <span className="provider-icon groq">Q</span>
              <span className="provider-name">Groq</span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="get-key-link"
              >
                Get API Key
              </a>
            </div>
            <Input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="Enter your Groq API key"
            />
          </div>

          <div className="api-key-field">
            <div className="provider-header">
              <span className="provider-icon openrouter">O</span>
              <span className="provider-name">OpenRouter</span>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="get-key-link"
              >
                Get API Key
              </a>
            </div>
            <Input
              type="password"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder="Enter your OpenRouter API key"
            />
          </div>
        </div>

        <div className="settings-warning">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 5V8M8 11H8.01M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>API keys are stored in your browser's localStorage. They are not sent to any server except the respective AI providers.</span>
        </div>
      </div>
    </Modal>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) {
    return null;
  }
  
  return <SettingsModalContent key="settings" onClose={onClose} />;
}
