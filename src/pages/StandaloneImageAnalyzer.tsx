import ModuleLayout from "@/components/ModuleLayout";
import CaptionGenerator from "./CaptionGenerator";

export default function StandaloneImageAnalyzer() {
  return (
    <ModuleLayout title="Image Analyzer" description="Analyze images and generate ad captions">
      <CaptionGenerator />
    </ModuleLayout>
  );
}
