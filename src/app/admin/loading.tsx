export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="bg-white border-b border-gray-200 h-16 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-32 animate-pulse">
                            <div className="h-4 w-24 bg-gray-100 rounded mb-4"></div>
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80 animate-pulse lg:col-span-1"></div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80 animate-pulse lg:col-span-2"></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-96 animate-pulse"></div>
            </div>
        </div>
    );
}
