import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Copy,
  Check,
  X,
  RefreshCw,
  Navigation,
  Building2,
  User,
  Share2,
  Sparkles,
  Printer,
  Search,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { Order } from "../types";
import { deliveryService, TrackingDetails } from "../services/deliveryService";

interface ShippingTrackingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: "pending" | "shipped" | "delivered") => void;
  merchantLang?: "en" | "ar" | "fr";
}

const DICT = {
  ar: {
    modalTitle: "بوابة تتبع الشحنات والطرود الجزائرية",
    searchPlaceholder: "أدخل رقم التتبع (YAL/ZRX)، رقم الطلب، أو رقم الهاتف...",
    searchBtn: "بحث فوري",
    liveTracking: "تتبع مباشر",
    estimatedArrival: "موعد الوصول التقديري",
    inTransit: "قيد النقل والتوصيل",
    delivered: "تم التوصيل واستلام المبلغ (COD)",
    pending: "قيد المعالجة وتجهيز الطرد",
    carrier: "شركة التوصيل المعتمدة",
    originHub: "مركز الانطلاق",
    destinationHub: "مركز الوصول والفرز",
    trackingCode: "رقم بوليصة التتبع",
    copy: "نسخ",
    copied: "تم النسخ!",
    recipientCardTitle: "بيانات الزبون وعنوان الاستلام",
    callCustomer: "اتصال هاتفي بالزبون",
    whatsappConfirm: "تأكيد فوري عبر واتساب",
    packageDetails: "تفاصيل الطرد وقيمة الدفع عند الاستلام",
    codAmount: "المبلغ الإجمالي عند الاستلام (COD)",
    shippingFee: "تكلفة الشحن",
    items: "المنتجات المطلوبة",
    printLabel: "طباعة بوليصة الشحن (AWB)",
    doneClose: "إغلاق النافذة",
    shareLink: "مشاركة رابط التتبع",
    linkCopied: "تم نسخ الرابط!",
    step1: "تم تأكيد الطلب وتجهيز الطرد",
    step2: "استلام الطرد من طرف شركة التوصيل",
    step3: "قيد النقل بين المراكز الجهوية",
    step4: "خرج للتسليم / جاهز بالمكتب (Stop Desk)",
    step5: "تم التسليم بنجاح وتحصيل المبلغ",
    reconcileSuccess: "تمت مزامنة حالة الشحنة مع خوادم التوصيل بنجاح",
  },
  fr: {
    modalTitle: "Portail de Suivi des Expéditions Algérie",
    searchPlaceholder: "Entrez N° de suivi (YAL/ZRX), N° commande ou téléphone...",
    searchBtn: "Rechercher",
    liveTracking: "Suivi en direct",
    estimatedArrival: "Livraison estimée",
    inTransit: "En cours d'acheminement",
    delivered: "Colis livré & paiement COD encaissé",
    pending: "En attente de prise en charge",
    carrier: "Société de livraison",
    originHub: "Hub d'expédition",
    destinationHub: "Centre de tri de destination",
    trackingCode: "Numéro de suivi (AWB)",
    copy: "Copier",
    copied: "Copié !",
    recipientCardTitle: "Coordonnées du destinataire",
    callCustomer: "Appeler le client",
    whatsappConfirm: "Confirmer sur WhatsApp",
    packageDetails: "Détails du colis & Paiement COD",
    codAmount: "Montant COD à percevoir",
    shippingFee: "Frais de livraison",
    items: "Articles commandés",
    printLabel: "Imprimer bordereau (AWB)",
    doneClose: "Fermer",
    shareLink: "Partager le lien de suivi",
    linkCopied: "Lien copié !",
    step1: "Commande confirmée et emballée",
    step2: "Pris en charge par le transporteur",
    step3: "En transit entre les centres régionaux",
    step4: "En cours de livraison / Disponible au Stop Desk",
    step5: "Colis livré et montant encaissé",
    reconcileSuccess: "Synchronisation réussie avec les serveurs du transporteur",
  },
  en: {
    modalTitle: "Algerian Delivery Tracking & Logistics Portal",
    searchPlaceholder: "Enter Tracking # (YAL/ZRX), Order ID or Phone number...",
    searchBtn: "Track Order",
    liveTracking: "Live Tracking",
    estimatedArrival: "Estimated Delivery",
    inTransit: "In Transit across Wilayas",
    delivered: "Delivered & COD Collected",
    pending: "Pending Courier Handover",
    carrier: "Assigned Carrier",
    originHub: "Origin Dispatch Hub",
    destinationHub: "Destination Sorting Center",
    trackingCode: "Tracking Code (AWB)",
    copy: "Copy",
    copied: "Copied!",
    recipientCardTitle: "Customer & Destination Details",
    callCustomer: "Call Buyer",
    whatsappConfirm: "WhatsApp Confirmation",
    packageDetails: "Package Details & COD Value",
    codAmount: "Total COD to Collect",
    shippingFee: "Shipping Fee",
    items: "Order Items",
    printLabel: "Print AWB Shipping Label",
    doneClose: "Close Portal",
    shareLink: "Copy Tracking Link",
    linkCopied: "Link Copied!",
    step1: "Order confirmed & packaged",
    step2: "Scanned at courier central hub",
    step3: "In transit between regional hubs",
    step4: "Out for delivery / Ready at stop desk",
    step5: "Delivered & payment collected",
    reconcileSuccess: "Shipment status successfully synchronized with carrier",
  },
};

export const ShippingTrackingModal: React.FC<ShippingTrackingModalProps> = ({
  order: initialOrder,
  isOpen,
  onClose,
  onUpdateStatus,
  merchantLang = "ar",
}) => {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [liveDetails, setLiveDetails] = useState<TrackingDetails | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");
  const [showPrintLabel, setShowPrintLabel] = useState(false);

  const langKey = merchantLang === "ar" || merchantLang === "fr" ? merchantLang : "en";
  const t = (k: keyof typeof DICT["ar"]) => DICT[langKey][k] || DICT["en"][k] || k;
  const isRtl = merchantLang === "ar";

  useEffect(() => {
    setOrder(initialOrder);
    setSearchError("");
    if (initialOrder) {
      loadLiveTracking(initialOrder.trackingCode || initialOrder.id);
    }
  }, [initialOrder]);

  const loadLiveTracking = async (code: string) => {
    try {
      const data = await deliveryService.trackShipment(code);
      setLiveDetails(data);
    } catch {
      // Fallback to local representation
      setLiveDetails(null);
    }
  };

  const handleSearchLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError("");

    try {
      const data = await deliveryService.trackShipment(searchQuery.trim());
      setLiveDetails(data);
    } catch (err: any) {
      setSearchError(
        langKey === "ar"
          ? "لم يتم العثور على شحنة تطابق هذا الرقم. يرجى التحقق من رقم التتبع أو رقم الهاتف."
          : "Aucune expédition trouvée avec ce numéro. Veuillez vérifier le code ou le téléphone."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSyncCarrier = async () => {
    setIsSyncing(true);
    try {
      const res = await deliveryService.syncShipments();
      setSyncFeedback(t("reconcileSuccess"));
      if (order?.trackingCode) {
        await loadLiveTracking(order.trackingCode);
      }
      setTimeout(() => setSyncFeedback(""), 4000);
    } catch (err: any) {
      setSyncFeedback("Sync error: " + err.message);
      setTimeout(() => setSyncFeedback(""), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const deliveryCompany = useMemo(() => {
    if (liveDetails?.carrierName) return liveDetails.carrierName;
    if (order?.deliveryCompany?.toLowerCase().includes("zr")) return "ZR Express";
    if (order?.deliveryCompany?.toLowerCase().includes("yalidine")) return "Yalidine Fast Express";
    return order?.deliveryCompany || "Yalidine Fast Express";
  }, [liveDetails, order]);

  const trackingNumber = useMemo(() => {
    if (liveDetails?.trackingNumber) return liveDetails.trackingNumber;
    if (order?.trackingCode) return order.trackingCode;
    if (!order) return "YAL-781920-DZ";
    const prefix = deliveryCompany.toLowerCase().includes("zr") ? "ZRX" : "YAL";
    const cleanId = order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    return `${prefix}-${cleanId}-DZ`;
  }, [liveDetails, order, deliveryCompany]);

  // Determine current lifecycle step (1 to 5)
  const currentStep = useMemo(() => {
    const status = liveDetails?.currentStatus || order?.status || "pending";
    if (status === "DELIVERED" || status === "delivered") return 5;
    if (status === "OUT_FOR_DELIVERY" || status === "READY_AT_STOP_DESK") return 4;
    if (status === "IN_TRANSIT" || status === "shipped") return 3;
    if (status === "LABEL_GENERATED" || status === "PICKED_UP" || status === "accepted") return 2;
    return 1;
  }, [liveDetails, order]);

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?track=${encodeURIComponent(trackingNumber)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  const recipientName = order?.shopper?.name || (liveDetails as any)?.recipient?.name || "Client Yume";
  const recipientPhone = order?.shopper?.phone || (liveDetails as any)?.recipient?.phone || "0550000000";
  const wilayaName = order?.shopper?.wilaya || liveDetails?.destination?.wilayaName || "Alger";
  const codAmount = order?.total || liveDetails?.codAmountDzd || 4500;
  const itemsSummary = order?.items?.map(i => `${i.name} (x${i.quantity})`).join(", ") || "Commande Yume";

  const waLink = deliveryService.generateWhatsAppConfirmation({
    id: order?.id || trackingNumber,
    recipientName,
    phone: recipientPhone,
    totalAmountDzd: codAmount,
    wilayaName,
    itemsSummary,
  }, langKey as any);

  const phoneLink = deliveryService.generatePhoneCallLink(recipientPhone);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          dir={isRtl ? "rtl" : "ltr"}
          className="bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]"
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
        >
          {/* Top Modal Header */}
          <div className="bg-white dark:bg-slate-850 px-5 sm:px-7 py-4 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t("modalTitle")}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    58 Wilayas
                  </span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  {deliveryCompany} • {t("liveTracking")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncCarrier}
                disabled={isSyncing}
                title="Synchroniser avec le transporteur"
                className="p-2 rounded-xl text-stone-500 hover:text-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-indigo-600" : ""}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sync Feedback Alert */}
          {syncFeedback && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-7 overflow-y-auto space-y-6 flex-1">
            {/* Live Search & Lookup Bar */}
            <form onSubmit={handleSearchLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-stone-400 ${isRtl ? "right-3.5" : "left-3.5"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className={`w-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-2xl py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : t("searchBtn")}
              </button>
            </form>

            {searchError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Tracking Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-stone-200/90 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  {t("trackingCode")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                    {trackingNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTracking}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-500 transition-all cursor-pointer"
                    title={t("copy")}
                  >
                    {copiedTracking ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{deliveryCompany}</span>
                  <span>•</span>
                  <span>{liveDetails?.carrierServiceType === "stop_desk" ? "Point Relais (Stop Desk)" : "Livraison à Domicile"}</span>
                </div>
              </div>

              {/* Status Badge & AWB Print Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrintLabel(!showPrintLabel)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-stone-500" />
                  <span>{t("printLabel")}</span>
                </button>

                <div className={`px-4 py-2 rounded-xl text-xs font-black border ${
                  currentStep === 5
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
                    : currentStep >= 3
                    ? "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200"
                    : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                }`}>
                  {currentStep === 5 ? t("delivered") : currentStep >= 3 ? t("inTransit") : t("pending")}
                </div>
              </div>
            </div>

            {/* Printable AWB Label Box (collapsible) */}
            {showPrintLabel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    <span>{t("printLabel")} — {deliveryCompany}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Imprimer maintenant
                  </button>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 font-mono text-center">
                  <div className="text-xs text-stone-400 uppercase tracking-widest">{deliveryCompany} FAST PARCEL</div>
                  <div className="text-2xl font-black my-2 tracking-widest text-slate-900 dark:text-white">*{trackingNumber}*</div>
                  <div className="text-xs text-stone-500">Destinataire: {recipientName} • Tél: {recipientPhone}</div>
                  <div className="text-xs font-bold text-emerald-600 mt-1">MONTANT COD: {codAmount.toLocaleString()} DZD</div>
                </div>
              </motion.div>
            )}

            {/* Multi-Stage Visual Tracking Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-stone-200/90 dark:border-slate-700/80 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {langKey === "ar" ? "مراحل الشحن والتوزيع عبر الولايات" : "Étapes du parcours logistique"}
              </h3>

              {/* Progress Steps Ribbon */}
              <div className="relative py-2">
                <div className="h-1.5 bg-stone-100 dark:bg-slate-700 rounded-full w-full absolute top-1/2 -translate-y-1/2 z-0" />
                <div
                  className="h-1.5 bg-indigo-600 rounded-full absolute top-1/2 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${((currentStep - 1) / 4) * 100}%`,
                    [isRtl ? "right" : "left"]: 0,
                  }}
                />

                <div className="relative z-10 flex justify-between">
                  {[1, 2, 3, 4, 5].map((stepNum) => {
                    const isDone = currentStep >= stepNum;
                    const isCurrent = currentStep === stepNum;
                    return (
                      <div key={stepNum} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? "bg-indigo-600 text-white shadow-md ring-4 ring-indigo-50 dark:ring-indigo-950"
                              : "bg-white dark:bg-slate-800 text-stone-400 border-2 border-stone-200 dark:border-slate-700"
                          } ${isCurrent ? "scale-110 ring-indigo-200 dark:ring-indigo-800" : ""}`}
                        >
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step Descriptions List */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-center text-xs">
                <div className={`p-2 rounded-xl ${currentStep >= 1 ? "text-indigo-900 dark:text-indigo-200 font-bold" : "text-stone-400"}`}>
                  {t("step1")}
                </div>
                <div className={`p-2 rounded-xl ${currentStep >= 2 ? "text-indigo-900 dark:text-indigo-200 font-bold" : "text-stone-400"}`}>
                  {t("step2")}
                </div>
                <div className={`p-2 rounded-xl ${currentStep >= 3 ? "text-indigo-900 dark:text-indigo-200 font-bold" : "text-stone-400"}`}>
                  {t("step3")}
                </div>
                <div className={`p-2 rounded-xl ${currentStep >= 4 ? "text-indigo-900 dark:text-indigo-200 font-bold" : "text-stone-400"}`}>
                  {t("step4")}
                </div>
                <div className={`p-2 rounded-xl ${currentStep >= 5 ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-stone-400"}`}>
                  {t("step5")}
                </div>
              </div>
            </div>

            {/* Recipient & COD Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recipient Details & Action Triggers */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-stone-200/90 dark:border-slate-700/80 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{t("recipientCardTitle")}</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-100 dark:border-slate-700/60">
                    <span className="text-stone-400">Nom & Prénom:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{recipientName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100 dark:border-slate-700/60">
                    <span className="text-stone-400">Téléphone:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">{recipientPhone}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100 dark:border-slate-700/60">
                    <span className="text-stone-400">Wilaya:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{wilayaName}</strong>
                  </div>
                </div>

                {/* WhatsApp & Phone Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t("whatsappConfirm")}</span>
                  </a>

                  <a
                    href={phoneLink}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{t("callCustomer")}</span>
                  </a>
                </div>
              </div>

              {/* Package Details & COD Value Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-stone-200/90 dark:border-slate-700/80 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t("packageDetails")}</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-baseline justify-between py-1 border-b border-stone-100 dark:border-slate-700/60">
                    <span className="text-stone-400">{t("codAmount")}:</span>
                    <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {codAmount.toLocaleString()} DZD
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100 dark:border-slate-700/60">
                    <span className="text-stone-400">{t("carrier")}:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{deliveryCompany}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100 dark:border-slate-700/60">
                    <span className="text-stone-400">{t("items")}:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">
                      {itemsSummary}
                    </span>
                  </div>
                </div>

                {/* Quick Merchant Status Switch */}
                {onUpdateStatus && order && (
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-100 dark:border-slate-700/60">
                    <span className="text-stone-400 font-bold">Changer statut:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, "pending")}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          order.status === "pending"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-stone-50 dark:bg-slate-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-600"
                        }`}
                      >
                        En attente
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, "shipped")}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          order.status === "shipped" || order.status === "accepted"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-stone-50 dark:bg-slate-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-600"
                        }`}
                      >
                        Expédié
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, "delivered")}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          order.status === "delivered"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-stone-50 dark:bg-slate-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-600"
                        }`}
                      >
                        Livré
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="bg-white dark:bg-slate-850 px-5 sm:px-8 py-3.5 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-stone-500" />
              <span>{copiedLink ? t("linkCopied") : t("shareLink")}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {t("doneClose")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
