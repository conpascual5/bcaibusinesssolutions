import ModuleLayout from "@/components/ModuleLayout";
import SalesWizard from "./SalesWizard";

export default function StandaloneSalesWizard() {
  return (
    <ModuleLayout title="Sales Wizard" description="AI-powered sales copy generator">
      <SalesWizard />
    </ModuleLayout>
  );
}
