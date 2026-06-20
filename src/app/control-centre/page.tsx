import { PageHeader } from "@/components/page-elements";
import { ControlCentreView } from "@/components/control-centre-view";

export default function ControlCentrePage() { return <><PageHeader eyebrow="Command" title="Control Centre" description="Real-time overview of project health, crew status, budget performance, and open issues."/><ControlCentreView/></>; }
