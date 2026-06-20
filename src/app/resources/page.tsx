import { PageHeader } from "@/components/page-elements";
import { ResourcesView } from "@/components/resources-view";

export default function ResourcesPage() { return <><PageHeader eyebrow="Assets" title="Resource Management" description="Track budgets, equipment, materials, and fuel allocations across your portfolio."/><ResourcesView/></>; }
