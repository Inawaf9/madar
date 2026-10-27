"use client";
import { Combobox as Primitive } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Combobox = Primitive.Root;
function ComboboxInput({ className, ...props }: Primitive.Input.Props) {
  return (
    <Primitive.InputGroup className="relative min-w-0">
      <Primitive.Input
        data-slot="combobox-input"
        className={cn(
          "h-11 w-full min-w-0 rounded-xl border border-input bg-background ps-3 pe-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <Primitive.Trigger
        className="absolute inset-y-0 end-0 flex w-10 items-center justify-center rounded-e-xl text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={props.dir === "rtl" ? "فتح قائمة الخيارات" : "Open options"}
      >
        <ChevronDown
          aria-hidden="true"
          className="size-4"
        />
      </Primitive.Trigger>
    </Primitive.InputGroup>
  );
}
function ComboboxContent({ className, children, ...props }: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        sideOffset={4}
        align="start"
        className="isolate z-50 max-w-(--available-width)"
      >
        <Primitive.Popup
          data-slot="combobox-content"
          className={cn(
            "flex max-h-(--available-height) w-(--anchor-width) max-w-full flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-lg",
            className,
          )}
          {...props}
        >
          {children}
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
function ComboboxList({ className, ...props }: Primitive.List.Props) {
  return (
    <Primitive.List
      data-slot="combobox-list"
      className={cn(
        "min-h-0 max-h-64 overflow-y-auto overscroll-contain p-1 empty:p-0",
        className,
      )}
      {...props}
    />
  );
}
function ComboboxItem({ className, children, ...props }: Primitive.Item.Props) {
  return (
    <Primitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-xl py-2 ps-3 pe-8 text-sm outline-none data-highlighted:bg-secondary data-selected:font-semibold",
        className,
      )}
      {...props}
    >
      {children}
      <Primitive.ItemIndicator className="absolute end-2">
        <Check
          aria-hidden="true"
          className="size-4"
        />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}
const ComboboxEmpty = Primitive.Empty;
export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
};
