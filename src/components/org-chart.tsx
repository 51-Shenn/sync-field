"use client";

import { useEffect, useRef, useCallback } from "react";
import { OrgChart as D3OrgChart } from "d3-org-chart";
import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui";

export interface OrgChartNode {
  id: string;
  parentId: string | null;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  avatarUrl: string;
  projectIds: string[];
}

const avatarColors = [
  "background:#fed7aa;color:#c2410c",
  "background:#bfdbfe;color:#1d4ed8",
  "background:#ddd6fe;color:#6d28d9",
  "background:#a7f3d0;color:#047857",
  "background:#fecaca;color:#b91c1c",
  "background:#fde68a;color:#b45309",
  "background:#c4b5fd;color:#5b21b6",
  "background:#fbcfe8;color:#be185d",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface OrgChartProps {
  data: OrgChartNode[];
  onNodeClick?: (node: OrgChartNode) => void;
  searchQuery?: string;
}

export function OrgChart({ data, onNodeClick, searchQuery }: OrgChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<D3OrgChart | null>(null);

  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => {
      if (onNodeClick) onNodeClick(d.data);
    },
    [onNodeClick]
  );

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    containerRef.current.innerHTML = "";

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const chart = new D3OrgChart()
      .container(container)
      .data(data as any)
      .svgWidth(rect.width)
      .svgHeight(rect.height)
      .nodeWidth(() => 280)
      .nodeHeight(() => 150)
      .childrenMargin(() => 50)
      .siblingsMargin(() => 30)
      .neighbourMargin(() => 40)
      .compactMarginBetween(() => 30)
      .compactMarginPair(() => 60)
      .compact(true)
      .rootMargin(20)
      .initialExpandLevel(3)
      .layout("top")
      .linkYOffset(8)
      .setActiveNodeCentered(false)
      .scaleExtent([0.1, 5])
      .nodeButtonWidth(() => 24)
      .nodeButtonHeight(() => 24)
      .nodeButtonX(() => -12)
      .nodeButtonY(() => -12)
      .nodeId((d: any) => d.id)
      .parentNodeId((d: any) => d.parentId)
      .onNodeClick(handleNodeClick)
      .nodeContent(function (this: any, d: any) {
        const node = d.data;
        const colorIdx =
          node.name.charCodeAt(0) % avatarColors.length;
        const avatarColor = avatarColors[colorIdx];
        const isActive = node.status === "active";

        return `
          <div class="org-node" style="
            width:260px;height:130px;
            background:white;
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:16px;
            display:flex;
            flex-direction:column;
            box-shadow:0 1px 3px rgba(15,23,42,0.04);
            cursor:pointer;
            font-family:'Inter','Segoe UI',Arial,sans-serif;
            box-sizing:border-box;
          ">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="
                width:44px;height:44px;border-radius:9999px;
                display:inline-flex;align-items:center;justify-content:center;
                font-weight:600;font-size:13px;flex-shrink:0;
                ${avatarColor};
              ">${initials(node.name)}</div>
              <div style="min-width:0;flex:1;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${node.name}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${node.role}</p>
              </div>
            </div>
            <div style="margin-top:auto;display:flex;align-items:center;gap:8px;justify-content:space-between;">
              <span style="
                display:inline-flex;align-items:center;padding:2px 10px;border-radius:9999px;
                font-size:11px;font-weight:600;
                ${
                  isActive
                    ? "background:#ecfdf5;color:#047857;"
                    : "background:#fef3c7;color:#b45309;"
                }
              ">${isActive ? "Active" : "On Leave"}</span>
              <span style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">${node.email || ""}</span>
            </div>
          </div>
        `;
      })
      .buttonContent(({ node, state }: { node: any; state: any }) => {
        const count = node.data._directSubordinates || 0;
        if (count === 0) return "";
        const isExpanded = node.children;
        return `
          <div style="
            display:flex;align-items:center;justify-content:center;
            width:24px;height:24px;border-radius:9999px;
            background:white;border:1px solid #e2e8f0;
            cursor:pointer;font-size:14px;color:#64748b;line-height:1;
            font-family:'Inter','Segoe UI',Arial,sans-serif;
            box-shadow:0 1px 2px rgba(15,23,42,0.05);
          ">${isExpanded ? "−" : "+"}</div>
        `;
      })
      .linkUpdate(function (this: SVGPathElement, d: any) {
        const hl = d.data._upToTheRootHighlighted;
        this.setAttribute("stroke", hl ? "#f97316" : "#cbd5e1");
        this.setAttribute("stroke-width", hl ? "2.5" : "1.5");
        this.setAttribute("fill", "none");
        this.setAttribute("stroke-linecap", "round");
        this.setAttribute("opacity", hl ? "1" : "0.7");
      })
      .render();

    chartRef.current = chart;

    requestAnimationFrame(() => {
      chart.fit();
    });

    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width <= 0) return;
      chart.svgWidth(entry.contentRect.width);
      chart.svgHeight(entry.contentRect.height);
      chart.render();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      chartRef.current = null;
    };
  }, [data, handleNodeClick]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    if (searchQuery && searchQuery.length > 0) {
      const q = searchQuery.toLowerCase();
      chart.clearHighlighting();
      data.forEach((item) => {
        if (
          item.name.toLowerCase().includes(q) ||
          item.role.toLowerCase().includes(q)
        ) {
          chart.setHighlighted(item.id);
        }
      });
    } else {
      chart.clearHighlighting();
    }
  }, [searchQuery, data]);

  const handleExpandAll = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.expandAll().render();
  }, []);

  const handleCollapseAll = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.collapseAll().render();
  }, []);

  const handleFit = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.fit();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
          title="Expand all"
        >
          <Plus className="size-3.5" />
          Expand all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCollapseAll}
          title="Collapse all"
        >
          <Minus className="size-3.5" />
          Collapse all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFit}
          title="Fit to screen"
        >
          <Maximize2 className="size-3.5" />
          Fit
        </Button>
      </div>
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
        style={{ height: "calc(100vh - 280px)", minHeight: "450px" }}
      />
    </div>
  );
}
