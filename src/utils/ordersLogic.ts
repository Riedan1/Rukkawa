import { Order } from "../types";

export type OrderStageTab = "all" | "pending" | "accepted" | "shipped" | "delivered";

export interface OrderStageCounts {
  all: number;
  incoming: number;
  processing: number;
  shipped: number;
  completed: number;
  returns: number;
}

export interface OrderMetricsSummary {
  counts: OrderStageCounts;
  totalRevenue: number;
  avgOrderValue: number;
  deliverySuccessRate: number;
  returnRate: number;
}

export function calculateOrderMetrics(storeOrders: Order[]): OrderMetricsSummary {
  const validOrders = (storeOrders || []).filter(Boolean);
  const all = validOrders.length;
  const incoming = validOrders.filter((o) => o.status === "pending").length;
  const processing = validOrders.filter((o) => o.status === "accepted").length;
  const shipped = validOrders.filter((o) => o.status === "shipped").length;
  const completed = validOrders.filter((o) => o.status === "delivered").length;
  const returns = validOrders.filter((o) => Boolean(o.returnRequested)).length;

  const activeFulfilledCount = processing + shipped + completed;
  const totalRevenue = validOrders
    .filter((o) => o.status === "accepted" || o.status === "shipped" || o.status === "delivered")
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const avgOrderValue = activeFulfilledCount > 0 ? Math.round(totalRevenue / activeFulfilledCount) : 0;
  const deliverySuccessRate = all > 0 ? Math.round((completed / all) * 100) : 100;
  const returnRate = all > 0 ? Math.round((returns / all) * 100) : 0;

  return {
    counts: {
      all,
      incoming,
      processing,
      shipped,
      completed,
      returns,
    },
    totalRevenue,
    avgOrderValue,
    deliverySuccessRate,
    returnRate,
  };
}

export interface OrderFilterCriteria {
  stage: OrderStageTab;
  searchQuery?: string;
  carrierFilter?: string;
  wilayaFilter?: string;
  paymentFilter?: string;
  startDate?: string;
  endDate?: string;
}

export function filterStoreOrders(
  storeOrders: Order[],
  criteria: OrderFilterCriteria,
  matchesCategoryFn?: (order: Order) => boolean
): Order[] {
  const {
    stage,
    searchQuery = "",
    carrierFilter = "all",
    wilayaFilter = "all",
    paymentFilter = "all",
    startDate = "",
    endDate = "",
  } = criteria;

  return (storeOrders || []).filter((o) => {
    if (!o) return false;

    if (stage !== "all" && o.status !== stage) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        Boolean(o.id && o.id.toLowerCase().includes(q)) ||
        Boolean(o.shopper?.name && o.shopper.name.toLowerCase().includes(q)) ||
        Boolean(o.shopper?.phone && o.shopper.phone.includes(q)) ||
        Boolean(o.shopper?.wilaya && o.shopper.wilaya.toLowerCase().includes(q)) ||
        Boolean(o.shopper?.commune && o.shopper.commune.toLowerCase().includes(q)) ||
        Boolean(o.trackingCode && o.trackingCode.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    if (matchesCategoryFn && !matchesCategoryFn(o)) {
      return false;
    }

    if (carrierFilter !== "all") {
      const ordCarrier = o.deliveryCompany || "yalidine";
      if (ordCarrier.toLowerCase() !== carrierFilter.toLowerCase()) return false;
    }

    if (wilayaFilter !== "all") {
      if (
        !o.shopper ||
        (o.shopper.wilaya?.toLowerCase() !== wilayaFilter.toLowerCase() &&
          o.shopper.wilayaCode !== wilayaFilter)
      ) {
        return false;
      }
    }

    if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter) {
      return false;
    }

    if (startDate) {
      const orderTime = new Date(o.date).getTime();
      const startTime = new Date(startDate + "T00:00:00").getTime();
      if (orderTime < startTime) return false;
    }

    if (endDate) {
      const orderTime = new Date(o.date).getTime();
      const endTime = new Date(endDate + "T23:59:59").getTime();
      if (orderTime > endTime) return false;
    }

    return true;
  });
}

export function getNextOrderStage(
  currentStatus: Order["status"]
): { nextStatus: Order["status"]; actionLabel: string; arActionLabel: string } | null {
  switch (currentStatus) {
    case "pending":
      return {
        nextStatus: "accepted",
        actionLabel: "Accept & Process",
        arActionLabel: "قبول وتجهيز",
      };
    case "accepted":
      return {
        nextStatus: "shipped",
        actionLabel: "Dispatch Shipment",
        arActionLabel: "شحن الطلبية",
      };
    case "shipped":
      return {
        nextStatus: "delivered",
        actionLabel: "Mark Completed",
        arActionLabel: "تأكيد التسليم",
      };
    case "delivered":
    default:
      return null;
  }
}
