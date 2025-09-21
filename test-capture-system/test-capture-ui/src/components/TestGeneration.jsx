import React, { useState } from 'react';
import { Code, Download, Copy, CheckCircle } from 'lucide-react';

const TestGeneration = ({ onGenerateTest, generatedTest }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (generatedTest) {
      navigator.clipboard.writeText(generatedTest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadTest = () => {
    if (generatedTest) {
      const blob = new Blob([generatedTest], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'GeneratedTest.cs';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="test-generation">
      <div className="generation-header">
        <h2>
          <Code size={20} />
          Test Generation
        </h2>

        {!generatedTest && (
          <button className="btn btn-generate" onClick={onGenerateTest}>
            Generate C# Test
          </button>
        )}
      </div>

      {generatedTest && (
        <>
          <div className="test-actions">
            <button className="btn btn-copy" onClick={copyToClipboard}>
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button className="btn btn-download" onClick={downloadTest}>
              <Download size={16} />
              Download Test
            </button>
            <button className="btn btn-regenerate" onClick={onGenerateTest}>
              Regenerate
            </button>
          </div>

          <div className="code-container">
            <pre className="code-block">
              <code>{generatedTest}</code>
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default TestGeneration;