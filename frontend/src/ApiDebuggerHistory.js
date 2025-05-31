import React, { useState } from 'react';
import './ApiDebuggerHistory.css';

const ApiDebuggerHistory = ({ apiResponses, clearHistory }) => {
  const [expandedEntries, setExpandedEntries] = useState({});

  const toggleEntry = (index) => {
    setExpandedEntries(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!apiResponses || apiResponses.length === 0) {
    return null;
  }

  return (
    <div className="api-debugger-history">
      <div className="api-debugger-header">
        <h3>Historia Zapytań API</h3>
        <button onClick={clearHistory} className="clear-history-btn">
          Wyczyść historię
        </button>
      </div>
      {apiResponses.length === 0 && <p>Brak zapytań do wyświetlenia.</p>}
      <ul>
        {apiResponses.map((response, index) => (
          <li key={index} className="history-entry">
            <details>
              <summary className="entry-summary" onClick={() => toggleEntry(index)}>
                <span className="timestamp">{response.timestamp}</span>
                <span className="method">{response.method}</span>
                <span className={`status status-${response.status}`}>{response.status}</span>
                <span className="url">{response.url}</span>
                <span className="toggler">{expandedEntries[index] ? '▼' : '►'}</span>
              </summary>
              <pre className="response-body">{response.body}</pre>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApiDebuggerHistory; 