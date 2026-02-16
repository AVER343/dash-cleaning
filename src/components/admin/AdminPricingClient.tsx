"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPricingAction, updatePricingAction, deletePricingAction } from "@/app/admin/pricing/actions";

import { formatDateTime } from "@/lib/format/date";

type PricingRow = {
    id: string;
    base: number;
    bed: number;
    bath: number;
    sqft: number;
    updatedAt: Date;
};

export function AdminPricingClient({ pricing }: { pricing: PricingRow[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        base: "0",
        bed: "0",
        bath: "0",
        sqft: "0",
    });

    function openCreate() {
        setEditingId(null);
        setForm({ base: "100", bed: "20", bath: "30", sqft: "0.10" });
        setError(null);
        setShowModal(true);
    }

    function openEdit(row: PricingRow) {
        setEditingId(row.id);
        setForm({
            base: String(row.base),
            bed: String(row.bed),
            bath: String(row.bath),
            sqft: String(row.sqft),
        });
        setError(null);
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append("base", form.base);
        formData.append("bed", form.bed);
        formData.append("bath", form.bath);
        formData.append("sqft", form.sqft);

        startTransition(async () => {
            try {
                const result = editingId
                    ? await updatePricingAction(editingId, {}, formData)
                    : await createPricingAction({}, formData);

                if (result.error) {
                    setError(result.error);
                } else {
                    setShowModal(false);
                    router.refresh();
                }
            } catch {
                setError("Something went wrong");
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this pricing row?")) return;
        startTransition(async () => {
            const result = await deletePricingAction(id);
            if (result.error) alert(result.error);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pricing Models</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Configure base rates and multipliers.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="btn-primary"
                >
                    + Add Pricing Tier
                </button>
            </div>

            {/* List */}
            <div className="card p-0 overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Price</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Per Room</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Per Sqft</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                        {pricing.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">${row.base}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="mr-3">Bed: +${row.bed}</span>
                                    <span>Bath: +${row.bath}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">+${row.sqft}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span suppressHydrationWarning>{formatDateTime(row.updatedAt)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEdit(row)} className="text-accent hover:text-blue-700 mr-4 font-medium transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(row.id)} className="text-danger hover:text-red-700 font-medium transition-colors">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {pricing.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No pricing tiers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)} aria-hidden="true"></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-foreground mb-4" id="modal-title">
                                    {editingId ? "Edit Pricing Tier" : "Add Pricing Tier"}
                                </h3>
                                {error && <div className="mb-4 p-3 bg-red-50 text-danger text-sm rounded-md border border-red-100">{error}</div>}
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Base Price</label>
                                        <input type="number" required min="0" value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Sqft Multiplier</label>
                                        <input type="number" required min="0" step="0.01" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Per Bedroom</label>
                                        <input type="number" required min="0" value={form.bed} onChange={e => setForm({ ...form, bed: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Per Bathroom</label>
                                        <input type="number" required min="0" value={form.bath} onChange={e => setForm({ ...form, bath: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                    </div>

                                    <div className="mt-5 sm:mt-6 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                        <button type="submit" disabled={isPending} className="w-full btn-primary sm:col-start-2 disabled:opacity-50">
                                            {isPending ? "Saving..." : "Save"}
                                        </button>
                                        <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full btn-secondary sm:mt-0 sm:col-start-1">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
