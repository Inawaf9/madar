"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { interests } from "@/lib/api/discovery";
import { interestSchema, type Interest } from "@/lib/api/discovery-contracts";
import { useIdentity } from "./identity";
import { DataForm, DeleteAction, EmptyState, ErrorState, Loading, Panel, PageHeading } from "./shared";
import { Button } from "@/components/ui/button";
export function InterestsPage() {
  const { userId } = useIdentity(); const cache = useQueryClient(); const [edit, setEdit] = useState<Interest | null>(null); const [version, setVersion] = useState(0);
  const query = useQuery({ queryKey: ["interests", userId], queryFn: ({ signal }) => interests.get(userId, signal), retry: false });
  const refresh = () => cache.invalidateQueries({ queryKey: ["interests", userId] });
  return <><PageHeading title="اهتماماتك الأساسية" description="اختيارية تمامًا. اكتب الخدمات أو الأماكن التي تهمك؛ لا تحتاج لإعدادها قبل استكشاف العقارات." />
    <div className="grid items-start gap-6 xl:grid-cols-2"><div className="flex flex-col gap-4">{query.isPending ? <Loading /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title="ما الذي يهمك حول بيتك؟" description="أضف اهتمامًا لتبحث عنه لاحقًا حول منزلك الحالي." /> : query.data.map(item => <Panel key={item.id} title={item.name} description={`${item.searchTerm} · ${item.searchMode} · الأولوية: ${item.priority ?? "غير محددة"}`}><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setEdit(item)}>تعديل</Button><DeleteAction onDelete={async () => { await interests.remove(userId, item.id); await refresh(); if (edit?.id === item.id) setEdit(null); }} /></div></Panel>)}</div>
      <Panel title={edit ? "تعديل الاهتمام" : "إضافة اهتمام"} description="البحث النصي يقبل كلماتك العربية والإنجليزية. نمط CATEGORY يستخدم التصنيف المدعوم أو يعود للبحث النصي.">
        <DataForm key={`${edit?.id || "new"}-${version}`} schema={interestSchema} defaults={edit ? { ...edit, priority: edit.priority ?? "" } : { name: "", searchTerm: "", searchMode: "TEXT", priority: "" }} fields={[{ name: "name", maxLength: 100 }, { name: "searchTerm", maxLength: 500 }, { name: "searchMode", options: [{ value: "TEXT", label: "بحث نصي" }, { value: "CATEGORY", label: "تصنيف" }] }, { name: "priority", type: "number", required: false, min: 1, max: 5 }]} onCancel={edit ? () => setEdit(null) : undefined} onSubmit={async value => { if (edit) await interests.update(userId, edit.id, value); else await interests.add(userId, value); await refresh(); setEdit(null); setVersion(v => v + 1); }} />
      </Panel>
    </div>
  </>;
}
