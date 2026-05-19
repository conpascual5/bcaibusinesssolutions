import ModuleLayout from "@/components/ModuleLayout";
import AdAnalyzer from "@/components/AdAnalyzer";

export default function StandaloneAdAnalyzer() {
  return (
    <ModuleLayout title="Ad Analyzer" description="Analyze and optimize your ad performance">
      <div className="p-4">
        <AdAnalyzer />
      </div>
    </ModuleLayout>
  );
}
