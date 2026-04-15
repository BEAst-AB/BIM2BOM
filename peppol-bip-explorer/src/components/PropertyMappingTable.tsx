import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import type { BIPProperty, Discipline } from '@/types/bip-peppol';
interface PropertyMappingTableProps {
  properties: BIPProperty[];
  selectedDiscipline: Discipline | 'All';
}
export function PropertyMappingTable({
  properties,
  selectedDiscipline
}: PropertyMappingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredProperties = properties.filter(prop => {
    const matchesSearch = prop.bipProperty.toLowerCase().includes(searchTerm.toLowerCase()) || prop.peppolName.toLowerCase().includes(searchTerm.toLowerCase()) || prop.bipComment.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedDiscipline === 'All') return matchesSearch;
    const disciplineField = selectedDiscipline.toLowerCase() as keyof BIPProperty;
    return matchesSearch && prop[disciplineField] === 'Y';
  });
  return <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle>BIP till Peppol property set mappings</CardTitle>
        <CardDescription>
          Overview of how BIP properties are mapped to Peppol format
        </CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search properties..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">BIP Property</TableHead>
                <TableHead className="w-[100px]">BIP DataType</TableHead>
                <TableHead className="w-[150px]">BIP Example</TableHead>
                <TableHead className="w-[250px]">BIP Comment</TableHead>
                <TableHead className="w-[180px]">Peppol cbc:Name</TableHead>
                <TableHead className="w-[150px]">Peppol cbc:NameCode</TableHead>
                <TableHead className="w-[120px]">Peppol @listID</TableHead>
                <TableHead className="w-[150px]">Peppol cbc:Value</TableHead>
                <TableHead className="w-[150px]">Peppol cbc:ValueQuantity</TableHead>
                <TableHead className="w-[120px]">Peppol @unitCode</TableHead>
                <TableHead className="w-[200px]">Unit Description</TableHead>
                <TableHead className="w-[150px]">Requires ValueQuantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((prop, index) => <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{prop.bipProperty}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{prop.bipDataType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{prop.bipExample}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{prop.bipComment}</TableCell>
                  <TableCell className="font-mono text-sm">{prop.peppolName}</TableCell>
                  <TableCell className="font-mono text-sm">{prop.peppolNameCode}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{prop.peppolListID}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{prop.peppolValue}</TableCell>
                  <TableCell className="font-mono text-sm">{prop.peppolValueQuantity}</TableCell>
                  <TableCell>
                    {prop.peppolUnitCode && <Badge variant="secondary" className="font-mono text-xs">{prop.peppolUnitCode}</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{prop.unitDescription}</TableCell>
                  <TableCell className="text-sm">
                    {prop.requiresValueQuantity && <Badge variant={prop.requiresValueQuantity === 'Yes' ? 'default' : 'secondary'}>
                        {prop.requiresValueQuantity}
                      </Badge>}
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
        {filteredProperties.length === 0 && <div className="py-12 text-center text-muted-foreground">
            No properties found
          </div>}
      </CardContent>
    </Card>;
}