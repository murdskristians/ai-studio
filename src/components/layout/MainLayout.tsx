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
    <div className="main-layout">
      {header}
      <div className="layout-body">
        {sidebar}
        <main className="layout-main">
          {main}
        </main>
        {panel}
      </div>
    </div>
  );
}
