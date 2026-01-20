import { useState } from 'react';
import type { TrainingExample } from '../../types';
import { Modal, Button } from '../ui';
import './TrainingExamplesEditor.css';

interface TrainingExamplesEditorProps {
  examples: TrainingExample[];
  onChange: (examples: TrainingExample[]) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function TrainingExamplesEditor({
  examples,
  onChange,
  collapsed,
  onToggleCollapse,
}: TrainingExamplesEditorProps) {
  const [newInput, setNewInput] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const [expandedExamples, setExpandedExamples] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const exampleToDelete = deleteConfirmId ? examples.find(ex => ex.id === deleteConfirmId) : null;

  const handleAddExample = () => {
    if (newInput.trim() && newOutput.trim()) {
      const newExample: TrainingExample = {
        id: crypto.randomUUID(),
        input: newInput.trim(),
        output: newOutput.trim(),
        enabled: true,
      };
      onChange([...examples, newExample]);
      setNewInput('');
      setNewOutput('');
    }
  };

  const handleRemoveExample = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmRemoveExample = () => {
    if (deleteConfirmId) {
      onChange(examples.filter((ex) => ex.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleToggleExample = (id: string) => {
    onChange(
      examples.map((ex) =>
        ex.id === id ? { ...ex, enabled: !ex.enabled } : ex
      )
    );
  };

  const handleUpdateExample = (id: string, field: 'input' | 'output', value: string) => {
    onChange(
      examples.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const handleToggleExpand = (id: string) => {
    setExpandedExamples((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const enabledCount = examples.filter((ex) => ex.enabled).length;

  return (
    <div className={`ai-studio-examples-editor ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="ai-studio-examples-header"
        onClick={onToggleCollapse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleCollapse();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="ai-studio-examples-title-wrapper">
          {enabledCount > 0 && (
            <span className="ai-studio-examples-badge">{enabledCount}</span>
          )}
          <h3 className="ai-studio-examples-title">Examples</h3>
        </div>
        <button
          className="ai-studio-collapse-btn"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d={collapsed ? 'M4 6L8 10L12 6' : 'M4 10L8 6L12 10'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="ai-studio-examples-content">
          <p className="ai-studio-examples-description">
            Add input/output examples to help the model understand the expected response format.
          </p>

          {examples.length > 0 && (
            <div className="ai-studio-examples-list">
              {examples.map((example, index) => {
                const isExpanded = expandedExamples.has(example.id);
                return (
                  <div
                    key={example.id}
                    className={`ai-studio-example-item ${!example.enabled ? 'disabled' : ''} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="ai-studio-example-header"
                      onClick={() => handleToggleExpand(example.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleExpand(example.id);
                        }
                      }}
                    >
                      <div className="ai-studio-example-header-left">
                        <button
                          className="ai-studio-example-expand-btn"
                          onClick={(e) => { e.stopPropagation(); handleToggleExpand(example.id); }}
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d={isExpanded ? 'M4 10L8 6L12 10' : 'M4 6L8 10L12 6'}
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <span className="ai-studio-example-number">#{index + 1}</span>
                        {isExpanded ? null : (
                          <span className="ai-studio-example-preview">
                            {example.input.slice(0, 30)}{example.input.length > 30 ? '...' : ''}
                          </span>
                        )}
                      </div>
                      <div className="ai-studio-example-actions">
                        <button
                          className="ai-studio-example-toggle"
                          onClick={(e) => { e.stopPropagation(); handleToggleExample(example.id); }}
                          title={example.enabled ? 'Disable example' : 'Enable example'}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            {example.enabled ? (
                              <path
                                d="M13.5 4.5L6 12L2.5 8.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : (
                              <path
                                d="M3 8H13"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            )}
                          </svg>
                        </button>
                        <button
                          className="ai-studio-example-remove"
                          onClick={(e) => { e.stopPropagation(); handleRemoveExample(example.id); }}
                          title="Remove example"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M4 4L12 12M12 4L4 12"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="ai-studio-example-fields">
                        <div className="ai-studio-example-field">
                          <label className="ai-studio-example-label">Input</label>
                          <textarea
                            className="ai-studio-example-textarea"
                            value={example.input}
                            onChange={(e) => handleUpdateExample(example.id, 'input', e.target.value)}
                            placeholder="User input..."
                            rows={2}
                          />
                        </div>
                        <div className="ai-studio-example-field">
                          <label className="ai-studio-example-label">Output</label>
                          <textarea
                            className="ai-studio-example-textarea"
                            value={example.output}
                            onChange={(e) => handleUpdateExample(example.id, 'output', e.target.value)}
                            placeholder="Expected output..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="ai-studio-example-add">
            <div className="ai-studio-example-add-fields">
              <div className="ai-studio-example-field">
                <label className="ai-studio-example-label">New Input</label>
                <textarea
                  className="ai-studio-example-textarea"
                  value={newInput}
                  onChange={(e) => setNewInput(e.target.value)}
                  placeholder="Enter example input..."
                  rows={2}
                />
              </div>
              <div className="ai-studio-example-field">
                <label className="ai-studio-example-label">New Output</label>
                <textarea
                  className="ai-studio-example-textarea"
                  value={newOutput}
                  onChange={(e) => setNewOutput(e.target.value)}
                  placeholder="Enter expected output..."
                  rows={2}
                />
              </div>
            </div>
            <button
              className="ai-studio-example-add-btn"
              onClick={handleAddExample}
              disabled={!newInput.trim() || !newOutput.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3V13M3 8H13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Add Example
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Example"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmRemoveExample}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this example?</p>
        {exampleToDelete && (
          <div className="ai-studio-delete-preview">
            <div className="ai-studio-delete-preview-row">
              <strong>Input:</strong>
              <span className="ai-studio-delete-preview-text">{exampleToDelete.input}</span>
            </div>
            <div className="ai-studio-delete-preview-row">
              <strong>Output:</strong>
              <span className="ai-studio-delete-preview-text">{exampleToDelete.output}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
