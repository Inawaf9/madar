"use client";
import { APIProvider } from "@vis.gl/react-google-maps";
export function MapsProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return key ? <APIProvider apiKey={key} language="ar" region="SA">{children}</APIProvider> : children;
}
