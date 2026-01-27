import { usePerformance } from '../../contexts/usePerformance';
import type { Employee } from '../../types/performance';
import './EmployeeSelector.css';

interface EmployeeSelectorProps {
  onEmployeeSelect: (employee: Employee | null) => void;
  selectedEmployeeId: string | null;
}

export function EmployeeSelector({ onEmployeeSelect, selectedEmployeeId }: EmployeeSelectorProps) {
  const { employees, isLoadingEmployees } = usePerformance();

  if (isLoadingEmployees) {
    return (
      <div className="ai-studio-employee-selector">
        <div className="ai-studio-employee-selector-header">
          <h3>Employees</h3>
        </div>
        <div className="ai-studio-employee-loading">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="ai-studio-employee-selector">
      <div className="ai-studio-employee-selector-header">
        <h3>Employees</h3>
        <span className="ai-studio-employee-count">{employees.length}</span>
      </div>
      <div className="ai-studio-employee-list">
        {employees.map(employee => (
          <button
            key={employee.id}
            className={`ai-studio-employee-item ${selectedEmployeeId === employee.id ? 'selected' : ''}`}
            onClick={() => onEmployeeSelect(employee)}
          >
            <div className="ai-studio-employee-item-avatar">
              {employee.name.charAt(0)}
            </div>
            <div className="ai-studio-employee-item-info">
              <span className="ai-studio-employee-item-name">{employee.name}</span>
              <span className="ai-studio-employee-item-role">{employee.role}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
