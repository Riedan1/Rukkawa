/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface Review {
  id: string;
  author: string;
  authorLocation: string;
  rating: number;
  comment: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  reply?: string;
}

export interface ProductVariant {
  id: string;
  name?: string;
  options: { [optionName: string]: string };
  sku: string;
  price?: number;
  stock: number;
  availability?: "in_stock" | "low_stock" | "out_of_stock" | string;
  images?: string[];
  imageUrl?: string;
  isHot?: boolean;
}

export interface Product {
  id: string;
  storeId?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  image?: string;
  imgUrl?: string;
  images?: string[];
  imagesFr?: string[];
  imagesEn?: string[];
  featured?: boolean;
  promotionText?: string;
  discountEndDate?: string;
  isVisible?: boolean;
  reviewsCount?: number;
  verified?: boolean;
  status?: "active" | "draft";
  rating: number;
  reviews: Review[];
  description_ar?: string;
  description_fr?: string;
  description_en?: string;
  description?: string;
  colors?: { name: string; hex: string; imageUrl?: string; image?: string; isHot?: boolean; images?: string[]; price?: number; stock?: number }[];
  colorStockTrackingEnabled?: boolean;
  colorVariantStyle?: "image_cards" | "circles" | "photo_cards" | "cards" | "solid_circles";
  detailedImagesPerColorEnabled?: boolean;
  detailedImagesByPrimary?: Record<string, string[]>;
  sizes?: string[];
  sizePrices?: Record<string, number | undefined>;
  sizesWithPrices?: Array<{ name: string; price?: number }>;
  specifications?: { key: string; value: string }[];
  tags?: string[];
  shippingCost?: number;
  deliveryCompany?: string;
  safe?: boolean;
  isSafe?: boolean;
  moderation_reason?: string;
  moderationReason?: string;
  simulated?: boolean;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  weight?: number; // in grams
  sku?: string;
  subcategory?: string;
  variants?: ProductVariant[];
  videoUrl?: string;
  videoUrls?: string[];
  videoMetadata?: Record<string, { duration?: string; resolution?: string; format?: string }>;
  discountEnabled?: boolean;
  discountPercent?: number;
  originalPrice?: number;
  promoOfferStyle?: "style_1" | "style_2" | "style_3";
  buyPrice?: number;
  purchasePrice?: number;
  shippingType?: "paid" | "free";
  realDeliveryCost?: number;
  timerEnabled?: boolean;
  timerHours?: number;
  timerStyle?: "style_1" | "style_2" | "style_3" | "style_4" | "style_5";
  currency?: string;
  uploadedLandingPageContent?: string;
  advancedLandingPageEnabled?: boolean;
  advancedProductStorySections?: any[];
  wizardAdvancedStorySections?: any[];
  storySections?: any[];
  altText?: string;
  detailedDescription?: string;
  altTextModel?: string;
  isBundle?: boolean;
  bundleItems?: { productId: string; name: string; quantity: number; price?: number }[];
  bundlePrice?: number;
  offersConfig?: import('./utils/offersLogic').ProductOffersConfig;
  selectedOfferTierId?: string;
  selectedOfferTitle?: string;
  selectedOfferSummary?: string;
  selectedOfferUnitVariants?: Record<string, string>[];
  selectedOfferFreeGifts?: import('./utils/offersLogic').OfferGiftItem[];
  sizingFitConfig?: import('./utils/sizingFitLogic').ProductSizingFitConfig;
}

export interface AnnouncementBanner {
  enabled: boolean;
  text: string;
  bgColor?: string;
  textColor?: string;
  expiresAt?: string; // "YYYY-MM-DD" style or ISO
}

export interface MerchantStore {
  id: string;
  name: string;
  slug: string; // Used for domain-mocking
  subdomain: string; // e.g. "deglet.platform.dz"
  skuPrefix?: string;
  logo: string;
  logoUrl?: string;
  banner: string;
  bannerUrl?: string;
  banners?: string[];
  description: string;
  bio: string;
  city?: string;
  wilaya: string;
  wilayaCode: string;
  address: string;
  coordinates: LocationCoordinates;
  rating: number;
  categories: string[];
  verified: boolean;
  premiumTier: "Starter" | "Growth" | "Pro" | CanonicalSubscriptionPlanId | string;
  subscriptionTier?: SubscriptionPlanTier;
  country?: string;
  countryCode?: string;
  currency?: string;
  storeLabel?: string;
  storeImportance?: "critical" | "high" | "standard" | "watch";
  contact: {
    phone: string;
    secondaryPhone?: string;
    phones?: string[];
    email: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    viber?: string;
    tiktok?: string;
    snapchat?: string;
    supportAccounts?: any;
  };
  products: Product[];
  reviews: Review[];
  announcement?: AnnouncementBanner;
  adBannerTitle?: string;
  adBannerDescription?: string;
  adBannerTemplate?: string;
  followersCount?: number;
  followerSystemSettings?: {
    whoCanFollow: "anyone" | "verified" | "customers" | "approved";
    contentVisibility: "public" | "followers" | "customers_followers";
    displayCount: boolean;
    autoApprove: boolean;
    maxFollowers: number;
  };
  followersList?: {
    id: string;
    name: string;
    email?: string;
    avatar: string;
    accountType?: "Shopper" | "Store/Merchant";
    storeId?: string;
    country?: string;
    countryFlag?: string;
    city?: string;
    location: string;
    isVerified: boolean;
    dateFollowed: string;
    followedAt?: number;
    status: "approved" | "pending" | "blocked";
  }[];
  designSettings?: {
    width?: string; // "medium" | "large" | "full"
    height?: string; // "medium" | "large" | "full"
    bgColor?: string;
    borderColor?: string;
    borderStyle?: string; // "solid" | "dashed" | "double" | "dotted" | "none"
    borderWidth?: string; // "1px" | "2px" | "4px" | "6px" | "8px"
    borderRadius?: string; // "none" | "xl" | "2xl" | "3xl" | "full"
    accentColor?: string; // Hex color code for store carousel and buttons
    coverTemplate?: string; // "toonhub" | "classic" | etc.
    toonhubLogo?: string;
    toonhubProducts?: string[];
    toonhubCharacters?: string[];
    toonhubMode?: "characters" | "products" | "both";
    mysticflowerLogo?: string;
    mysticflowerProducts?: string[];
    mysticflowerCharacters?: string[];
    mysticflowerMode?: "characters" | "products" | "both";
    classicCovers?: string[];
    classicCoversPerSlide?: number;
    gamingLogo?: string;
    gamingProducts?: string[];
    myBrandImage?: string;
    myBrandBgType?: "gradient" | "space" | "nebula" | "solid";
    myBrandColor1?: string;
    myBrandColor2?: string;
    myBrandSpacing?: number;
    myBrandAngle?: number;
    myBrandShadowColor?: string;
    myBrandShadowIntensity?: number;
    myBrandShadowOpacity?: number;
    myBrandShadowPreviewBorder?: boolean;
    myBrandImageOriginal?: string;
    myBrandBgRemovalMode?: "none" | "white" | "black" | "chroma";
    myBrandBgRemovalTolerance?: number;
    myBrandBgRemovalColor?: string;
    myBrandBrightness?: number;
    myBrandContrast?: number;
    myBrandGrayscale?: number;
    profileBgStyle?: string;
    fontFamily?: string;
    titleFontSize?: string;
    titleFontStyle?: string;
    titleFontWeight?: string;
    bodyFontSize?: string;
    bodyFontStyle?: string;
    scrollBlurIntensity?: number;
    glassBlurEnabled?: boolean;
    glassBlurAmount?: number;
    glassTransparency?: number;
    glassBarBlur?: number;
    glassBarColor?: string;
    glassBarOpacity?: number;
    glassMultiColorEnabled?: boolean;
    glassMultiColors?: string[];
    gridCardMinWidth?: string;
    gridCardGap?: string;
    productsPerRow?: 2 | 3 | 4 | 5 | number;
    cardSpacing?: "compact" | "normal" | "spacious";
    reelsGridCardMinWidth?: string;
    reelsGridCardGap?: string;
    reelsPerRow?: 2 | 3 | 4 | 5 | number;
    reelsCardSpacing?: "compact" | "normal" | "spacious";
    permitBuyerModifications?: boolean;
    showSimilarProducts?: boolean;
    offerTimerStyle?: "style_1" | "style_2" | "style_3" | "style_4" | "style_5";
    dockSettings?: import("./utils/storeMoreOptionsLogic").StoreDockSettings;
  };
  ownerId?: string;
  ownerEmail?: string;
  createdAt?: string;
  deliveryWilayas?: any[];
  gridLinesHorizontal?: number;
  gridLinesVertical?: number;
  gridSpacingHorizontal?: number;
  gridSpacingVertical?: number;
  merchantFullName?: string;
  merchantFirstName?: string;
  merchantLastName?: string;
  apiKey?: string;
  newsletterSubscribers?: string[];
  paymentGateways?: {
    cod: boolean;
    eddahabia: boolean;
    cib: boolean;
    wire: boolean;
  };
  dynamicGateways?: any;
  notificationsConfig?: {
    email: boolean;
    sms: boolean;
    order: boolean;
    review: boolean;
    follow: boolean;
    lowStockAlerts?: boolean;
    lowStockThreshold?: number;
    telegramEnabled?: boolean;
    telegramChatId?: string;
    whatsappEnabled?: boolean;
    [key: string]: any;
  };
  verificationStatus?: "not_started" | "pending" | "verified";
  verificationDocName?: string;
  shopApproved?: boolean;
  shopApprovedAt?: string;
  shopApprovedBy?: string;
  kycEnabled?: boolean;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  kycIdentity?: {
    status: "not_required" | "not_submitted" | "pending_review" | "verified" | "rejected";
    documentType?: "national_id" | "passport" | "driving_license";
    documentNumberMasked?: string;
    documentFileName?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    notes?: string;
  };
  apiKeysVault?: MerchantApiKeys;
  coupons?: Coupon[];
  teamMembers?: TeamMember[];
  customRoles?: CustomTeamRole[];
  orderAssignmentConfig?: OrderAssignmentConfig;
  teamActivityLogs?: TeamActivityLogEntry[];
  authorizationHistory?: AuthorizationHistoryEntry[];
  ordersMode?: "classic" | "advanced" | "both";
  customDomains?: CustomDomainRecord[];
  storiesEnabled?: boolean;
  enforcement?: MerchantEnforcementRecord;
  entitlementOverrides?: MerchantEntitlementOverrides;
  subscriptionMeta?: MerchantSubscriptionMeta;
}

export interface AuthorizationHistoryEntry {
  id: string;
  buyerName: string;
  buyerEmail: string;
  action: string;
  timestamp: string;
  device: string;
  ip: string;
}

export interface GranularTeamPermissions {
  // Legacy top-level compatibility flags
  confirmOrders: boolean;
  prepareShipments: boolean;
  deliveryOperations?: boolean;
  manageProducts: boolean;
  manageDiscounts: boolean;
  adPixels?: boolean;
  manageAnalytics?: boolean;
  respondReviews?: boolean;
  manageFollowers?: boolean;

  // A. Products Management
  viewProducts?: boolean;
  addProducts?: boolean;
  editProducts?: boolean;
  deleteProducts?: boolean;
  manageProductImages?: boolean;
  manageProductVariants?: boolean;
  manageProductCategories?: boolean;
  manageProductStock?: boolean;

  // B. Orders Management
  viewOrders?: boolean;
  receiveAssignedOrders?: boolean;
  rejectOrders?: boolean;
  editOrderInfo?: boolean;
  changeOrderStatus?: boolean;
  cancelOrders?: boolean;
  assignOrdersToMembers?: boolean;
  reassignOrders?: boolean;
  viewCustomerInfo?: boolean;
  manageOrderNotes?: boolean;

  // C. Order Confirmation & Distribution
  receiveOrdersForConfirmation?: boolean;
  confirmOrdersByPhone?: boolean;
  markCustomersUnreachable?: boolean;
  markOrdersConfirmed?: boolean;
  markOrdersRejected?: boolean;
  requestAnotherConfirmationAttempt?: boolean;
  transferOrdersToAnotherAgent?: boolean;
  viewPersonalConfirmationPerformance?: boolean;
  viewAssignedOrdersOnly?: boolean;

  // D. Coupons & Discounts
  viewCoupons?: boolean;
  createCoupons?: boolean;
  editCoupons?: boolean;
  deleteCoupons?: boolean;
  activateDeactivateCoupons?: boolean;

  // E. Stories & Content Management
  viewStories?: boolean;
  publishStories?: boolean;
  editStories?: boolean;
  deleteStories?: boolean;
  manageStoryHighlights?: boolean;

  // F. Page & Followers Management
  viewFollowers?: boolean;
  viewFollowerProfiles?: boolean;
  viewAudienceStatistics?: boolean;
  accessGeographicAudienceDistribution?: boolean;

  // G. Messages & Communication - Shopper Communication
  viewShopperMessages?: boolean;
  replyToShopperMessages?: boolean;
  manageCustomerInquiries?: boolean;
  // G. Messages & Communication - Merchant & Platform Support
  viewMerchantSupportMessages?: boolean;
  replyToMerchantQuestions?: boolean;
  handleYumeFeatureQuestions?: boolean;
  assistMerchantsPlatformUsage?: boolean;
  handleTechnicalOperationalInquiries?: boolean;

  // H. Marketing & Analytics
  viewAnalytics?: boolean;
  manageAdCampaigns?: boolean;
  manageAdPixels?: boolean;
  accessGrowthStudio?: boolean;
  viewStorePerformanceReports?: boolean;

  // I. Delivery Management
  viewDeliveryInfo?: boolean;
  manageDeliveryCompanies?: boolean;
  updateDeliveryStatus?: boolean;
  manageShippingInfo?: boolean;
  splitShipments?: boolean;
  overrideShippingRates?: boolean;
  inspectReturns?: boolean;

  // J. Settings & Team Management
  viewStoreSettings?: boolean;
  editStoreSettings?: boolean;
  addTeamMembers?: boolean;
  manageDomains?: boolean;
  editTeamMembers?: boolean;
  removeTeamMembers?: boolean;
  manageRolesAndPermissions?: boolean;
  viewTeamActivityLogs?: boolean;

  // K. Financial & COD Reconciliation Permissions
  viewFinancialReconciliation?: boolean;
  viewProductPurchaseCosts?: boolean;
  editProductPurchaseCosts?: boolean;
  manageCarrierSettlements?: boolean;
  viewNetProfitReports?: boolean;
  viewVisitorAnalytics?: boolean;
}

export interface CustomTeamRole {
  id: string;
  name: string;
  description: string;
  isPredefined?: boolean;
  permissions: GranularTeamPermissions;
  createdAt?: string;
}

export interface OrderAssignmentConfig {
  method: "round_robin" | "workload" | "manual";
  maxPendingOrdersPerEmployee: number;
  assignmentTimeoutMinutes: number;
  autoReassignOnTimeout: boolean;
  expiredOrderRouting: "another_agent" | "original_agent";
  maxReassignmentAttempts: number;
  returnUnprocessedToOwner: boolean;
  lastRoundRobinIndex?: number;
}

export interface OrderAssignmentHistoryEntry {
  id: string;
  orderId: string;
  assignedToMemberId: string;
  assignedToMemberName: string;
  assignedBy: string;
  assignedAt: string;
  method: "round_robin" | "workload" | "manual" | "reassigned" | "transferred" | "owner_fallback";
  status: "pending" | "confirmed" | "rejected" | "unreachable" | "transferred" | "expired" | "owner_review";
  note?: string;
  resolvedAt?: string;
}

export interface TeamActivityLogEntry {
  id: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  action: string;
  category:
    | "products"
    | "orders"
    | "confirmation"
    | "coupons"
    | "stories"
    | "followers"
    | "messages"
    | "merchant_support"
    | "marketing"
    | "delivery"
    | "team_settings";
  details?: string;
  timestamp: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role:
    | "admin"
    | "manager"
    | "preparator"
    | "viewer"
    | "store_admin"
    | "store_manager"
    | "order_confirmation_agent"
    | "customer_support_agent"
    | "product_manager"
    | "marketing_content_manager"
    | string;
  roleName?: string;
  permissions: GranularTeamPermissions;
  status: "active" | "inactive" | "invited";
  onlineStatus?: "online" | "offline";
  joinedDate: string;
  workingTime?: {
    firstLoginAt?: string;
    lastActivityAt?: string;
    activeSecondsToday: number;
    activeSecondsWeek: number;
    activeSecondsMonth: number;
    totalActiveSeconds: number;
    completedTasksCount: number;
  };
  performanceStats?: {
    ordersConfirmed: number;
    ordersRejected: number;
    unreachableCount: number;
    ordersTransferred: number;
    totalConfirmationTimeSeconds: number;
    shopperMessagesAnswered: number;
    customerInquiriesHandled: number;
    merchantSupportInquiriesHandled: number;
  };
}

export interface Coupon {
  id: string;
  storeId?: string;
  code: string;
  type: "percentage" | "fixed";
  value: number; // e.g., 10 for 10% or 500 for 500 DZD
  targetType: "all" | "category" | "product";
  targetValue?: string; // category name or product ID
  minPurchase?: number; // minimum order value to apply
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "active" | "scheduled" | "expired";
  usageCount: number;
  maxUses?: number;
}

export interface MerchantApiKeys {
  gemini?: string;
  grok?: string;
  openai?: string;
  deepseek?: string;
  z_ai?: string;
  claude?: string;
  nvidia?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  storeId: string;
  storeName: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantOptions?: Record<string, string>;
  variantOptions?: Record<string, string>;
}

// ============================================================================
// FOUR DECOUPLED OPERATIONAL DIMENSIONS (PART 2, 3, 4)
// ============================================================================

export type OrderLifecycleStatus =
  | "new"
  | "confirmation_pending"
  | "confirmed"
  | "ready_to_ship"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "failed_delivery"
  | "returned";

export type ShipmentLifecycleStatus =
  | "pending_creation"
  | "shipment_created"
  | "ready_for_pickup"
  | "picked_up"
  | "in_transit"
  | "at_distribution_center"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "returning_to_sender"
  | "returned";

export type PaymentLifecycleStatus =
  | "awaiting_collection"
  | "collected"
  | "settlement_pending"
  | "partially_settled"
  | "settled"
  | "disputed"
  | "refunded";

export type ReturnLifecycleStatus =
  | "none"
  | "return_requested"
  | "return_approved"
  | "return_in_transit"
  | "received"
  | "inspection_pending"
  | "restocked"
  | "not_resellable"
  | "refund_completed";

export interface OrderConfirmationAttempt {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  channel: "phone" | "whatsapp" | "sms";
  outcome:
    | "confirmed"
    | "no_answer"
    | "busy"
    | "wrong_number"
    | "postponed"
    | "cancelled";
  notes?: string;
  scheduledCallbackAt?: string;
}

export interface OrderItemSnapshot {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  productName: string;
  variantLabel?: string;
  imageUrl?: string;
  orderedQty: number;
  keptQty: number;
  returnedQty: number;
  damagedUnresellableQty: number;
  unitSalePrice: number;
  unitDiscount: number;
  /** Nullable: null indicates purchase cost is missing and must NEVER be treated as 0 */
  unitPurchaseCost: number | null;
  costSource?: "snapshot_at_order" | "catalog_backfill" | "merchant_inline_entry" | "missing";
  weightKg: number;
  dimensionsCm?: {
    length: number;
    width: number;
    height: number;
  };
  allocatedShipmentId?: string;
}

export type TariffSourceType =
  | "merchant_custom"
  | "official_api"
  | "yume_verified"
  | "merchant_manual_override";

export type OperationalCoverageState =
  | "ELIGIBLE"
  | "DESTINATION_UNSUPPORTED"
  | "SERVICE_UNAVAILABLE"
  | "PRICE_UNAVAILABLE"
  | "PRICE_UNVERIFIED"
  | "MANUAL_PRICE_OVERRIDE";

export interface ShipmentCarrierEvent {
  id: string;
  timestamp: string;
  status: ShipmentLifecycleStatus;
  location?: string;
  description: string;
  rawEventId?: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  storeId: string;
  shipmentIndex: number;
  totalShipmentsInOrder: number;
  isSplitShipment: boolean;
  carrierId: string;
  carrierName: string;
  rateSource: TariffSourceType;
  isConfirmedPrice: boolean;
  overrideReason?: string;
  trackingNumber: string;
  labelUrl?: string;
  deliveryType: "home" | "desk";
  actualWeightKg: number;
  dimensionsCm?: {
    length: number;
    width: number;
    height: number;
  } | null;
  volumetricDivisor?: number | null;
  volumetricWeightKg?: number | null;
  billableWeightKg: number;
  weightBasisStatus:
    | "VERIFIED_DIMENSIONAL_WEIGHT"
    | "VERIFIED_DEAD_WEIGHT"
    | "DIMENSIONS_MISSING_PROVISIONAL";
  isFragile: boolean;
  allowOpenPackage: boolean;
  exchangeRequired: boolean;
  allocatedItems: {
    orderItemId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitSalePrice: number;
    unitDiscount: number;
    unitPurchaseCost: number | null;
  }[];
  allocatedDiscountAmount: number;
  allocatedCustomerShippingFee: number;
  shipmentCodCollectable: number;
  carrierShippingFee: number;
  carrierCodFee: number;
  carrierReturnFee: number;
  cashCollectedByCourier: number;
  netPayableByCarrier: number;
  remittedPayoutToMerchant: number;
  settlementBatchId?: string;
  shipmentStatus: ShipmentLifecycleStatus;
  estimatedDeliveryDate?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  failedAttempts: number;
  carrierEvents: ShipmentCarrierEvent[];
}

export interface OrderFinancialSummary {
  gmv: number;
  keptMerchandiseValue: number;
  orderDiscount: number;
  customerRefundAmount: number;
  netOrderRevenue: number;
  customerShippingFeeCharged: number;
  prepaidAmount: number;
  totalCodCollectable: number;
  hasMissingPurchaseCost: boolean;
  missingCostItemIds: string[];
  totalCogs: number | null;
  grossProductProfit: number | null;
  totalCarrierShippingExpense: number;
  totalCarrierCodFee: number;
  totalReturnFee: number;
  totalCarrierFees: number;
  damagedInventoryLoss: number;
  packagingAndOtherCost: number;
  merchantExternalExpenses: number | null;
  netOperationalProfit: number | null;
  collectedCod: number;
  carrierDeductedFees: number;
  netPayableByCarrier: number;
  actualCashReceived: number;
  pendingSettlement: number;
  inTransitExpectedNetCod: number;
  disputedShortfallAmount: number;
  outstandingCarrierReceivables: number;
  totalOutstandingBalance: number;
}

export interface OrderTimelineEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  dimension: "order" | "shipment" | "payment" | "return" | "edit" | "note" | "financial" | "migration";
  previousValue?: string;
  newValue?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  date: string;
  updatedAt?: string;
  shopper: {
    name: string;
    email: string;
    phone: string;
    secondaryPhone?: string;
    whatsapp?: string;
    viber?: string;
    telegram?: string;
    country?: string;
    countryCode?: string;
    wilaya: string;
    wilayaCode: string;
    commune: string;
    address: string;
    postalCode?: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    color?: string;
    size?: string;
    sku?: string;
    buyPrice?: number;
    purchasePrice?: number | null;
    weightKg?: number;
    dimensionsCm?: { length: number; width: number; height: number };
    variantOptions?: Record<string, string>;
    isOfferItem?: boolean;
    offerTierId?: string;
    offerTitle?: string;
    offerType?: string;
    offerTotalUnits?: number;
    offerPurchasedQty?: number;
    offerFreeQty?: number;
    offerSavingsDzd?: number;
    offerSummary?: string;
    offerUnitVariants?: Record<string, string>[];
    offerFreeGifts?: Array<{
      id?: string;
      name: string;
      quantity?: number;
      price?: number;
      color?: string;
      imageUrl?: string;
    }>;
  }[];
  subtotal?: number;
  discountAmount?: number;
  promoCode?: string;
  total: number;
  shippingCost: number;
  /** Legacy 4-stage status field maintained in strict two-way sync with orderStatus */
  status: "pending" | "accepted" | "shipped" | "delivered";
  paymentMethod: "cod" | "eddahabia" | "cib";
  deliveryCompany?: string;
  deliveryCompanyName?: string;
  deliveryMethod?: "home" | "stop_desk" | "stopdesk";
  trackingCode?: string;
  estimatedDeliveryDate?: string;
  verified?: boolean;
  returnRequested?: boolean;
  returnReason?: string;
  teamMemberAssigned?: string;
  assignedToMemberId?: string;
  assignedToMemberName?: string;
  assignedAt?: string;
  confirmationStatus?:
    | "unassigned"
    | "pending_confirmation"
    | "confirmed"
    | "rejected"
    | "unreachable"
    | "transferred"
    | "owner_review";
  reassignmentCount?: number;
  confirmedAt?: string;
  assignmentHistory?: OrderAssignmentHistoryEntry[];
  notes?: string;
  isOfferOrder?: boolean;
  offerDetails?: {
    tierId?: string;
    tierTitle?: string;
    offerType?: string;
    badgeText?: string;
    totalUnits?: number;
    purchasedQuantity?: number;
    freeQuantity?: number;
    baseUnitPriceDzd?: number;
    originalTotalDzd?: number;
    finalPriceDzd?: number;
    savingsDzd?: number;
    savingsPercent?: number;
    summaryText?: string;
    unitSelections?: Record<string, string>[];
    freeGifts?: Array<{
      id?: string;
      name: string;
      quantity?: number;
      price?: number;
      color?: string;
      imageUrl?: string;
    }>;
  };

  // ==========================================================================
  // V2 EXTENDED ORDERS MANAGEMENT FIELDS (ADDITIVE & BACKWARD-COMPATIBLE)
  // ==========================================================================
  schemaVersion?: 1 | 2;
  snapshotVersionId?: string;
  migrationBaselineHash?: string;
  postMigrationRevision?: number;

  orderStatus?: OrderLifecycleStatus;
  shipmentStatus?: ShipmentLifecycleStatus;
  paymentStatus?: PaymentLifecycleStatus;
  returnStatus?: ReturnLifecycleStatus;

  callAttempts?: number;
  confirmationAttempts?: OrderConfirmationAttempt[];
  cancellationReason?: string;
  failedDeliveryReason?: string;
  returnInspectionStatus?: "pending" | "restocked" | "not_resellable";
  returnInspectionNotes?: string;
  inventoryState?: "unreserved" | "reserved" | "deducted" | "restocked" | "written_off";

  itemSnapshots?: OrderItemSnapshot[];
  shipments?: ShipmentRecord[];
  packagingAndOtherCost?: number;
  customerRefundAmount?: number;
  financials?: OrderFinancialSummary;
  timeline?: OrderTimelineEvent[];
  processedWebhookIds?: string[];
  _v2Archive?: Record<string, any>;
}

// ============================================================================
// CARRIER TARIFF ENGINE & COVERAGE INTERFACES (PART 3)
// ============================================================================

export interface CarrierRegionCoverageRule {
  regionCode: string;
  regionName: string;
  isSupported: boolean;
  serviceDiscontinued?: boolean;
  supportsHomeDelivery: boolean;
  supportsDeskDelivery: boolean;
  supportsCod: boolean;
  homeDeliveryRate: number | null;
  deskDeliveryRate: number | null;
  returnFee: number;
  codFeePercent: number;
  codFixedFee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  historicalSuccessRatePercent?: number;
}

export interface CarrierTariffProfile {
  id: string;
  carrierId: string;
  carrierName: string;
  countryCode: string;
  source: "merchant_custom" | "official_api" | "yume_verified";
  isActive: boolean;
  lastUpdatedAt: string;
  validUntil?: string | null;
  baseWeightKg: number;
  weightStepKg: number;
  extraStepFee: number;
  maxWeightKg: number;
  maxCodLimit: number;
  volumetricDivisor: number | null;
  dimensionalExemptionThresholdKg: number;
  coverageByRegion: Record<string, CarrierRegionCoverageRule>;
}

export interface CarrierRateEvaluationResult {
  carrierId: string;
  carrierName: string;
  countryCode: string;
  regionCode: string;
  deliveryType: "home" | "desk";
  operationalState: OperationalCoverageState;
  destinationStatus: "SUPPORTED" | "UNSUPPORTED";
  serviceTypeStatus: "SUPPORTED" | "UNSUPPORTED" | "DISCONTINUED";
  weightStatus: "OK" | "EXCEEDS_MAX_WEIGHT";
  codEligibilityStatus: "SUPPORTED" | "INELIGIBLE";
  canApplyManualPriceOverride: boolean;
  selectedSource: TariffSourceType | null;
  freshnessStatus: "FRESH" | "STALE" | "EXPIRED" | "UNAVAILABLE";
  isConfirmedPrice: boolean;
  isAutoPreferred: boolean;
  requiresManualSelectionOrRenewal: boolean;
  actualWeightKg: number;
  volumetricWeightKg: number | null;
  billableWeightKg: number;
  weightBasisStatus:
    | "VERIFIED_DIMENSIONAL_WEIGHT"
    | "VERIFIED_DEAD_WEIGHT"
    | "DIMENSIONS_MISSING_PROVISIONAL";
  shippingFee: number | null;
  codFee: number;
  returnFee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  historicalSuccessRatePercent: number;
  lastUpdatedAt: string | null;
  validUntil: string | null;
  statusBadgeText: string;
  statusBadgeTone: "emerald" | "blue" | "amber" | "rose" | "slate";
  warningMessage?: string;
  blockReason?: string;
  staleContractCandidate?: {
    shippingFee: number;
    lastUpdatedAt: string;
    validUntil?: string | null;
  };
}

// ============================================================================
// COD FINANCIAL RECONCILIATION & SETTLEMENT BATCHES (PART 4)
// ============================================================================

export type SettlementLineMatchStatus =
  | "matched"
  | "fee_discrepancy"
  | "amount_discrepancy"
  | "duplicate_already_settled"
  | "partial_settlement"
  | "missing_order";

export interface SettlementRemittanceLine {
  id: string;
  lineHash: string;
  payoutReference: string;
  orderId?: string;
  shipmentId?: string;
  trackingNumber: string;
  customerName?: string;
  expectedCodCollectable: number;
  reportedCollectedCod: number;
  expectedCarrierFees: number;
  reportedCarrierShippingFee: number;
  reportedCarrierCodFee: number;
  reportedReturnFee: number;
  expectedNetPayable: number;
  remittedNetPayout: number;
  discrepancyAmount: number;
  matchStatus: SettlementLineMatchStatus;
  notes?: string;
}

export interface SettlementBatchRecord {
  id: string;
  batchReference: string;
  storeId: string;
  carrierId: string;
  carrierName: string;
  createdAt: string;
  committedAt?: string;
  status: "preview" | "committed" | "partially_settled" | "disputed";
  totalLinesCount: number;
  matchedCount: number;
  discrepancyCount: number;
  duplicateBlockedCount: number;
  totalReportedCollectedCod: number;
  totalReportedCarrierFees: number;
  totalExpectedNetPayout: number;
  totalActualRemittedPayout: number;
  totalDiscrepancyAmount: number;
  lines: SettlementRemittanceLine[];
}

// ============================================================================
// MIGRATION SNAPSHOT & ROLLBACK BUNDLE (PART 7)
// ============================================================================

export interface MigrationSnapshotBundle {
  snapshotId: string;
  storeId: string;
  createdAt: string;
  schemaVersionFrom: 1;
  totalOrderCount: number;
  bundleChecksum: string;
  recordHashesMap: Record<string, string>;
  orders: Order[];
  productStockAndCostSnapshot: Record<
    string,
    {
      stockQuantity: number;
      buyPrice?: number;
      purchasePrice?: number;
    }
  >;
  workspacePreferences: {
    activeMode?: string | null;
    defaultMode?: string | null;
  };
}

// ============================================================================
// STORE VISITOR ANALYTICS & CONVERSION FUNNEL (PART 6)
// ============================================================================

export type VisitorFunnelStage =
  | "visit"
  | "product_view"
  | "add_to_cart"
  | "checkout_started"
  | "order_submitted";

export interface StoreVisitorSession {
  sessionId: string;
  canonicalVisitorId: string;
  previousVisitorId?: string;
  authenticatedUserId?: string | null;
  identityScope: "authenticated_user" | "anonymous_browser_token";
  storeId: string;
  isNewVisitor: boolean;
  startedAt: string;
  lastActivityAt: string;
  durationSeconds: number;
  deviceType: "mobile" | "desktop" | "tablet";
  os: string;
  browser: string;
  trafficSource:
    | "direct"
    | "instagram"
    | "facebook"
    | "tiktok"
    | "google"
    | "whatsapp"
    | "other";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerUrl?: string;
  countryCode?: string;
  regionCode?: string;
  pagesViewed: number;
  viewedProductIds: string[];
  cartedProductIds: string[];
  stagesReached: VisitorFunnelStage[];
  convertedOrderId?: string;
}

export interface CoverTemplateImage {
  src: string;
  bg: string;
  panel?: string;
}

export interface CoverTemplate {
  id: string; // "classic" | "toonhub" | custom IDs
  name: string;
  description: string;
  badgeText: string; // e.g. "3D SHAPE", or if empty, uses selectedStore.name
  images: CoverTemplateImage[];
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  date: string;
  shopperName: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    size?: string;
  };
  quantity: number;
  reason: string;
  reasonDetails?: string;
  deliveryMethod: string;
  refundMethod: string;
  status: "pending" | "approved" | "received" | "completed" | "rejected";
  refundAmount: number;
}

export interface CategoryTemplateField {
  name: string;
  type: "text" | "number" | "boolean" | "select";
  required: boolean;
  options?: string[]; // Used for type="select"
  placeholder?: string;
  unit?: string; // Used for type="number", e.g. "kg", "ml", "cm"
}

export interface CategoryTemplate {
  id: string; // e.g. "Fashion", "Electronics"
  name: string;
  sizeSystem: {
    enabled: boolean;
    label: string; // e.g. "Wearable Sizing Tags"
    sizes: string[]; // e.g. ["XS", "S", "M", "L", "XL"]
  };
  recommendedMaterials: string[]; // e.g. ["Wool", "Organic Cotton"]
  fields: CategoryTemplateField[];
}

export interface MainCategory {
  id: string;
  names: { en: string; ar: string; fr: string; [key: string]: string }; // multi-language names: { en, ar, fr }
  icon: string; // e.g. "Shirt"
  image: string; // Unsplash banner URL or upload
  order: number;
  isArchived?: boolean;
  createdAt?: string;
}

export interface Subcategory {
  id: string;
  mainCategoryId: string;
  names: { en: string; ar: string; fr: string; [key: string]: string }; // multi-language names: { en, ar, fr }
  icon: string;
  image: string;
  order: number;
  isArchived?: boolean;
  sizeSystem: {
    enabled: boolean;
    label: string;
    sizes: string[];
  };
  recommendedMaterials: string[];
  fields: CategoryTemplateField[];
  createdAt?: string;
}

export interface StorefrontAdProductImage {
  name: string;
  img?: string;
  price?: number;
  productId?: string;
  rotation?: string;
  originalProduct?: Product | null;
}

export interface StorefrontAd {
  id: string;
  storeId: string;
  title: string;
  shortDescription: string;
  badge?: string;
  sponsorText?: string;
  ctaText: string;
  destinationLink: string;
  secondaryCtaText?: string;
  secondaryDestinationLink?: string;
  productImages: StorefrontAdProductImage[];
  bgColor?: string;
  accentColor?: string;
  priority?: number;
  clickCount?: number;
  impressionCount?: number;
  isActive?: boolean;
}

export type DomainDestinationType = "store" | "product" | "landing_page";

export type DomainVerificationStatus = "verified" | "pending" | "failed";

export type DomainDnsStatus = "configured" | "pending" | "misconfigured";

export type DomainSslStatus = "active" | "provisioning" | "pending" | "error";

export type DomainConnectionStatus =
  | "active"
  | "pending_verification"
  | "misconfigured"
  | "disconnected";

export interface DomainDnsRecord {
  type: "A" | "CNAME" | "TXT";
  host: string;
  value: string;
  ttl: number;
  verified: boolean;
  purpose: string;
}

export interface CustomDomainRecord {
  id: string;
  merchantId: string; // storeId
  storeName: string;
  domain: string; // e.g. www.mystore.com or shop.mystore.com
  rootDomain: string; // e.g. mystore.com
  isSubdomain: boolean;
  destinationType: DomainDestinationType;
  destinationRefId: string; // storeId, productId, or future landingPageId
  destinationLabel: string;
  destinationPath?: string;
  verificationToken: string;
  verificationStatus: DomainVerificationStatus;
  dnsStatus: DomainDnsStatus;
  sslStatus: DomainSslStatus;
  connectionStatus: DomainConnectionStatus;
  sslAutoRenew: boolean;
  forceHttps: boolean;
  cdnEnabled: boolean;
  cacheStatus: "HIT" | "MISS" | "BYPASS";
  cacheTtlSeconds: number;
  lastCachePurgedAt?: string;
  adCampaignReady: boolean;
  utmPassthrough: boolean;
  pixelForwardingEnabled: boolean;
  supportedAdNetworks: string[];
  dnsRecords: DomainDnsRecord[];
  createdAt: string;
  updatedAt: string;
  lastCheckedAt?: string;
}

export type CanonicalSubscriptionPlanId =
  | "Basic"
  | "Pro"
  | "Pro Plus"
  | "Premium"
  | "Premium Plus";

export type SubscriptionPlanTier =
  | CanonicalSubscriptionPlanId
  | "Free"
  | "Ultimate"
  | "Premium Ultra";

export type MerchantEnforcementState =
  | "active"
  | "warning"
  | "restricted"
  | "suspended"
  | "terminated";

export type RestrictedMerchantCapability =
  | "create_product"
  | "create_products"
  | "edit_product"
  | "campaigns"
  | "launch_ads"
  | "stories"
  | "publish_stories"
  | "custom_domains"
  | "connect_domains"
  | "accept_new_checkouts";

export interface MerchantAppealRecord {
  id?: string;
  appealId: string;
  storeId: string;
  storeName: string;
  submittedAt: string;
  createdAt?: string;
  merchantStatement: string;
  statement?: string;
  contactEmail?: string;
  evidenceSummary?: string;
  status: "pending_review" | "approved" | "rejected";
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  resolutionNotes?: string;
  restoredToState?: MerchantEnforcementState;
}

export interface MerchantEnforcementRecord {
  state: MerchantEnforcementState;
  reason?: string;
  reasonCode: string;
  policyReference: string;
  publicNoticeMessage: string;
  merchantGuidanceMessage: string;
  restrictedCapabilities: RestrictedMerchantCapability[];
  enforcedByAdminId: string;
  enforcedByAdminName: string;
  enforcedByAdminRole: string;
  enforcedAt: string;
  appealStatus: "none" | "pending_review" | "approved" | "rejected";
  appealsHistory: MerchantAppealRecord[];
  appeals?: MerchantAppealRecord[];
}

export interface MerchantEntitlementOverrides {
  maxActiveProducts?: number | "unlimited" | null;
  maxImagesPerProduct?: number | null;
  maxVideosPerProduct?: number | null;
  storySlots?: number | null;
  maxCustomDomains?: number | "unlimited" | null;
  maxStoreCampaigns?: number | "unlimited" | null;
  maxSponsoredAdSlots?: number | "unlimited" | null;
  forceEnableAdvancedOrders?: boolean | null;
  overrideReason?: string;
  updatedByAdmin?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface MerchantSubscriptionMeta {
  planId?: CanonicalSubscriptionPlanId;
  canonicalPlanId?: CanonicalSubscriptionPlanId;
  billingCycle: "monthly" | "annual";
  status?: "active" | "trial" | "trialing" | "past_due" | "expired" | "canceled" | "cancelled";
  billingStatus?: "active" | "trial" | "trialing" | "past_due" | "expired" | "canceled" | "cancelled";
  monthlyPriceDzd?: number;
  trialEndsAt?: string | null;
  currentPeriodEndsAt?: string | null;
  autoRenew?: boolean;
  lastUpdatedByAdmin?: string;
  updatedAt: string;
}

export type PlatformAdminRoleId =
  | "super_admin"
  | "trust_and_safety"
  | "trust_safety"
  | "market_operations"
  | "market_ops"
  | "finance"
  | "marketing_and_ads"
  | "marketing_ads"
  | string;

export type PlatformAdminActionType =
  | "view"
  | "create"
  | "edit"
  | "approve"
  | "suspend"
  | "delete";

export interface PlatformAdminAccount {
  id: string;
  uid: string;
  email: string;
  name: string;
  roleId: PlatformAdminRoleId;
  roleLabel: string;
  assignedMarketIds: string[] | "ALL_MARKETS";
  mfaEnabled: boolean;
  mfaVerifiedSession: boolean;
  mfaVerified: boolean;
  status: "active" | "suspended" | "revoked";
  customPermissions?: Record<string, PlatformAdminActionType[]>;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAuditLogRecord {
  id: string;
  timestamp: string;
  actorUid: string;
  actorName: string;
  actorEmail: string;
  actorRole: PlatformAdminRoleId;
  module: string;
  action: string;
  actionType: string;
  targetEntityType:
    | "store"
    | "product"
    | "plan"
    | "permission"
    | "policy"
    | "market"
    | "campaign"
    | "review"
    | "complaint"
    | "admin"
    | "system";
  targetType: string;
  targetEntityId: string;
  targetId: string;
  targetEntityLabel?: string;
  targetName: string;
  marketScope: string;
  reason: string;
  summary: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  mfaConfirmed: boolean;
  integrityHash: string;
}

export interface BuyerComplaintRecord {
  id: string;
  storeId: string;
  storeName: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  buyerName: string;
  buyerEmail: string;
  category:
    | "counterfeit_or_prohibited"
    | "non_delivery"
    | "misleading_listing"
    | "harassment_or_abuse"
    | "pricing_or_cod_dispute";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  submittedAt: string;
  createdAt: string;
  status:
    | "open"
    | "investigating"
    | "resolved"
    | "resolved_action_taken"
    | "escalated_to_enforcement"
    | "dismissed";
  resolutionNotes?: string;
  resolvedByAdmin?: string;
  resolvedAt?: string;
}

export interface PlatformDomainLimitsConfig {
  enforceSubscriptionLimits: boolean; // False by default in current phase
  planLimits: Record<string, number | "unlimited">;
  cloudflareIntegration: {
    enabled: boolean;
    zoneIdConfigured: boolean;
    customHostnameSsl: boolean;
    edgeCachingEnabled: boolean;
    ddosProtectionLevel: "standard" | "high" | "under_attack";
    rateLimitRps: number;
    cacheTtlSeconds: number;
  };
  updatedAt: string;
}

export type DateRangePreset = "today" | "last_7_days" | "last_30_days" | "custom";

export type AutomaticStoreRanking = "High" | "Medium" | "Low" | "Unranked";

export interface StoreAnalyticsEventRecord {
  eventId: string;
  storeId: string;
  productId?: string | null;
  eventType: "visit" | "product_click";
  visitorHash: string;
  sessionBucket: number;
  dedupKey: string;
  occurredAt: string;
}

export interface StorePerformanceMetrics {
  storeId: string;
  qualifiedOrders: number;
  salesDzd: number;
  publishedProductsCount: number;
  uniqueVisitors: number;
  totalSessions: number;
  productClicks: number;
  uniqueConvertingVisitors: number;
  conversionRatePercent: number | null;
  conversionMethod: "unique_converting_visitors" | "qualified_orders_ratio" | "unavailable";
  conversionUnavailableReason?: string;
  ranking: AutomaticStoreRanking;
  rankingScore: number;
  rankingStage: "stage_1_commerce_baseline" | "stage_2_full_telemetry" | "archived_exempt" | "unranked_insufficient_data";
}

// ============================================================================
// PARTNER PICKS — RECIPROCAL MERCHANT-TO-MERCHANT COLLABORATION SCHEMAS
// (100% independent from future paid advertising, CPC/CPM, campaigns & billing)
// ============================================================================

export type PartnerPickChannelId =
  | "STORE_BANNER"
  | "PRODUCT_GRID"
  | "DISCOVER_MORE"
  | "REELS_FEED"
  | "STORIES";

export type ReelsAssetPresentationStrategy =
  | "AUTO_BEST_ASSET"
  | "ORIGINAL_VIDEO_ONLY"
  | "PRODUCT_IMAGE_SHOWCASE"
  | "NATIVE_SCENE_CARD";

export interface ChannelVisualTokenConfig {
  showPartnerPicksBadge: boolean;
  badgeStyle: "minimal_pill" | "icon_only" | "store_avatar_pill";
  showPartnerStoreAttribution: boolean;
  showHostContextAttribution: boolean;
  showDiscountBadge: boolean;
  showStarRating: boolean;
  cardScaleDesktop: "compact" | "standard";
  cardScaleMobile: "compact" | "standard";
  imageAspectRatio: "native" | "4:5" | "1:1" | "9:16";
  reelsPresentationStrategy?: ReelsAssetPresentationStrategy;
}

export interface ChannelFrequencySettings {
  enabled: boolean;
  minSecondsBetweenAppearances: number;
  maxAppearancesPerSession: number;
  maxAppearancesPerDayPerUser: number;
  minNativeItemsBeforeFirstInsert?: number;
  insertionCadenceNativeItems?: number;
}

export interface IndependentChannelConfig {
  channelId: PartnerPickChannelId;
  enabled: boolean;
  maxDisplayedProducts: number;
  spatialPlacementRules?: {
    allowedBannerSlotIndices?: number[];
    minGridRow?: number;
    maxGridRow?: number;
    maxPartnerCardsPerRow?: number;
    gridPageScope?: "PAGE_1_ONLY" | "ALL_PAGES";
    allowedDiscoverCarouselSlots?: number[];
  };
  sequentialMediaRules?: {
    requireHostStoriesFeatureEnabled?: boolean;
    requireActiveNativeStoryPublished?: boolean;
    forbidStandalonePromotionalStoryRing?: boolean;
    allowMidSequenceInsertion?: boolean;
    allowSequenceTailInsertion?: boolean;
  };
  frequencyLimits: ChannelFrequencySettings;
  rotationOverride: {
    useGlobalRotation: boolean;
    customRotationMode?: "REFRESH_BASED" | "TIMED_ROTATION";
    customTimedIntervalSeconds?: number;
  };
  visualTokens: ChannelVisualTokenConfig;
  fairnessChannelWeight: number;
}

export interface PlanPartnerPicksEntitlement {
  planId: CanonicalSubscriptionPlanId;
  enabled: boolean;
  maxActivePartnerStores: number;
  maxProductsPerPartnership: number;
  allowedChannelsAsSource: Record<PartnerPickChannelId, boolean>;
  allowedChannelsAsHost: Record<PartnerPickChannelId, boolean>;
  allowCustomPerPartnerProducts: boolean;
}

export interface GlobalSmartFrequencyAndFatigueConfig {
  enabled: boolean;
  maxCrossChannelExposuresPerSession: number;
  maxCrossChannelExposuresPerDayPerUser: number;
  sameProductCooldownSeconds: number;
  samePartnerStoreCooldownSeconds: number;
  recentlyViewedProductSuppressionSeconds: number;
  userSpecificSkipDecay: {
    enabled: boolean;
    rapidSkipThresholdMs: number;
    perSkipPriorityMultiplier: number;
    priorityRecoveryHalfLifeMinutes: number;
  };
}

export interface PartnerPicksGlobalConfig {
  id: "global";
  featureEnabled: boolean;
  maxSimultaneousPartnerStores: number;
  defaultRotationMode: "REFRESH_BASED" | "TIMED_ROTATION";
  timedRotationEnabled: boolean;
  timedRotationIntervalSeconds: number;
  channels: Record<PartnerPickChannelId, IndependentChannelConfig>;
  planEntitlements: Record<CanonicalSubscriptionPlanId, PlanPartnerPicksEntitlement>;
  smartFrequency: GlobalSmartFrequencyAndFatigueConfig;
  updatedAt: string;
  updatedByAdminId: string;
}

export interface PartnerPicksGridCoordinate {
  row: number;
  col: number;
}

export interface PartnerPicksStaffPermissions {
  authorizedStaffIds: string[];
  canSendRequests: boolean;
  canAcceptRejectRequests: boolean;
  canManageSharedProducts: boolean;
  canProposeAndSelectPlacements: boolean;
  canFinalApprovePlacements: boolean;
}

export interface MerchantPartnerPicksProfile {
  storeId: string;
  ownerUid?: string;
  defaultSharedProductIds: string[];
  partnershipProductMode: Record<string, "DEFAULT_COMMON" | "CUSTOM_PER_PARTNER">;
  customProductIdsByPartnership: Record<string, string[]>;
  hostChannelConsent: Record<PartnerPickChannelId, boolean>;
  hostSpatialAllowedSlots: {
    bannerSlotIndices: number[];
    gridCoordinates: PartnerPicksGridCoordinate[];
    discoverCarouselIndices: number[];
  };
  hostSequentialMediaConsent: {
    reelsInsertionEnabled: boolean;
    storiesInsertionEnabled: boolean;
  };
  staffPermissions: PartnerPicksStaffPermissions;
  updatedAt: string;
}

export type PartnerPicksPartnershipStatus =
  | "PENDING_REQUEST"
  | "ACCEPTED"
  | "TERMS_PENDING"
  | "PLACEMENT_PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "SUSPENDED";

export interface PartnerPicksAgreementTerms {
  durationDays: number;
  enabledChannelsAOnB: Record<PartnerPickChannelId, boolean>;
  enabledChannelsBOnA: Record<PartnerPickChannelId, boolean>;
  agreedByStoreA: boolean;
  agreedByStoreB: boolean;
  agreedAtStoreA?: string | null;
  agreedAtStoreB?: string | null;
}

export interface PartnerPicksPartnership {
  id: string;
  storeAId: string;
  storeAName: string;
  storeAOwnerUid?: string;
  storeBId: string;
  storeBName: string;
  storeBOwnerUid?: string;
  initiatedByStoreId: string;
  status: PartnerPicksPartnershipStatus;
  requestMessage?: string;
  agreementTerms: PartnerPicksAgreementTerms;
  activatedAt?: string | null;
  expiresAt?: string | null;
  suspendedByAdminId?: string | null;
  suspendedReason?: string | null;
  previousStatusBeforeSuspension?: PartnerPicksPartnershipStatus | null;
  createdAt: string;
  updatedAt: string;
}

export type PlacementTrafficLight = "GREEN" | "YELLOW" | "RED";

export type PlacementLifecycleState =
  | "PROPOSED_AWAITING_HOST_SELECTION"
  | "HOST_SELECTED_AWAITING_FINAL_APPROVAL"
  | "APPROVED_LIVE"
  | "REJECTED_BY_HOST"
  | "REJECTED_BY_PROPOSER"
  | "AUTO_PAUSED_OUT_OF_STOCK"
  | "PAUSED_OWNER_HIDDEN"
  | "PAUSED_OWNER_DISABLED"
  | "PAUSED_OWNER_ARCHIVED"
  | "INVALIDATED_PRODUCT_REMOVED"
  | "SUSPENDED_BY_PLATFORM_ADMIN";

export interface PartnerPickProposedOption {
  optionId: string;
  channelId: PartnerPickChannelId;
  bannerSlotIndex?: number;
  gridCoordinate?: PartnerPicksGridCoordinate;
  discoverCarouselIndex?: number;
  sequentialPositionHint?: "EARLY" | "MID_SEQUENCE" | "TAIL";
  label: string;
}

export interface PartnerPickPlacementActivityEntry {
  id: string;
  timestamp: string;
  actorStoreId: string;
  actorUid?: string;
  actorRole: "SOURCE_MERCHANT" | "HOST_MERCHANT" | "SYSTEM" | "PLATFORM_ADMIN";
  action:
    | "PROPOSED_OPTIONS"
    | "HOST_SELECTED_OPTION"
    | "PROPOSER_FINAL_APPROVED"
    | "REJECTED_BY_HOST"
    | "REJECTED_BY_PROPOSER"
    | "AUTO_PAUSED_OUT_OF_STOCK"
    | "AUTO_RESUMED_IN_STOCK"
    | "PAUSED_OWNER_HIDDEN"
    | "PAUSED_OWNER_DISABLED"
    | "PAUSED_OWNER_ARCHIVED"
    | "INVALIDATED_PRODUCT_REMOVED"
    | "SUSPENDED_BY_ADMIN"
    | "REINSTATED_BY_ADMIN";
  selectedOptionId?: string | null;
  note?: string;
}

export interface PartnerPickProductPlacement {
  id: string;
  partnershipId: string;
  sourceStoreId: string;
  sourceStoreOwnerUid?: string;
  hostStoreId: string;
  hostStoreOwnerUid?: string;
  productId: string;
  channelId: PartnerPickChannelId;
  proposedOptions: PartnerPickProposedOption[];
  selectedOptionId: string | null;
  selectedOption: PartnerPickProposedOption | null;
  hostSelectedAt?: string | null;
  proposerFinalApproved: boolean;
  proposerFinalApprovedAt?: string | null;
  trafficLight: PlacementTrafficLight;
  lifecycleState: PlacementLifecycleState;
  activityHistory: PartnerPickPlacementActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PartnerPickChannelExposureCounters {
  opportunities: number;
  impressions: number;
  uniqueReach: number;
  clicks: number;
  skips: number;
  weightedScore: number;
  activeExposureDurationSeconds: number;
}

export interface PartnerPickDirectionalExposureSummary {
  sourceStoreId: string;
  hostStoreId: string;
  byChannel: Record<PartnerPickChannelId, PartnerPickChannelExposureCounters>;
  totalOpportunities: number;
  totalImpressions: number;
  totalUniqueReach: number;
  totalClicks: number;
  totalSkips: number;
  totalWeightedScore: number;
  opportunityFillRatePercent: number;
}

export interface PartnerPicksBidirectionalExposureLedger {
  partnershipId: string;
  storeAId: string;
  storeBId: string;
  directionAOnB: PartnerPickDirectionalExposureSummary;
  directionBOnA: PartnerPickDirectionalExposureSummary;
  updatedAt: string;
}

export type PartnerPickAnalyticsEventType =
  | "opportunity"
  | "impression"
  | "click"
  | "skip"
  | "original_product_open";

export interface PartnerPicksChannelAnalyticsEvent {
  id: string;
  idempotencyKey: string;
  partnershipId: string;
  placementId: string;
  hostStoreId: string;
  sourceStoreId: string;
  channelId: PartnerPickChannelId;
  productId: string;
  eventType: PartnerPickAnalyticsEventType;
  visitorHash: string;
  rotationEpoch: number;
  exposureDurationMs?: number;
  timestamp: string;
}
