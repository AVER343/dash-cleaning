"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBookingAction, updateBookingAction, deleteBookingAction } from "@/app/admin/bookings/actions";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

import { StatusBadge } from "@/components/admin/StatusBadge";

type BookingRow = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    place_id: string;
    location_name: string | null;
    service_type: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    date: string;
    time: string;
    price: number;
    status: BookingStatus;
    created_at: Date;
};

type LocationOption = {
    id: string;
    name: string;
};

type Props = {
    initialBookings: BookingRow[];
    locations: LocationOption[];
    total: number;
    page: number;
    pageCount: number;
};

const INITIAL_FORM = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    place_id: "",
    service_type: "",
    bedrooms: "0",
    bathrooms: "0",
    sqft: "0",
    date: "",
    time: "",
    price: "0",
    status: "pending" as BookingStatus,
};

export function AdminBookingsClient({ initialBookings, locations, total, page, pageCount }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const currentQ = searchParams.get("q") ?? "";
    const currentStatus = searchParams.get("status") ?? "";

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams);
        if (term) params.set("q", term);
        else params.delete("q");
        params.set("page", "1");
        router.replace(`/admin/bookings?${params.toString()}`);
    }

    function handleStatusFilter(status: string) {
        const params = new URLSearchParams(searchParams);
        if (status) params.set("status", status);
        else params.delete("status");
        params.set("page", "1");
        router.replace(`/admin/bookings?${params.toString()}`);
    }

    function handlePageChange(newPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(newPage));
        router.replace(`/admin/bookings?${params.toString()}`);
    }

    function openCreate() {
        setEditingId(null);
        setFormData({
            ...INITIAL_FORM,
            place_id: locations[0]?.id || ""
        });
        setError(null);
        setShowModal(true);
    }

    function openEdit(row: BookingRow) {
        setEditingId(row.id);
        setFormData({
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone,
            place_id: row.place_id,
            service_type: row.service_type,
            bedrooms: String(row.bedrooms),
            bathrooms: String(row.bathrooms),
            sqft: String(row.sqft),
            date: row.date,
            time: row.time,
            price: String(row.price),
            status: row.status,
        });
        setError(null);
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            payload.append(key, value);
        });

        startTransition(async () => {
            try {
                const result = editingId
                    ? await updateBookingAction(editingId, {}, payload)
                    : await createBookingAction({}, payload);

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
        if (!confirm("Are you sure you want to delete this booking?")) return;

        startTransition(async () => {
            const result = await deleteBookingAction(id);
            if (result.error) alert(result.error);
        });
    }


    return (
        <div className="space-y-6">
            {/* Header Stats & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage appointments and schedules ({total} total)
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="btn-primary"
                >
                    + Create Booking
                </button>
            </div>

            {/* Filters */}
            <div className="card flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-4 py-2"
                        defaultValue={currentQ}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-48">
                    <select
                        className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm py-2 px-3"
                        value={currentStatus}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {BOOKING_STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {
                isPending && (
                    <div className="absolute inset-0 bg-white/50 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
                        <div className="animate-pulse text-accent font-medium">Updating...</div>
                    </div>
                )
            }

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border">
                            {initialBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-accent font-bold">
                                                    {booking.first_name[0]}{booking.last_name[0]}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-foreground">{booking.first_name} {booking.last_name}</div>
                                                <div className="text-sm text-gray-500">{booking.email}</div>
                                                <div className="text-xs text-gray-400">{booking.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">{booking.service_type}</div>
                                        <div className="text-xs text-gray-500">{booking.location_name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{booking.bedrooms} bd / {booking.bathrooms} ba / {booking.sqft} sqft</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">{booking.date}</div>
                                        <div className="text-sm text-gray-500">{booking.time}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-foreground">{formatCurrency(booking.price)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={booking.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEdit(booking)} className="text-accent hover:text-blue-700 mr-4 font-medium transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(booking.id)} className="text-danger hover:text-red-700 font-medium transition-colors">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {initialBookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No bookings found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 border-t border-border flex items-center justify-between sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{pageCount}</span>
                            </p>
                        </div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <span className="sr-only">Previous</span>
                                <span>&larr;</span>
                            </button>
                            <button
                                onClick={() => handlePageChange(Math.min(pageCount, page + 1))}
                                disabled={page >= pageCount}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <span className="sr-only">Next</span>
                                <span>&rarr;</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowModal(false)} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-foreground mb-4" id="modal-title">
                                        {editingId ? "Edit Booking" : "Create New Booking"}
                                    </h3>
                                    {error && <div className="mb-4 p-3 bg-red-50 text-danger text-sm rounded-md border border-red-100">{error}</div>}
                                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                                            <input type="text" required value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                            <input type="text" required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                                            <input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Location</label>
                                            <select required value={formData.place_id} onChange={e => setFormData({ ...formData, place_id: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm">
                                                <option value="">Select Location</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Service Type</label>
                                            <input type="text" required value={formData.service_type} onChange={e => setFormData({ ...formData, service_type: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                                            <input type="number" required min="0" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                                            <input type="number" required min="0" value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Sqft</label>
                                            <input type="number" required min="0" value={formData.sqft} onChange={e => setFormData({ ...formData, sqft: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                                            <input type="number" required min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Date</label>
                                            <input type="text" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} placeholder="YYYY-MM-DD" className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Time</label>
                                            <input type="text" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} placeholder="14:00" className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as BookingStatus })} className="mt-1 block w-full border-input rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm">
                                                {BOOKING_STATUSES.map(s => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
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
                )
            }
        </div >
    );
}
