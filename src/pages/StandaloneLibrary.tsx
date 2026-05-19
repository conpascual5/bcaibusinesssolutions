import ModuleLayout from "@/components/ModuleLayout";
import Library from "./Library";

export default function StandaloneLibrary() {
  return (
    <ModuleLayout title="Library" description="Browse your saved generations and content">
      <Library />
    </ModuleLayout>
  );
}
