import { ProductShell } from "@/components/product/product-shell";

// Account content is selected after the development ID is read in the browser.
// Its children cannot be validated by the server instant-navigation probe.
export const instant = false;

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <ProductShell>{children}</ProductShell>;
}
