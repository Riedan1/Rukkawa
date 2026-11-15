import fs from "fs";
import path from "path";

function getDataDir(): string {
  return process.env.YUME_DATA_DIR
    ? path.resolve(process.env.YUME_DATA_DIR)
    : path.join(process.cwd(), "data");
}

function getDbFilePath(): string {
  return path.join(getDataDir(), "local-db.json");
}

function getTmpFilePath(): string {
  return path.join(getDataDir(), "local-db.tmp.json");
}

export interface ApiIdempotencyRecord {
  idempotencyKey: string;
  endpointScope: string;
  actorScope: string;
  payloadSha256: string;
  status: "IN_PROGRESS" | "COMPLETED";
  resourceId: string | null;
  responseStatus: number | null;
  responseBody: any | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface InventoryLedgerMovementRecord {
  movementId: string;
  idempotencyKey: string;
  productId: string;
  variantId: string | null;
  orderId: string | null;
  lineItemId: string | null;
  shipmentItemId: string | null;
  returnEventId: string | null;
  movementType:
    | "ORDER_RESERVE"
    | "SHIPMENT_DISPATCH_COMMIT"
    | "UNSHIPPED_CANCEL_RELEASE"
    | "COURIER_LOSS_CLAIM_WRITEOFF"
    | "COURIER_DAMAGE_REPORTED_IN_TRANSIT"
    | "COURIER_DAMAGE_CLAIM_SETTLED_UNRETURNED"
    | "RETURN_RESTOCK_INTACT"
    | "RETURN_DAMAGED_WRITEOFF"
    | "MANUAL_ADJUSTMENT";
  deltaSellableStock: number;
  deltaReservedStock: number;
  deltaDamagedStock: number;
  deltaCourierLostStock: number;
  deltaCourierDamagedUnreturnedStock: number;
  createdAt: string;
}

export interface ShipmentLineItemRecord {
  shipmentItemId: string;
  shipmentId: string;
  orderId: string;
  storeId: string;
  lineItemId: string;
  productId: string;
  variantId: string | null;
  quantityOrdered: number;
  quantityAllocated: number;
  quantityDeallocated: number;
  quantityShipped: number;
  quantityDelivered: number;
  quantityLostByCourier: number;
  quantityCourierDamagedReported: number;
  quantityCourierDamagedReceived: number;
  quantityCourierDamagedSettledUnreturned: number;
  quantityReturnedByCustomer: number;
  quantityCustomerReturnReceived: number;
  quantityReturnedResellable: number;
  quantityReturnedDamaged: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentDispatchBatchRecord {
  dispatchBatchId: string;
  shipmentItemId: string;
  shipmentId: string;
  orderId: string;
  storeId: string;
  lineItemId: string;
  batchSequenceNumber: number;
  idempotencyKey: string;
  quantityDispatched: number;
  carrierManifestRef: string | null;
  dispatchedByActorId: string;
  dispatchedAt: string;
}

export interface ShipmentReturnEventRecord {
  returnEventId: string;
  idempotencyKey: string;
  payloadSha256: string;
  shipmentItemId: string;
  shipmentId: string;
  orderId: string;
  storeId: string;
  lineItemId: string;
  eventType:
    | "COURIER_DELIVERED"
    | "COURIER_LOST_PRE_DELIVERY"
    | "COURIER_DAMAGED_PRE_DELIVERY"
    | "MERCHANT_WAREHOUSE_RECEIVED_COURIER_DAMAGED"
    | "COURIER_DAMAGED_SETTLED_UNRETURNED"
    | "CUSTOMER_RETURN_INITIATED"
    | "MERCHANT_WAREHOUSE_RECEIVED_CUSTOMER_RETURN"
    | "QC_APPROVED_RESELLABLE"
    | "QC_REJECTED_DAMAGED";
  quantityDelta: number;
  actorId: string;
  reasonCode: string | null;
  createdAt: string;
}

export interface SubscriptionPlanGovernanceRecord {
  planCode: string;
  displayName: string;
  tierClassification: "launch_free" | "commercial_paid";
  lifecycleState: "active" | "hidden" | "disabled" | "retired";
  isPubliclyVisible: boolean;
  allowNewSubscriptions: boolean;
  allowUpgradesTo: boolean;
  monthlyDzd: number;
  annualDzd: number;
  monthlyUsd: number;
  sortOrder: number;
  entitlements: {
    maxActiveProducts: number | null;
    maxPhotosPerProduct: number;
    maxFileSizeMb: number;
    allowVideoStream: boolean;
    maxCustomDomains: number | null;
  };
  updatedAt: string;
}

export interface PlanMigrationPolicyRecord {
  policyId: string;
  retiredPlanCode: string;
  targetPlanCode: string;
  gracePeriodDays: number;
  preserveExistingResources: true;
  createdBy: string;
  createdAt: string;
}

export interface SubscriptionGovernanceState {
  launchMode: "FREE_ONLY" | "SELECTIVE_PAID" | "FULL_COMMERCIAL" | "CUSTOM";
  paidUpgradesEnabled: boolean;
  autoLaunchExpiration: string | null;
  defaultSignupPlanCode: string;
  plans: SubscriptionPlanGovernanceRecord[];
  migrationPolicies: PlanMigrationPolicyRecord[];
  merchantSubscriptions: Record<
    string,
    {
      subscriptionId: string;
      storeId: string;
      planCode: string;
      status: "active" | "grace_period" | "expired";
      overQuotaFlags: Record<
        string,
        { active: number; limit: number; excess: number; action: "CREATION_GATED_EXISTING_PRESERVED" }
      >;
      assignedAt: string;
      updatedAt: string;
    }
  >;
  updatedAt: string;
}

export interface ClusterFencingState {
  primaryEpoch: number;
  fencingStatus: "ACTIVE_PRIMARY" | "SAFE_NON_WRITABLE_FAIL_CLOSED";
  activePrimaryNode: string;
  activeRegionCode: string;
  standbyNode: string;
  standbyRegionCode: string;
  standbyMode: "warm_standby" | "cold_standby" | "active_scalable";
  lastStonithAttestation: {
    epoch: number;
    stonithConfirmed: boolean;
    oobChannel: string | null;
    powerStateReadback: string | null;
    attestedAt: string;
    reason: string;
  } | null;
  fencedNodes: Array<{
    nodeId: string;
    fencedAtEpoch: number;
    state: "READ_ONLY_FOLLOWER" | "FENCED_STALE_PRIMARY";
    timestamp: string;
  }>;
  lastLeaseRenewedAt: string;
  lastFailoverDrillAt: string | null;
  lastFailoverRtoMs: number | null;
}

export interface ServerStoreAnalyticsEvent {
  eventId: string;
  storeId: string;
  productId: string | null;
  eventType: "visit" | "product_click";
  visitorHash: string;
  sessionBucket: number;
  dedupKey: string;
  occurredAt: string;
}

export interface LocalDbSchema {
  users: any[];
  stores: any[];
  products: any[];
  orders: any[];
  coupons: any[];
  shipments: any[];
  domains: any[];
  returns?: any[];
  analyticsEvents?: ServerStoreAnalyticsEvent[];
  apiIdempotencyRecords?: ApiIdempotencyRecord[];
  inventoryLedger?: InventoryLedgerMovementRecord[];
  shipmentLineItems?: ShipmentLineItemRecord[];
  shipmentDispatchBatches?: ShipmentDispatchBatchRecord[];
  shipmentReturnEvents?: ShipmentReturnEventRecord[];
  mediaAssets?: any[];
  piiSpool?: any[];
  subscriptionGovernance?: SubscriptionGovernanceState;
  clusterFencingState?: ClusterFencingState;
  domainSettings?: {
    enforceSubscriptionLimits: boolean;
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
  };
  deliverySettings: {
    yalidineApiKey?: string;
    yalidineApiToken?: string;
    zrExpressToken?: string;
    defaultOriginWilayaId?: number;
    hourlyPollingEnabled: boolean;
    autoAssignCarrier: boolean;
  };
  governanceState?: {
    permissionsConfig?: any;
    featureConfig?: any;
    subscriptionLifecyclePolicy?: any;
    adminAccounts?: any[];
    auditLogs?: any[];
    storeEnforcements?: Record<string, any>;
    securityEpoch?: number;
    updatedAt?: string;
  };
  lastUpdated: string;
}

export function createDefaultSubscriptionGovernance(): SubscriptionGovernanceState {
  const now = new Date().toISOString();
  return {
    launchMode: "FREE_ONLY",
    paidUpgradesEnabled: false,
    autoLaunchExpiration: null,
    defaultSignupPlanCode: "Free",
    plans: [
      {
        planCode: "Free",
        displayName: "Free Launch Tier",
        tierClassification: "launch_free",
        lifecycleState: "active",
        isPubliclyVisible: true,
        allowNewSubscriptions: true,
        allowUpgradesTo: false,
        monthlyDzd: 0,
        annualDzd: 0,
        monthlyUsd: 0,
        sortOrder: 0,
        entitlements: {
          maxActiveProducts: 25,
          maxPhotosPerProduct: 3,
          maxFileSizeMb: 5,
          allowVideoStream: false,
          maxCustomDomains: 0,
        },
        updatedAt: now,
      },
      {
        planCode: "Basic",
        displayName: "Basic",
        tierClassification: "commercial_paid",
        lifecycleState: "hidden",
        isPubliclyVisible: false,
        allowNewSubscriptions: false,
        allowUpgradesTo: false,
        monthlyDzd: 1900,
        annualDzd: 19000,
        monthlyUsd: 9,
        sortOrder: 1,
        entitlements: {
          maxActiveProducts: 50,
          maxPhotosPerProduct: 5,
          maxFileSizeMb: 8,
          allowVideoStream: false,
          maxCustomDomains: 0,
        },
        updatedAt: now,
      },
      {
        planCode: "Pro",
        displayName: "Pro",
        tierClassification: "commercial_paid",
        lifecycleState: "hidden",
        isPubliclyVisible: false,
        allowNewSubscriptions: false,
        allowUpgradesTo: false,
        monthlyDzd: 4900,
        annualDzd: 49000,
        monthlyUsd: 24,
        sortOrder: 2,
        entitlements: {
          maxActiveProducts: 250,
          maxPhotosPerProduct: 8,
          maxFileSizeMb: 15,
          allowVideoStream: true,
          maxCustomDomains: 1,
        },
        updatedAt: now,
      },
      {
        planCode: "Pro Plus",
        displayName: "Pro Plus",
        tierClassification: "commercial_paid",
        lifecycleState: "hidden",
        isPubliclyVisible: false,
        allowNewSubscriptions: false,
        allowUpgradesTo: false,
        monthlyDzd: 8900,
        annualDzd: 89000,
        monthlyUsd: 44,
        sortOrder: 3,
        entitlements: {
          maxActiveProducts: 1000,
          maxPhotosPerProduct: 12,
          maxFileSizeMb: 25,
          allowVideoStream: true,
          maxCustomDomains: 3,
        },
        updatedAt: now,
      },
      {
        planCode: "Premium",
        displayName: "Premium",
        tierClassification: "commercial_paid",
        lifecycleState: "hidden",
        isPubliclyVisible: false,
        allowNewSubscriptions: false,
        allowUpgradesTo: false,
        monthlyDzd: 14900,
        annualDzd: 149000,
        monthlyUsd: 74,
        sortOrder: 4,
        entitlements: {
          maxActiveProducts: 5000,
          maxPhotosPerProduct: 15,
          maxFileSizeMb: 50,
          allowVideoStream: true,
          maxCustomDomains: 10,
        },
        updatedAt: now,
      },
      {
        planCode: "Premium Plus",
        displayName: "Premium Plus",
        tierClassification: "commercial_paid",
        lifecycleState: "hidden",
        isPubliclyVisible: false,
        allowNewSubscriptions: false,
        allowUpgradesTo: false,
        monthlyDzd: 24900,
        annualDzd: 249000,
        monthlyUsd: 129,
        sortOrder: 5,
        entitlements: {
          maxActiveProducts: null,
          maxPhotosPerProduct: 20,
          maxFileSizeMb: 100,
          allowVideoStream: true,
          maxCustomDomains: null,
        },
        updatedAt: now,
      },
    ],
    migrationPolicies: [],
    merchantSubscriptions: {},
    updatedAt: now,
  };
}

export function createDefaultClusterFencingState(): ClusterFencingState {
  return {
    primaryEpoch: 14,
    fencingStatus: "ACTIVE_PRIMARY",
    activePrimaryNode: process.env.YUME_NODE_ID || "node-alg-01 (Ryzen 9 / 128GB ECC / NVMe RAID-10)",
    activeRegionCode: process.env.YUME_REGION_CODE || "dz-algiers-1",
    standbyNode: process.env.YUME_STANDBY_NODE_ID || "node-fra-01 (Frankfurt Warm Standby)",
    standbyRegionCode: process.env.YUME_STANDBY_REGION_CODE || "eu-fra-01",
    standbyMode: "warm_standby",
    lastStonithAttestation: null,
    fencedNodes: [],
    lastLeaseRenewedAt: new Date().toISOString(),
    lastFailoverDrillAt: null,
    lastFailoverRtoMs: null,
  };
}

const DEFAULT_DB: LocalDbSchema = {
  users: [],
  stores: [],
  products: [],
  orders: [],
  coupons: [],
  returns: [],
  analyticsEvents: [],
  apiIdempotencyRecords: [],
  inventoryLedger: [],
  shipmentLineItems: [],
  shipmentDispatchBatches: [],
  shipmentReturnEvents: [],
  mediaAssets: [],
  piiSpool: [],
  subscriptionGovernance: createDefaultSubscriptionGovernance(),
  clusterFencingState: createDefaultClusterFencingState(),
  shipments: [
    {
      trackingNumber: "YAL-781920-DZ",
      carrier: "yalidine",
      carrierServiceType: "home_delivery",
      orderId: "ORD-2026-9812",
      currentStatus: "IN_TRANSIT",
      statusLabel_ar: "قيد النقل بين المراكز الجهوية",
      statusLabel_fr: "En transit vers le centre régional",
      lastUpdated: new Date().toISOString(),
      origin: { wilayaId: 16, wilayaName: "Alger" },
      destination: { wilayaId: 31, wilayaName: "Oran", commune: "Es Senia" },
      codAmountDzd: 8400,
      recipient: {
        name: "Yassine Mansouri",
        phone: "+213550123456",
        address: "Cité 500 Logements, Bâtiment B, Oran",
      },
      events: [
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: "LABEL_GENERATED",
          location: "Alger (Centre)",
          description: "Bordereau créé par le vendeur",
        },
        {
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          status: "PICKED_UP",
          location: "Hub Oued Smar",
          description: "Colis pris en charge par l'agence Yalidine",
        },
        {
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          status: "IN_TRANSIT",
          location: "Centre de Tri Régional Chlef",
          description: "Colis expédié vers la wilaya de destination",
        },
      ],
    },
    {
      trackingNumber: "ZRX-409182-DZ",
      carrier: "zr_express",
      carrierServiceType: "stop_desk",
      orderId: "ORD-2026-7734",
      currentStatus: "OUT_FOR_DELIVERY",
      statusLabel_ar: "جاهز للاستلام بالمكتب (Stop Desk)",
      statusLabel_fr: "Disponible au bureau de retrait ZR Express",
      lastUpdated: new Date().toISOString(),
      origin: { wilayaId: 16, wilayaName: "Alger" },
      destination: { wilayaId: 25, wilayaName: "Constantine", commune: "Sidi Mabrouk" },
      codAmountDzd: 6200,
      recipient: {
        name: "Amina Zeroual",
        phone: "+213661987654",
        address: "Bureau ZR Express Sidi Mabrouk",
      },
      events: [
        {
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          status: "LABEL_GENERATED",
          location: "Alger Hub",
          description: "Étiquette créée",
        },
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: "IN_TRANSIT",
          location: "Constantine Entrepôt",
          description: "Arrivé à Constantine",
        },
        {
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: "OUT_FOR_DELIVERY",
          location: "Bureau Stop Desk Sidi Mabrouk",
          description: "Colis prêt au guichet",
        },
      ],
    },
  ],
  deliverySettings: {
    yalidineApiKey: "",
    yalidineApiToken: "",
    zrExpressToken: "",
    defaultOriginWilayaId: 16,
    hourlyPollingEnabled: true,
    autoAssignCarrier: true,
  },
  domains: [],
  domainSettings: {
    enforceSubscriptionLimits: true,
    planLimits: {
      Free: 0,
      Basic: 0,
      Pro: 1,
      "Pro Plus": 3,
      Premium: 10,
      "Premium Plus": "unlimited",
    },
    cloudflareIntegration: {
      enabled: true,
      zoneIdConfigured: true,
      customHostnameSsl: true,
      edgeCachingEnabled: true,
      ddosProtectionLevel: "high",
      rateLimitRps: 250,
      cacheTtlSeconds: 3600,
    },
    updatedAt: new Date().toISOString(),
  },
  lastUpdated: new Date().toISOString(),
};

let cachedDb: LocalDbSchema | null = null;
let lastPersistedDb: LocalDbSchema | null = null;
let loadedFromDataDir: string | null = null;
let writeQueue: Promise<void> = Promise.resolve();
let flushTimer: NodeJS.Timeout | null = null;
let pendingFlushResolvers: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

const collectionIndexMap = new Map<string, Map<string, any>>();

const dbMetrics = {
  totalReads: 0,
  cacheHits: 0,
  diskReads: 0,
  indexLookups: 0,
  indexHits: 0,
  totalWriteRequests: 0,
  coalescedDiskFlushes: 0,
  failedDiskFlushes: 0,
  corruptQuarantineCount: 0,
  lastFlushDurationMs: 0,
  lastFlushAt: new Date().toISOString(),
  fileSizeBytes: 0,
};

function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDbDefaults(parsed: any): LocalDbSchema {
  if (!Array.isArray(parsed.stores)) parsed.stores = [];
  if (!Array.isArray(parsed.products)) parsed.products = [];
  if (!Array.isArray(parsed.orders)) parsed.orders = [];
  if (!Array.isArray(parsed.shipments)) parsed.shipments = [];
  if (!Array.isArray(parsed.coupons)) parsed.coupons = [];
  if (!Array.isArray(parsed.users)) parsed.users = [];
  if (!Array.isArray(parsed.domains)) parsed.domains = [];
  if (!Array.isArray(parsed.returns)) parsed.returns = [];
  if (!Array.isArray(parsed.apiIdempotencyRecords)) parsed.apiIdempotencyRecords = [];
  if (!Array.isArray(parsed.inventoryLedger)) parsed.inventoryLedger = [];
  if (!Array.isArray(parsed.shipmentLineItems)) parsed.shipmentLineItems = [];
  if (!Array.isArray(parsed.shipmentDispatchBatches)) parsed.shipmentDispatchBatches = [];
  if (!Array.isArray(parsed.shipmentReturnEvents)) parsed.shipmentReturnEvents = [];
  if (!Array.isArray(parsed.mediaAssets)) parsed.mediaAssets = [];
  if (!Array.isArray(parsed.piiSpool)) parsed.piiSpool = [];
  if (!parsed.subscriptionGovernance) {
    parsed.subscriptionGovernance = createDefaultSubscriptionGovernance();
  }
  if (!parsed.clusterFencingState) {
    parsed.clusterFencingState = createDefaultClusterFencingState();
  }
  if (!parsed.domainSettings) {
    parsed.domainSettings = cloneSnapshot(DEFAULT_DB.domainSettings);
  }
  return parsed as LocalDbSchema;
}

function rebuildCollectionIndex(collectionName: string, list: any[]) {
  const idxMap = new Map<string, any>();
  if (Array.isArray(list)) {
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      if (item.id) idxMap.set(String(item.id), item);
      if (item.trackingNumber) idxMap.set(String(item.trackingNumber), item);
      if (item.orderId) idxMap.set(String(item.orderId), item);
      if (item.email) idxMap.set(String(item.email), item);
      if (item.shipmentId) idxMap.set(String(item.shipmentId), item);
    }
  }
  collectionIndexMap.set(collectionName, idxMap);
}

function rebuildAllIndexes(db: LocalDbSchema) {
  const cols: CollectionName[] = [
    "users",
    "stores",
    "products",
    "orders",
    "coupons",
    "shipments",
    "domains",
  ];
  for (const c of cols) {
    rebuildCollectionIndex(c, (db as any)[c] || []);
  }
}

export function resetLocalDbCache(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  cachedDb = null;
  lastPersistedDb = null;
  loadedFromDataDir = null;
  collectionIndexMap.clear();
}

export function getDbPerformanceMetrics() {
  const db = loadDatabase();
  let indexedDocumentsCount = 0;
  for (const map of collectionIndexMap.values()) {
    indexedDocumentsCount += map.size;
  }
  const writeSavedPct =
    dbMetrics.totalWriteRequests > 1 && dbMetrics.coalescedDiskFlushes > 0
      ? Math.max(
          0,
          Number(
            (
              ((dbMetrics.totalWriteRequests - dbMetrics.coalescedDiskFlushes) /
                dbMetrics.totalWriteRequests) *
              100
            ).toFixed(1)
          )
        )
      : 0;
  return {
    ...dbMetrics,
    engine: process.env.DB_AUTHORITY === "postgres16" ? "postgres16_authoritative" : "local_json_fsync_transactional",
    cacheInitialized: cachedDb !== null,
    pendingFlush: flushTimer !== null,
    indexedCollectionsCount: collectionIndexMap.size,
    indexedDocumentsCount,
    indexedO1Hits: dbMetrics.indexHits,
    linearScanFallbacks: Math.max(0, dbMetrics.indexLookups - dbMetrics.indexHits),
    totalWritesRequested: dbMetrics.totalWriteRequests,
    writeAmplificationReductionPct: writeSavedPct,
    avgFlushDurationMs: dbMetrics.lastFlushDurationMs,
    cacheHitRatioPercent:
      dbMetrics.totalReads > 0
        ? Number(((dbMetrics.cacheHits / dbMetrics.totalReads) * 100).toFixed(2))
        : 100,
    writeCoalescingRatio:
      dbMetrics.coalescedDiskFlushes > 0
        ? Number((dbMetrics.totalWriteRequests / dbMetrics.coalescedDiskFlushes).toFixed(2))
        : 1,
    collectionCounts: {
      users: db.users?.length || 0,
      stores: db.stores?.length || 0,
      products: db.products?.length || 0,
      orders: db.orders?.length || 0,
      coupons: db.coupons?.length || 0,
      shipments: db.shipments?.length || 0,
      domains: db.domains?.length || 0,
      auditLogs: db.governanceState?.auditLogs?.length || 0,
      inventoryLedger: db.inventoryLedger?.length || 0,
      apiIdempotencyRecords: db.apiIdempotencyRecords?.length || 0,
    },
  };
}

function ensureDataDir(): string {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function fsyncDirectoryBestEffort(dirPath: string): void {
  try {
    const fd = fs.openSync(dirPath, "r");
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    // Some virtual filesystems forbid fsync on directories; file fsync already completed.
  }
}

async function atomicWriteAndFsync(serialized: string): Promise<void> {
  const dataDir = ensureDataDir();
  const tmpFile = getTmpFilePath();
  const dbFile = getDbFilePath();

  const fh = await fs.promises.open(tmpFile, "w", 0o600);
  try {
    await fh.writeFile(serialized, "utf-8");
    await fh.sync();
  } finally {
    await fh.close();
  }
  await fs.promises.rename(tmpFile, dbFile);
  fsyncDirectoryBestEffort(dataDir);
}

function atomicWriteAndFsyncSync(serialized: string): void {
  const dataDir = ensureDataDir();
  const tmpFile = getTmpFilePath();
  const dbFile = getDbFilePath();

  const fd = fs.openSync(tmpFile, "w", 0o600);
  try {
    fs.writeFileSync(fd, serialized, "utf-8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpFile, dbFile);
  fsyncDirectoryBestEffort(dataDir);
}

export function loadDatabase(): LocalDbSchema {
  const currentDir = getDataDir();
  if (loadedFromDataDir && loadedFromDataDir !== currentDir) {
    resetLocalDbCache();
  }

  dbMetrics.totalReads++;
  if (cachedDb) {
    dbMetrics.cacheHits++;
    return cachedDb;
  }

  dbMetrics.diskReads++;
  ensureDataDir();
  const dbFile = getDbFilePath();

  if (!fs.existsSync(dbFile)) {
    const fresh = cloneSnapshot(DEFAULT_DB);
    saveDatabaseSync(fresh);
    loadedFromDataDir = currentDir;
    lastPersistedDb = cloneSnapshot(fresh);
    cachedDb = fresh;
    rebuildAllIndexes(cachedDb);
    return cachedDb;
  }

  try {
    const raw = fs.readFileSync(dbFile, "utf-8");
    dbMetrics.fileSizeBytes = Buffer.byteLength(raw, "utf-8");
    const parsed = normalizeDbDefaults(JSON.parse(raw));
    loadedFromDataDir = currentDir;
    lastPersistedDb = cloneSnapshot(parsed);
    cachedDb = parsed;
    rebuildAllIndexes(cachedDb);
    return cachedDb;
  } catch (err) {
    // Quarantine corrupt file for forensics instead of silently wiping data
    dbMetrics.corruptQuarantineCount += 1;
    try {
      if (fs.existsSync(dbFile)) {
        const quarantinePath = path.join(
          currentDir,
          `local-db.corrupt.${Date.now()}.json`
        );
        fs.renameSync(dbFile, quarantinePath);
        console.error(`[LocalDb] Quarantined corrupt DB file to ${quarantinePath}:`, err);
      }
    } catch (qErr) {
      console.error("[LocalDb] Failed to quarantine corrupt DB file:", qErr);
    }
    const fresh = cloneSnapshot(DEFAULT_DB);
    saveDatabaseSync(fresh);
    loadedFromDataDir = currentDir;
    lastPersistedDb = cloneSnapshot(fresh);
    cachedDb = fresh;
    rebuildAllIndexes(cachedDb);
    return cachedDb;
  }
}

function saveDatabaseSync(data: LocalDbSchema): void {
  const start = performance.now();
  data.lastUpdated = new Date().toISOString();
  const serialized = JSON.stringify(data, null, 2);
  atomicWriteAndFsyncSync(serialized);
  dbMetrics.fileSizeBytes = Buffer.byteLength(serialized, "utf-8");
  dbMetrics.coalescedDiskFlushes++;
  dbMetrics.lastFlushDurationMs = Number((performance.now() - start).toFixed(2));
  dbMetrics.lastFlushAt = data.lastUpdated;
  lastPersistedDb = cloneSnapshot(data);
  cachedDb = data;
}

/**
 * Immediate fsync-guaranteed transactional write with automatic memory & index rollback on I/O failure.
 */
export async function saveDatabaseImmediate(data: LocalDbSchema): Promise<void> {
  dbMetrics.totalWriteRequests++;
  const normalized = normalizeDbDefaults(data);
  normalized.lastUpdated = new Date().toISOString();
  const serialized = JSON.stringify(normalized, null, 2);

  const run = writeQueue.then(async () => {
    const start = performance.now();
    try {
      await atomicWriteAndFsync(serialized);
      cachedDb = normalized;
      lastPersistedDb = cloneSnapshot(normalized);
      rebuildAllIndexes(normalized);
      dbMetrics.fileSizeBytes = Buffer.byteLength(serialized, "utf-8");
      dbMetrics.coalescedDiskFlushes++;
      dbMetrics.lastFlushDurationMs = Number((performance.now() - start).toFixed(2));
      dbMetrics.lastFlushAt = normalized.lastUpdated;
    } catch (err) {
      dbMetrics.failedDiskFlushes++;
      // Roll back in-memory cache & indexes to last durably persisted snapshot
      if (lastPersistedDb) {
        cachedDb = cloneSnapshot(lastPersistedDb);
        rebuildAllIndexes(cachedDb);
      } else {
        cachedDb = null;
      }
      throw err;
    }
  });

  writeQueue = run.catch(() => undefined);
  return run;
}

/**
 * Coalesced Atomic fsync Persistence:
 * Coalesces burst writes within 40ms into one fsync()+rename(), propagates errors to all awaiting callers,
 * and rolls back in-memory cache + O(1) indexes on any disk write failure (never resolves on failed write).
 */
export async function saveDatabase(data: LocalDbSchema): Promise<void> {
  dbMetrics.totalWriteRequests++;
  const normalized = normalizeDbDefaults(data);
  normalized.lastUpdated = new Date().toISOString();
  cachedDb = normalized;
  rebuildAllIndexes(normalized);

  return new Promise<void>((resolve, reject) => {
    pendingFlushResolvers.push({ resolve, reject });
    if (flushTimer) return;

    flushTimer = setTimeout(() => {
      flushTimer = null;
      const resolvers = pendingFlushResolvers.splice(0, pendingFlushResolvers.length);
      const snapshotToWrite = cloneSnapshot(cachedDb || normalized);

      const job = writeQueue.then(async () => {
        const start = performance.now();
        try {
          const serialized = JSON.stringify(snapshotToWrite, null, 2);
          await atomicWriteAndFsync(serialized);
          lastPersistedDb = cloneSnapshot(snapshotToWrite);
          dbMetrics.fileSizeBytes = Buffer.byteLength(serialized, "utf-8");
          dbMetrics.coalescedDiskFlushes++;
          dbMetrics.lastFlushDurationMs = Number((performance.now() - start).toFixed(2));
          dbMetrics.lastFlushAt = snapshotToWrite.lastUpdated;
          for (const r of resolvers) r.resolve();
        } catch (err) {
          dbMetrics.failedDiskFlushes++;
          if (lastPersistedDb) {
            cachedDb = cloneSnapshot(lastPersistedDb);
            rebuildAllIndexes(cachedDb);
          } else {
            cachedDb = null;
          }
          for (const r of resolvers) r.reject(err);
        }
      });

      writeQueue = job.catch(() => undefined);
    }, 40);
  });
}

export function getLastPersistedSnapshot(): LocalDbSchema | null {
  return lastPersistedDb ? cloneSnapshot(lastPersistedDb) : null;
}

export type CollectionName =
  | "users"
  | "stores"
  | "products"
  | "orders"
  | "coupons"
  | "shipments"
  | "domains";

export async function getCollection(collectionName: keyof LocalDbSchema): Promise<any> {
  const db = loadDatabase();
  return db[collectionName] || [];
}

export async function getDocumentById(
  collectionName: CollectionName,
  id: string
): Promise<any | null> {
  loadDatabase();
  dbMetrics.indexLookups++;
  const idxMap = collectionIndexMap.get(collectionName);
  if (idxMap && idxMap.has(String(id))) {
    dbMetrics.indexHits++;
    return idxMap.get(String(id)) || null;
  }
  const list = await getCollection(collectionName);
  if (!Array.isArray(list)) return null;
  return (
    list.find(
      (item: any) =>
        item.id === id ||
        item.trackingNumber === id ||
        item.orderId === id ||
        item.email === id ||
        item.shipmentId === id
    ) || null
  );
}

export async function insertDocument(collectionName: CollectionName, doc: any): Promise<any> {
  const db = loadDatabase();
  const list = ((db as any)[collectionName] as any[]) || [];

  if (!doc.id && !doc.trackingNumber) {
    doc.id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  doc.createdAt = doc.createdAt || new Date().toISOString();
  doc.updatedAt = new Date().toISOString();

  const existingIdx = list.findIndex(
    (item) =>
      (item.id && item.id === doc.id) ||
      (item.trackingNumber && item.trackingNumber === doc.trackingNumber)
  );
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...doc };
  } else {
    list.unshift(doc);
  }

  (db as any)[collectionName] = list;
  await saveDatabase(db);
  return doc;
}

export async function updateDocument(
  collectionName: CollectionName,
  id: string,
  patch: any
): Promise<any | null> {
  const db = loadDatabase();
  const list = ((db as any)[collectionName] as any[]) || [];
  const idx = list.findIndex(
    (item) => item.id === id || item.trackingNumber === id || item.orderId === id
  );
  if (idx === -1) return null;

  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  (db as any)[collectionName] = list;
  await saveDatabase(db);
  return list[idx];
}

export async function deleteDocument(
  collectionName: CollectionName,
  id: string
): Promise<boolean> {
  const db = loadDatabase();
  const list = ((db as any)[collectionName] as any[]) || [];
  const initialLen = list.length;
  (db as any)[collectionName] = list.filter(
    (item) => item.id !== id && item.trackingNumber !== id && item.orderId !== id
  );
  if ((db as any)[collectionName].length !== initialLen) {
    await saveDatabase(db);
    return true;
  }
  return false;
}

let txChain: Promise<unknown> = Promise.resolve();

export async function withSerializedTransaction<
  O extends { commit: boolean; result: any }
>(
  fn: (db: LocalDbSchema) => Promise<O> | O
): Promise<O["result"]> {
  const exec = txChain.then(async () => {
    const live = loadDatabase();
    const working = cloneSnapshot(live);
    const outcome = await fn(working);
    if (outcome.commit) {
      await saveDatabaseImmediate(working);
    }
    return outcome.result;
  });
  txChain = exec.catch(() => undefined);
  return exec;
}

