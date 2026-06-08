import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [toast, setToast] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
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

  // Auto-resize textarea
  const handleInput = useCallback((e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  }, []);

  const charCount = prompt.length;
  const maxChars = 2000;

  const placeholders = {
    generate: "Describe your system architecture… e.g. 'E-commerce platform with React frontend, Node.js API, PostgreSQL database, and Redis cache'",
    modify: "Describe your changes… e.g. 'Add a payment gateway between the API and database layers'",
  };

  return (
    <div className="prompt-bar">
      {/* Toast notification */}
      {toast && (
        <div className={`prompt-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div className="prompt-bar-inner">
        {/* Left side — live diagram stats */}
        <div className="prompt-side-info prompt-side-left">
          <span className="prompt-stat-pill">
            <span className="prompt-stat-icon">⬡</span>
            {nodes.length} <span className="prompt-stat-label">nodes</span>
          </span>
        </div>

        {/* Centre — main prompt card */}
        <div className={`prompt-container ${isFocused ? 'focused' : ''} ${isLoading ? 'loading-state' : ''}`}>
          {/* Top row: mode toggle + char count */}
          <div className="prompt-header">
            {/* Mode toggle */}
            <div className="prompt-mode-toggle">
              <button
                id="mode-generate-btn"
                className={`mode-btn ${aiMode === 'generate' ? 'active' : ''}`}
                onClick={() => setAiMode('generate')}
                title="Generate a new diagram from scratch"
                disabled={isLoading}
              >
                <span className="mode-icon">✦</span>
                Generate
              </button>
              <button
                id="mode-modify-btn"
                className={`mode-btn ${aiMode === 'modify' ? 'active' : ''}`}
                onClick={() => setAiMode('modify')}
                title="Modify the current diagram — preserves your edits"
                disabled={isLoading}
              >
                <span className="mode-icon">⟳</span>
                Modify
              </button>
            </div>

            {/* Char count */}
            <span className={`char-count ${charCount > maxChars * 0.9 ? 'warn' : ''}`}>
              {charCount > 0 && `${charCount} / ${maxChars}`}
            </span>
          </div>

          {/* Input row */}
          <div className="prompt-input-row">
            <div className="prompt-input-wrapper">
              {/* AI sparkle icon */}
              <span className={`prompt-ai-icon ${isLoading ? 'spinning' : ''}`}>
                {isLoading ? '⟳' : '✦'}
              </span>
              <textarea
                ref={inputRef}
                id="prompt-input"
                className="prompt-input"
                placeholder={placeholders[aiMode]}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
                rows={1}
                autoComplete="off"
                maxLength={maxChars}
              />
            </div>

            {/* Submit button */}
            <button
              id="prompt-submit-btn"
              className={`prompt-btn ${isLoading ? 'loading' : ''} ${aiMode}`}
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
              title={aiMode === 'generate' ? 'Generate diagram (Enter)' : 'Modify diagram (Enter)'}
            >
              {isLoading ? (
                <span className="btn-spinner" />
              ) : (
                <>
                  <span className="btn-icon">{aiMode === 'generate' ? '✦' : '⟳'}</span>
                  <span>{aiMode === 'generate' ? 'Generate' : 'Modify'}</span>
                </>
              )}
            </button>
          </div>

          {/* Status bar */}
          <div className="prompt-status">
            {isLoading && (
              <span className="status-loading">
                <span className="status-loading-dots">
                  <span />
                  <span />
                  <span />
                </span>
                {aiMode === 'generate' ? 'Generating diagram with Gemini AI…' : 'Analyzing diagram and applying changes…'}
              </span>
            )}
            {aiError && !isLoading && (
              <span className="status-error">⚠ {aiError}</span>
            )}
            {!isLoading && !aiError && aiMode === 'modify' && hasNodes && (
              <span className="status-hint">
                <span className="hint-icon">💡</span>
                Modify mode — your manual edits and node positions will be preserved
              </span>
            )}
            {!isLoading && !aiError && aiMode === 'generate' && (
              <span className="status-hint">
                <span className="hint-icon">✦</span>
                Powered by Gemini 3 Flash · Press <kbd>Enter</kbd> to generate
              </span>
            )}
          </div>
        </div>

        {/* Right side — keyboard shortcuts */}
        <div className="prompt-side-info prompt-side-right">
          <div className="prompt-kbd-hints">
            <span className="prompt-kbd-row"><kbd>↵</kbd> Send</span>
            <span className="prompt-kbd-row"><kbd>⇧</kbd><kbd>↵</kbd> Newline</span>
          </div>
        </div>
      </div>
    </div>

  );
}
