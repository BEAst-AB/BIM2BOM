import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyMappingTable } from '@/components/PropertyMappingTable';
import { ExampleMessagesView } from '@/components/ExampleMessagesView';
import { CatalogueTester } from '@/components/CatalogueTester';
import { CatalogueDiff } from '@/components/CatalogueDiff';
import { parseBIPMapping, parsePeppolExamples } from '@/utils/excelParser';
import { Loader2, Database, FileText, Upload, GitCompare } from 'lucide-react';
import type { BIPProperty, PeppolExample, Discipline } from '@/types/bip-peppol';
const Index = () => {
  const [bipProperties, setBipProperties] = useState<BIPProperty[]>([]);
  const [peppolExamples, setPeppolExamples] = useState<PeppolExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [properties, examples] = await Promise.all([parseBIPMapping(), parsePeppolExamples()]);
        setBipProperties(properties);
        setPeppolExamples(examples);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Loading BIP & Peppol data...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-[var(--shadow-card)]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Database className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Peppol & BIP Explorer</h1>
          </div>
          <p className="text-muted-foreground">BIP properties mappings for Peppol Catalogue with examples</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{/* ... keep existing code (Tabs section) */}

        {/* Tabs */}
        <Tabs defaultValue="mapping" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="mapping" className="gap-2">
              <Database className="h-4 w-4" />
              Property Mapping
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-2">
              <FileText className="h-4 w-4" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="tester" className="gap-2">
              <Upload className="h-4 w-4" />
              Catalogue Tester
            </TabsTrigger>
            <TabsTrigger value="diff" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Catalogue Diff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mapping">
            <PropertyMappingTable properties={bipProperties} selectedDiscipline="All" />
          </TabsContent>

          <TabsContent value="examples">
            <ExampleMessagesView examples={peppolExamples} />
          </TabsContent>

          <TabsContent value="tester">
            <CatalogueTester />
          </TabsContent>

          <TabsContent value="diff">
            <CatalogueDiff />
          </TabsContent>
        </Tabs>

      </main>
    </div>;
};
export default Index;