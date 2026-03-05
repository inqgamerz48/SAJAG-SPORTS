"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { UploadDropzone } from "@/utils/uploadthing";
import Image from "next/image";

type ColorVariant = {
    colorName: string;
    stockCount: number;
    imageUrl?: string;
};

type Product = {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stockCount: number;
    description: string;
    images: string[];
    colorVariants?: ColorVariant[];
};

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        category: "Racquets",
        price: 0,
        stockCount: 0,
        description: "",
        images: [] as string[],
        colorVariants: [] as ColorVariant[],
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/admin/inventory");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            toast.error("Could not load products");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                sku: product.sku,
                category: product.category,
                price: product.price,
                stockCount: product.stockCount,
                description: product.description || "",
                images: product.images || [],
                colorVariants: product.colorVariants || [],
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                sku: "",
                category: "Racquets",
                price: 0,
                stockCount: 0,
                description: "",
                images: [],
                colorVariants: [],
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingProduct
            ? `/api/admin/inventory/${editingProduct.id}`
            : "/api/admin/inventory";

        const method = editingProduct ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to save product");
            }

            toast.success(editingProduct ? "Product updated" : "Product added");
            setIsModalOpen(false);
            fetchProducts();
        } catch (err: any) {
            toast.error(err.message || "An error occurred while saving");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`/api/admin/inventory/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Product deleted");
            fetchProducts();
        } catch (err) {
            toast.error("An error occurred while deleting");
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </button>
            </div>

            <div className="flex bg-white p-2 rounded-lg border shadow-sm items-center max-w-md">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input
                    type="text"
                    placeholder="Search by name or SKU..."
                    className="w-full px-3 py-1 outline-none text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading inventory...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No products found.</td></tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className={`transition-colors ${product.stockCount < 5 ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            {product.images && product.images.length > 0 ? (
                                                <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-400">No Img</div>
                                            )}
                                            {product.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{product.price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${product.stockCount >= 10 ? 'bg-green-100 text-green-800' : product.stockCount >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-red-600 text-white shadow-sm'}`}>
                                            {product.stockCount} {product.stockCount < 5 ? 'Low Stock!' : 'in stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(product)} className="text-amber-600 hover:text-amber-900 mr-4">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add New Product"}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input required type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                                    <input required type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="Racquets">Racquets</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Apparel">Apparel</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                                    <input required type="number" min="0" step="0.01" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Stock Count</label>
                                    <input required type="number" min="0" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea rows={3} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            {/* Image Uploading via UploadThing */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    {formData.images.map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-md overflow-hidden border">
                                            <Image src={url} alt={`img-${i}`} fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50/50 p-2">
                                    <UploadDropzone
                                        endpoint="productImage"
                                        onClientUploadComplete={(res) => {
                                            const urls = res.map((r) => r.url);
                                            setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
                                            toast.success("Image(s) uploaded successfully!");
                                        }}
                                        onUploadError={(error: Error) => {
                                            toast.error(`ERROR! ${error.message}`);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Color Variants */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Color Variants</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            colorVariants: [...prev.colorVariants, { colorName: "", stockCount: 0 }]
                                        }))}
                                        className="text-sm text-brand-blue hover:text-brand-orange flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Add Variant
                                    </button>
                                </div>

                                {formData.colorVariants.map((variant, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-start bg-slate-50 p-2 rounded-lg border">
                                        <div className="flex-1 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Color Name (e.g. Matte Red)"
                                                    className="w-full border rounded-md px-2 py-1 text-sm focus:ring-amber-500"
                                                    value={variant.colorName}
                                                    onChange={e => {
                                                        const newVariants = [...formData.colorVariants];
                                                        newVariants[idx].colorName = e.target.value;
                                                        setFormData({ ...formData, colorVariants: newVariants });
                                                    }}
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Stock"
                                                    className="w-full border rounded-md px-2 py-1 text-sm focus:ring-amber-500"
                                                    value={variant.stockCount}
                                                    onChange={e => {
                                                        const newVariants = [...formData.colorVariants];
                                                        newVariants[idx].stockCount = parseInt(e.target.value) || 0;
                                                        setFormData({ ...formData, colorVariants: newVariants });
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <select
                                                className="w-full border rounded-md px-2 py-1 text-sm focus:ring-amber-500 text-gray-600 bg-white"
                                                value={variant.imageUrl || ""}
                                                onChange={e => {
                                                    const newVariants = [...formData.colorVariants];
                                                    newVariants[idx].imageUrl = e.target.value || undefined;
                                                    setFormData({ ...formData, colorVariants: newVariants });
                                                }}
                                            >
                                                <option value="">No specific image / Primary image</option>
                                                {formData.images.map((imgUrl, i) => (
                                                    <option key={i} value={imgUrl}>Image {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newVariants = [...formData.colorVariants];
                                                newVariants.splice(idx, 1);
                                                setFormData({ ...formData, colorVariants: newVariants });
                                            }}
                                            className="text-red-500 hover:bg-red-50 p-1 rounded mt-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {formData.colorVariants.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Note: The main product stock count is automatically synced to the sum of all variant stocks!
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">{editingProduct ? "Save Changes" : "Add Product"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
