import React, { useState } from 'react';
import { Terminal, Copy, Check, X, Database, Clock, Layers } from 'lucide-react';

export interface InspectorData {
  pipeline: any[];
  executionTimeMs: number;
  docsExamined: number;
  docsReturned: number;
  keysExamined?: number;
  indexUsed: boolean;
  stageSummary: string;
}

interface PipelineInspectorProps {
  inspector?: InspectorData;
  title?: string;
}

export const PipelineInspector: React.FC<PipelineInspectorProps> = ({ inspector, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!inspector) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(inspector.pipeline, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono font-medium rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
        title="View MongoDB Aggregation Pipeline and Execution Stats"
      >
        <Terminal className="w-3.5 h-3.5 text-brand" />
        <span>Query: {inspector.executionTimeMs}ms</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            inspector.indexUsed ? 'bg-brand' : 'bg-warning'
          }`}
        />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md shadow-lg flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Pipeline Inspector: {title || 'Aggregation Query'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-muted-light dark:text-text-muted-dark"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Performance Stats Pill Grid */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark text-xs font-mono">
              <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                <div className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Latency
                </div>
                <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                  {inspector.executionTimeMs} ms
                </div>
              </div>

              <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                <div className="text-text-muted-light dark:text-text-muted-dark flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Scan Type
                </div>
                <div
                  className={`text-sm font-semibold mt-0.5 ${
                    inspector.indexUsed ? 'text-brand' : 'text-warning'
                  }`}
                >
                  {inspector.indexUsed ? 'IXSCAN (Index)' : 'COLLSCAN (Table)'}
                </div>
              </div>

              <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                <div className="text-text-muted-light dark:text-text-muted-dark">Docs Examined</div>
                <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                  {inspector.docsExamined.toLocaleString()}
                </div>
              </div>

              <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                <div className="text-text-muted-light dark:text-text-muted-dark">Docs Returned</div>
                <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                  {inspector.docsReturned.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Stage Summary Explanation */}
            <div className="px-4 py-2 text-xs border-b border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark flex items-center justify-between">
              <span>
                <strong>Execution Stage:</strong> {inspector.stageSummary}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border-light dark:border-border-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-xs"
              >
                {copied ? <Check className="w-3 h-3 text-brand" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-[#1E1E24] text-[#E0E0E0] rounded-b-md">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(inspector.pipeline, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
