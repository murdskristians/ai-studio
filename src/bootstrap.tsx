import React from 'react';
import ReactDOM from 'react-dom/client';
import AIStudioModule from './AIStudioModule';
import './index.css';

/**
 * Bootstrap - Local development entry point
 *
 * Following the same pattern as CommunicationModule:
 * - Passes host.user object for local development
 * - In production, the host application provides the real user
 */
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AIStudioModule
      host={{
        user: {
          uid: 'local-user',
          email: 'local@example.com',
          displayName: 'Local User',
          photoURL: null,
          permissions: [],
        },
      }}
    />
  </React.StrictMode>
);
