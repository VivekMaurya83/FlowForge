import { useState, useCallback, useRef } from 'react';
import useDiagramStore from '../store/diagramStore';

export default function PromptBox() {
  const {
    isLoading,
    aiError,
    aiMode,
    setAiMode,
    clearAiError,
    generateFromPrompt,
    modifyWithPrompt,
    nodes,
  } = useDiagramStore();

  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: string }
  const inputRef = useRef(null);
  const hasNodes = nodes.length > 0;

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    clearAiError();

    if (aiMode === 'generate') {
      const result = await generateFromPrompt(trimmed);
      if (result.success) {
        showToast('success', '✨ Diagram generated!');
        setPrompt('');
      } else {
        showToast('error', result.error);
      }
    } else {
      if (!hasNodes) {
        showToast('error', 'Generate a diagram first before modifying it.');
        return;
      }
      const result = await modifyWithPrompt(trimmed);
      if (result.success) {
        showToast('success', '✅ Diagram updated — manual edits preserved!');
        setPrompt('');
      } else {
        showToast('error', result.error);
      }
    }
  }, [prompt, isLoading, aiMode, hasNodes, clearAiError, generateFromPrompt, modifyWithPrompt, showToast]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const placeholders = {
    generate: "e.g. 'Create a travel website architecture with frontend, backend, and database'",
    modify: "e.g. 'Add a payment gateway and recommendation engine'",
  };

  return (
    <div className="prompt-bar">
      {/* Toast notification */}
      {toast && (
        <div className={`prompt-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div className="prompt-inner">
        {/* Mode toggle */}
        <div className="prompt-mode-toggle">
          <button
            id="mode-generate-btn"
            className={`mode-btn ${aiMode === 'generate' ? 'active' : ''}`}
            onClick={() => setAiMode('generate')}
            title="Generate a new diagram from scratch"
            disabled={isLoading}
          >
            ✦ Generate
          </button>
          <button
            id="mode-modify-btn"
            className={`mode-btn ${aiMode === 'modify' ? 'active' : ''}`}
            onClick={() => setAiMode('modify')}
            title="Modify the current diagram — preserves your edits"
            disabled={isLoading}
          >
            ⟳ Modify
          </button>
        </div>

        {/* Input */}
        <textarea
          ref={inputRef}
          id="prompt-input"
          className="prompt-input"
          placeholder={placeholders[aiMode]}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          disabled={isLoading}
          rows={1}
          autoComplete="off"
        />

        {/* Submit */}
        <button
          id="prompt-submit-btn"
          className={`prompt-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          title={aiMode === 'generate' ? 'Generate diagram' : 'Modify diagram'}
        >
          {isLoading ? (
            <span className="btn-spinner" />
          ) : aiMode === 'generate' ? (
            'Generate'
          ) : (
            'Modify'
          )}
        </button>
      </div>

      {/* Status bar */}
      <div className="prompt-status">
        {isLoading && (
          <span className="status-loading">
            <span className="pulse-dot" />
            {aiMode === 'generate' ? 'Generating diagram with Gemini AI...' : 'Analyzing diagram and applying changes...'}
          </span>
        )}
        {aiError && !isLoading && (
          <span className="status-error">⚠ {aiError}</span>
        )}
        {!isLoading && !aiError && aiMode === 'modify' && hasNodes && (
          <span className="status-hint">
            💡 Modify mode — your manual edits and node positions will be preserved
          </span>
        )}
        {!isLoading && !aiError && aiMode === 'generate' && (
          <span className="status-hint">
            ✦ Powered by Gemini 2.5 Flash · Press Enter to generate
          </span>
        )}
      </div>
    </div>
  );
}
