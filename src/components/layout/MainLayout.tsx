import { ReactNode } from 'react';
import './MainLayout.css';

interface MainLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  panel?: ReactNode;
  /** Mobile only: dims the chat while a drawer is open. */
  backdrop?: boolean;
  onBackdropClick?: () => void;
}

export function MainLayout({
  header,
  sidebar,
  main,
  panel,
  backdrop = false,
  onBackdropClick,
}: MainLayoutProps) {
  return (
    <div className="ai-studio-main-layout">
      {header}
      <div className="ai-studio-layout-body">
        {sidebar}
        <main className="ai-studio-layout-main">
          {main}
        </main>
        {panel}
        {backdrop && (
          <div
            className="ai-studio-layout-backdrop"
            onClick={onBackdropClick}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
