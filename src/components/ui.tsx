"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as SelectPrimitive from "@radix-ui/react-select";
import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-react";
import { cn, initials } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "secondary" | "danger";
  size?: "default" | "sm" | "icon";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30",
        variant === "default" && "bg-slate-950 text-white hover:bg-slate-800",
        variant === "outline" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        variant === "secondary" &&
          "bg-orange-50 text-orange-700 hover:bg-orange-100",
        variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100",
        size === "default" && "h-10 px-4 text-sm",
        size === "sm" && "h-8 px-3 text-xs",
        size === "icon" && "size-10",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 p-5 pb-0",
        className,
      )}
      {...props}
    />
  );
}
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-semibold tracking-tight text-slate-950", className)}
      {...props}
    />
  );
}
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />;
}
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

const badgeStyles: Record<string, string> = {
  in_progress: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  planning: "bg-slate-100 text-slate-600 ring-slate-500/15",
  todo: "bg-slate-100 text-slate-600 ring-slate-500/15",
  low: "bg-slate-100 text-slate-600 ring-slate-500/15",
  on_hold: "bg-amber-50 text-amber-700 ring-amber-600/15",
  review: "bg-violet-50 text-violet-700 ring-violet-600/15",
  medium: "bg-amber-50 text-amber-700 ring-amber-600/15",
  on_leave: "bg-amber-50 text-amber-700 ring-amber-600/15",
  high: "bg-red-50 text-red-700 ring-red-600/15",
  overdue: "bg-red-50 text-red-700 ring-red-600/15",
};

export function Badge({
  value,
  children,
  className,
}: {
  value?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const key = value ?? String(children);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset",
        badgeStyles[key] ?? "bg-blue-50 text-blue-700 ring-blue-600/15",
        className,
      )}
    >
      {children ?? key.replaceAll("_", " ")}
    </span>
  );
}

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-orange-500 transition-all",
          indicatorClassName,
        )}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

const avatarColors = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
];
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const index = name.charCodeAt(0) % avatarColors.length;
  return (
    <AvatarPrimitive.Root
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-2 ring-white",
        avatarColors[index],
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-11 text-sm",
        size === "xl" && "size-16 text-lg",
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarPrimitive.Fallback>{initials(name)}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export function AvatarStack({
  names,
  limit = 4,
}: {
  names: string[];
  limit?: number;
}) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, limit).map((name) => (
        <Avatar name={name} size="sm" key={name} />
      ))}
      {names.length > limit && (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
          +{names.length - limit}
        </span>
      )}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
        props.className,
      )}
    />
  );
}

export function Dropdown({
  value,
  onValueChange,
  children,
  ...props
}: { value: string; onValueChange: (value: string) => void; children: React.ReactNode } & Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
  "value" | "onValueChange"
>) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} {...props}>
      {children}
    </SelectPrimitive.Root>
  );
}

export function DropdownTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-8 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 data-[placeholder]:text-slate-400 [&>span]:line-clamp-1",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <IconChevronDown className="size-3.5 shrink-0 text-slate-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function DropdownValue(
  props: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>,
) {
  return <SelectPrimitive.Value {...props} />;
}

export function DropdownContent({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        className="z-50 max-h-72 min-w-[8rem] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        {...props}
      >
        {children}
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function DropdownItem({
  value,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  value: string;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700 focus:bg-slate-100"
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-1.5">
        <IconCheck className="size-3.5 text-orange-600" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  className,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, [open]);

  const label =
    selected.length === 0
      ? (placeholder ?? "Select...")
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex h-10 w-full min-w-[160px] items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm outline-none transition-shadow duration-150 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 hover:shadow-sm",
          selected.length > 0 ? "text-slate-700" : "text-slate-400",
          className,
        )}
      >
        <span className="flex-1 truncate">{label}</span>
        {selected.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange([]);
              }
            }}
            className="flex cursor-pointer items-center justify-center rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <IconX className="size-3.5" />
          </span>
        )}
        <svg
          className="size-4 shrink-0 text-slate-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              animation: "fade-in 0.12s ease-out",
            }}
          >
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors duration-100 hover:bg-slate-50"
                  onClick={() =>
                    onChange(
                      isSelected
                        ? selected.filter((v) => v !== opt.value)
                        : [...selected, opt.value],
                    )
                  }
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-slate-300",
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={cn(
                      "flex-1",
                      isSelected
                        ? "font-medium text-slate-900"
                        : "text-slate-600",
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  const options = useMemo(
    () =>
      React.Children.toArray(children).filter(
        (
          c,
        ): c is React.ReactElement<
          React.OptionHTMLAttributes<HTMLOptionElement>
        > => React.isValidElement(c) && c.type === "option",
      ),
    [children],
  );
  const activeValue = value ?? internalValue;
  const label = useMemo(
    () => options.find((o) => o.props.value === activeValue)?.props.children ?? activeValue,
    [options, activeValue],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-white px-3 pr-10 text-left text-sm text-slate-700 outline-none transition-shadow duration-150 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 hover:shadow-sm",
          className,
        )}
        id={props.id}
        name={props.name}
        disabled={props.disabled}
        aria-label={props["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex-1 truncate">{label}</span>
        <svg
          className="absolute right-3 size-4 shrink-0 text-slate-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="z-50 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: 280,
              animation: "fade-in 0.12s ease-out",
            }}
          >
            {options.map((opt) => {
              const optValue = opt.props.value ?? String(opt.props.children);
              const isSelected = opt.props.value === activeValue;
              return (
                <button
                  key={String(optValue)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors duration-100 hover:bg-slate-50",
                    isSelected
                      ? "bg-orange-50 font-medium text-orange-700"
                      : "text-slate-600",
                  )}
                  onClick={() => {
                    const newVal = opt.props.value ?? String(opt.props.children);
                    if (value === undefined) setInternalValue(newVal);
                    const target = { value: newVal } as HTMLSelectElement;
                    onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1">{opt.props.children}</span>
                  {isSelected && (
                    <svg
                      className="size-4 shrink-0 text-orange-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
        props.className,
      )}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-semibold text-slate-700",
        className,
      )}
      {...props}
    />
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-slate-200", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />
  );
}

export function Dialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      ) : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl outline-none">
          <DialogPrimitive.Title className="text-lg font-semibold text-slate-950">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-1 text-sm text-slate-500">
              {description}
            </DialogPrimitive.Description>
          )}
          <div className="mt-5">{children}</div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <IconX className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Tabs({
  tabs,
  defaultValue,
  className,
  useHash,
}: {
  tabs: { value: string; label: string; content: React.ReactNode }[];
  defaultValue?: string;
  className?: string;
  useHash?: boolean;
}) {
  const [value, setValue] = React.useState(defaultValue ?? tabs[0]?.value);

  React.useEffect(() => {
    if (!useHash) return;
    const sync = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && tabs.some((t) => t.value === hash)) setValue(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [useHash, tabs]);

  const onValueChange = (v: string) => {
    if (useHash) {
      setValue(v);
      window.history.replaceState(null, "", `#${v}`);
    }
  };

  const list = (
    <TabsPrimitive.List className="flex w-full gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => (
        <TabsPrimitive.Trigger
          key={tab.value}
          value={tab.value}
          className="shrink-0 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 outline-none transition-colors hover:text-slate-900 data-[state=active]:border-orange-500 data-[state=active]:text-slate-950"
        >
          {tab.label}
        </TabsPrimitive.Trigger>
      ))}
    </TabsPrimitive.List>
  );

  const content = tabs.map((tab) => (
    <TabsPrimitive.Content
      key={tab.value}
      value={tab.value}
      className="mt-5 outline-none"
    >
      {tab.content}
    </TabsPrimitive.Content>
  ));

  return useHash ? (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      {list}
      {content}
    </TabsPrimitive.Root>
  ) : (
    <TabsPrimitive.Root
      defaultValue={defaultValue ?? tabs[0]?.value}
      className={className}
    >
      {list}
      {content}
    </TabsPrimitive.Root>
  );
}

export function Table({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full min-w-[720px] text-left text-sm", className)}
      >
        {children}
      </table>
    </div>
  );
}
export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500",
        className,
      )}
    >
      {children}
    </th>
  );
}
export function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-slate-100 px-4 py-3 text-slate-600",
        className,
      )}
    >
      {children}
    </td>
  );
}
