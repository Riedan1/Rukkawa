import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Users,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Mail,
  UserCheck,
  AlertCircle,
  Key,
  Layers,
  Clock,
  Check,
  X,
  Edit3,
  UserPlus,
  Sliders,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  PhoneCall,
  PhoneOff,
  ArrowRightLeft,
  RotateCcw,
  Activity,
  BarChart3,
  FileText,
  Filter,
  Calendar,
  Package,
  ShoppingBag,
  Percent,
  Film,
  Globe,
  MessageSquare,
  TrendingUp,
  Truck,
  Settings,
  Lock,
  Circle,
  Award,
  RefreshCw,
  CheckSquare,
  Square,
  User,
  Camera,
  Eye,
  Headphones,
  AlertTriangle,
  Play,
  Pause,
} from "lucide-react";
import {
  MerchantStore,
  TeamMember,
  GranularTeamPermissions,
  CustomTeamRole,
  OrderAssignmentConfig,
  OrderAssignmentHistoryEntry,
  TeamActivityLogEntry,
  Order,
} from "../types";

interface MerchantTeamManagementProps {
  darkMode: boolean;
  myStore: MerchantStore;
  setStores: React.Dispatch<React.SetStateAction<MerchantStore[]>>;
  activeMemberId: string | null;
  setActiveMemberId: (id: string | null) => void;
  orders?: Order[];
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
}

export interface PermissionItemDef {
  key: keyof GranularTeamPermissions;
  label: string;
  description: string;
  subGroup?: string;
}

export interface PermissionGroupDef {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  note?: string;
  permissions: PermissionItemDef[];
}

export const PERMISSION_GROUPS: PermissionGroupDef[] = [
  {
    id: "products",
    code: "A",
    title: "Products Management",
    subtitle: "Control catalog viewing, product creation, editing, variants, categories, and stock levels.",
    icon: Package,
    note: "Viewing products does not automatically grant permission to edit or delete products.",
    permissions: [
      { key: "viewProducts", label: "View products", description: "View store product catalog and item specifications" },
      { key: "addProducts", label: "Add new products", description: "Create and publish new products to the store catalog" },
      { key: "editProducts", label: "Edit existing products", description: "Modify titles, descriptions, and pricing of existing items" },
      { key: "deleteProducts", label: "Delete products", description: "Permanently remove products from the store catalog" },
      { key: "manageProductImages", label: "Manage product images", description: "Upload, reorder, or replace product gallery photos" },
      { key: "manageProductVariants", label: "Manage product variants", description: "Configure sizes, colors, and SKU option matrices" },
      { key: "manageProductCategories", label: "Manage product categories", description: "Assign and organize store categories and subcategories" },
      { key: "manageProductStock", label: "Manage product stock", description: "Update inventory quantities and low-stock alert thresholds" },
    ],
  },
  {
    id: "orders",
    code: "B",
    title: "Orders Management",
    subtitle: "Control order visibility, status changes, cancellations, customer details, and order notes.",
    icon: ShoppingBag,
    permissions: [
      { key: "viewOrders", label: "View orders", description: "Access the store orders list and order summaries" },
      { key: "receiveAssignedOrders", label: "Receive assigned orders", description: "Eligible to receive orders in personal work queue" },
      { key: "confirmOrders", label: "Confirm orders", description: "Approve and validate customer orders for fulfillment" },
      { key: "rejectOrders", label: "Reject orders", description: "Decline invalid or unverified customer orders" },
      { key: "editOrderInfo", label: "Edit order information", description: "Modify shipping address, commune, or item quantities on orders" },
      { key: "changeOrderStatus", label: "Change order status", description: "Transition orders between pending, accepted, shipped, and delivered" },
      { key: "cancelOrders", label: "Cancel orders", description: "Cancel active orders and release reserved stock" },
      { key: "assignOrdersToMembers", label: "Assign orders to team members", description: "Manually dispatch orders to specific confirmation agents" },
      { key: "reassignOrders", label: "Reassign orders", description: "Move assigned orders from one employee to another" },
      { key: "viewCustomerInfo", label: "View customer information", description: "See buyer phone numbers, full addresses, and contact links" },
      { key: "manageOrderNotes", label: "Manage order notes", description: "Add and edit internal operational notes on orders" },
    ],
  },
  {
    id: "confirmation",
    code: "C",
    title: "Order Confirmation & Distribution",
    subtitle: "Phone confirmation workflows, unreachable status handling, agent transfers, and queue visibility.",
    icon: PhoneCall,
    permissions: [
      { key: "receiveOrdersForConfirmation", label: "Receive orders for confirmation", description: "Include agent in automatic round-robin and workload distribution" },
      { key: "confirmOrdersByPhone", label: "Confirm orders by phone", description: "Conduct phone verification calls and log call outcomes" },
      { key: "markCustomersUnreachable", label: "Mark customers as unreachable", description: "Flag orders where buyer did not answer phone call attempts" },
      { key: "markOrdersConfirmed", label: "Mark orders as confirmed", description: "Finalize order confirmation after buyer verification" },
      { key: "markOrdersRejected", label: "Mark orders as rejected", description: "Mark order as rejected after buyer cancellation or invalid number" },
      { key: "requestAnotherConfirmationAttempt", label: "Request another confirmation attempt", description: "Schedule a follow-up call retry for unreachable buyers" },
      { key: "transferOrdersToAnotherAgent", label: "Transfer orders to another agent", description: "Hand off an assigned order to an available colleague" },
      { key: "viewPersonalConfirmationPerformance", label: "View personal confirmation performance", description: "View own confirmation rate, speed, and completed call metrics" },
      { key: "viewAssignedOrdersOnly", label: "View only orders assigned to them", description: "Restrict order visibility strictly to orders assigned to this agent" },
    ],
  },
  {
    id: "coupons",
    code: "D",
    title: "Coupons & Discounts",
    subtitle: "Promotional codes, percentage/fixed discounts, and campaign activation controls.",
    icon: Percent,
    permissions: [
      { key: "viewCoupons", label: "View coupons and discounts", description: "View active, scheduled, and expired promotional codes" },
      { key: "createCoupons", label: "Create coupons and discounts", description: "Generate new promotional codes and discount rules" },
      { key: "editCoupons", label: "Edit coupons and discounts", description: "Update discount values, minimum spend, or expiration dates" },
      { key: "deleteCoupons", label: "Delete coupons and discounts", description: "Remove promotional codes from the store" },
      { key: "activateDeactivateCoupons", label: "Activate or deactivate coupons", description: "Pause or resume coupon codes immediately" },
    ],
  },
  {
    id: "stories",
    code: "E",
    title: "Stories & Content Management",
    subtitle: "Storefront story slots, media publishing, editing, deletion, and highlights.",
    icon: Film,
    permissions: [
      { key: "viewStories", label: "View stories", description: "View active, scheduled, and draft store stories" },
      { key: "publishStories", label: "Publish stories", description: "Create and publish new image, video, or text stories" },
      { key: "editStories", label: "Edit stories", description: "Modify captions, product tags, and filters on existing stories" },
      { key: "deleteStories", label: "Delete stories", description: "Remove stories from active storefront slots" },
      { key: "manageStoryHighlights", label: "Manage story highlights", description: "Curate and organize permanent story highlights" },
    ],
  },
  {
    id: "followers",
    code: "F",
    title: "Page & Followers Management",
    subtitle: "Store audience list, follower profiles, moderation, and geographic insights.",
    icon: Globe,
    permissions: [
      { key: "viewFollowers", label: "View followers", description: "Access the store followers list and growth overview" },
      { key: "viewFollowerProfiles", label: "View follower profiles", description: "Inspect detailed shopper and merchant follower profiles" },
      { key: "manageFollowers", label: "Manage followers", description: "Approve pending follow requests, block, or remove followers" },
      { key: "viewAudienceStatistics", label: "View audience statistics", description: "View follower growth trends and acquisition metrics" },
      { key: "accessGeographicAudienceDistribution", label: "Access geographic audience distribution", description: "View follower distribution by country and city" },
    ],
  },
  {
    id: "messages",
    code: "G",
    title: "Messages & Communication",
    subtitle: "Shopper inquiries, direct customer chat, and merchant & platform support assistance.",
    icon: MessageSquare,
    permissions: [
      { key: "viewShopperMessages", label: "View shopper messages", description: "Read incoming messages from shoppers", subGroup: "Shopper Communication" },
      { key: "replyToShopperMessages", label: "Reply to shopper messages", description: "Send responses and product links to shoppers", subGroup: "Shopper Communication" },
      { key: "manageCustomerInquiries", label: "Manage customer inquiries", description: "Organize, tag, and resolve customer support threads", subGroup: "Shopper Communication" },
      { key: "viewMerchantSupportMessages", label: "View merchant support messages", description: "Read incoming questions from merchants and store partners", subGroup: "Merchant & Platform Support" },
      { key: "replyToMerchantQuestions", label: "Reply to merchant questions", description: "Respond directly to merchant questions and requests", subGroup: "Merchant & Platform Support" },
      { key: "handleYumeFeatureQuestions", label: "Handle questions about YUME features", description: "Guide users on YUME tools, stories, coupons, and dashboard modules", subGroup: "Merchant & Platform Support" },
      { key: "assistMerchantsPlatformUsage", label: "Assist merchants with platform usage", description: "Provide onboarding and operational guidance for platform workflows", subGroup: "Merchant & Platform Support" },
      { key: "handleTechnicalOperationalInquiries", label: "Handle technical or operational inquiries", description: "Resolve technical troubleshooting and order/delivery escalations", subGroup: "Merchant & Platform Support" },
    ],
  },
  {
    id: "marketing",
    code: "H",
    title: "Marketing & Analytics",
    subtitle: "Store analytics, ad campaigns, tracking pixels, Growth Studio, and performance reports.",
    icon: TrendingUp,
    permissions: [
      { key: "viewAnalytics", label: "View analytics", description: "Access store traffic, conversion, and revenue dashboards" },
      { key: "manageAdCampaigns", label: "Manage ad campaigns", description: "Create, edit, and pause sponsored store ad campaigns" },
      { key: "manageAdPixels", label: "Manage ad pixels", description: "Configure Meta, TikTok, and Google conversion tracking pixels" },
      { key: "accessGrowthStudio", label: "Access Growth Studio", description: "Use Growth Studio tools to optimize storefront conversion" },
      { key: "viewStorePerformanceReports", label: "View store performance reports", description: "View and export comprehensive store financial and sales reports" },
    ],
  },
  {
    id: "delivery",
    code: "I",
    title: "Delivery Management",
    subtitle: "Courier integrations, shipping rates, delivery status updates, and waybill operations.",
    icon: Truck,
    permissions: [
      { key: "viewDeliveryInfo", label: "View delivery information", description: "View active couriers, regional zones, and shipping tariffs" },
      { key: "manageDeliveryCompanies", label: "Manage delivery companies", description: "Connect, configure, or disable courier partners and API keys" },
      { key: "updateDeliveryStatus", label: "Update delivery status", description: "Update parcel dispatch, in-transit, and delivery confirmation states" },
      { key: "manageShippingInfo", label: "Manage shipping information", description: "Edit regional delivery fees, stop-desk rates, and free shipping rules" },
    ],
  },
  {
    id: "settings",
    code: "J",
    title: "Settings & Team Management",
    subtitle: "Store configuration, team member invitations, role definitions, and security audit logs.",
    icon: Settings,
    permissions: [
      { key: "viewStoreSettings", label: "View store settings", description: "View general store configuration, payment gateways, and policies" },
      { key: "editStoreSettings", label: "Edit store settings", description: "Modify store identity, checkout settings, and notification rules" },
      { key: "addTeamMembers", label: "Add team members", description: "Invite and register new staff members into the store team" },
      { key: "editTeamMembers", label: "Edit team members", description: "Update staff member roles, status, and individual permissions" },
      { key: "removeTeamMembers", label: "Remove team members", description: "Revoke access and remove non-owner staff members" },
      { key: "manageRolesAndPermissions", label: "Manage roles and permissions", description: "Create custom roles and modify default role permission templates" },
      { key: "viewTeamActivityLogs", label: "View team activity logs", description: "Inspect the audit log of actions performed by team members" },
    ],
  },
];

export const ALL_GRANULAR_KEYS: (keyof GranularTeamPermissions)[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

/**
 * Synchronizes the 9 legacy top-level permission flags from the 63 granular switches
 * so existing checks across the platform remain 100% accurate.
 */
export function syncLegacyPermissions(perms: Partial<GranularTeamPermissions>): GranularTeamPermissions {
  const base: GranularTeamPermissions = {
    confirmOrders: false,
    prepareShipments: false,
    deliveryOperations: false,
    manageProducts: false,
    manageDiscounts: false,
    adPixels: false,
    manageAnalytics: false,
    respondReviews: false,
    manageFollowers: false,
    ...perms,
  };

  base.confirmOrders = Boolean(
    base.confirmOrders ||
      base.markOrdersConfirmed ||
      base.confirmOrdersByPhone ||
      base.receiveOrdersForConfirmation ||
      base.changeOrderStatus
  );
  base.prepareShipments = Boolean(
    base.prepareShipments || base.updateDeliveryStatus || base.changeOrderStatus || base.editOrderInfo
  );
  base.deliveryOperations = Boolean(
    base.deliveryOperations || base.manageDeliveryCompanies || base.manageShippingInfo || base.updateDeliveryStatus
  );
  base.manageProducts = Boolean(
    base.manageProducts ||
      base.addProducts ||
      base.editProducts ||
      base.deleteProducts ||
      base.manageProductImages ||
      base.manageProductVariants ||
      base.manageProductCategories ||
      base.manageProductStock
  );
  base.manageDiscounts = Boolean(
    base.manageDiscounts ||
      base.createCoupons ||
      base.editCoupons ||
      base.deleteCoupons ||
      base.activateDeactivateCoupons
  );
  base.adPixels = Boolean(base.adPixels || base.manageAdPixels || base.manageAdCampaigns || base.accessGrowthStudio);
  base.manageAnalytics = Boolean(base.manageAnalytics || base.viewAnalytics || base.viewStorePerformanceReports);
  base.respondReviews = Boolean(
    base.respondReviews || base.replyToShopperMessages || base.manageCustomerInquiries || base.replyToMerchantQuestions
  );
  base.manageFollowers = Boolean(base.manageFollowers || base.viewFollowers || base.viewFollowerProfiles);

  return base;
}

export function createEmptyPermissions(): GranularTeamPermissions {
  const obj: Record<string, boolean> = {};
  ALL_GRANULAR_KEYS.forEach((k) => {
    obj[k] = false;
  });
  return syncLegacyPermissions(obj as Partial<GranularTeamPermissions>);
}

export function createFullPermissions(excludeOwnerOnly = false): GranularTeamPermissions {
  const obj: Record<string, boolean> = {};
  ALL_GRANULAR_KEYS.forEach((k) => {
    obj[k] = true;
  });
  if (excludeOwnerOnly) {
    // View only orders assigned to them is a restriction flag, so default to false when enabling all access
    obj.viewAssignedOrdersOnly = false;
  } else {
    obj.viewAssignedOrdersOnly = false;
  }
  return syncLegacyPermissions(obj as Partial<GranularTeamPermissions>);
}

export const PREDEFINED_ROLES: CustomTeamRole[] = [
  {
    id: "store_admin",
    name: "Store Administrator",
    description: "Complete operational access across products, orders, marketing, delivery, and team management (excluding Owner removal).",
    isPredefined: true,
    permissions: createFullPermissions(true),
  },
  {
    id: "store_manager",
    name: "Store Manager",
    description: "Manages daily store operations including products, orders, order distribution, coupons, stories, delivery, and analytics.",
    isPredefined: true,
    permissions: syncLegacyPermissions({
      ...createFullPermissions(true),
      removeTeamMembers: false,
      manageRolesAndPermissions: false,
      editStoreSettings: false,
    }),
  },
  {
    id: "order_confirmation_agent",
    name: "Order Confirmation Agent",
    description: "Specialized in receiving assigned orders, confirming orders by phone, updating confirmation statuses, and handling call retries.",
    isPredefined: true,
    permissions: syncLegacyPermissions({
      ...createEmptyPermissions(),
      viewProducts: true,
      viewOrders: true,
      receiveAssignedOrders: true,
      confirmOrders: true,
      rejectOrders: true,
      editOrderInfo: true,
      changeOrderStatus: true,
      viewCustomerInfo: true,
      manageOrderNotes: true,
      receiveOrdersForConfirmation: true,
      confirmOrdersByPhone: true,
      markCustomersUnreachable: true,
      markOrdersConfirmed: true,
      markOrdersRejected: true,
      requestAnotherConfirmationAttempt: true,
      transferOrdersToAnotherAgent: true,
      viewPersonalConfirmationPerformance: true,
      viewAssignedOrdersOnly: true,
      viewDeliveryInfo: true,
    }),
  },
  {
    id: "customer_support_agent",
    name: "Customer Support Agent",
    description: "Handles shopper messages, customer inquiries, merchant & platform support questions, and order status assistance.",
    isPredefined: true,
    permissions: syncLegacyPermissions({
      ...createEmptyPermissions(),
      viewProducts: true,
      viewOrders: true,
      viewCustomerInfo: true,
      manageOrderNotes: true,
      viewFollowers: true,
      viewFollowerProfiles: true,
      viewShopperMessages: true,
      replyToShopperMessages: true,
      manageCustomerInquiries: true,
      viewMerchantSupportMessages: true,
      replyToMerchantQuestions: true,
      handleYumeFeatureQuestions: true,
      assistMerchantsPlatformUsage: true,
      handleTechnicalOperationalInquiries: true,
      viewDeliveryInfo: true,
    }),
  },
  {
    id: "product_manager",
    name: "Product Manager",
    description: "Full responsibility over product catalog, images, variants, categories, stock levels, and store stories.",
    isPredefined: true,
    permissions: syncLegacyPermissions({
      ...createEmptyPermissions(),
      viewProducts: true,
      addProducts: true,
      editProducts: true,
      deleteProducts: true,
      manageProductImages: true,
      manageProductVariants: true,
      manageProductCategories: true,
      manageProductStock: true,
      viewStories: true,
      publishStories: true,
      editStories: true,
      deleteStories: true,
      manageStoryHighlights: true,
    }),
  },
  {
    id: "marketing_content_manager",
    name: "Marketing & Content Manager",
    description: "Manages coupons, discounts, stories, followers, audience statistics, ad campaigns, pixels, and Growth Studio.",
    isPredefined: true,
    permissions: syncLegacyPermissions({
      ...createEmptyPermissions(),
      viewProducts: true,
      viewCoupons: true,
      createCoupons: true,
      editCoupons: true,
      deleteCoupons: true,
      activateDeactivateCoupons: true,
      viewStories: true,
      publishStories: true,
      editStories: true,
      deleteStories: true,
      manageStoryHighlights: true,
      viewFollowers: true,
      viewFollowerProfiles: true,
      manageFollowers: true,
      viewAudienceStatistics: true,
      accessGeographicAudienceDistribution: true,
      viewAnalytics: true,
      manageAdCampaigns: true,
      manageAdPixels: true,
      accessGrowthStudio: true,
      viewStorePerformanceReports: true,
    }),
  },
];

export function normalizeMemberPermissions(member: TeamMember, allRoles: CustomTeamRole[]): GranularTeamPermissions {
  const raw = member.permissions || ({} as Partial<GranularTeamPermissions>);
  const hasAnyGranular = ALL_GRANULAR_KEYS.some((k) => typeof raw[k] === "boolean");
  if (hasAnyGranular) {
    const filled: Record<string, boolean> = {};
    ALL_GRANULAR_KEYS.forEach((k) => {
      filled[k] = Boolean(raw[k]);
    });
    return syncLegacyPermissions({ ...raw, ...filled });
  }

  // Upgrade legacy 4-role member seamlessly
  const legacyRoleMap: Record<string, string> = {
    admin: "store_admin",
    manager: "store_manager",
    preparator: "order_confirmation_agent",
    viewer: "customer_support_agent",
  };
  const mappedId = legacyRoleMap[member.role] || member.role;
  const matchedRole = allRoles.find((r) => r.id === mappedId);
  if (matchedRole) {
    return syncLegacyPermissions({ ...matchedRole.permissions, ...raw });
  }
  return syncLegacyPermissions({
    ...createEmptyPermissions(),
    viewProducts: true,
    addProducts: Boolean(raw.manageProducts),
    editProducts: Boolean(raw.manageProducts),
    manageProductImages: Boolean(raw.manageProducts),
    manageProductVariants: Boolean(raw.manageProducts),
    manageProductStock: Boolean(raw.manageProducts),
    viewOrders: Boolean(raw.confirmOrders || raw.prepareShipments),
    receiveAssignedOrders: Boolean(raw.confirmOrders),
    confirmOrders: Boolean(raw.confirmOrders),
    receiveOrdersForConfirmation: Boolean(raw.confirmOrders),
    confirmOrdersByPhone: Boolean(raw.confirmOrders),
    markOrdersConfirmed: Boolean(raw.confirmOrders),
    viewCoupons: Boolean(raw.manageDiscounts),
    createCoupons: Boolean(raw.manageDiscounts),
    editCoupons: Boolean(raw.manageDiscounts),
    viewFollowers: Boolean(raw.manageFollowers),
    manageFollowers: Boolean(raw.manageFollowers),
    viewAnalytics: Boolean(raw.manageAnalytics),
    manageAdPixels: Boolean(raw.adPixels),
    manageAdCampaigns: Boolean(raw.adPixels),
    viewDeliveryInfo: Boolean(raw.deliveryOperations || raw.prepareShipments),
    updateDeliveryStatus: Boolean(raw.deliveryOperations || raw.prepareShipments),
    ...raw,
  });
}

export function getRoleDisplayName(roleId: string, allRoles: CustomTeamRole[], roleName?: string): string {
  if (roleName) return roleName;
  const found = allRoles.find((r) => r.id === roleId);
  if (found) return found.name;
  const legacyNames: Record<string, string> = {
    admin: "Store Administrator",
    manager: "Store Manager",
    preparator: "Order Confirmation Agent",
    viewer: "Customer Support Agent",
  };
  return legacyNames[roleId] || roleId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export const MerchantTeamManagement: React.FC<MerchantTeamManagementProps> = ({
  darkMode,
  myStore,
  setStores,
  activeMemberId,
  setActiveMemberId,
  orders = [],
  setOrders,
}) => {
  // Internal sub-navigation inside the unified Team & Role Access Control center
  const [activeSubSection, setActiveSubSection] = useState<
    "members" | "roles" | "order_assignment" | "availability" | "performance_logs"
  >("members");

  // All available roles (Predefined + Custom)
  const customRoles = useMemo(() => myStore.customRoles || [], [myStore.customRoles]);
  const allRoles = useMemo(() => [...PREDEFINED_ROLES, ...customRoles], [customRoles]);

  // Normalized team members
  const teamMembers = useMemo(() => {
    return (myStore.teamMembers || []).map((m) => ({
      ...m,
      status: m.status === "inactive" ? ("inactive" as const) : ("active" as const),
      onlineStatus: m.onlineStatus || (m.id === activeMemberId ? "online" : "online"),
      permissions: normalizeMemberPermissions(m, allRoles),
    }));
  }, [myStore.teamMembers, allRoles, activeMemberId]);

  const activeOperator = useMemo(
    () => (activeMemberId ? teamMembers.find((m) => m.id === activeMemberId) || null : null),
    [activeMemberId, teamMembers]
  );

  // Order Assignment Configuration
  const assignmentConfig: OrderAssignmentConfig = useMemo(
    () => ({
      method: myStore.orderAssignmentConfig?.method || "round_robin",
      maxPendingOrdersPerEmployee: myStore.orderAssignmentConfig?.maxPendingOrdersPerEmployee ?? 10,
      assignmentTimeoutMinutes: myStore.orderAssignmentConfig?.assignmentTimeoutMinutes ?? 30,
      autoReassignOnTimeout: myStore.orderAssignmentConfig?.autoReassignOnTimeout ?? true,
      expiredOrderRouting: myStore.orderAssignmentConfig?.expiredOrderRouting || "another_agent",
      maxReassignmentAttempts: myStore.orderAssignmentConfig?.maxReassignmentAttempts ?? 3,
      returnUnprocessedToOwner: myStore.orderAssignmentConfig?.returnUnprocessedToOwner ?? true,
      lastRoundRobinIndex: myStore.orderAssignmentConfig?.lastRoundRobinIndex ?? 0,
    }),
    [myStore.orderAssignmentConfig]
  );

  // Store orders belonging to this store
  const storeOrders = useMemo(
    () => orders.filter((o) => o.storeId === myStore.id),
    [orders, myStore.id]
  );

  // Search & filter state for Team Members list
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Add / Edit Team Member Modal / Drawer state
  const [isMemberEditorOpen, setIsMemberEditorOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFormName, setMemberFormName] = useState("");
  const [memberFormEmail, setMemberFormEmail] = useState("");
  const [memberFormAvatar, setMemberFormAvatar] = useState("");
  const [memberFormRole, setMemberFormRole] = useState<string>("order_confirmation_agent");
  const [memberFormStatus, setMemberFormStatus] = useState<"active" | "inactive">("active");
  const [memberFormOnlineStatus, setMemberFormOnlineStatus] = useState<"online" | "offline">("online");
  const [memberFormPermissions, setMemberFormPermissions] = useState<GranularTeamPermissions>(() =>
    PREDEFINED_ROLES[2].permissions
  );
  const [expandedPermissionGroups, setExpandedPermissionGroups] = useState<Record<string, boolean>>({
    products: true,
    orders: true,
    confirmation: false,
    coupons: false,
    stories: false,
    followers: false,
    messages: false,
    marketing: false,
    delivery: false,
    settings: false,
  });

  // Custom Role Creator / Editor state
  const [selectedRoleForPreview, setSelectedRoleForPreview] = useState<string>("store_admin");
  const [isCreatingCustomRole, setIsCreatingCustomRole] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDescription, setCustomRoleDescription] = useState("");
  const [customRolePermissions, setCustomRolePermissions] = useState<GranularTeamPermissions>(() =>
    createEmptyPermissions()
  );

  // Working Time & Activity Period Filter
  const [workingTimePeriod, setWorkingTimePeriod] = useState<"today" | "7d" | "30d" | "all">("today");
  const [selectedEmployeeProfileId, setSelectedEmployeeProfileId] = useState<string | null>(null);

  // Activity Log Filters
  const [logEmployeeFilter, setLogEmployeeFilter] = useState<string>("all");
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>("all");
  const [logDateFilter, setLogDateFilter] = useState<string>("all");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");

  // Order Assignment UI State
  const [orderQueueFilter, setOrderQueueFilter] = useState<string>("all");
  const [transferModalOrder, setTransferModalOrder] = useState<Order | null>(null);
  const [transferTargetMemberId, setTransferTargetMemberId] = useState<string>("");
  const [transferNote, setTransferNote] = useState<string>("");

  // Toast feedback state
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const showFeedback = useCallback((type: "success" | "warning" | "error", message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Helper to update myStore inside setStores and persist to localStorage
  const updateStoreData = useCallback(
    (updater: (store: MerchantStore) => MerchantStore) => {
      setStores((prevStores) =>
        prevStores.map((st) => {
          if (st.id !== myStore.id) return st;
          const updated = updater(st);
          try {
            if (updated.teamMembers) {
              localStorage.setItem(`yume_store_team_${st.id}`, JSON.stringify(updated.teamMembers));
            }
            if (updated.customRoles) {
              localStorage.setItem(`yume_store_custom_roles_${st.id}`, JSON.stringify(updated.customRoles));
            }
            if (updated.orderAssignmentConfig) {
              localStorage.setItem(`yume_store_order_assign_cfg_${st.id}`, JSON.stringify(updated.orderAssignmentConfig));
            }
            if (updated.teamActivityLogs) {
              localStorage.setItem(`yume_store_team_logs_${st.id}`, JSON.stringify(updated.teamActivityLogs));
            }
          } catch {
            // ignore storage errors
          }
          return updated;
        })
      );
    },
    [myStore.id, setStores]
  );

  // Hydrate persisted custom roles, assignment config, and logs on mount if present
  useEffect(() => {
    try {
      const savedRoles = localStorage.getItem(`yume_store_custom_roles_${myStore.id}`);
      const savedCfg = localStorage.getItem(`yume_store_order_assign_cfg_${myStore.id}`);
      const savedLogs = localStorage.getItem(`yume_store_team_logs_${myStore.id}`);
      if (savedRoles || savedCfg || savedLogs) {
        setStores((prev) =>
          prev.map((st) => {
            if (st.id !== myStore.id) return st;
            return {
              ...st,
              customRoles: st.customRoles ?? (savedRoles ? JSON.parse(savedRoles) : undefined),
              orderAssignmentConfig:
                st.orderAssignmentConfig ?? (savedCfg ? JSON.parse(savedCfg) : undefined),
              teamActivityLogs: st.teamActivityLogs ?? (savedLogs ? JSON.parse(savedLogs) : undefined),
            };
          })
        );
      }
    } catch {
      // ignore parse errors
    }
  }, [myStore.id, setStores]);

  // Append an authentic entry to the store's Team Activity Log
  const recordActivityLog = useCallback(
    (
      action: string,
      category: TeamActivityLogEntry["category"],
      details?: string,
      overrideMember?: { id: string; name: string; role: string }
    ) => {
      const actorId = overrideMember?.id || activeOperator?.id || "owner";
      const actorName =
        overrideMember?.name || activeOperator?.name || `${myStore.merchantFullName || myStore.name} (Store Owner)`;
      const actorRole =
        overrideMember?.role ||
        (activeOperator ? getRoleDisplayName(activeOperator.role, allRoles, activeOperator.roleName) : "Store Owner");

      const newEntry: TeamActivityLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        memberId: actorId,
        memberName: actorName,
        memberRole: actorRole,
        action,
        category,
        details,
        timestamp: new Date().toISOString(),
      };

      updateStoreData((st) => ({
        ...st,
        teamActivityLogs: [newEntry, ...(st.teamActivityLogs || [])].slice(0, 250),
      }));
    },
    [activeOperator, allRoles, myStore.merchantFullName, myStore.name, updateStoreData]
  );

  // ============================================================================
  // REAL ACTIVE WORKING TIME TRACKER (Distinguishes active work from idle time)
  // ============================================================================
  const lastUserInteractionRef = useRef<number>(Date.now());
  const [isSessionActivelyWorking, setIsSessionActivelyWorking] = useState<boolean>(true);
  const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds without mouse/keyboard/click pauses active timer

  useEffect(() => {
    const handleActivity = () => {
      lastUserInteractionRef.current = Date.now();
      if (!isSessionActivelyWorking) {
        setIsSessionActivelyWorking(true);
      }
    };
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [isSessionActivelyWorking]);

  // Increment active working time every 5 seconds ONLY if the active member is online AND not idle
  useEffect(() => {
    if (!activeMemberId) return;
    const interval = setInterval(() => {
      const idleElapsed = Date.now() - lastUserInteractionRef.current;
      const activelyWorking = idleElapsed < IDLE_TIMEOUT_MS;
      setIsSessionActivelyWorking(activelyWorking);

      if (!activelyWorking) return;

      const nowIso = new Date().toISOString();
      updateStoreData((st) => ({
        ...st,
        teamMembers: (st.teamMembers || []).map((m) => {
          if (m.id !== activeMemberId || m.status === "inactive" || m.onlineStatus === "offline") {
            return m;
          }
          const prevWt = m.workingTime || {
            firstLoginAt: nowIso,
            lastActivityAt: nowIso,
            activeSecondsToday: 0,
            activeSecondsWeek: 0,
            activeSecondsMonth: 0,
            totalActiveSeconds: 0,
            completedTasksCount: 0,
          };
          return {
            ...m,
            onlineStatus: "online",
            workingTime: {
              ...prevWt,
              firstLoginAt: prevWt.firstLoginAt || nowIso,
              lastActivityAt: nowIso,
              activeSecondsToday: (prevWt.activeSecondsToday || 0) + 5,
              activeSecondsWeek: (prevWt.activeSecondsWeek || 0) + 5,
              activeSecondsMonth: (prevWt.activeSecondsMonth || 0) + 5,
              totalActiveSeconds: (prevWt.totalActiveSeconds || 0) + 5,
            },
          };
        }),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [activeMemberId, IDLE_TIMEOUT_MS, updateStoreData]);

  // Internal system team capacity check (kept internal without exposing subscription plan names or cards)
  const canAddMoreTeamMembers = useCallback((): boolean => {
    const maxInternalCapacity = 50;
    return teamMembers.length < maxInternalCapacity;
  }, [teamMembers.length]);

  // Check if current operator has permission to manage team / roles
  const canCurrentActorManageTeam = useMemo(() => {
    if (!activeOperator) return true; // Store Owner always has full control
    return Boolean(
      activeOperator.permissions.manageRolesAndPermissions ||
        activeOperator.permissions.addTeamMembers ||
        activeOperator.permissions.editTeamMembers
    );
  }, [activeOperator]);

  // ============================================================================
  // ADD / EDIT TEAM MEMBER HANDLERS
  // ============================================================================
  const openAddMemberModal = () => {
    if (!canCurrentActorManageTeam) {
      showFeedback("error", "Only the Store Owner or authorized administrators can add team members.");
      return;
    }
    if (!canAddMoreTeamMembers()) {
      showFeedback("warning", "Maximum team member capacity reached.");
      return;
    }
    setEditingMemberId(null);
    setMemberFormName("");
    setMemberFormEmail("");
    setMemberFormAvatar("");
    const defaultRole = PREDEFINED_ROLES[2]; // Order Confirmation Agent
    setMemberFormRole(defaultRole.id);
    setMemberFormStatus("active");
    setMemberFormOnlineStatus("online");
    setMemberFormPermissions({ ...defaultRole.permissions });
    setIsMemberEditorOpen(true);
  };

  const openEditMemberModal = (member: TeamMember) => {
    if (activeOperator && !activeOperator.permissions.editTeamMembers && !activeOperator.permissions.manageRolesAndPermissions) {
      showFeedback("error", "You do not have permission to edit team members.");
      return;
    }
    setEditingMemberId(member.id);
    setMemberFormName(member.name);
    setMemberFormEmail(member.email);
    setMemberFormAvatar(member.avatar || "");
    setMemberFormRole(member.role);
    setMemberFormStatus(member.status === "inactive" ? "inactive" : "active");
    setMemberFormOnlineStatus(member.onlineStatus || "online");
    // Preserve the member's existing custom permissions without resetting them!
    setMemberFormPermissions(normalizeMemberPermissions(member, allRoles));
    setIsMemberEditorOpen(true);
  };

  const handleRoleChangeInForm = (newRoleId: string) => {
    setMemberFormRole(newRoleId);
    // Only auto-apply role defaults when creating a new member, or if user explicitly clicks "Reset to Role Defaults"
    if (!editingMemberId) {
      const roleObj = allRoles.find((r) => r.id === newRoleId);
      if (roleObj) {
        setMemberFormPermissions(syncLegacyPermissions({ ...roleObj.permissions }));
      }
    }
  };

  const handleResetToRoleDefaults = () => {
    const roleObj = allRoles.find((r) => r.id === memberFormRole);
    if (roleObj) {
      setMemberFormPermissions(syncLegacyPermissions({ ...roleObj.permissions }));
      showFeedback("success", `Permissions reset to ${roleObj.name} defaults.`);
    }
  };

  const handleEnableAllPermissions = () => {
    setMemberFormPermissions(createFullPermissions(true));
  };

  const handleDisableAllPermissions = () => {
    setMemberFormPermissions(createEmptyPermissions());
  };

  const toggleFormPermission = (key: keyof GranularTeamPermissions) => {
    // Security Rule: A non-owner team member cannot grant themselves higher team-management permissions
    if (
      activeOperator &&
      editingMemberId === activeOperator.id &&
      (key === "manageRolesAndPermissions" || key === "removeTeamMembers" || key === "addTeamMembers")
    ) {
      showFeedback("error", "Team members cannot grant themselves higher administrative privileges.");
      return;
    }

    setMemberFormPermissions((prev) => {
      const nextVal = !prev[key];
      const next: Partial<GranularTeamPermissions> = { ...prev, [key]: nextVal };

      // Note: Viewing products does not automatically grant edit/delete,
      // but if an edit/add/delete product permission is turned ON, ensure viewProducts is ON so they can see the section.
      if (
        nextVal &&
        (key === "addProducts" ||
          key === "editProducts" ||
          key === "deleteProducts" ||
          key === "manageProductImages" ||
          key === "manageProductVariants" ||
          key === "manageProductCategories" ||
          key === "manageProductStock")
      ) {
        next.viewProducts = true;
      }

      return syncLegacyPermissions(next);
    });
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = memberFormName.trim();
    const trimmedEmail = memberFormEmail.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      showFeedback("error", "Please enter both the team member's full name and email address.");
      return;
    }

    const roleObj = allRoles.find((r) => r.id === memberFormRole);
    const resolvedRoleName = roleObj ? roleObj.name : getRoleDisplayName(memberFormRole, allRoles);
    const syncedPerms = syncLegacyPermissions(memberFormPermissions);
    const nowIso = new Date().toISOString();

    if (editingMemberId) {
      updateStoreData((st) => ({
        ...st,
        teamMembers: (st.teamMembers || []).map((m) =>
          m.id === editingMemberId
            ? {
                ...m,
                name: trimmedName,
                email: trimmedEmail,
                avatar: memberFormAvatar.trim() || undefined,
                role: memberFormRole,
                roleName: resolvedRoleName,
                status: memberFormStatus,
                onlineStatus: memberFormStatus === "inactive" ? "offline" : memberFormOnlineStatus,
                permissions: syncedPerms,
              }
            : m
        ),
      }));
      recordActivityLog(
        `Updated team member profile & permissions for ${trimmedName}`,
        "team_settings",
        `Role: ${resolvedRoleName} • Status: ${memberFormStatus}`
      );
      showFeedback("success", `${trimmedName}'s role and permissions have been saved.`);
    } else {
      if (teamMembers.some((m) => m.email.toLowerCase() === trimmedEmail)) {
        showFeedback("error", "A team member with this email address already exists in your store.");
        return;
      }
      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        avatar: memberFormAvatar.trim() || undefined,
        role: memberFormRole,
        roleName: resolvedRoleName,
        permissions: syncedPerms,
        status: memberFormStatus,
        onlineStatus: memberFormStatus === "inactive" ? "offline" : memberFormOnlineStatus,
        joinedDate: new Date().toISOString().split("T")[0],
        workingTime: {
          firstLoginAt: nowIso,
          lastActivityAt: nowIso,
          activeSecondsToday: 0,
          activeSecondsWeek: 0,
          activeSecondsMonth: 0,
          totalActiveSeconds: 0,
          completedTasksCount: 0,
        },
        performanceStats: {
          ordersConfirmed: 0,
          ordersRejected: 0,
          unreachableCount: 0,
          ordersTransferred: 0,
          totalConfirmationTimeSeconds: 0,
          shopperMessagesAnswered: 0,
          customerInquiriesHandled: 0,
          merchantSupportInquiriesHandled: 0,
        },
      };
      updateStoreData((st) => ({
        ...st,
        teamMembers: [...(st.teamMembers || []), newMember],
      }));
      recordActivityLog(
        `Added new team member ${trimmedName}`,
        "team_settings",
        `Assigned role: ${resolvedRoleName} (${trimmedEmail})`
      );
      showFeedback("success", `${trimmedName} has been added to your store team.`);
    }

    setIsMemberEditorOpen(false);
    setEditingMemberId(null);
  };

  const handleToggleMemberAccountStatus = (member: TeamMember) => {
    if (activeOperator && !activeOperator.permissions.editTeamMembers) {
      showFeedback("error", "You do not have permission to change account status.");
      return;
    }
    const nextStatus = member.status === "inactive" ? "active" : "inactive";
    updateStoreData((st) => ({
      ...st,
      teamMembers: (st.teamMembers || []).map((m) =>
        m.id === member.id
          ? {
              ...m,
              status: nextStatus,
              onlineStatus: nextStatus === "inactive" ? "offline" : m.onlineStatus || "online",
            }
          : m
      ),
    }));
    if (nextStatus === "inactive" && activeMemberId === member.id) {
      setActiveMemberId(null);
    }
    recordActivityLog(
      `Changed ${member.name}'s account status to ${nextStatus.toUpperCase()}`,
      "team_settings"
    );
    showFeedback("success", `${member.name} is now ${nextStatus}.`);
  };

  const handleToggleMemberOnlineStatus = (member: TeamMember) => {
    if (member.status === "inactive") {
      showFeedback("warning", "Activate the member's account first before setting them online.");
      return;
    }
    const nextOnline = member.onlineStatus === "offline" ? "online" : "offline";
    const nowIso = new Date().toISOString();
    updateStoreData((st) => ({
      ...st,
      teamMembers: (st.teamMembers || []).map((m) =>
        m.id === member.id
          ? {
              ...m,
              onlineStatus: nextOnline,
              workingTime: {
                ...(m.workingTime || {
                  firstLoginAt: nowIso,
                  activeSecondsToday: 0,
                  activeSecondsWeek: 0,
                  activeSecondsMonth: 0,
                  totalActiveSeconds: 0,
                  completedTasksCount: 0,
                }),
                firstLoginAt: m.workingTime?.firstLoginAt || nowIso,
                lastActivityAt: nowIso,
              },
            }
          : m
      ),
    }));
    recordActivityLog(
      `Updated ${member.name} availability to ${nextOnline.toUpperCase()}`,
      "team_settings"
    );
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (activeOperator && !activeOperator.permissions.removeTeamMembers) {
      showFeedback("error", "You do not have permission to remove team members.");
      return;
    }
    if (activeOperator && activeOperator.id === member.id) {
      showFeedback("error", "You cannot remove your own active operator account.");
      return;
    }
    if (activeMemberId === member.id) {
      setActiveMemberId(null);
    }
    updateStoreData((st) => ({
      ...st,
      teamMembers: (st.teamMembers || []).filter((m) => m.id !== member.id),
    }));
    recordActivityLog(`Removed team member ${member.name} (${member.email})`, "team_settings");
    showFeedback("success", `${member.name} has been removed from the team.`);
  };

  // ============================================================================
  // CUSTOM ROLE CREATION & MANAGEMENT
  // ============================================================================
  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName.trim()) {
      showFeedback("error", "Please enter a name for the custom role.");
      return;
    }
    const roleId = `custom_${customRoleName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString().slice(-4)}`;

    const newRole: CustomTeamRole = {
      id: roleId,
      name: customRoleName.trim(),
      description: customRoleDescription.trim() || "Custom store role with tailored operational permissions.",
      isPredefined: false,
      permissions: syncLegacyPermissions(customRolePermissions),
      createdAt: new Date().toISOString(),
    };

    updateStoreData((st) => ({
      ...st,
      customRoles: [...(st.customRoles || []), newRole],
    }));
    recordActivityLog(`Created custom role "${newRole.name}"`, "team_settings");
    setSelectedRoleForPreview(newRole.id);
    setIsCreatingCustomRole(false);
    setCustomRoleName("");
    setCustomRoleDescription("");
    showFeedback("success", `Custom role "${newRole.name}" created.`);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    const target = customRoles.find((r) => r.id === roleId);
    if (!target) return;
    updateStoreData((st) => ({
      ...st,
      customRoles: (st.customRoles || []).filter((r) => r.id !== roleId),
    }));
    if (selectedRoleForPreview === roleId) {
      setSelectedRoleForPreview("store_admin");
    }
    recordActivityLog(`Deleted custom role "${target.name}"`, "team_settings");
    showFeedback("success", `Custom role "${target.name}" removed.`);
  };

  // ============================================================================
  // SMART ORDER ASSIGNMENT & DISTRIBUTION ENGINE
  // ============================================================================
  const updateAssignmentConfig = (partial: Partial<OrderAssignmentConfig>) => {
    const nextCfg: OrderAssignmentConfig = { ...assignmentConfig, ...partial };
    updateStoreData((st) => ({
      ...st,
      orderAssignmentConfig: nextCfg,
    }));
    recordActivityLog(
      "Updated Order Assignment & Distribution rules",
      "confirmation",
      `Method: ${nextCfg.method} • Max Pending: ${nextCfg.maxPendingOrdersPerEmployee} • Timeout: ${nextCfg.assignmentTimeoutMinutes}m`
    );
  };

  // Pending orders per member helper
  const pendingOrdersByMember = useMemo(() => {
    const map: Record<string, number> = {};
    teamMembers.forEach((m) => {
      map[m.id] = 0;
    });
    storeOrders.forEach((o) => {
      const isPending =
        o.status === "pending" &&
        (!o.confirmationStatus ||
          o.confirmationStatus === "pending_confirmation" ||
          o.confirmationStatus === "unreachable");
      if (isPending && o.assignedToMemberId && map[o.assignedToMemberId] !== undefined) {
        map[o.assignedToMemberId] += 1;
      }
    });
    return map;
  }, [storeOrders, teamMembers]);

  // Eligible confirmation agents (Active + Online + has receiveOrdersForConfirmation or receiveAssignedOrders + under maxPendingOrdersPerEmployee)
  const eligibleConfirmationAgents = useMemo(() => {
    return teamMembers.filter(
      (m) =>
        m.status === "active" &&
        m.onlineStatus !== "offline" &&
        (m.permissions.receiveOrdersForConfirmation ||
          m.permissions.receiveAssignedOrders ||
          m.permissions.confirmOrders) &&
        (pendingOrdersByMember[m.id] || 0) < assignmentConfig.maxPendingOrdersPerEmployee
    );
  }, [teamMembers, pendingOrdersByMember, assignmentConfig.maxPendingOrdersPerEmployee]);

  // Assign a single order to a specific member
  const assignOrderToMember = useCallback(
    (
      orderId: string,
      member: TeamMember,
      method: OrderAssignmentHistoryEntry["method"] = "manual",
      note?: string
    ) => {
      if (!setOrders) return;
      const nowIso = new Date().toISOString();
      const actorName = activeOperator ? activeOperator.name : "Store Owner";

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const historyEntry: OrderAssignmentHistoryEntry = {
            id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            orderId: o.id,
            assignedToMemberId: member.id,
            assignedToMemberName: member.name,
            assignedBy: actorName,
            assignedAt: nowIso,
            method,
            status: "pending",
            note,
          };
          return {
            ...o,
            teamMemberAssigned: member.name,
            assignedToMemberId: member.id,
            assignedToMemberName: member.name,
            assignedAt: nowIso,
            confirmationStatus: "pending_confirmation",
            reassignmentCount: method === "reassigned" ? (o.reassignmentCount || 0) + 1 : o.reassignmentCount || 0,
            assignmentHistory: [historyEntry, ...(o.assignmentHistory || [])],
          };
        })
      );

      recordActivityLog(
        `Assigned Order #${orderId} to ${member.name}`,
        "confirmation",
        `Method: ${method.replace(/_/g, " ").toUpperCase()}${note ? ` • ${note}` : ""}`
      );
      showFeedback("success", `Order #${orderId} assigned to ${member.name}.`);
    },
    [activeOperator, recordActivityLog, setOrders, showFeedback]
  );

  // Auto-distribute unassigned pending orders according to selected method (Round-Robin or Workload-Based)
  const handleAutoDistributePendingOrders = () => {
    if (!setOrders) return;
    const unassignedOrders = storeOrders.filter(
      (o) =>
        o.status === "pending" &&
        !o.assignedToMemberId &&
        (!o.confirmationStatus || o.confirmationStatus === "unassigned")
    );
    if (unassignedOrders.length === 0) {
      showFeedback("warning", "All pending store orders are already assigned.");
      return;
    }
    if (eligibleConfirmationAgents.length === 0) {
      showFeedback(
        "error",
        "No available online confirmation agents with capacity found. Ensure at least one agent is Active, Online, and under their pending order limit."
      );
      return;
    }

    const method = assignmentConfig.method === "manual" ? "round_robin" : assignmentConfig.method;
    let rrIndex = assignmentConfig.lastRoundRobinIndex || 0;
    const localPendingCounts = { ...pendingOrdersByMember };
    const nowIso = new Date().toISOString();
    const actorName = activeOperator ? activeOperator.name : "Store Owner";
    let assignedCount = 0;

    const assignmentsMap: Record<string, { member: TeamMember; methodUsed: "round_robin" | "workload" }> = {};

    for (const ord of unassignedOrders) {
      const availableNow = eligibleConfirmationAgents.filter(
        (ag) => (localPendingCounts[ag.id] || 0) < assignmentConfig.maxPendingOrdersPerEmployee
      );
      if (availableNow.length === 0) break;

      let chosenAgent: TeamMember;
      if (method === "workload") {
        chosenAgent = [...availableNow].sort(
          (a, b) => (localPendingCounts[a.id] || 0) - (localPendingCounts[b.id] || 0)
        )[0];
      } else {
        chosenAgent = availableNow[rrIndex % availableNow.length];
        rrIndex += 1;
      }

      assignmentsMap[ord.id] = { member: chosenAgent, methodUsed: method };
      localPendingCounts[chosenAgent.id] = (localPendingCounts[chosenAgent.id] || 0) + 1;
      assignedCount += 1;
    }

    if (assignedCount === 0) {
      showFeedback("warning", "All online agents have reached their maximum pending order limit.");
      return;
    }

    setOrders((prev) =>
      prev.map((o) => {
        const match = assignmentsMap[o.id];
        if (!match) return o;
        const entry: OrderAssignmentHistoryEntry = {
          id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          orderId: o.id,
          assignedToMemberId: match.member.id,
          assignedToMemberName: match.member.name,
          assignedBy: actorName,
          assignedAt: nowIso,
          method: match.methodUsed,
          status: "pending",
          note: `Auto-dispatched via ${match.methodUsed === "workload" ? "Workload-Based" : "Round-Robin"} distribution`,
        };
        return {
          ...o,
          teamMemberAssigned: match.member.name,
          assignedToMemberId: match.member.id,
          assignedToMemberName: match.member.name,
          assignedAt: nowIso,
          confirmationStatus: "pending_confirmation",
          assignmentHistory: [entry, ...(o.assignmentHistory || [])],
        };
      })
    );

    updateAssignmentConfig({ lastRoundRobinIndex: rrIndex });
    recordActivityLog(
      `Auto-distributed ${assignedCount} order(s) across ${eligibleConfirmationAgents.length} available agent(s)`,
      "confirmation",
      `Distribution Mode: ${method === "workload" ? "Workload-Based" : "Automatic Round-Robin"}`
    );
    showFeedback("success", `Successfully distributed ${assignedCount} order(s) to available agents.`);
  };

  // Process an order confirmation action (Confirm by Phone, Reject, Mark Unreachable, Request Retry, or Return to Owner)
  const handleOrderConfirmationAction = (
    order: Order,
    outcome: "confirmed" | "rejected" | "unreachable" | "retry" | "owner_review"
  ) => {
    if (!setOrders) return;
    const nowIso = new Date().toISOString();
    const assignedMemberId = order.assignedToMemberId || activeOperator?.id;
    const assignedMember = teamMembers.find((m) => m.id === assignedMemberId) || activeOperator;
    const actorName = assignedMember?.name || "Store Owner";

    // Calculate confirmation duration in seconds if assignedAt exists
    const assignedTimeMs = order.assignedAt ? new Date(order.assignedAt).getTime() : Date.now() - 180000;
    const confirmationDurationSec = Math.max(30, Math.round((Date.now() - assignedTimeMs) / 1000));

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        const nextConfirmationStatus: Order["confirmationStatus"] =
          outcome === "confirmed"
            ? "confirmed"
            : outcome === "rejected"
            ? "rejected"
            : outcome === "unreachable"
            ? "unreachable"
            : outcome === "owner_review"
            ? "owner_review"
            : "pending_confirmation";

        const nextOrderStatus: Order["status"] =
          outcome === "confirmed" ? "accepted" : o.status;

        const historyEntry: OrderAssignmentHistoryEntry = {
          id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          orderId: o.id,
          assignedToMemberId: assignedMember?.id || "owner",
          assignedToMemberName: actorName,
          assignedBy: actorName,
          assignedAt: nowIso,
          method: outcome === "owner_review" ? "owner_fallback" : "manual",
          status:
            outcome === "confirmed"
              ? "confirmed"
              : outcome === "rejected"
              ? "rejected"
              : outcome === "unreachable"
              ? "unreachable"
              : outcome === "owner_review"
              ? "owner_review"
              : "pending",
          note:
            outcome === "confirmed"
              ? "Confirmed by phone with customer"
              : outcome === "rejected"
              ? "Order rejected during confirmation"
              : outcome === "unreachable"
              ? "Customer unreachable by phone"
              : outcome === "retry"
              ? "Requested another confirmation attempt"
              : "Returned to Store Owner for manual review",
          resolvedAt: outcome === "confirmed" || outcome === "rejected" ? nowIso : undefined,
        };

        return {
          ...o,
          status: nextOrderStatus,
          verified: outcome === "confirmed" ? true : o.verified,
          confirmationStatus: nextConfirmationStatus,
          confirmedAt: outcome === "confirmed" ? nowIso : o.confirmedAt,
          assignmentHistory: [historyEntry, ...(o.assignmentHistory || [])],
        };
      })
    );

    // Update employee performance stats and completed tasks count
    if (assignedMember) {
      updateStoreData((st) => ({
        ...st,
        teamMembers: (st.teamMembers || []).map((m) => {
          if (m.id !== assignedMember.id) return m;
          const prevPerf = m.performanceStats || {
            ordersConfirmed: 0,
            ordersRejected: 0,
            unreachableCount: 0,
            ordersTransferred: 0,
            totalConfirmationTimeSeconds: 0,
            shopperMessagesAnswered: 0,
            customerInquiriesHandled: 0,
            merchantSupportInquiriesHandled: 0,
          };
          const prevWt = m.workingTime || {
            firstLoginAt: nowIso,
            lastActivityAt: nowIso,
            activeSecondsToday: 0,
            activeSecondsWeek: 0,
            activeSecondsMonth: 0,
            totalActiveSeconds: 0,
            completedTasksCount: 0,
          };
          return {
            ...m,
            workingTime: {
              ...prevWt,
              lastActivityAt: nowIso,
              completedTasksCount:
                outcome === "confirmed" || outcome === "rejected"
                  ? (prevWt.completedTasksCount || 0) + 1
                  : prevWt.completedTasksCount || 0,
            },
            performanceStats: {
              ...prevPerf,
              ordersConfirmed:
                outcome === "confirmed" ? (prevPerf.ordersConfirmed || 0) + 1 : prevPerf.ordersConfirmed || 0,
              ordersRejected:
                outcome === "rejected" ? (prevPerf.ordersRejected || 0) + 1 : prevPerf.ordersRejected || 0,
              unreachableCount:
                outcome === "unreachable" ? (prevPerf.unreachableCount || 0) + 1 : prevPerf.unreachableCount || 0,
              totalConfirmationTimeSeconds:
                outcome === "confirmed"
                  ? (prevPerf.totalConfirmationTimeSeconds || 0) + confirmationDurationSec
                  : prevPerf.totalConfirmationTimeSeconds || 0,
            },
          };
        }),
      }));
    }

    const actionLabels: Record<typeof outcome, string> = {
      confirmed: `Order #${order.id} confirmed by phone`,
      rejected: `Order #${order.id} marked as rejected`,
      unreachable: `Customer for Order #${order.id} marked as unreachable`,
      retry: `Scheduled another confirmation attempt for Order #${order.id}`,
      owner_review: `Returned Order #${order.id} to Store Owner for manual review`,
    };
    recordActivityLog(
      actionLabels[outcome],
      "confirmation",
      `Customer: ${order.shopper.name} (${order.shopper.wilaya})`,
      assignedMember ? { id: assignedMember.id, name: assignedMember.name, role: assignedMember.role } : undefined
    );
    showFeedback("success", actionLabels[outcome]);
  };

  // Transfer an order from one agent to another
  const handleConfirmOrderTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalOrder || !transferTargetMemberId || !setOrders) return;
    const targetAgent = teamMembers.find((m) => m.id === transferTargetMemberId);
    if (!targetAgent) return;

    const prevAgentId = transferModalOrder.assignedToMemberId;
    const prevAgent = teamMembers.find((m) => m.id === prevAgentId);
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== transferModalOrder.id) return o;
        const entry: OrderAssignmentHistoryEntry = {
          id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          orderId: o.id,
          assignedToMemberId: targetAgent.id,
          assignedToMemberName: targetAgent.name,
          assignedBy: prevAgent?.name || activeOperator?.name || "Store Owner",
          assignedAt: nowIso,
          method: "transferred",
          status: "transferred",
          note: transferNote.trim() || `Transferred from ${prevAgent?.name || "previous queue"} to ${targetAgent.name}`,
        };
        return {
          ...o,
          teamMemberAssigned: targetAgent.name,
          assignedToMemberId: targetAgent.id,
          assignedToMemberName: targetAgent.name,
          assignedAt: nowIso,
          confirmationStatus: "pending_confirmation",
          reassignmentCount: (o.reassignmentCount || 0) + 1,
          assignmentHistory: [entry, ...(o.assignmentHistory || [])],
        };
      })
    );

    if (prevAgent) {
      updateStoreData((st) => ({
        ...st,
        teamMembers: (st.teamMembers || []).map((m) =>
          m.id === prevAgent.id
            ? {
                ...m,
                performanceStats: {
                  ...(m.performanceStats || {
                    ordersConfirmed: 0,
                    ordersRejected: 0,
                    unreachableCount: 0,
                    ordersTransferred: 0,
                    totalConfirmationTimeSeconds: 0,
                    shopperMessagesAnswered: 0,
                    customerInquiriesHandled: 0,
                    merchantSupportInquiriesHandled: 0,
                  }),
                  ordersTransferred: (m.performanceStats?.ordersTransferred || 0) + 1,
                },
              }
            : m
        ),
      }));
    }

    recordActivityLog(
      `Transferred Order #${transferModalOrder.id} to ${targetAgent.name}`,
      "confirmation",
      transferNote.trim() || undefined
    );
    showFeedback("success", `Order #${transferModalOrder.id} transferred to ${targetAgent.name}.`);
    setTransferModalOrder(null);
    setTransferTargetMemberId("");
    setTransferNote("");
  };

  // Check and process timed-out pending orders according to assignment rules
  const handleProcessExpiredAssignments = () => {
    if (!setOrders) return;
    const timeoutMs = (assignmentConfig.assignmentTimeoutMinutes || 30) * 60 * 1000;
    const nowMs = Date.now();
    const expiredOrders = storeOrders.filter((o) => {
      if (o.status !== "pending" || !o.assignedToMemberId || !o.assignedAt) return false;
      if (o.confirmationStatus === "confirmed" || o.confirmationStatus === "rejected") return false;
      const elapsed = nowMs - new Date(o.assignedAt).getTime();
      return elapsed >= timeoutMs;
    });

    if (expiredOrders.length === 0) {
      showFeedback("success", "No assigned orders have exceeded the confirmation timeout window.");
      return;
    }

    let reassignedCount = 0;
    let ownerEscalatedCount = 0;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) => {
        const isExpired = expiredOrders.some((ex) => ex.id === o.id);
        if (!isExpired) return o;
        const attempts = (o.reassignmentCount || 0) + 1;

        if (
          attempts > assignmentConfig.maxReassignmentAttempts &&
          assignmentConfig.returnUnprocessedToOwner
        ) {
          ownerEscalatedCount += 1;
          const entry: OrderAssignmentHistoryEntry = {
            id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            orderId: o.id,
            assignedToMemberId: "owner",
            assignedToMemberName: "Store Owner (Manual Review)",
            assignedBy: "Assignment Rule Engine",
            assignedAt: nowIso,
            method: "owner_fallback",
            status: "owner_review",
            note: `Exceeded max reassignment attempts (${assignmentConfig.maxReassignmentAttempts}). Returned to Store Owner.`,
          };
          return {
            ...o,
            assignedToMemberId: undefined,
            assignedToMemberName: "Store Owner",
            teamMemberAssigned: "Store Owner",
            confirmationStatus: "owner_review",
            reassignmentCount: attempts,
            assignmentHistory: [entry, ...(o.assignmentHistory || [])],
          };
        }

        // Route either back to original agent or another available agent
        let nextAgent: TeamMember | undefined;
        if (assignmentConfig.expiredOrderRouting === "original_agent") {
          nextAgent = teamMembers.find((m) => m.id === o.assignedToMemberId);
        } else {
          const otherAgents = eligibleConfirmationAgents.filter((m) => m.id !== o.assignedToMemberId);
          nextAgent = otherAgents[0] || eligibleConfirmationAgents[0];
        }

        if (!nextAgent) {
          ownerEscalatedCount += 1;
          return {
            ...o,
            confirmationStatus: "owner_review",
          };
        }

        reassignedCount += 1;
        const entry: OrderAssignmentHistoryEntry = {
          id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          orderId: o.id,
          assignedToMemberId: nextAgent.id,
          assignedToMemberName: nextAgent.name,
          assignedBy: "Timeout Reassignment Rule",
          assignedAt: nowIso,
          method: "reassigned",
          status: "pending",
          note: `Reassigned after ${assignmentConfig.assignmentTimeoutMinutes}m timeout (Attempt #${attempts})`,
        };
        return {
          ...o,
          teamMemberAssigned: nextAgent.name,
          assignedToMemberId: nextAgent.id,
          assignedToMemberName: nextAgent.name,
          assignedAt: nowIso,
          confirmationStatus: "pending_confirmation",
          reassignmentCount: attempts,
          assignmentHistory: [entry, ...(o.assignmentHistory || [])],
        };
      })
    );

    recordActivityLog(
      `Processed ${expiredOrders.length} timed-out order assignment(s)`,
      "confirmation",
      `Reassigned: ${reassignedCount} • Escalated to Store Owner: ${ownerEscalatedCount}`
    );
    showFeedback(
      "success",
      `Processed timeout rules: ${reassignedCount} reassigned, ${ownerEscalatedCount} returned to Store Owner.`
    );
  };

  // Log communication/support action helper (so support agents can log real shopper/merchant support resolutions)
  const handleRecordSupportResolution = (
    member: TeamMember,
    supportType: "shopper_message" | "customer_inquiry" | "merchant_support"
  ) => {
    const nowIso = new Date().toISOString();
    updateStoreData((st) => ({
      ...st,
      teamMembers: (st.teamMembers || []).map((m) => {
        if (m.id !== member.id) return m;
        const prevPerf = m.performanceStats || {
          ordersConfirmed: 0,
          ordersRejected: 0,
          unreachableCount: 0,
          ordersTransferred: 0,
          totalConfirmationTimeSeconds: 0,
          shopperMessagesAnswered: 0,
          customerInquiriesHandled: 0,
          merchantSupportInquiriesHandled: 0,
        };
        const prevWt = m.workingTime || {
          firstLoginAt: nowIso,
          lastActivityAt: nowIso,
          activeSecondsToday: 0,
          activeSecondsWeek: 0,
          activeSecondsMonth: 0,
          totalActiveSeconds: 0,
          completedTasksCount: 0,
        };
        return {
          ...m,
          workingTime: {
            ...prevWt,
            lastActivityAt: nowIso,
            completedTasksCount: (prevWt.completedTasksCount || 0) + 1,
          },
          performanceStats: {
            ...prevPerf,
            shopperMessagesAnswered:
              supportType === "shopper_message"
                ? (prevPerf.shopperMessagesAnswered || 0) + 1
                : prevPerf.shopperMessagesAnswered || 0,
            customerInquiriesHandled:
              supportType === "customer_inquiry"
                ? (prevPerf.customerInquiriesHandled || 0) + 1
                : prevPerf.customerInquiriesHandled || 0,
            merchantSupportInquiriesHandled:
              supportType === "merchant_support"
                ? (prevPerf.merchantSupportInquiriesHandled || 0) + 1
                : prevPerf.merchantSupportInquiriesHandled || 0,
          },
        };
      }),
    }));

    const labels = {
      shopper_message: "Customer message answered",
      customer_inquiry: "Shopper order/product inquiry resolved",
      merchant_support: "Merchant & YUME platform support inquiry resolved",
    };
    recordActivityLog(
      labels[supportType],
      supportType === "merchant_support" ? "merchant_support" : "messages",
      `Handled by ${member.name}`,
      { id: member.id, name: member.name, role: member.role }
    );
    showFeedback("success", `${labels[supportType]} recorded for ${member.name}.`);
  };

  // Filtered team members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (memberStatusFilter !== "all" && m.status !== memberStatusFilter) return false;
      if (memberRoleFilter !== "all" && m.role !== memberRoleFilter) return false;
      if (memberSearch.trim()) {
        const q = memberSearch.toLowerCase();
        const roleLabel = getRoleDisplayName(m.role, allRoles, m.roleName).toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          roleLabel.includes(q)
        );
      }
      return true;
    });
  }, [teamMembers, memberStatusFilter, memberRoleFilter, memberSearch, allRoles]);

  // Visible orders in the Order Assignment table (respects viewAssignedOrdersOnly when an operator session is active)
  const visibleAssignmentOrders = useMemo(() => {
    let list = storeOrders;
    if (activeOperator && activeOperator.permissions.viewAssignedOrdersOnly) {
      list = list.filter((o) => o.assignedToMemberId === activeOperator.id);
    }
    if (orderQueueFilter === "unassigned") {
      list = list.filter((o) => !o.assignedToMemberId && o.confirmationStatus !== "owner_review");
    } else if (orderQueueFilter === "pending_confirmation") {
      list = list.filter((o) => o.confirmationStatus === "pending_confirmation" || (o.assignedToMemberId && o.status === "pending"));
    } else if (orderQueueFilter === "confirmed") {
      list = list.filter((o) => o.confirmationStatus === "confirmed" || o.verified);
    } else if (orderQueueFilter === "unreachable") {
      list = list.filter((o) => o.confirmationStatus === "unreachable");
    } else if (orderQueueFilter === "rejected") {
      list = list.filter((o) => o.confirmationStatus === "rejected");
    } else if (orderQueueFilter === "owner_review") {
      list = list.filter((o) => o.confirmationStatus === "owner_review");
    }
    return list;
  }, [storeOrders, activeOperator, orderQueueFilter]);

  // All assignment history entries flattened across store orders
  const flattenedAssignmentHistory = useMemo(() => {
    const entries: OrderAssignmentHistoryEntry[] = [];
    storeOrders.forEach((o) => {
      if (o.assignmentHistory && o.assignmentHistory.length > 0) {
        entries.push(...o.assignmentHistory);
      } else if (o.assignedToMemberId || o.teamMemberAssigned) {
        entries.push({
          id: `hist-${o.id}`,
          orderId: o.id,
          assignedToMemberId: o.assignedToMemberId || "assigned",
          assignedToMemberName: o.assignedToMemberName || o.teamMemberAssigned || "Team Member",
          assignedBy: "Store System",
          assignedAt: o.assignedAt || o.date,
          method: "manual",
          status:
            o.confirmationStatus === "confirmed" || o.verified
              ? "confirmed"
              : o.confirmationStatus === "rejected"
              ? "rejected"
              : o.confirmationStatus === "unreachable"
              ? "unreachable"
              : "pending",
        });
      }
    });
    return entries.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }, [storeOrders]);

  // Filtered Activity Logs
  const filteredActivityLogs = useMemo(() => {
    const rawLogs = myStore.teamActivityLogs || [];
    const nowMs = Date.now();
    return rawLogs.filter((entry) => {
      if (logEmployeeFilter !== "all" && entry.memberId !== logEmployeeFilter) return false;
      if (logCategoryFilter !== "all" && entry.category !== logCategoryFilter) return false;
      if (logDateFilter !== "all") {
        const entryMs = new Date(entry.timestamp).getTime();
        const diffDays = (nowMs - entryMs) / (1000 * 60 * 60 * 24);
        if (logDateFilter === "today" && diffDays > 1) return false;
        if (logDateFilter === "7d" && diffDays > 7) return false;
        if (logDateFilter === "30d" && diffDays > 30) return false;
      }
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        return (
          entry.action.toLowerCase().includes(q) ||
          entry.memberName.toLowerCase().includes(q) ||
          (entry.details || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [myStore.teamActivityLogs, logEmployeeFilter, logCategoryFilter, logDateFilter, logSearchQuery]);

  // Computed per-employee metrics from real store orders, activity logs, and active working time
  const employeeMetricsMap = useMemo(() => {
    const map: Record<
      string,
      {
        assignedOrdersCount: number;
        pendingOrdersCount: number;
        overduePendingCount: number;
        confirmedCount: number;
        rejectedCount: number;
        unreachableCount: number;
        transferredCount: number;
        avgConfirmationSeconds: number;
        messagesAnswered: number;
        customerInquiries: number;
        merchantSupportInquiries: number;
        activeSecondsForPeriod: number;
        completedTasks: number;
      }
    > = {};

    const timeoutMs = (assignmentConfig.assignmentTimeoutMinutes || 30) * 60 * 1000;
    const nowMs = Date.now();

    teamMembers.forEach((m) => {
      const memberOrders = storeOrders.filter(
        (o) => o.assignedToMemberId === m.id || o.teamMemberAssigned === m.name
      );
      const pendingOrders = memberOrders.filter(
        (o) =>
          o.status === "pending" &&
          o.confirmationStatus !== "confirmed" &&
          o.confirmationStatus !== "rejected"
      );
      const overdueOrders = pendingOrders.filter((o) => {
        if (!o.assignedAt) return false;
        return nowMs - new Date(o.assignedAt).getTime() >= timeoutMs;
      });
      const confirmedFromOrders = memberOrders.filter(
        (o) => o.confirmationStatus === "confirmed" || o.verified || o.status === "accepted" || o.status === "shipped" || o.status === "delivered"
      ).length;
      const rejectedFromOrders = memberOrders.filter((o) => o.confirmationStatus === "rejected").length;
      const unreachableFromOrders = memberOrders.filter((o) => o.confirmationStatus === "unreachable").length;

      const perf = m.performanceStats;
      const confirmedCount = Math.max(perf?.ordersConfirmed || 0, confirmedFromOrders);
      const rejectedCount = Math.max(perf?.ordersRejected || 0, rejectedFromOrders);
      const unreachableCount = Math.max(perf?.unreachableCount || 0, unreachableFromOrders);
      const transferredCount = perf?.ordersTransferred || 0;
      const totalConfirmSec = perf?.totalConfirmationTimeSeconds || 0;
      const avgConfirmationSeconds =
        confirmedCount > 0 && totalConfirmSec > 0 ? Math.round(totalConfirmSec / confirmedCount) : 0;

      const wt = m.workingTime;
      const activeSecondsForPeriod =
        workingTimePeriod === "today"
          ? wt?.activeSecondsToday || 0
          : workingTimePeriod === "7d"
          ? wt?.activeSecondsWeek || wt?.activeSecondsToday || 0
          : workingTimePeriod === "30d"
          ? wt?.activeSecondsMonth || wt?.totalActiveSeconds || 0
          : wt?.totalActiveSeconds || 0;

      const completedTasks = Math.max(
        wt?.completedTasksCount || 0,
        confirmedCount +
          rejectedCount +
          (perf?.shopperMessagesAnswered || 0) +
          (perf?.customerInquiriesHandled || 0) +
          (perf?.merchantSupportInquiriesHandled || 0)
      );

      map[m.id] = {
        assignedOrdersCount: memberOrders.length,
        pendingOrdersCount: pendingOrders.length,
        overduePendingCount: overdueOrders.length,
        confirmedCount,
        rejectedCount,
        unreachableCount,
        transferredCount,
        avgConfirmationSeconds,
        messagesAnswered: perf?.shopperMessagesAnswered || 0,
        customerInquiries: perf?.customerInquiriesHandled || 0,
        merchantSupportInquiries: perf?.merchantSupportInquiriesHandled || 0,
        activeSecondsForPeriod,
        completedTasks,
      };
    });

    return map;
  }, [teamMembers, storeOrders, assignmentConfig.assignmentTimeoutMinutes, workingTimePeriod]);

  const selectedProfileMember = useMemo(() => {
    if (selectedEmployeeProfileId) {
      return teamMembers.find((m) => m.id === selectedEmployeeProfileId) || teamMembers[0] || null;
    }
    return teamMembers[0] || null;
  }, [selectedEmployeeProfileId, teamMembers]);

  // Design tokens matching Add Product reference
  const cardCls = `rounded-[24px] border transition-all duration-300 shadow-sm ${
    darkMode ? "bg-[#141d2f] border-slate-800/80 text-white" : "bg-white border-slate-200/80 text-slate-900"
  }`;
  const subCardCls = `rounded-2xl border transition-all ${
    darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/70 border-slate-200/80"
  }`;
  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
    darkMode
      ? "bg-slate-900 border-slate-700/80 text-white placeholder-slate-500 focus:border-[#2563EB]"
      : "bg-slate-50/50 border-slate-200/90 text-slate-900 placeholder-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/10"
  }`;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* =====================================================================
          PRIMARY UNIFIED SECTION: TEAM & ROLE ACCESS CONTROL
          (Starts directly here — no separate top-level cards or plan limits)
         ===================================================================== */}
      <div className={`${cardCls} p-6 sm:p-8`}>
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-2 h-8 rounded-full bg-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-[#2563EB]" />
                  Team &amp; Role Access Control
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  {teamMembers.length + 1} Team Account{teamMembers.length === 0 ? "" : "s"}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${
                    darkMode
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {teamMembers.filter((m) => m.status === "active" && m.onlineStatus !== "offline").length + 1} Online
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Centralized team management, custom role assignment, granular permission switches, smart order distribution, and real working-time tracking.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openAddMemberModal}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Team Member
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackBanner && (
          <div
            className={`mt-5 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold ${
              feedbackBanner.type === "success"
                ? darkMode
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
                : feedbackBanner.type === "warning"
                ? darkMode
                  ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
                  : "bg-amber-50 border-amber-200 text-amber-800"
                : darkMode
                ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackBanner.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Operator Session Switcher Bar */}
        <div
          className={`mt-5 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            activeOperator
              ? darkMode
                ? "bg-blue-950/25 border-blue-800/50"
                : "bg-blue-50/70 border-blue-200"
              : darkMode
              ? "bg-slate-900/50 border-slate-800"
              : "bg-slate-50/80 border-slate-200/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeOperator
                  ? "bg-[#2563EB] text-white"
                  : darkMode
                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                  : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
              }`}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Active Workspace Session:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    activeOperator
                      ? "bg-[#2563EB] text-white"
                      : darkMode
                      ? "bg-slate-800 text-emerald-400 border border-slate-700"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {activeOperator
                    ? `${activeOperator.name} • ${getRoleDisplayName(
                        activeOperator.role,
                        allRoles,
                        activeOperator.roleName
                      )}`
                    : "Store Owner (Full Control)"}
                </span>
                {activeOperator && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      isSessionActivelyWorking
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {isSessionActivelyWorking ? "Active Work Timer Running" : "Idle (Timer Paused)"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Switch active operator view to verify permissions in real time or track employee working time. Store Owner always retains full control.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveMemberId(null)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                !activeMemberId
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : darkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Store Owner
            </button>
            {teamMembers
              .filter((m) => m.status === "active")
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    lastUserInteractionRef.current = Date.now();
                    setActiveMemberId(m.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeMemberId === m.id
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : darkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      m.onlineStatus === "offline" ? "bg-slate-400" : "bg-emerald-400"
                    }`}
                  />
                  {m.name.split(" ")[0]}
                </button>
              ))}
          </div>
        </div>

        {/* Unified Section Navigation Tabs */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200/80 dark:border-slate-800 pb-3">
          {[
            {
              id: "members" as const,
              label: "Team Members",
              badge: teamMembers.length + 1,
              icon: Users,
            },
            {
              id: "roles" as const,
              label: "Roles & Permissions",
              badge: allRoles.length,
              icon: Shield,
            },
            {
              id: "order_assignment" as const,
              label: "Order Assignment & Distribution",
              badge: storeOrders.filter((o) => o.status === "pending").length,
              icon: PhoneCall,
            },
            {
              id: "availability" as const,
              label: "Team Availability & Working Time",
              badge: `${teamMembers.filter((m) => m.status === "active" && m.onlineStatus !== "offline").length} Active`,
              icon: Clock,
            },
            {
              id: "performance_logs" as const,
              label: "Team Performance & Activity Log",
              badge: (myStore.teamActivityLogs || []).length,
              icon: BarChart3,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubSection(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : darkMode
                    ? "bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===================================================================
            TAB 1: TEAM MEMBERS DIRECTORY & ACCESS CONTROL
           =================================================================== */}
        {activeSubSection === "members" && (
          <div className="mt-6 space-y-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search team member by name, email, or assigned role..."
                  className={`${inputCls} pl-10`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  className={`${inputCls} w-auto min-w-[180px]`}
                >
                  <option value="all">All Assigned Roles</option>
                  {allRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <div
                  className={`inline-flex p-1 rounded-xl border ${
                    darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  {(["all", "active", "inactive"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMemberStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                        memberStatusFilter === st
                          ? darkMode
                            ? "bg-slate-800 text-white shadow-2xs"
                            : "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Store Owner Protected Row (Always retains full control) */}
            <div
              className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                darkMode
                  ? "bg-slate-900/90 border-blue-500/30"
                  : "bg-gradient-to-r from-blue-50/50 via-white to-slate-50/60 border-blue-200/80"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  {myStore.logo ? (
                    <img
                      src={myStore.logo}
                      alt={myStore.merchantFullName || myStore.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-blue-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white font-black text-sm flex items-center justify-center">
                      OW
                    </div>
                  )}
                  <span
                    className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute -bottom-0.5 -right-0.5"
                    title="Online"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {myStore.merchantFullName || myStore.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#2563EB] text-white">
                      Store Owner (Admin Store)
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active • Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {myStore.contact?.email || "owner@store.yume"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                  Protected Owner Account • Full Access to All 10 Permission Groups
                </div>
              </div>
            </div>

            {/* Team Members List */}
            {filteredMembers.length === 0 ? (
              <div className={`${subCardCls} p-10 text-center`}>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#2563EB] flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {teamMembers.length === 0
                    ? "No Team Members Added Yet"
                    : "No Team Members Match Your Filter"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  {teamMembers.length === 0
                    ? "Add order confirmation agents, customer support specialists, product managers, or custom roles to distribute store operations."
                    : "Try clearing your search query or changing the role/status filter above."}
                </p>
                {teamMembers.length === 0 && (
                  <button
                    type="button"
                    onClick={openAddMemberModal}
                    className="mt-4 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add First Team Member
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredMembers.map((member) => {
                  const roleLabel = getRoleDisplayName(member.role, allRoles, member.roleName);
                  const metrics = employeeMetricsMap[member.id];
                  const enabledPermissionsCount = ALL_GRANULAR_KEYS.filter(
                    (k) => Boolean(member.permissions[k])
                  ).length;
                  const isOnline = member.status === "active" && member.onlineStatus !== "offline";

                  return (
                    <div
                      key={member.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${
                        activeMemberId === member.id
                          ? darkMode
                            ? "bg-blue-950/20 border-blue-500/60"
                            : "bg-blue-50/40 border-blue-300"
                          : darkMode
                          ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                          : "bg-white border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      {/* Left: Avatar + Identity + Role + Status Badges */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="relative shrink-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center border ${
                                member.status === "inactive"
                                  ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500 border-slate-300 dark:border-slate-700"
                                  : "bg-blue-600/10 text-[#2563EB] dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/20"
                              }`}
                            >
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 absolute -bottom-0.5 -right-0.5 ${
                              isOnline ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                            title={isOnline ? "Online" : "Offline"}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {member.name}
                            </h4>
                            {/* Assigned Role Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${
                                darkMode
                                  ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                                  : "bg-blue-50 border-blue-200 text-blue-700"
                              }`}
                            >
                              {roleLabel}
                            </span>

                            {/* Account Status (Active / Inactive) */}
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                member.status === "inactive"
                                  ? darkMode
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                  : darkMode
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                              }`}
                            >
                              {member.status === "inactive" ? "Inactive Account" : "Active Account"}
                            </span>

                            {/* Online / Offline Status */}
                            <button
                              type="button"
                              onClick={() => handleToggleMemberOnlineStatus(member)}
                              title="Click to toggle Online / Offline status"
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                                isOnline
                                  ? darkMode
                                    ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                                    : "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                                  : darkMode
                                  ? "bg-slate-800 border-slate-700 text-slate-400"
                                  : "bg-slate-100 border-slate-200 text-slate-600"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOnline ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              {isOnline ? "Online" : "Offline"}
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {member.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Key className="w-3.5 h-3.5 text-[#2563EB]" />
                              {enabledPermissionsCount} / {ALL_GRANULAR_KEYS.length} permissions enabled
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" />
                              Active Today: {formatDuration(member.workingTime?.activeSecondsToday || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Operational Summary + Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between xl:justify-end gap-3 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          <span
                            className={`px-2.5 py-1 rounded-xl border ${
                              darkMode
                                ? "bg-slate-800/90 border-slate-700 text-slate-300"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            Pending Orders: <strong className="text-[#2563EB]">{metrics?.pendingOrdersCount || 0}</strong>
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-xl border ${
                              darkMode
                                ? "bg-slate-800/90 border-slate-700 text-slate-300"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            Confirmed: <strong className="text-emerald-500">{metrics?.confirmedCount || 0}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditMemberModal(member)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              darkMode
                                ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                                : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
                            Permissions &amp; Role
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleMemberAccountStatus(member)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              member.status === "inactive"
                                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                                : darkMode
                                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                                : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            {member.status === "inactive" ? "Activate" : "Deactivate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            title="Remove team member"
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              darkMode
                                ? "bg-rose-950/30 border-rose-800/50 text-rose-400 hover:bg-rose-900/50"
                                : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 2: ROLES & PERMISSIONS (Predefined + Custom Roles + 10 Groups)
           =================================================================== */}
        {activeSubSection === "roles" && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Predefined &amp; Custom Role Templates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select any role below to inspect its 10-group permission matrix, or create a custom role tailored to your store workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCustomRole((prev) => !prev);
                  setCustomRolePermissions(createEmptyPermissions());
                }}
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 self-start cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isCreatingCustomRole ? "Cancel Custom Role" : "Create Custom Role"}
              </button>
            </div>

            {/* Custom Role Builder Drawer */}
            {isCreatingCustomRole && (
              <form
                onSubmit={handleCreateCustomRole}
                className={`${subCardCls} p-5 space-y-5 border-2 border-[#2563EB]/40`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Create New Custom Role
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomRolePermissions(createFullPermissions(true))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-[#2563EB] hover:bg-blue-500/20 cursor-pointer"
                    >
                      Enable All
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomRolePermissions(createEmptyPermissions())}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-300 hover:bg-slate-500/20 cursor-pointer"
                    >
                      Disable All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Custom Role Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customRoleName}
                      onChange={(e) => setCustomRoleName(e.target.value)}
                      placeholder="e.g., Night Shift Confirmation Lead, Warehouse Dispatcher..."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Role Responsibilities Description
                    </label>
                    <input
                      type="text"
                      value={customRoleDescription}
                      onChange={(e) => setCustomRoleDescription(e.target.value)}
                      placeholder="Describe what members with this role are responsible for..."
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Permission Selector for Custom Role */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    const enabledInGroup = group.permissions.filter(
                      (p) => customRolePermissions[p.key]
                    ).length;
                    return (
                      <div
                        key={group.id}
                        className={`p-4 rounded-xl border ${
                          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GroupIcon className="w-4 h-4 text-[#2563EB]" />
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {group.code}. {group.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-[#2563EB]">
                              {enabledInGroup}/{group.permissions.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...customRolePermissions };
                                group.permissions.forEach((p) => {
                                  updated[p.key] = true;
                                });
                                setCustomRolePermissions(syncLegacyPermissions(updated));
                              }}
                              className="text-[10px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                            >
                              All On
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...customRolePermissions };
                                group.permissions.forEach((p) => {
                                  updated[p.key] = false;
                                });
                                setCustomRolePermissions(syncLegacyPermissions(updated));
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:underline cursor-pointer"
                            >
                              All Off
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.permissions.map((perm) => {
                            const isChecked = Boolean(customRolePermissions[perm.key]);
                            return (
                              <button
                                key={perm.key}
                                type="button"
                                onClick={() =>
                                  setCustomRolePermissions((prev) =>
                                    syncLegacyPermissions({ ...prev, [perm.key]: !prev[perm.key] })
                                  )
                                }
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  isChecked
                                    ? darkMode
                                      ? "bg-blue-950/40 border-blue-600/60 text-white"
                                      : "bg-blue-50/80 border-blue-300 text-slate-900"
                                    : darkMode
                                    ? "bg-slate-950/40 border-slate-800 text-slate-400"
                                    : "bg-slate-50 border-slate-200/70 text-slate-600"
                                }`}
                              >
                                <span className="text-[11px] font-bold leading-tight">{perm.label}</span>
                                <div
                                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                                    isChecked ? "bg-[#2563EB] justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                                  }`}
                                >
                                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-2xs" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustomRole(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer"
                  >
                    Save Custom Role
                  </button>
                </div>
              </form>
            )}

            {/* Predefined + Custom Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allRoles.map((role) => {
                const isSelected = selectedRoleForPreview === role.id;
                const enabledCount = ALL_GRANULAR_KEYS.filter((k) => Boolean(role.permissions[k])).length;
                const assignedMembersCount = teamMembers.filter((m) => m.role === role.id).length;

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRoleForPreview(role.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? darkMode
                          ? "bg-blue-950/30 border-[#2563EB] ring-2 ring-blue-500/20"
                          : "bg-blue-50/50 border-[#2563EB] ring-2 ring-blue-500/15"
                        : darkMode
                        ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${isSelected ? "text-[#2563EB]" : "text-slate-400"}`} />
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {role.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              role.isPredefined
                                ? darkMode
                                  ? "bg-slate-800 text-slate-300"
                                  : "bg-slate-100 text-slate-600"
                                : "bg-purple-500/15 text-purple-500"
                            }`}
                          >
                            {role.isPredefined ? "Predefined" : "Custom"}
                          </span>
                          {!role.isPredefined && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomRole(role.id);
                              }}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10"
                              title="Delete custom role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold">
                      <span className="text-[#2563EB]">
                        {enabledCount} / {ALL_GRANULAR_KEYS.length} switches ON
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {assignedMembersCount} member{assignedMembersCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Role 10-Group Permission Matrix Breakdown */}
            {(() => {
              const role = allRoles.find((r) => r.id === selectedRoleForPreview) || allRoles[0];
              if (!role) return null;
              return (
                <div className={`${subCardCls} p-5 space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#2563EB]" />
                        Permission Blueprint: {role.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Organized into 10 operational groups. Assign this role to any team member or customize individual switches per employee.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        openAddMemberModal();
                        handleRoleChangeInForm(role.id);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Assign Role to New Member
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {PERMISSION_GROUPS.map((group) => {
                      const GroupIcon = group.icon;
                      const enabledCount = group.permissions.filter((p) => role.permissions[p.key]).length;
                      return (
                        <div
                          key={group.id}
                          className={`p-4 rounded-xl border ${
                            darkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <GroupIcon className="w-4 h-4 text-[#2563EB]" />
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {group.code}. {group.title}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                enabledCount > 0
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {enabledCount}/{group.permissions.length} Enabled
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {group.permissions.map((p) => {
                              const on = Boolean(role.permissions[p.key]);
                              return (
                                <span
                                  key={p.key}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                                    on
                                      ? darkMode
                                        ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                                      : darkMode
                                      ? "bg-slate-900 border-slate-800 text-slate-500"
                                      : "bg-slate-50 border-slate-200 text-slate-400"
                                  }`}
                                >
                                  {on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  {p.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===================================================================
            TAB 3: SMART ORDER ASSIGNMENT & DISTRIBUTION SYSTEM
           =================================================================== */}
        {activeSubSection === "order_assignment" && (
          <div className="mt-6 space-y-6">
            {/* Distribution Methods Selector (Round-Robin, Workload-Based, Manual) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                {
                  id: "round_robin" as const,
                  title: "Automatic Round-Robin Distribution",
                  desc: "Distributes new orders sequentially among available online confirmation agents.",
                  badge: "Sequential Queue",
                },
                {
                  id: "workload" as const,
                  title: "Workload-Based Distribution",
                  desc: "Assigns new orders to the available employee with the lowest number of pending orders.",
                  badge: "Balanced Load",
                },
                {
                  id: "manual" as const,
                  title: "Manual Assignment",
                  desc: "Allows the Store Owner or authorized manager to select an employee and assign orders manually.",
                  badge: "Supervisor Control",
                },
              ].map((m) => {
                const isSelected = assignmentConfig.method === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => updateAssignmentConfig({ method: m.id })}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? darkMode
                          ? "bg-blue-950/30 border-[#2563EB] ring-2 ring-blue-500/20"
                          : "bg-blue-50/60 border-[#2563EB] ring-2 ring-blue-500/15"
                        : darkMode
                        ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-500/10 text-[#2563EB]">
                          {m.badge}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-slate-400"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Assignment Rules Configuration Panel */}
            <div className={`${subCardCls} p-5 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#2563EB]" />
                    Order Assignment &amp; Escalation Rules
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure capacity limits, confirmation timeouts, automatic reassignments, and Store Owner fallback rules.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleProcessExpiredAssignments}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    Run Timeout Check
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoDistributePendingOrders}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Distribute Unassigned Orders Now
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Max Pending Orders Per Employee
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={assignmentConfig.maxPendingOrdersPerEmployee}
                    onChange={(e) =>
                      updateAssignmentConfig({
                        maxPendingOrdersPerEmployee: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Assignment Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={assignmentConfig.assignmentTimeoutMinutes}
                    onChange={(e) =>
                      updateAssignmentConfig({
                        assignmentTimeoutMinutes: Math.max(5, Number(e.target.value) || 30),
                      })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Max Reassignment Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={assignmentConfig.maxReassignmentAttempts}
                    onChange={(e) =>
                      updateAssignmentConfig({
                        maxReassignmentAttempts: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    When Assigned Order Expires
                  </label>
                  <select
                    value={assignmentConfig.expiredOrderRouting}
                    onChange={(e) =>
                      updateAssignmentConfig({
                        expiredOrderRouting: e.target.value as "another_agent" | "original_agent",
                      })
                    }
                    className={inputCls}
                  >
                    <option value="another_agent">Route to another available agent</option>
                    <option value="original_agent">Return to original confirmation agent</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Automatic Reassignment on Timeout
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Reassign if not processed within {assignmentConfig.assignmentTimeoutMinutes} mins
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateAssignmentConfig({
                        autoReassignOnTimeout: !assignmentConfig.autoReassignOnTimeout,
                      })
                    }
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                      assignmentConfig.autoReassignOnTimeout
                        ? "bg-[#2563EB] justify-end"
                        : "bg-slate-300 dark:bg-slate-700 justify-start"
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-2xs" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Return Unprocessed Orders to Store Owner
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Escalate for manual owner review after max attempts
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateAssignmentConfig({
                        returnUnprocessedToOwner: !assignmentConfig.returnUnprocessedToOwner,
                      })
                    }
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                      assignmentConfig.returnUnprocessedToOwner
                        ? "bg-[#2563EB] justify-end"
                        : "bg-slate-300 dark:bg-slate-700 justify-start"
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-2xs" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Store Orders Confirmation & Assignment Queue */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Live Order Confirmation Queue ({visibleAssignmentOrders.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign orders to confirmation agents, confirm by phone, mark unreachable, or transfer between employees.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "all", label: "All Orders" },
                    { id: "unassigned", label: "Unassigned" },
                    { id: "pending_confirmation", label: "Pending Confirmation" },
                    { id: "confirmed", label: "Confirmed" },
                    { id: "unreachable", label: "Unreachable" },
                    { id: "rejected", label: "Rejected" },
                    { id: "owner_review", label: "Owner Review" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderQueueFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        orderQueueFilter === f.id
                          ? "bg-[#2563EB] text-white"
                          : darkMode
                          ? "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {visibleAssignmentOrders.length === 0 ? (
                <div className={`${subCardCls} p-8 text-center`}>
                  <PhoneCall className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No store orders match the current confirmation filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`text-[10px] font-black uppercase tracking-wider border-b ${
                          darkMode
                            ? "bg-slate-900/90 border-slate-800 text-slate-400"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <th className="py-3 px-4">Order &amp; Date</th>
                        <th className="py-3 px-4">Customer &amp; Phone</th>
                        <th className="py-3 px-4">Assigned Agent</th>
                        <th className="py-3 px-4">Confirmation Status</th>
                        <th className="py-3 px-4 text-right">Confirmation &amp; Dispatch Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                      {visibleAssignmentOrders.map((ord) => {
                        const confStatus =
                          ord.confirmationStatus ||
                          (ord.verified || ord.status === "accepted" ? "confirmed" : "unassigned");

                        return (
                          <tr
                            key={ord.id}
                            className={
                              darkMode ? "bg-slate-900/40 hover:bg-slate-900/80" : "bg-white hover:bg-slate-50/80"
                            }
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-black text-slate-900 dark:text-white">#{ord.id}</div>
                              <div className="text-[11px] text-slate-500">
                                {ord.total.toLocaleString()} DZD • {ord.date}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{ord.shopper.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {ord.shopper.phone} • {ord.shopper.wilaya}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={ord.assignedToMemberId || ""}
                                onChange={(e) => {
                                  const member = teamMembers.find((m) => m.id === e.target.value);
                                  if (member) {
                                    assignOrderToMember(ord.id, member, "manual");
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold outline-none ${
                                  darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-800"
                                }`}
                              >
                                <option value="">Unassigned — Select Agent</option>
                                {teamMembers
                                  .filter((m) => m.status === "active")
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({pendingOrdersByMember[m.id] || 0} pending)
                                    </option>
                                  ))}
                              </select>
                              {ord.assignedAt && (
                                <div className="text-[10px] text-slate-400 mt-1">
                                  Assigned: {new Date(ord.assignedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                                  confStatus === "confirmed"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : confStatus === "rejected"
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                    : confStatus === "unreachable"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : confStatus === "owner_review"
                                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                    : confStatus === "pending_confirmation"
                                    ? "bg-blue-500/15 text-[#2563EB]"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                {confStatus.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOrderConfirmationAction(ord, "confirmed")}
                                  title="Confirm Order by Phone"
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOrderConfirmationAction(ord, "unreachable")}
                                  title="Mark Customer Unreachable"
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <PhoneOff className="w-3 h-3" />
                                  Unreachable
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOrderConfirmationAction(ord, "rejected")}
                                  title="Mark Order Rejected"
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferModalOrder(ord);
                                    setTransferTargetMemberId("");
                                  }}
                                  title="Transfer Order to Another Agent"
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                    darkMode
                                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  Transfer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Complete Order Assignment History Log */}
            <div className={`${subCardCls} p-5 space-y-3`}>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                Complete Order Assignment History ({flattenedAssignmentHistory.length})
              </h4>
              {flattenedAssignmentHistory.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No order assignments recorded yet. Distribute or assign orders above to track every assignment and status change.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {flattenedAssignmentHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-[#2563EB]">Order #{item.orderId}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.assignedToMemberName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {item.method.replace(/_/g, " ")}
                        </span>
                        {item.note && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            • {item.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            item.status === "confirmed"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : item.status === "rejected"
                              ? "bg-rose-500/15 text-rose-500"
                              : item.status === "unreachable"
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-blue-500/15 text-[#2563EB]"
                          }`}
                        >
                          {item.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.assignedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: EMPLOYEE WORKLOAD, AVAILABILITY & WORKING TIME TRACKING
           =================================================================== */}
        {activeSubSection === "availability" && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Employee Workload, Availability &amp; Active Working Time
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Working time measures verified active engagement (keyboard, mouse, and order/support actions) and automatically pauses when idle.
                </p>
              </div>
              <div
                className={`inline-flex p-1 rounded-xl border ${
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}
              >
                {[
                  { id: "today" as const, label: "Today" },
                  { id: "7d" as const, label: "Last 7 Days" },
                  { id: "30d" as const, label: "Last 30 Days" },
                  { id: "all" as const, label: "All Time" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setWorkingTimePeriod(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      workingTimePeriod === p.id
                        ? darkMode
                          ? "bg-slate-800 text-white shadow-2xs"
                          : "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {teamMembers.length === 0 ? (
              <div className={`${subCardCls} p-8 text-center`}>
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Add team members first to monitor real-time workload, availability, and active working time.
                </p>
              </div>
            ) : (
              <>
                {/* Employee Activity Overview Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`text-[10px] font-black uppercase tracking-wider border-b ${
                          darkMode
                            ? "bg-slate-900/90 border-slate-800 text-slate-400"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <th className="py-3.5 px-4">Employee</th>
                        <th className="py-3.5 px-4">Current Status</th>
                        <th className="py-3.5 px-4">Assigned / Pending</th>
                        <th className="py-3.5 px-4">Confirmed / Rejected</th>
                        <th className="py-3.5 px-4">Transferred</th>
                        <th className="py-3.5 px-4">Messages Answered</th>
                        <th className="py-3.5 px-4">Active Working Time</th>
                        <th className="py-3.5 px-4">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                      {teamMembers.map((m) => {
                        const stat = employeeMetricsMap[m.id];
                        const isOnline = m.status === "active" && m.onlineStatus !== "offline";
                        return (
                          <tr
                            key={m.id}
                            onClick={() => setSelectedEmployeeProfileId(m.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedProfileMember?.id === m.id
                                ? darkMode
                                  ? "bg-blue-950/25"
                                  : "bg-blue-50/50"
                                : darkMode
                                ? "bg-slate-900/40 hover:bg-slate-900/80"
                                : "bg-white hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-black text-slate-900 dark:text-white">{m.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {getRoleDisplayName(m.role, allRoles, m.roleName)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1.5 ${
                                  isOnline
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOnline ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                />
                                {isOnline ? "Online" : "Offline"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold">
                              <span>{stat?.assignedOrdersCount || 0} assigned</span>
                              <span className="text-slate-400 mx-1">•</span>
                              <span className="text-[#2563EB]">{stat?.pendingOrdersCount || 0} pending</span>
                            </td>
                            <td className="py-3.5 px-4 font-bold">
                              <span className="text-emerald-500">{stat?.confirmedCount || 0} confirmed</span>
                              <span className="text-slate-400 mx-1">•</span>
                              <span className="text-rose-500">{stat?.rejectedCount || 0} rejected</span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                              {stat?.transferredCount || 0}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                              {(stat?.messagesAnswered || 0) +
                                (stat?.customerInquiries || 0) +
                                (stat?.merchantSupportInquiries || 0)}
                            </td>
                            <td className="py-3.5 px-4 font-black text-[#2563EB]">
                              {formatDuration(stat?.activeSecondsForPeriod || 0)}
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-slate-500">
                              {m.workingTime?.lastActivityAt
                                ? new Date(m.workingTime.lastActivityAt).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "No activity yet"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Personal Activity Profile & Working Time Card */}
                {selectedProfileMember && (
                  <div className={`${subCardCls} p-5 space-y-4`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#2563EB]" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            Personal Activity Profile: {selectedProfileMember.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-[#2563EB]">
                            {getRoleDisplayName(
                              selectedProfileMember.role,
                              allRoles,
                              selectedProfileMember.roleName
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Detailed working time telemetry and support task completion log.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRecordSupportResolution(selectedProfileMember, "shopper_message")
                          }
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                            darkMode
                              ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          + Log Shopper Message Reply
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRecordSupportResolution(selectedProfileMember, "merchant_support")
                          }
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                            darkMode
                              ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          + Log Merchant Support Resolution
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          First Login Time
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-white mt-1">
                          {selectedProfileMember.workingTime?.firstLoginAt
                            ? new Date(selectedProfileMember.workingTime.firstLoginAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : selectedProfileMember.joinedDate}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          Last Activity Time
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-white mt-1">
                          {selectedProfileMember.workingTime?.lastActivityAt
                            ? new Date(selectedProfileMember.workingTime.lastActivityAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Awaiting first action"}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          Active Working Time Today
                        </div>
                        <div className="text-sm font-black text-emerald-500 mt-1">
                          {formatDuration(selectedProfileMember.workingTime?.activeSecondsToday || 0)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          Active Time ({workingTimePeriod.toUpperCase()})
                        </div>
                        <div className="text-sm font-black text-[#2563EB] mt-1">
                          {formatDuration(
                            employeeMetricsMap[selectedProfileMember.id]?.activeSecondsForPeriod || 0
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="text-[10px] font-black uppercase text-slate-400">
                          Completed Tasks
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                          {employeeMetricsMap[selectedProfileMember.id]?.completedTasks || 0} Tasks
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 5: TEAM PERFORMANCE & ACTIVITY LOG
           =================================================================== */}
        {activeSubSection === "performance_logs" && (
          <div className="mt-6 space-y-6">
            {/* Team Performance Table */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Team Performance Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real operational metrics across order confirmations, response speed, customer inquiries, merchant support, and active working time.
                </p>
              </div>

              {teamMembers.length === 0 ? (
                <div className={`${subCardCls} p-6 text-center text-xs text-slate-500`}>
                  No team members added yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`text-[10px] font-black uppercase tracking-wider border-b ${
                          darkMode
                            ? "bg-slate-900/90 border-slate-800 text-slate-400"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <th className="py-3.5 px-4">Team Member</th>
                        <th className="py-3.5 px-4">Orders Confirmed</th>
                        <th className="py-3.5 px-4">Orders Rejected</th>
                        <th className="py-3.5 px-4">Avg Confirmation Time</th>
                        <th className="py-3.5 px-4">Overdue Pending</th>
                        <th className="py-3.5 px-4">Messages Answered</th>
                        <th className="py-3.5 px-4">Customer Inquiries</th>
                        <th className="py-3.5 px-4">Merchant Support</th>
                        <th className="py-3.5 px-4">Total Active Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                      {teamMembers.map((m) => {
                        const perf = employeeMetricsMap[m.id];
                        return (
                          <tr
                            key={m.id}
                            className={
                              darkMode ? "bg-slate-900/40 hover:bg-slate-900/80" : "bg-white hover:bg-slate-50"
                            }
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-black text-slate-900 dark:text-white">{m.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {getRoleDisplayName(m.role, allRoles, m.roleName)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-black text-emerald-500">
                              {perf?.confirmedCount || 0}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-rose-500">
                              {perf?.rejectedCount || 0}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                              {perf?.avgConfirmationSeconds
                                ? formatDuration(perf.avgConfirmationSeconds)
                                : "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  (perf?.overduePendingCount || 0) > 0
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                {perf?.overduePendingCount || 0}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold">{perf?.messagesAnswered || 0}</td>
                            <td className="py-3.5 px-4 font-bold">{perf?.customerInquiries || 0}</td>
                            <td className="py-3.5 px-4 font-bold">{perf?.merchantSupportInquiries || 0}</td>
                            <td className="py-3.5 px-4 font-black text-[#2563EB]">
                              {formatDuration(m.workingTime?.totalActiveSeconds || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Activity Log with Filters (by Employee, Activity Type, and Date) */}
            <div className={`${subCardCls} p-5 space-y-4`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    Team Activity Log ({filteredActivityLogs.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audit trail of actions performed by team members across products, orders, confirmations, coupons, stories, messages, and settings.
                  </p>
                </div>

                {/* Filters: Employee, Activity Type, Date */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={logEmployeeFilter}
                    onChange={(e) => setLogEmployeeFilter(e.target.value)}
                    className={`${inputCls} w-auto min-w-[150px]`}
                  >
                    <option value="all">All Employees</option>
                    <option value="owner">Store Owner</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={logCategoryFilter}
                    onChange={(e) => setLogCategoryFilter(e.target.value)}
                    className={`${inputCls} w-auto min-w-[160px]`}
                  >
                    <option value="all">All Activity Types</option>
                    <option value="products">Products</option>
                    <option value="orders">Orders</option>
                    <option value="confirmation">Order Confirmation</option>
                    <option value="coupons">Coupons &amp; Discounts</option>
                    <option value="stories">Stories &amp; Content</option>
                    <option value="followers">Followers</option>
                    <option value="messages">Customer Messages</option>
                    <option value="merchant_support">Merchant Support</option>
                    <option value="marketing">Marketing &amp; Analytics</option>
                    <option value="delivery">Delivery</option>
                    <option value="team_settings">Team &amp; Settings</option>
                  </select>

                  <select
                    value={logDateFilter}
                    onChange={(e) => setLogDateFilter(e.target.value)}
                    className={`${inputCls} w-auto min-w-[130px]`}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>

                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Filter action text..."
                    className={`${inputCls} w-auto min-w-[160px]`}
                  />
                </div>
              </div>

              {filteredActivityLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No team activity logs match the selected filters yet. Actions performed by the Store Owner or team members appear here automatically.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredActivityLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white">
                            {entry.memberName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-[#2563EB]">
                            {entry.memberRole}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {entry.category.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="font-bold text-slate-700 dark:text-slate-200 mt-1">
                          {entry.action}
                        </div>
                        {entry.details && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {entry.details}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-medium text-slate-400 shrink-0">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: ADD / EDIT TEAM MEMBER & 10-GROUP GRANULAR PERMISSIONS
         ===================================================================== */}
      {isMemberEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            className={`w-full max-w-4xl rounded-[28px] border shadow-2xl overflow-hidden my-8 ${
              darkMode ? "bg-[#0f172a] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center">
                  {editingMemberId ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingMemberId ? "Edit Team Member & Permissions" : "Add New Team Member"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign a predefined or custom role and fine-tune individual ON/OFF permission switches across all 10 store modules.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberEditorOpen(false)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Identity, Role, Status Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Team Member Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={memberFormName}
                    onChange={(e) => setMemberFormName(e.target.value)}
                    placeholder="e.g., Yassine Benali"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={memberFormEmail}
                    onChange={(e) => setMemberFormEmail(e.target.value)}
                    placeholder="agent@store.dz"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Profile Picture URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={memberFormAvatar}
                    onChange={(e) => setMemberFormAvatar(e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Assigned Role *
                  </label>
                  <select
                    value={memberFormRole}
                    onChange={(e) => handleRoleChangeInForm(e.target.value)}
                    className={inputCls}
                  >
                    <optgroup label="Predefined Store Roles">
                      {PREDEFINED_ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </optgroup>
                    {customRoles.length > 0 && (
                      <optgroup label="Custom Store Roles">
                        {customRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Account Status
                  </label>
                  <select
                    value={memberFormStatus}
                    onChange={(e) => setMemberFormStatus(e.target.value as "active" | "inactive")}
                    className={inputCls}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Online / Offline Status
                  </label>
                  <select
                    value={memberFormOnlineStatus}
                    onChange={(e) => setMemberFormOnlineStatus(e.target.value as "online" | "offline")}
                    className={inputCls}
                  >
                    <option value="online">Online (Available)</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              {/* Bulk Permission Action Bar: Enable All, Disable All, Reset to Role Defaults */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Detailed Permission Switches (10 Groups)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ALL_GRANULAR_KEYS.filter((k) => Boolean(memberFormPermissions[k])).length} of{" "}
                    {ALL_GRANULAR_KEYS.length} individual permissions enabled
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEnableAllPermissions}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={handleDisableAllPermissions}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 cursor-pointer"
                  >
                    Disable All
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 text-[#2563EB] hover:bg-blue-500/25 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Role Defaults
                  </button>
                </div>
              </div>

              {/* Collapsible 10 Permission Groups */}
              <div className="space-y-3">
                {PERMISSION_GROUPS.map((group) => {
                  const GroupIcon = group.icon;
                  const isExpanded = Boolean(expandedPermissionGroups[group.id]);
                  const enabledCount = group.permissions.filter(
                    (p) => Boolean(memberFormPermissions[p.key])
                  ).length;

                  return (
                    <div
                      key={group.id}
                      className={`rounded-2xl border overflow-hidden transition-all ${
                        darkMode ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200"
                      }`}
                    >
                      {/* Collapsible Header */}
                      <div
                        onClick={() =>
                          setExpandedPermissionGroups((prev) => ({
                            ...prev,
                            [group.id]: !prev[group.id],
                          }))
                        }
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#2563EB] flex items-center justify-center shrink-0">
                            <GroupIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {group.code}. {group.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  enabledCount > 0
                                    ? "bg-blue-500/15 text-[#2563EB]"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                {enabledCount} / {group.permissions.length} ON
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {group.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const allOn = enabledCount === group.permissions.length;
                              const next = { ...memberFormPermissions };
                              group.permissions.forEach((p) => {
                                next[p.key] = !allOn;
                              });
                              setMemberFormPermissions(syncLegacyPermissions(next));
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {enabledCount === group.permissions.length ? "Disable Group" : "Enable Group"}
                          </button>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                          {group.note && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {group.note}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {group.permissions.map((perm) => {
                              const isOn = Boolean(memberFormPermissions[perm.key]);
                              return (
                                <div
                                  key={perm.key}
                                  onClick={() => toggleFormPermission(perm.key)}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    isOn
                                      ? darkMode
                                        ? "bg-blue-950/30 border-blue-600/60"
                                        : "bg-blue-50/70 border-blue-300"
                                      : darkMode
                                      ? "bg-slate-950/40 border-slate-800/90 hover:border-slate-700"
                                      : "bg-slate-50/70 border-slate-200/80 hover:border-slate-300"
                                  }`}
                                >
                                  <div>
                                    {perm.subGroup && (
                                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#2563EB] mb-0.5">
                                        {perm.subGroup}
                                      </span>
                                    )}
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                      {perm.label}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {perm.description}
                                    </div>
                                  </div>

                                  {/* Individual ON/OFF Switch */}
                                  <div
                                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                                      isOn
                                        ? "bg-[#2563EB] justify-end"
                                        : "bg-slate-300 dark:bg-slate-700 justify-start"
                                    }`}
                                  >
                                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-2xs" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                  Store Owner always retains full control and cannot be removed or restricted.
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsMemberEditorOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                  >
                    {editingMemberId ? "Save Member Changes" : "Add Team Member"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: TRANSFER ORDER TO ANOTHER AGENT
         ===================================================================== */}
      {transferModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${
              darkMode ? "bg-[#0f172a] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#2563EB]" />
                Transfer Order #{transferModalOrder.id}
              </h4>
              <button
                type="button"
                onClick={() => setTransferModalOrder(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrderTransfer} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                  Select Destination Agent *
                </label>
                <select
                  required
                  value={transferTargetMemberId}
                  onChange={(e) => setTransferTargetMemberId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Choose an active team member...</option>
                  {teamMembers
                    .filter((m) => m.status === "active" && m.id !== transferModalOrder.assignedToMemberId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({getRoleDisplayName(m.role, allRoles, m.roleName)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                  Transfer Note / Reason
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g., Shift handover, Arabic/French speaker requested..."
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-white cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantTeamManagement;

