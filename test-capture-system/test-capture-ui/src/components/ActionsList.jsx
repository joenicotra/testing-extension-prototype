import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { MousePointer, Type, FileCheck, Send } from 'lucide-react';

const ActionsList = () => {
  const { actions } = useWebSocket();

  const getActionIcon = (type) => {
    switch (type) {
      case 'click':
        return <MousePointer size={16} />;
      case 'input':
        return <Type size={16} />;
      case 'change':
        return <FileCheck size={16} />;
      case 'submit':
        return <Send size={16} />;
      default:
        return null;
    }
  };

  const formatSelector = (action) => {
    if (action.hasAutomationId) {
      return <span className="selector good">{action.selector}</span>;
    }
    return <span className="selector warning">{action.selector} ⚠️ No automation ID</span>;
  };

  return (
    <div className="actions-list">
      <h2>Captured Actions ({actions.length})</h2>

      {actions.length === 0 ? (
        <div className="no-actions">
          <p>No actions captured yet. Start recording to capture user interactions.</p>
        </div>
      ) : (
        <div className="action-items">
          {actions.map((action, index) => (
            <div key={index} className="action-item">
              <div className="action-number">{index + 1}</div>
              <div className="action-icon">
                {getActionIcon(action.type)}
              </div>
              <div className="action-details">
                <div className="action-type">{action.type.toUpperCase()}</div>
                <div className="action-selector">
                  {formatSelector(action)}
                </div>
                {action.value && (
                  <div className="action-value">Value: {action.value}</div>
                )}
                {action.text && (
                  <div className="action-text">Text: {action.text}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionsList;