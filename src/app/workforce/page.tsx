import { PageHeader } from "@/components/page-elements";
import { WorkforceView } from "@/components/workforce-view";

export default function WorkforcePage() { return <><PageHeader eyebrow="People" title="Workforce Management" description="Manage worker profiles, roles, assignments, and availability across all projects."/><WorkforceView/></>; }
