import { Button } from '@/components/ui/button';
import { Building, Columns, Zap, Wrench, Grid3x3 } from 'lucide-react';
import type { Discipline } from '@/types/bip-peppol';

interface DisciplineFilterProps {
  selected: Discipline | 'All';
  onChange: (discipline: Discipline | 'All') => void;
}

const disciplines: Array<{ value: Discipline | 'All'; label: string; icon: any }> = [
  { value: 'All', label: 'All', icon: Grid3x3 },
  { value: 'Architecture', label: 'Architecture', icon: Building },
  { value: 'Structural', label: 'Structural', icon: Columns },
  { value: 'Electrical', label: 'Electrical', icon: Zap },
  { value: 'MEP', label: 'Mechanical', icon: Wrench },
];

export function DisciplineFilter({ selected, onChange }: DisciplineFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {disciplines.map((discipline) => {
        const Icon = discipline.icon;
        const isSelected = selected === discipline.value;
        
        return (
          <Button
            key={discipline.value}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onChange(discipline.value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {discipline.label}
          </Button>
        );
      })}
    </div>
  );
}
