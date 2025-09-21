import React from 'react';
import { Play, Square, Activity } from 'lucide-react';

const RecordingControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  testName,
  onTestNameChange
}) => {
  return (
    <div className="recording-controls">
      <div className="test-name-input">
        <label htmlFor="testName">Test Name:</label>
        <input
          id="testName"
          type="text"
          value={testName}
          onChange={(e) => onTestNameChange(e.target.value)}
          placeholder="Enter test name"
          disabled={isRecording}
        />
      </div>

      <div className="control-buttons">
        {!isRecording ? (
          <button
            className="btn btn-start"
            onClick={onStartRecording}
          >
            <Play size={20} />
            Start Recording
          </button>
        ) : (
          <button
            className="btn btn-stop"
            onClick={onStopRecording}
          >
            <Square size={20} />
            Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <Activity className="recording-icon" size={16} />
          <span>Recording in progress...</span>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;