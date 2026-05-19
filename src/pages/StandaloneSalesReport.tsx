import ModuleLayout from "@/components/ModuleLayout";
import SalesReport from "./SalesReport";

export default function StandaloneSalesReport() {
  return (
    <ModuleLayout title="Sales Report" description="Track and analyze your sales data">
      <SalesReport />
    </ModuleLayout>
  );
}
