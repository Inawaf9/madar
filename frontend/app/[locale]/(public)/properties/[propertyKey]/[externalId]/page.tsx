import { PropertyDetailPage } from "@/features/properties/detail-page";
import { notFound } from "next/navigation";
export default async function Page({ params }: { params: Promise<{ propertyKey: string; externalId: string }> }) { const { propertyKey: source, externalId } = await params; if (!source || !externalId || ["null", "undefined"].includes(externalId)) notFound(); return <PropertyDetailPage source={source} externalId={externalId} />; }
