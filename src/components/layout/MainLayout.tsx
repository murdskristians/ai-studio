import { ReactNode } from 'react';
import './MainLayout.css';

interface MainLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  panel?: ReactNode;
}

export function MainLayout({ header, sidebar, main, panel }: MainLayoutProps) {
  return (
    <div className="ai-studio-main-layout">
      {header}
      <div className="ai-studio-layout-body">
        {sidebar}
        <main className="ai-studio-layout-main">
          {main}
        </main>
        {panel}
      </div>
    </div>
  );
}
