"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLocationAction, updateLocationAction, deleteLocationAction } from "@/app/admin/locations/actions";

import { formatDateTime } from "@/lib/format/date";

type LocationRow = {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
};

type Props = {
    locations: LocationRow[];
};

export function AdminLocationsClient({ locations }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
    });

    function openCreate() {
        setEditingId(null);
        setForm({ name: "" });
        setError(null);
        setShowModal(true);
    }

    function openEdit(row: LocationRow) {
        setEditingId(row.id);
        setForm({ name: row.name });
        setError(null);
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const formData = new FormData();
        formData.append("name", form.name);

        startTransition(async () => {
            try {
                const result = editingId
                    ? await updateLocationAction(editingId, {}, formData)
                    : await createLocationAction({}, formData);

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
        if (!confirm("Delete this location?")) return;
        startTransition(async () => {
            const result = await deleteLocationAction(id);
            if (result.error) alert(result.error);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Locations</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage service areas.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="btn-primary"
                >
                    + Add Location
                </button>
            </div>

            {/* List */}
            <div className="card p-0 overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                        {locations.map((loc) => (
                            <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{loc.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span suppressHydrationWarning>{formatDateTime(loc.updated_at)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEdit(loc)} className="text-accent hover:text-blue-700 mr-4 font-medium transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(loc.id)} className="text-danger hover:text-red-700 font-medium transition-colors">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {locations.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No locations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)} aria-hidden="true"></div>
                        <div className="bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full relative z-10">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-foreground mb-4" id="modal-title">
                                    {editingId ? "Edit Location" : "Add Location"}
                                </h3>
                                {error && <div className="mb-4 p-3 bg-red-50 text-danger text-sm rounded-md border border-red-100">{error}</div>}
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Location Name</label>
                                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm px-4 py-3" />
                                    </div>
                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
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
