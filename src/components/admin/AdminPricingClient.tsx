"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPricingAction, updatePricingAction, deletePricingAction } from "@/app/admin/pricing/actions";

type PricingRow = {
    id: string;
    service_id: string;
    service_name: string | null;
    location_id: string | null;
    location_name: string;
    bedrooms: number;
    bathrooms: number;
    frequency: "one_time" | "weekly" | "bi_weekly" | "monthly";
    base_price: number;
    updated_at: Date;
};

type Option = {
    id: string;
    name: string;
};

type Props = {
    pricing: PricingRow[];
    services: Option[];
    locations: Option[];
};

export function AdminPricingClient({ pricing, services, locations }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentServiceId = searchParams.get("service_id") || "";
    const currentLocationId = searchParams.get("location_id") || "";

    // ... existing modal state ...
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        service_id: "",
        location_id: "",
        bedrooms: "1",
        bathrooms: "1",
        frequency: "one_time",
        base_price: "100",
    });

    function handleFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        router.replace(`?${params.toString()}`);
    }

    // ... existing openCreate/openEdit functions ...

    function openCreate() {
        setEditingId(null);
        setForm({
            service_id: services[0]?.id || "",
            location_id: "",
            bedrooms: "1",
            bathrooms: "1",
            frequency: "one_time",
            base_price: "100",
        });
        setError(null);
        setShowModal(true);
    }

    function openEdit(row: PricingRow) {
        setEditingId(row.id);
        setForm({
            service_id: row.service_id,
            location_id: row.location_id || "",
            bedrooms: String(row.bedrooms),
            bathrooms: String(row.bathrooms),
            frequency: row.frequency,
            base_price: String(row.base_price),
        });
        setError(null);
        setShowModal(true);
    }

    // ... existing handleSubmit/handleDelete functions ...

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append("service_id", form.service_id);
        formData.append("location_id", form.location_id);
        formData.append("bedrooms", form.bedrooms);
        formData.append("bathrooms", form.bathrooms);
        formData.append("frequency", form.frequency);
        formData.append("base_price", form.base_price);

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
        if (!confirm("Delete this pricing rule?")) return;
        startTransition(async () => {
            const result = await deletePricingAction(id);
            if (result.error) alert(result.error);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Base Pricing Rules</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Configure base prices per service, location, and size.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="btn-primary"
                >
                    + Add Rule
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-border">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-64">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Filter by Service</label>
                        <select
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3"
                            value={currentServiceId}
                            onChange={(e) => handleFilter("service_id", e.target.value)}
                        >
                            <option value="">All Services</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="w-full sm:w-64">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Filter by Location</label>
                        <select
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3"
                            value={currentLocationId}
                            onChange={(e) => handleFilter("location_id", e.target.value)}
                        >
                            <option value="">All Locations</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-64">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Frequency</label>
                        <select
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3"
                            value={searchParams.get("frequency") || ""}
                            onChange={(e) => handleFilter("frequency", e.target.value)}
                        >
                            <option value="">All Frequencies</option>
                            <option value="one_time">One Time</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi_weekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div className="flex gap-2 w-full sm:w-64">
                        <div className="w-1/2">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Min Price</label>
                            <input
                                type="number"
                                placeholder="Min"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3"
                                value={searchParams.get("min_price") || ""}
                                onChange={(e) => handleFilter("min_price", e.target.value)}
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Price</label>
                            <input
                                type="number"
                                placeholder="Max"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3"
                                value={searchParams.get("max_price") || ""}
                                onChange={(e) => handleFilter("max_price", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="card p-0 overflow-hidden text-sm">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-500">Service</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-500">Location</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-500">Specs</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-500">Freq</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-500">Price</th>
                            <th className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                        {pricing.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-foreground">{row.service_name || "Unknown"}</td>
                                <td className="px-4 py-3 text-gray-500">{row.location_name}</td>
                                <td className="px-4 py-3 text-gray-500">
                                    {row.bedrooms} Bed, {row.bathrooms} Bath
                                </td>
                                <td className="px-4 py-3 text-gray-500 capitalize">{row.frequency.replace("_", " ")}</td>
                                <td className="px-4 py-3 font-semibold text-foreground">${row.base_price}</td>
                                <td className="px-4 py-3 text-right font-medium">
                                    <button onClick={() => openEdit(row)} className="text-accent hover:text-blue-700 mr-3">Edit</button>
                                    <button onClick={() => handleDelete(row.id)} className="text-danger hover:text-red-700">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {pricing.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No pricing rules found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full p-6 relative">
                            <h3 className="text-lg font-medium text-foreground mb-4">
                                {editingId ? "Edit Pricing Rule" : "Add Pricing Rule"}
                            </h3>
                            {error && <div className="mb-4 p-3 bg-red-50 text-danger text-sm rounded-md border border-red-100">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Service</label>
                                    <select required value={form.service_id} onChange={e => setForm({ ...form, service_id: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3">
                                        <option value="">Select Service</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location (Optional)</label>
                                    <select value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3">
                                        <option value="">All Locations</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                                        <input type="number" required min="0" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                                        <input type="number" required min="0" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Frequency</label>
                                        <select required value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3">
                                            <option value="one_time">One Time</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="bi_weekly">Bi-Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Base Price ($)</label>
                                        <input type="number" required min="0" step="0.01" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3" />
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3 justify-end">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                    <button type="submit" disabled={isPending} className="btn-primary">
                                        {isPending ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
