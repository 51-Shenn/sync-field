declare module "d3-org-chart" {
  export class OrgChart {
    constructor();
    container(el: HTMLElement | string): this;
    data(data: unknown[]): this;
    render(): this;
    svgWidth(w: number): this;
    svgHeight(h: number): this;
    nodeWidth(fn: (d: unknown) => number): this;
    nodeHeight(fn: (d: unknown) => number): this;
    childrenMargin(fn: (d: unknown) => number): this;
    siblingsMargin(fn: (d: unknown) => number): this;
    neighbourMargin(fn: (a: unknown, b: unknown) => number): this;
    compactMarginBetween(fn: (d: unknown) => number): this;
    compact(val: boolean): this;
    rootMargin(val: number): this;
    initialExpandLevel(val: number): this;
    layout(dir: "top" | "bottom" | "left" | "right"): this;
    scaleExtent(val: [number, number]): this;
    nodeId(fn: (d: unknown) => string): this;
    parentNodeId(fn: (d: unknown) => string | null): this;
    onNodeClick(fn: (d: unknown) => void): this;
    nodeContent(fn: (d: unknown) => string): this;
    buttonContent(fn: (opts: { node: unknown; state: unknown }) => string): this;
    linkUpdate(fn: (this: SVGPathElement, d: unknown) => void): this;
    expandAll(): this;
    collapseAll(): this;
    fit(): this;
    setHighlighted(id: string): this;
    clearHighlighting(): this;
  }
}
