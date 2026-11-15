/**
 * Local JSON Database Proxy Client (/api/db/*)
 * Communicates with the standalone local server.
 */

export interface DbStatus {
  storesCount: number;
  productsCount: number;
  ordersCount: number;
  shipmentsCount: number;
  lastUpdated: string;
  deliverySettings: any;
}

export const apiDb = {
  async getStatus(): Promise<DbStatus> {
    const res = await fetch("/api/db/status");
    if (!res.ok) throw new Error("Failed to fetch DB status");
    return res.json();
  },

  async getCollection<T = any>(collection: "stores" | "products" | "orders" | "shipments", params?: Record<string, string>): Promise<T[]> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`/api/db/${collection}${query}`);
    if (!res.ok) throw new Error(`Failed to fetch ${collection}`);
    return res.json();
  },

  async getItem<T = any>(collection: "stores" | "products" | "orders" | "shipments", id: string): Promise<T> {
    const res = await fetch(`/api/db/${collection}/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Failed to fetch ${collection}/${id}`);
    return res.json();
  },

  async createItem<T = any>(collection: "stores" | "products" | "orders" | "shipments", item: Partial<T>): Promise<T> {
    const res = await fetch(`/api/db/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(`Failed to create item in ${collection}`);
    return res.json();
  },

  async updateItem<T = any>(collection: "stores" | "products" | "orders" | "shipments", id: string, patch: Partial<T>): Promise<T> {
    const res = await fetch(`/api/db/${collection}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Failed to update item in ${collection}/${id}`);
    return res.json();
  },

  async deleteItem(collection: "stores" | "products" | "orders" | "shipments", id: string): Promise<boolean> {
    const res = await fetch(`/api/db/${collection}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.ok;
  },

  async exportDatabase(): Promise<any> {
    const res = await fetch("/api/db/export");
    if (!res.ok) throw new Error("Failed to export database");
    return res.json();
  },

  async importDatabase(data: any): Promise<any> {
    const res = await fetch("/api/db/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to import database");
    return res.json();
  },
};
