import ModuleLayout from "@/components/ModuleLayout";
import Invoices from "./Invoices";

export default function StandaloneInvoices() {
  return (
    <ModuleLayout title="Invoices" description="Create and manage invoices">
      <Invoices />
    </ModuleLayout>
  );
}
