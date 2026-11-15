import React, { useState, useEffect } from "react";
import {
  Check,
  Upload,
  Video,
  Image as ImageIcon,
  Layers,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  PlatformFeatureConfig,
  getPlatformFeatureConfig,
  savePlatformFeatureConfig,
  DEFAULT_PLATFORM_FEATURE_CONFIG,
  PlanFeatureConfig,
} from "../utils/platformFeatureConfig";
import { SUBSCRIPTION_PLAN_IDS } from "../utils/platformPermissionsConfig";
import { recordPlatformAuditLog } from "../utils/centralGovernanceArchitecture";
import {
  YUME_ADMIN_TOKENS,
  YumeAdminSectionHeader,
  YumeAdminAdviceBanner,
  YumeAdminToggle,
  YumeAdminActionFooter,
  YumeAdminConfirmModal,
} from "./YumeAdminDesignSystem";

interface PlatformOwnerFeatureManagementCardProps {
  currentSlideColor?: string;
}

export const PlatformOwnerFeatureManagementCard: React.FC<
  PlatformOwnerFeatureManagementCardProps
> = () => {
  const [config, setConfig] = useState<PlatformFeatureConfig>(
    getPlatformFeatureConfig
  );
  const [saveFeedback, setSaveFeedback] = useState<string>("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getPlatformFeatureConfig());
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("yumi_feature_config_changed", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("yumi_feature_config_changed", handleUpdate);
    };
  }, []);

  const handleGlobalToggle = (key: keyof PlatformFeatureConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePlanToggle = (
    plan: string,
    key: keyof PlanFeatureConfig,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      planConfigs: {
        ...prev.planConfigs,
        [plan]: {
          ...(prev.planConfigs[plan] ||
            DEFAULT_PLATFORM_FEATURE_CONFIG.planConfigs[plan] || {
              allowImageUploadDevice: true,
              allowVideoUploadDevice: true,
              allowExternalVideoLinks: true,
              maxImages: 10,
              maxVideos: 2,
            }),
          [key]: value,
        },
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const beforeSnapshot = getPlatformFeatureConfig();
    savePlatformFeatureConfig(config);
    recordPlatformAuditLog({
      module: "subscriptions",
      actionType: "edit",
      targetType: "plan",
      targetId: "global_media_governance",
      targetName: "Product & Media Feature Governance Matrix",
      summary: "Updated global media quotas and 5-tier subscription media matrix.",
      beforeState: {
        globalMaxImagesPerProduct: beforeSnapshot.globalMaxImagesPerProduct,
        globalMaxVideosPerProduct: beforeSnapshot.globalMaxVideosPerProduct,
      },
      afterState: {
        globalMaxImagesPerProduct: config.globalMaxImagesPerProduct,
        globalMaxVideosPerProduct: config.globalMaxVideosPerProduct,
      },
    });
    setSaveFeedback(
      "Platform Feature Management settings updated across all 5 canonical plans!"
    );
    setTimeout(() => setSaveFeedback(""), 5000);
  };

  const handleResetDefaults = () => {
    setShowResetConfirm(true);
  };

  const executeResetDefaults = () => {
    setConfig(DEFAULT_PLATFORM_FEATURE_CONFIG);
    savePlatformFeatureConfig(DEFAULT_PLATFORM_FEATURE_CONFIG);
    recordPlatformAuditLog({
      module: "subscriptions",
      actionType: "edit",
      targetType: "plan",
      targetId: "global_media_governance",
      targetName: "Product & Media Feature Governance Matrix",
      summary: "Restored default media governance settings across all 5 canonical plans.",
    });
    setSaveFeedback("Restored default platform feature configurations.");
    setTimeout(() => setSaveFeedback(""), 4000);
  };

  const plans = [...SUBSCRIPTION_PLAN_IDS];

  return (
    <div className={`${YUME_ADMIN_TOKENS.cardClass} md:col-span-2`}>
      {/* Section Header matching Add New Product */}
      <YumeAdminSectionHeader
        title="Product & Media Feature Governance Engine"
        subtitle="Control global media upload permissions (Device Images, Device Videos, External Video Links), max quotas, file limits, and plan tier matrix."
        rightContent={
          <>
            <button
              type="button"
              onClick={handleResetDefaults}
              className={YUME_ADMIN_TOKENS.secondaryButtonClass}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={YUME_ADMIN_TOKENS.primaryButtonClass}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Governance Settings</span>
            </button>
          </>
        }
      />

      {/* Contextual Advice Callout */}
      <YumeAdminAdviceBanner label="ADVICE:">
        Changes to global media quotas and plan tier limits automatically adapt
        the Merchant Space Add New Product interface in real time without
        requiring manual merchant reconfiguration.
      </YumeAdminAdviceBanner>

      {saveFeedback && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Main Governance Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: GLOBAL MEDIA TOGGLES & CONSTRAINTS */}
        <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-slate-800 pb-3 mb-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
              <span>1. Global Platform Default Media Controls</span>
            </h4>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
              Master Switches
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Global Image Upload */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    Device Image Upload
                  </span>
                </div>
                <YumeAdminToggle
                  size="sm"
                  checked={config.globalAllowImageUploadDevice}
                  onChange={(next) =>
                    handleGlobalToggle("globalAllowImageUploadDevice", next)
                  }
                  ariaLabel="Toggle Device Image Upload"
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                Allow merchants to upload product photos directly from local
                device or phone.
              </p>
            </div>

            {/* Global Video Upload from Device */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    Device Video Upload
                  </span>
                </div>
                <YumeAdminToggle
                  size="sm"
                  checked={config.globalAllowVideoUploadDevice}
                  onChange={(next) =>
                    handleGlobalToggle("globalAllowVideoUploadDevice", next)
                  }
                  ariaLabel="Toggle Device Video Upload"
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                Allow uploading MP4/WEBM video files directly from local
                storage.
              </p>
            </div>

            {/* Global External Video Links */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    External Video Links
                  </span>
                </div>
                <YumeAdminToggle
                  size="sm"
                  checked={config.globalAllowExternalVideoLinks}
                  onChange={(next) =>
                    handleGlobalToggle("globalAllowExternalVideoLinks", next)
                  }
                  ariaLabel="Toggle External Video Links"
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed font-medium">
                Allow pasting Instagram Reels, TikTok, or YouTube embed video
                links.
              </p>
            </div>
          </div>

          {/* Numerical Limits & File Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div>
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Max images / product
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={config.globalMaxImagesPerProduct}
                onChange={(e) =>
                  handleGlobalToggle(
                    "globalMaxImagesPerProduct",
                    parseInt(e.target.value) || 1
                  )
                }
                className={YUME_ADMIN_TOKENS.monoInputClass}
              />
            </div>

            <div>
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Max videos / product
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={config.globalMaxVideosPerProduct}
                onChange={(e) =>
                  handleGlobalToggle(
                    "globalMaxVideosPerProduct",
                    parseInt(e.target.value) || 0
                  )
                }
                className={YUME_ADMIN_TOKENS.monoInputClass}
              />
            </div>

            <div>
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Max image size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.globalMaxImageSizeBytesMB}
                onChange={(e) =>
                  handleGlobalToggle(
                    "globalMaxImageSizeBytesMB",
                    parseInt(e.target.value) || 5
                  )
                }
                className={YUME_ADMIN_TOKENS.monoInputClass}
              />
            </div>

            <div>
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Max video size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={config.globalMaxVideoSizeBytesMB}
                onChange={(e) =>
                  handleGlobalToggle(
                    "globalMaxVideoSizeBytesMB",
                    parseInt(e.target.value) || 50
                  )
                }
                className={YUME_ADMIN_TOKENS.monoInputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Allowed image file extensions
              </label>
              <input
                type="text"
                value={config.allowedImageTypes}
                onChange={(e) =>
                  handleGlobalToggle("allowedImageTypes", e.target.value)
                }
                placeholder="jpeg, png, webp, gif"
                className={YUME_ADMIN_TOKENS.monoInputClass}
              />
            </div>
            <div>
              <label className={YUME_ADMIN_TOKENS.labelClass}>
                Allowed video file extensions
              </label>
              <input
                type="text"
                value={config.allowedVideoTypes}
                onChange={(e) =>
                  handleGlobalToggle("allowedVideoTypes", e.target.value)
                }
                placeholder="mp4, webm, mov"
                className={YUME_ADMIN_TOKENS.monoInputClass}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SUBSCRIPTION PLAN TIER MATRIX */}
        <div className={YUME_ADMIN_TOKENS.innerPanelClass}>
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-slate-800 pb-3 mb-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1e2631] dark:text-sky-400" />
              <span>2. Subscription Tier Feature Matrix &amp; Quota Allocation</span>
            </h4>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400">
              Per-Tier Governance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-slate-800 text-[11px] font-bold text-stone-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Subscription Tier</th>
                  <th className="py-2.5 px-3 text-center">Device Images</th>
                  <th className="py-2.5 px-3 text-center">Device Videos</th>
                  <th className="py-2.5 px-3 text-center">
                    External Video Links
                  </th>
                  <th className="py-2.5 px-3 text-center">Max Images</th>
                  <th className="py-2.5 px-3 text-center">Max Videos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800">
                {plans.map((plan) => {
                  const planData = config.planConfigs[plan] ||
                    DEFAULT_PLATFORM_FEATURE_CONFIG.planConfigs[plan] || {
                      allowImageUploadDevice: true,
                      allowVideoUploadDevice: true,
                      allowExternalVideoLinks: true,
                      maxImages: 10,
                      maxVideos: 2,
                    };

                  return (
                    <tr
                      key={plan}
                      className="hover:bg-white/70 dark:hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-white">
                        {plan} Plan
                      </td>

                      {/* Device Images */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex justify-center">
                          <YumeAdminToggle
                            size="sm"
                            checked={planData.allowImageUploadDevice}
                            onChange={(next) =>
                              handlePlanToggle(
                                plan,
                                "allowImageUploadDevice",
                                next
                              )
                            }
                            ariaLabel={`${plan} Device Images`}
                          />
                        </div>
                      </td>

                      {/* Device Videos */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex justify-center">
                          <YumeAdminToggle
                            size="sm"
                            checked={planData.allowVideoUploadDevice}
                            onChange={(next) =>
                              handlePlanToggle(
                                plan,
                                "allowVideoUploadDevice",
                                next
                              )
                            }
                            ariaLabel={`${plan} Device Videos`}
                          />
                        </div>
                      </td>

                      {/* External Video Links */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex justify-center">
                          <YumeAdminToggle
                            size="sm"
                            checked={planData.allowExternalVideoLinks}
                            onChange={(next) =>
                              handlePlanToggle(
                                plan,
                                "allowExternalVideoLinks",
                                next
                              )
                            }
                            ariaLabel={`${plan} External Video Links`}
                          />
                        </div>
                      </td>

                      {/* Max Images */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={planData.maxImages}
                          onChange={(e) =>
                            handlePlanToggle(
                              plan,
                              "maxImages",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className={`${YUME_ADMIN_TOKENS.monoInputClass} !w-20 !py-2 text-center tabular-nums`}
                        />
                      </td>

                      {/* Max Videos */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={planData.maxVideos}
                          onChange={(e) =>
                            handlePlanToggle(
                              plan,
                              "maxVideos",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className={`${YUME_ADMIN_TOKENS.monoInputClass} !w-20 !py-2 text-center tabular-nums`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: VISUAL LOGIC & PREVIEW GUARANTEE */}
        <YumeAdminAdviceBanner label="ADAPTATION RULES:">
          Both Video methods enabled shows URL link input + device file upload
          button · Only External Video links enabled shows URL link input · Only
          Device Video upload enabled shows device upload button · Both Video
          methods disabled hides the video block from Add Product UI.
        </YumeAdminAdviceBanner>

        <YumeAdminActionFooter
          leftContent={
            <button
              type="button"
              onClick={handleResetDefaults}
              className={YUME_ADMIN_TOKENS.secondaryButtonClass}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          }
          centerText="Media & Upload Governance Matrix"
          rightContent={
            <button
              type="submit"
              className={YUME_ADMIN_TOKENS.primaryButtonClass}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Platform Owner Configurations</span>
            </button>
          }
        />
      </form>

      <YumeAdminConfirmModal
        isOpen={showResetConfirm}
        title="Restore Default Media Governance?"
        subtitle="Subscription Tier & Global Upload Quotas"
        description="This will reset all global image/video upload permissions, maximum file sizes, and per-tier media limits (Basic, Pro, Pro Plus, Premium) back to factory defaults."
        confirmLabel="Restore Defaults"
        variant="warning"
        onConfirm={executeResetDefaults}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default PlatformOwnerFeatureManagementCard;
