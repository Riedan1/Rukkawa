/**
 * YUME Network — Phase 3.1 Location-Independent Sovereign Cluster Configuration
 *
 * Portable infrastructure parameters for:
 * - Initial primary region: Algeria (dz-algiers-1)
 * - Relocation targets: Dubai / UAE (ae-dubai-1), Kuala Lumpur / Malaysia (my-kl-1), Frankfurt DR (eu-fra-01)
 * - Non-oversubscribed 4-class Linux `tc` HTB QoS budget (sum of mins === 100% of 0.90 * measured upload)
 * - Fail-closed positive OOB STONITH gate & monotonic fencing_epoch matrix
 */

export type RegionCode = "dz-algiers-1" | "dz-west-1" | "ae-dubai-1" | "my-kl-1" | "sg-sin-1" | "eu-fra-01";

export interface RegionProfile {
  regionCode: RegionCode;
  displayName: string;
  countryCode: string;
  residencyZone: string;
  wireguardControlIp: string;
  wireguardReplIp: string;
  recommendedStandbyRegion: RegionCode;
  estimatedRttToFrankfurtMs: string;
  lawFramework: string;
  suitabilityNotes: string;
}

export const PORTABLE_REGION_PROFILES: Record<RegionCode, RegionProfile> = {
  "dz-algiers-1": {
    regionCode: "dz-algiers-1",
    displayName: "Algeria Sovereign Primary (Algiers)",
    countryCode: "DZ",
    residencyZone: "DZ",
    wireguardControlIp: "10.99.0.1",
    wireguardReplIp: "10.99.1.1",
    recommendedStandbyRegion: "eu-fra-01",
    estimatedRttToFrankfurtMs: "28 - 42 ms (theoretical WAN estimate)",
    lawFramework: "Algeria Law No. 18-07 (ANPDP)",
    suitabilityNotes:
      "Initial sovereign bare-metal primary. Hosts separate yume_pii_vault_dz instance (port 5433); requires 4G/LTE OOB STONITH for unattended auto-failover.",
  },
  "dz-west-1": {
    regionCode: "dz-west-1",
    displayName: "Algeria Domestic Secondary (Oran)",
    countryCode: "DZ",
    residencyZone: "DZ",
    wireguardControlIp: "10.99.0.6",
    wireguardReplIp: "10.99.1.6",
    recommendedStandbyRegion: "dz-algiers-1",
    estimatedRttToFrankfurtMs: "34 - 48 ms",
    lawFramework: "Algeria Law No. 18-07 (ANPDP)",
    suitabilityNotes:
      "Domestic < 12 ms RTT candidate enabling remote_write / synchronous_commit = on without cross-border PII transfer.",
  },
  "ae-dubai-1": {
    regionCode: "ae-dubai-1",
    displayName: "Dubai / UAE Relocation Primary",
    countryCode: "AE",
    residencyZone: "AE",
    wireguardControlIp: "10.99.0.4",
    wireguardReplIp: "10.99.1.4",
    recommendedStandbyRegion: "eu-fra-01",
    estimatedRttToFrankfurtMs: "95 - 115 ms",
    lawFramework: "UAE Federal Decree-Law No. 45/2021 (+ ANPDP review for DZ PII)",
    suitabilityNotes:
      "MENA commercial relocation hub. Uses WireGuard 10.99.0.4 + R2 pgBackRest restore + 3->2->3 etcd Learner swap without 4-voter quorum.",
  },
  "my-kl-1": {
    regionCode: "my-kl-1",
    displayName: "Kuala Lumpur / Malaysia Relocation Primary",
    countryCode: "MY",
    residencyZone: "MY",
    wireguardControlIp: "10.99.0.5",
    wireguardReplIp: "10.99.1.5",
    recommendedStandbyRegion: "sg-sin-1",
    estimatedRttToFrankfurtMs: "155 - 185 ms",
    lawFramework: "Malaysia PDPA 2010 / 2024 Amendments (+ ANPDP review for DZ PII)",
    suitabilityNotes:
      "SE Asia relocation hub. Cascades WAL through Frankfurt during Algiers cutover to avoid trans-continental FTTH retransmissions; pairs with Singapore low-RTT standby.",
  },
  "sg-sin-1": {
    regionCode: "sg-sin-1",
    displayName: "Singapore Low-Latency Regional Standby",
    countryCode: "SG",
    residencyZone: "SG",
    wireguardControlIp: "10.99.0.7",
    wireguardReplIp: "10.99.1.7",
    recommendedStandbyRegion: "my-kl-1",
    estimatedRttToFrankfurtMs: "150 - 175 ms",
    lawFramework: "Singapore PDPA",
    suitabilityNotes: "3 - 8 ms RTT synchronous standby pairing for Kuala Lumpur primary.",
  },
  "eu-fra-01": {
    regionCode: "eu-fra-01",
    displayName: "Frankfurt Cloud Warm Standby & Read Replica",
    countryCode: "DE",
    residencyZone: "EU",
    wireguardControlIp: "10.99.0.2",
    wireguardReplIp: "10.99.1.2",
    recommendedStandbyRegion: "dz-algiers-1",
    estimatedRttToFrankfurtMs: "< 1 ms (local DC)",
    lawFramework: "EU GDPR",
    suitabilityNotes:
      "Holds backup-standby = y base backup offload to R2 + anonymous public catalog read offload guarded by 2,000 ms replication lag circuit breaker. Strictly fail-closed on unconfirmed primary STONITH.",
  },
};

export interface QosTrafficClassSpec {
  classId: string;
  priority: number;
  name: string;
  interfaceOrPort: string;
  minMbps: number;
  minSharePct: number;
  maxMbps: number;
  notes: string;
}

export interface NonOversubscribedQosBudget {
  measuredUploadMbps: number;
  shapedCeilingMbps: number;
  sumOfGuaranteedMinsMbps: number;
  oversubscribed: boolean;
  classes: QosTrafficClassSpec[];
  maxSupportedCcuTier: string;
}

/**
 * Computes the non-oversubscribed 4-class Linux tc HTB + fq_codel/CAKE bandwidth budget.
 * Guarantee: SUM(minMbps) === shapedCeilingMbps (0.90 * measuredUploadMbps).
 */
export function computeNonOversubscribedQosBudget(
  measuredUploadMbps: 50 | 100 | 200
): NonOversubscribedQosBudget {
  if (measuredUploadMbps === 50) {
    const shaped = 45.0;
    const classes: QosTrafficClassSpec[] = [
      {
        classId: "1:10",
        priority: 0,
        name: "Class 0: etcd v3.5 + yume-lease-enforcerd",
        interfaceOrPort: "wg-control (udp/51820)",
        minMbps: 2.0,
        minSharePct: 4.4,
        maxMbps: 5.0,
        notes: "Demand 0.35-1.20 Mbps. Preempts WAL/HTTP (< 1ms queue).",
      },
      {
        classId: "1:20",
        priority: 1,
        name: "Class 1: PG16 Streaming WAL + Primary archive-push",
        interfaceOrPort: "wg-repl (udp/51821) + R2 S3",
        minMbps: 15.0,
        minSharePct: 33.3,
        maxMbps: 22.5,
        notes: "2.5k CCU dual WAL ~5.44 avg / 10.88 peak Mbps. Hard ceiling prevents HTTP starvation.",
      },
      {
        classId: "1:30",
        priority: 2,
        name: "Class 2: Customer & Merchant HTTP API (tcp/443)",
        interfaceOrPort: "tcp/443 + cloudflared",
        minMbps: 26.5,
        minSharePct: 58.9,
        maxMbps: 42.5,
        notes: "With FRA read offload: 2.5k CCU fits easily; 7.5k CCU exceeds 45 Mbps ceiling.",
      },
      {
        classId: "1:40",
        priority: 3,
        name: "Class 3: Scavenger / Telemetry / Non-Critical Exports",
        interfaceOrPort: "Bulk / Diagnostic",
        minMbps: 1.5,
        minSharePct: 3.3,
        maxMbps: 10.0,
        notes: "Yields immediately during checkout or WAL bursts.",
      },
    ];
    return {
      measuredUploadMbps,
      shapedCeilingMbps: shaped,
      sumOfGuaranteedMinsMbps: Number(classes.reduce((acc, c) => acc + c.minMbps, 0).toFixed(2)),
      oversubscribed: false,
      classes,
      maxSupportedCcuTier: "2,000 - 2,500 CCU max (theoretical; 7,500 CCU exceeds 45 Mbps)",
    };
  }

  if (measuredUploadMbps === 200) {
    const shaped = 180.0;
    const classes: QosTrafficClassSpec[] = [
      {
        classId: "1:10",
        priority: 0,
        name: "Class 0: etcd v3.5 + yume-lease-enforcerd",
        interfaceOrPort: "wg-control (udp/51820)",
        minMbps: 4.0,
        minSharePct: 2.2,
        maxMbps: 10.0,
        notes: "Zero quorum starvation.",
      },
      {
        classId: "1:20",
        priority: 1,
        name: "Class 1: PG16 Streaming WAL + Primary archive-push",
        interfaceOrPort: "wg-repl (udp/51821) + R2 S3",
        minMbps: 56.0,
        minSharePct: 31.1,
        maxMbps: 80.0,
        notes: "7.5k CCU dual WAL ~16.32 avg / 32.63 peak Mbps.",
      },
      {
        classId: "1:30",
        priority: 2,
        name: "Class 2: Customer & Merchant HTTP API (tcp/443)",
        interfaceOrPort: "tcp/443 + cloudflared",
        minMbps: 112.0,
        minSharePct: 62.2,
        maxMbps: 170.0,
        notes: "Ample headroom for 7.5k - 10k CCU bursts.",
      },
      {
        classId: "1:40",
        priority: 3,
        name: "Class 3: Scavenger / Telemetry / Non-Critical Exports",
        interfaceOrPort: "Bulk / Diagnostic",
        minMbps: 8.0,
        minSharePct: 4.4,
        maxMbps: 36.0,
        notes: "Low priority background traffic.",
      },
    ];
    return {
      measuredUploadMbps,
      shapedCeilingMbps: shaped,
      sumOfGuaranteedMinsMbps: Number(classes.reduce((acc, c) => acc + c.minMbps, 0).toFixed(2)),
      oversubscribed: false,
      classes,
      maxSupportedCcuTier: "7,500 - 10,000 CCU (theoretical; requires iperf3 evening verification)",
    };
  }

  // Default: 100 Mbps
  const shaped = 90.0;
  const classes: QosTrafficClassSpec[] = [
    {
      classId: "1:10",
      priority: 0,
      name: "Class 0: etcd v3.5 + yume-lease-enforcerd",
      interfaceOrPort: "wg-control (udp/51820)",
      minMbps: 3.0,
      minSharePct: 3.3,
      maxMbps: 8.0,
      notes: "Demand 0.35-1.20 Mbps. Sub-millisecond queuing.",
    },
    {
      classId: "1:20",
      priority: 1,
      name: "Class 1: PG16 Streaming WAL + Primary archive-push",
      interfaceOrPort: "wg-repl (udp/51821) + R2 S3",
      minMbps: 34.0,
      minSharePct: 37.8,
      maxMbps: 45.0,
      notes: "Supports 2.5k & 7.5k CCU dual WAL streams; base backups offloaded to Frankfurt via backup-standby = y.",
    },
    {
      classId: "1:30",
      priority: 2,
      name: "Class 2: Customer & Merchant HTTP API (tcp/443)",
      interfaceOrPort: "tcp/443 + cloudflared",
      minMbps: 50.0,
      minSharePct: 55.6,
      maxMbps: 85.0,
      notes: "7.5k CCU peak API egress ~46.71 Mbps fits within 90 Mbps shaped pipe.",
    },
    {
      classId: "1:40",
      priority: 3,
      name: "Class 3: Scavenger / Telemetry / Non-Critical Exports",
      interfaceOrPort: "Bulk / Diagnostic",
      minMbps: 3.0,
      minSharePct: 3.3,
      maxMbps: 18.0,
      notes: "Immediately preemptible.",
    },
  ];
  return {
    measuredUploadMbps: 100,
    shapedCeilingMbps: shaped,
    sumOfGuaranteedMinsMbps: Number(classes.reduce((acc, c) => acc + c.minMbps, 0).toFixed(2)),
    oversubscribed: false,
    classes,
    maxSupportedCcuTier: "2,500 - 7,500 CCU (theoretical; pending evening 19:00-23:00 CET iperf3 test)",
  };
}

export const FENCING_TIMER_AUTHORITY_MATRIX = [
  {
    timer: "T_soft = 2.5 s",
    anchor: "t_sent (CLOCK_MONOTONIC before last successful etcd KeepAlive)",
    mechanism: "yume-lease-enforcerd zeroes /dev/shm/yume_lease_state + app write abort",
    independentlyVerifiableByStandby: false,
    strictGuarantee: "Self-fencing latency guard on Primary only; NEVER proves isolation to remote nodes.",
  },
  {
    timer: "T_net = 3.5 s",
    anchor: "t_sent on Node 1",
    mechanism: "nftables drops tcp/6432,5432 + PgBouncer PAUSE/KILL yume_rw",
    independentlyVerifiableByStandby: false,
    strictGuarantee: "Blocks new SQL traffic locally; already-executing backend in XLogFlush() can finish.",
  },
  {
    timer: "T_pg_stop = 5.5 s",
    anchor: "t_sent on Node 1",
    mechanism: "pg_terminate_backend (4.0 s) -> pg_ctl stop -m immediate (5.5 s)",
    independentlyVerifiableByStandby: false,
    strictGuarantee: "Aborts uncommitted PG backends if Linux kernel responds; unprovable across WAN partition.",
  },
  {
    timer: "T_watchdog = 9.0 s",
    anchor: "t_sent on Node 1",
    mechanism: "Local hardware /dev/watchdog (nowayout=1) stops being petted",
    independentlyVerifiableByStandby: false,
    strictGuarantee: "Best-effort local hardware reset only; NOT remotely readable across WAN cut.",
  },
  {
    timer: "T_promote >= 17.0 s + OOB STONITH",
    anchor: "etcd 15.0 s lease expiry + 2.0 s hold-off + positive OOB BMC/PDU Power=OFF readback",
    mechanism: "yume-stonith-gate verifies PowerState == 'Off' (4G/LTE OOB BMC/PDU) OR graceful primary read-only handoff",
    independentlyVerifiableByStandby: true,
    strictGuarantee: "MANDATORY PROMOTION GATE. If OOB Power=OFF is unconfirmed or ambiguous, Frankfurt FAILS CLOSED (HTTP 503).",
  },
];

export const REPLICA_LAG_CIRCUIT_BREAKER_POLICY = {
  healthyMaxLagMs: 1500,
  healthyMaxLagBytes: 2 * 1024 * 1024, // 2 MB
  tripThresholdLagMs: 2000,
  tripThresholdLagBytes: 4 * 1024 * 1024, // 4 MB
  disconnectTripMs: 2000,
  hysteresisRecoverLagMs: 500,
  hysteresisRecoverLagBytes: 512 * 1024, // 512 KB
  hysteresisConsecutiveSeconds: 10,
  alwaysPrimaryRoutes: [
    "POST/PUT/PATCH/DELETE (all mutations)",
    "POST /api/orders, /api/cart/validate, /api/checkout/quote",
    "All /api/admin/* and /api/merchant/* workspaces",
    "Any session carrying X-Yume-Min-LSN > replica pg_last_wal_replay_lsn()",
    "All yume_pii_vault_dz queries (physically pinned in Algeria)",
  ],
  standbyEligibleRoutes: [
    "GET /api/db/products (anonymous storefront browse when replay_lag_ms <= 1,500 ms)",
    "GET /api/db/stores (public store profiles)",
    "GET /api/subscriptions/public-catalog",
  ],
};

export const PGBACKREST_PORTABLE_TOPOLOGY = {
  baseBackupOffloadOption: "backup-standby = y",
  deprecatedInvalidOption: "backup-from-standby = y (REMOVED / INVALID)",
  baseBackupSourceNode: "eu-fra-01 (Standby reads ~90-99% unchanged blocks -> R2)",
  continuousWalArchiveNode: "Authoritative Primary (archive_mode = on -> pgbackrest archive-push %p -> R2)",
  archiveTimeoutSeconds: 60,
  retentionFullCount: 4,
};
