import React, { useState, useMemo } from "react";
import {
  Flag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquarePlus,
  ExternalLink,
  ShieldAlert,
  Calendar,
  ArrowUpDown,
  FileText,
  History,
  Store,
} from "lucide-react";
import type { MerchantStore } from "../types";
import {
  REPORT_STORE_REASONS,
  computeReportsCenterKpis,
  filterAndSortStoreReports,
  type StoreReportRecord,
  type StoreReportStatus,
  type StoreReportPriority,
} from "../utils/storeMoreOptionsLogic";

export interface PlatformAdminReportsCenterProps {
  reports: StoreReportRecord[];
  stores: MerchantStore[];
  onUpdateReport: (
    reportId: string,
    updates: {
      status?: StoreReportStatus;
      priority?: StoreReportPriority;
      internalNote?: string;
    }
  ) => Promise<void> | void;
  onInspectStore?: (storeId: string) => void;
}

export function PlatformAdminReportsCenter({
  reports,
  stores,
  onUpdateReport,
  onInspectStore,
}: PlatformAdminReportsCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority" | "status">("newest");

  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports[0]?.id || null
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const kpis = useMemo(() => computeReportsCenterKpis(reports), [reports]);

  const filteredReports = useMemo(
    () =>
      filterAndSortStoreReports({
        reports,
        searchQuery,
        statusFilter,
        reasonFilter,
        priorityFilter,
        dateFilter,
        sortBy,
      }),
    [reports, searchQuery, statusFilter, reasonFilter, priorityFilter, dateFilter, sortBy]
  );

  const selectedReport = useMemo(
    () =>
      reports.find((r) => r.id === selectedReportId) ||
      filteredReports[0] ||
      null,
    [reports, selectedReportId, filteredReports]
  );

  const previousReportsForSameStore = useMemo(() => {
    if (!selectedReport) return [];
    return reports.filter(
      (r) => r.storeId === selectedReport.storeId && r.id !== selectedReport.id
    );
  }, [reports, selectedReport]);

  const matchedStore = useMemo(() => {
    if (!selectedReport) return null;
    return stores.find((s) => s.id === selectedReport.storeId) || null;
  }, [stores, selectedReport]);

  const statusBadgeClass = (status: StoreReportStatus) => {
    switch (status) {
      case "new":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "under_review":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "resolved":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "rejected":
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  const priorityBadgeClass = (priority: StoreReportPriority) => {
    switch (priority) {
      case "critical":
        return "bg-rose-600/20 text-rose-400 border-rose-500/40";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "low":
        return "bg-slate-700/60 text-slate-300 border-slate-600";
    }
  };

  const handleStatusChange = async (reportId: string, status: StoreReportStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateReport(reportId, { status });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (reportId: string, priority: StoreReportPriority) => {
    setIsUpdating(true);
    try {
      await onUpdateReport(reportId, { priority });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !noteDraft.trim()) return;
    setIsUpdating(true);
    try {
      await onUpdateReport(selectedReport.id, { internalNote: noteDraft.trim() });
      setNoteDraft("");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Reports Center
              </h2>
              <p className="text-xs text-slate-400">
                Centralized Platform Admin investigation workspace for submitted store reports
              </p>
            </div>
          </div>
        </div>
        <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Centralized Team Queue • Reporter Identity Protected</span>
        </div>
      </div>

      {/* 9.1 Reports Dashboard KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total Reports",
            value: kpis.totalReports,
            accent: "text-white",
            border: "border-slate-800",
            icon: <FileText className="w-4 h-4 text-indigo-400" />,
          },
          {
            label: "New Reports",
            value: kpis.newReports,
            accent: "text-sky-400",
            border: "border-sky-500/30",
            icon: <Flag className="w-4 h-4 text-sky-400" />,
          },
          {
            label: "Under Review",
            value: kpis.underReviewReports,
            accent: "text-amber-400",
            border: "border-amber-500/30",
            icon: <Clock className="w-4 h-4 text-amber-400" />,
          },
          {
            label: "Resolved Reports",
            value: kpis.resolvedReports,
            accent: "text-emerald-400",
            border: "border-emerald-500/30",
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          },
          {
            label: "Rejected Reports",
            value: kpis.rejectedReports,
            accent: "text-slate-400",
            border: "border-slate-700",
            icon: <XCircle className="w-4 h-4 text-slate-400" />,
          },
          {
            label: "High Priority Reports",
            value: kpis.highPriorityReports,
            accent: "text-rose-400",
            border: "border-rose-500/30",
            icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`p-4 rounded-2xl bg-slate-900/90 border ${card.border} shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">{card.label}</span>
              {card.icon}
            </div>
            <div className={`text-2xl font-black ${card.accent}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search store reports"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report ID, Store Name, Reason, or Details..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            aria-label="Filter reports by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            aria-label="Filter reports by reason"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold"
          >
            <option value="all">All Reasons</option>
            {REPORT_STORE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <select
            aria-label="Filter reports by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold"
          >
            <option value="all">All Dates</option>
            <option value="today">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
          <select
            aria-label="Sort reports"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Highest Priority</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      {/* Main Split View: 9.2 Reports Table & 9.3 / 9.4 Report Details + Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 9.2 Reports Table */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Submitted Store Reports ({filteredReports.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Reported Store</th>
                  <th className="py-3 px-4">Report Reason</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Report Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No store reports match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((rpt) => {
                    const isSelected = selectedReport?.id === rpt.id;
                    return (
                      <tr
                        key={rpt.id}
                        onClick={() => setSelectedReportId(rpt.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-600/15 text-white"
                            : "hover:bg-slate-800/60 text-slate-200"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                          {rpt.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{rpt.storeName}</div>
                          <div className="text-[10px] text-slate-400">ID: {rpt.storeId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{rpt.primaryReason}</td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(rpt.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${statusBadgeClass(
                              rpt.status
                            )}`}
                          >
                            {rpt.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${priorityBadgeClass(
                              rpt.priority
                            )}`}
                          >
                            {rpt.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReportId(rpt.id);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 9.3 Report Details & 9.4 Management Actions */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-5">
          {!selectedReport ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Select a report from the table to view complete details and investigation controls.
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-indigo-400">
                      {selectedReport.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadgeClass(
                        selectedReport.status
                      )}`}
                    >
                      {selectedReport.status.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${priorityBadgeClass(
                        selectedReport.priority
                      )}`}
                    >
                      {selectedReport.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    {selectedReport.storeName}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    Submitted on{" "}
                    {new Date(selectedReport.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {onInspectStore && (
                  <button
                    type="button"
                    onClick={() => onInspectStore(selectedReport.storeId)}
                    className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Store className="w-3.5 h-3.5" />
                    Review Store Information
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Reported Store Info & Reason */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Store ID:</span>
                  <span className="font-bold text-white">{selectedReport.storeId}</span>
                </div>
                {matchedStore && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wilaya / Tier:</span>
                    <span className="font-bold text-white">
                      {matchedStore.wilaya || "Alger"} • {matchedStore.premiumTier || "Free"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Report Reason:</span>
                  <span className="font-black text-rose-400">{selectedReport.primaryReason}</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-slate-400 font-bold mb-1">Additional User Explanation:</div>
                  <p className="text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {selectedReport.additionalDetails || "No additional written explanation provided."}
                  </p>
                </div>
              </div>

              {/* 9.4 Report Management Actions */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Investigation Status Actions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isUpdating || selectedReport.status === "new"}
                    onClick={() => handleStatusChange(selectedReport.id, "new")}
                    className="py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 disabled:opacity-40 border border-sky-500/30 text-sky-300 text-xs font-bold"
                  >
                    Mark as New
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating || selectedReport.status === "under_review"}
                    onClick={() => handleStatusChange(selectedReport.id, "under_review")}
                    className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-500/30 text-amber-300 text-xs font-bold"
                  >
                    Mark as Under Review
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating || selectedReport.status === "resolved"}
                    onClick={() => handleStatusChange(selectedReport.id, "resolved")}
                    className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating || selectedReport.status === "rejected"}
                    onClick={() => handleStatusChange(selectedReport.id, "rejected")}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Reject Report
                  </button>
                </div>

                {/* Set Priority */}
                <div className="pt-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Set Priority
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["low", "medium", "high", "critical"] as StoreReportPriority[]).map(
                      (prio) => (
                        <button
                          key={prio}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handlePriorityChange(selectedReport.id, prio)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-black uppercase border transition-all ${
                            selectedReport.priority === prio
                              ? priorityBadgeClass(prio)
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {prio}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Previous Reports Against the Same Store */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Previous Reports Against {selectedReport.storeName} (
                  {previousReportsForSameStore.length})
                </div>
                {previousReportsForSameStore.length === 0 ? (
                  <div className="text-xs text-slate-500">
                    No prior reports on record for this store.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {previousReportsForSameStore.map((prev) => (
                      <button
                        key={prev.id}
                        type="button"
                        onClick={() => setSelectedReportId(prev.id)}
                        className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <span className="font-mono font-bold text-indigo-400">{prev.id}</span>
                        <span className="text-slate-300 truncate mx-2">{prev.primaryReason}</span>
                        <span className="text-[10px] uppercase text-slate-400">{prev.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Administrative Notes */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Internal Administrative Notes ({selectedReport.internalNotes?.length || 0})
                </div>
                <form onSubmit={handleAddInternalNote} className="flex gap-2">
                  <input
                    type="text"
                    aria-label="Add internal administrative note"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add internal investigation note..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={isUpdating || !noteDraft.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Add Note
                  </button>
                </form>

                {selectedReport.internalNotes && selectedReport.internalNotes.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedReport.internalNotes.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-indigo-400">{n.authorName}</span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200">{n.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Investigation History & Audit Log */}
              {selectedReport.investigationHistory &&
                selectedReport.investigationHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      Investigation Audit Trail
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px]">
                      {selectedReport.investigationHistory.map((h) => (
                        <div
                          key={h.id}
                          className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-200">{h.action}</span>
                            <span className="text-slate-400"> • by {h.actorName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(h.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
