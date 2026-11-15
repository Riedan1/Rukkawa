/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * YUME "Find Your Fit" — Core Sizing, Category Eligibility, Unit Conversion & Fit Recommendation Engine
 */

export type SizingSubcategoryProfile =
  | "womens_clothing"
  | "mens_clothing"
  | "childrens_clothing"
  | "baby_clothing"
  | "trousers_shorts"
  | "dresses_abayas"
  | "shoes";

export interface SizingMeasurementColumn {
  key: string;
  label: {
    en: string;
    ar: string;
    fr: string;
  };
  chartType: "body" | "garment" | "both";
  unitType: "length" | "weight" | "age" | "size_code" | "text";
  enabled: boolean;
  isCustom?: boolean;
  howToMeasure?: {
    en: string;
    ar: string;
    fr: string;
  };
}

export interface SizingTableRow {
  id: string;
  sizeLabel: string;
  internationalConversions?: {
    dz?: string;
    eu?: string;
    us?: string;
    uk?: string;
  };
  bodyValues: Record<string, string>;
  garmentValues: Record<string, string>;
}

export interface ProductModelDetails {
  enabled: boolean;
  modelNameOrLabel?: string;
  sizeWorn?: string;
  fitDescription?: "true_to_size" | "runs_small" | "runs_large" | "relaxed_fit";
  heightCm?: string;
  weightKg?: string;
  bustOrChestCm?: string;
  waistCm?: string;
  hipsCm?: string;
  shoulderWidthCm?: string;
  footLengthCm?: string;
  customNotes?: string;
}

export interface ProductSizingFitConfig {
  enabled: boolean;
  subcategoryProfile: SizingSubcategoryProfile;
  sizingSystemLabel: string;
  primaryUnit: "cm" | "in";
  fitType?: "slim" | "regular" | "relaxed" | "oversized" | "tailored";
  stretchLevel?: "non_stretch" | "slight_stretch" | "medium_stretch" | "high_stretch";
  showInternationalConversions?: boolean;
  columns: SizingMeasurementColumn[];
  rows: SizingTableRow[];
  modelDetails?: ProductModelDetails;
  measurementDisclaimer?: string;
  updatedAt?: string;
}

export interface FitRecommendationInput {
  heightCm?: number;
  weightKg?: number;
  bustOrChestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  footLengthCm?: number;
  footWidthCm?: number;
  babyAgeMonths?: number;
  fitPreference?: "closer" | "regular" | "relaxed";
}

export interface FitRecommendationResult {
  status: "success" | "insufficient_product_data" | "insufficient_customer_input" | "out_of_range";
  matchBasis: "confirmed_measurements" | "estimated_height_weight" | "none";
  primarySize: string | null;
  closerFitSize: string | null;
  relaxedFitSize: string | null;
  matchedRow: SizingTableRow | null;
  explanation: {
    en: string;
    ar: string;
    fr: string;
  };
  matchedDimensions: Array<{
    key: string;
    label: { en: string; ar: string; fr: string };
    customerValueCm: number;
    chartRangeCm: string;
    fitNote: "ideal" | "snug" | "relaxed";
  }>;
}

// ============================================================================
// MULTILINGUAL TRANSLATIONS FOR FIND YOUR FIT UI
// ============================================================================

export const FIND_YOUR_FIT_TRANSLATIONS = {
  en: {
    buttonLabel: "Find Your Fit",
    modalTitle: "Find Your Fit",
    modalSubtitle: "Category-specific measurements & personalized size guidance",
    tabBodyMeasurements: "Body Measurements",
    tabSizeChart: "Size Chart",
    tabFitRecommendation: "Fit Recommendation",
    tabModelDetails: "Model Details",
    unitCm: "CM",
    unitIn: "IN",
    bodyChartToggle: "Body Chart",
    garmentChartToggle: "Product / Garment Chart",
    selectYourSizeToInspect: "Select a size to inspect its measurements on the diagram",
    howToMeasureTitle: "How to Measure Accurately",
    manualDisclaimer: "Measurements are provided by the merchant. Allow ±1–2 cm tolerance due to manual flat measurement.",
    labelSizeHeader: "Size",
    intlDzHeader: "DZ / Local",
    intlEuHeader: "EU",
    intlUsHeader: "US",
    intlUkHeader: "UK",
    applySizeButton: "Select Size",
    currentlySelectedBadge: "Selected",
    fitRecTitle: "Personalized Fit Calculator",
    fitRecSubtitle: "Enter your measurements for a transparent comparison against this product's actual sizing chart.",
    inputHeight: "Height (cm)",
    inputWeight: "Weight (kg)",
    inputBust: "Bust (cm)",
    inputChest: "Chest (cm)",
    inputWaist: "Waist (cm)",
    inputHips: "Hips (cm)",
    inputFootLength: "Foot Length (cm)",
    inputFootWidth: "Foot Width (cm)",
    prefCloser: "Closer / Fitted",
    prefRegular: "Standard / Regular",
    prefRelaxed: "Looser / Relaxed",
    confirmedMatchBadge: "Confirmed Measurement Match",
    estimatedMatchBadge: "Estimated Fit Match (Height & Weight)",
    primaryFitLabel: "Primary Recommended Fit",
    closerFitLabel: "Closer / Tighter Alternative",
    relaxedFitLabel: "Looser / Relaxed Alternative",
    noAlternativeAvailable: "Not available in range",
    modelWearingTitle: "Model Reference & Fit",
    modelSizeWorn: "Model is wearing",
    modelFitTrue: "True to size",
    modelFitSmall: "Runs small (consider sizing up)",
    modelFitLarge: "Runs large (consider sizing down)",
    modelFitRelaxed: "Designed for a relaxed fit",
    fitTypeLabel: "Garment Cut",
    stretchLevelLabel: "Fabric Elasticity",
    fitSlim: "Slim Cut",
    fitRegular: "Regular Cut",
    fitRelaxed: "Relaxed Cut",
    fitOversized: "Oversized Cut",
    fitTailored: "Tailored Cut",
    stretchNone: "Non-stretch",
    stretchSlight: "Slight stretch",
    stretchMedium: "Medium stretch",
    stretchHigh: "High stretch",
    wizardSectionTitle: "Sizing & Fit Information",
    wizardSectionSubtitle: "Configure dynamic measurements, size chart columns, and model details for the customer Find Your Fit assistant.",
    wizardSkipButton: "Skip Sizing & Fit",
    wizardPreviewButton: "Preview Customer Find Your Fit",
  },
  ar: {
    buttonLabel: "اعثر على مقاسك المناسب",
    modalTitle: "اعثر على مقاسك المناسب",
    modalSubtitle: "قياسات دقيقة حسب الفئة وتوصية المقاس المناسب لك",
    tabBodyMeasurements: "قياسات الجسم",
    tabSizeChart: "جدول المقاسات",
    tabFitRecommendation: "توصية المقاس",
    tabModelDetails: "تفاصيل العارض(ة)",
    unitCm: "سم",
    unitIn: "إنش",
    bodyChartToggle: "جدول قياسات الجسم",
    garmentChartToggle: "جدول قياسات القطعة",
    selectYourSizeToInspect: "اختر مقاساً لعرض قياساته التفصيلية على الرسم التوضيحي",
    howToMeasureTitle: "كيفية أخذ القياسات بدقة",
    manualDisclaimer: "يتم إدخال القياسات من طرف التاجر. قد يوجد تفاوت طفيف بين 1 إلى 2 سم نتيجة القياس اليدوي.",
    labelSizeHeader: "المقاس",
    intlDzHeader: "المقاس المحلي (DZ)",
    intlEuHeader: "أوروبي (EU)",
    intlUsHeader: "أمريكي (US)",
    intlUkHeader: "بريطاني (UK)",
    applySizeButton: "اختيار المقاس",
    currentlySelectedBadge: "محدد حالياً",
    fitRecTitle: "حاسبة المقاس المناسب",
    fitRecSubtitle: "أدخل قياساتك لمقارنتها مباشرة بجدول مقاسات هذا المنتج.",
    inputHeight: "الطول (سم)",
    inputWeight: "الوزن (كغ)",
    inputBust: "محيط الصدر (سم)",
    inputChest: "محيط الصدر (سم)",
    inputWaist: "محيط الخصر (سم)",
    inputHips: "محيط الأرداف (سم)",
    inputFootLength: "طول القدم (سم)",
    inputFootWidth: "عرض القدم (سم)",
    prefCloser: "قصة ضيقة / محددة",
    prefRegular: "قصة عادية / متوازنة",
    prefRelaxed: "قصة واسعة / مريحة",
    confirmedMatchBadge: "تطابق مؤكد بناءً على القياسات",
    estimatedMatchBadge: "توصية تقديرية (بناءً على الطول والوزن)",
    primaryFitLabel: "المقاس الأساسي الموصى به",
    closerFitLabel: "بديل بقصة أضيق",
    relaxedFitLabel: "بديل بقصة أوسع",
    noAlternativeAvailable: "غير متوفر ضمن النطاق",
    modelWearingTitle: "بيانات العارض(ة) والملاءمة",
    modelSizeWorn: "المقاس الذي يرتديه العارض",
    modelFitTrue: "مقاس مطابق للمعتاد",
    modelFitSmall: "قصة صغيرة (ينصح بمقاس أكبر)",
    modelFitLarge: "قصة كبيرة (ينصح بمقاس أصغر)",
    modelFitRelaxed: "مصمم بقصة مريحة وواسعة",
    fitTypeLabel: "قصة المنتج",
    stretchLevelLabel: "مرونة القماش",
    fitSlim: "قصة ضيقة (Slim)",
    fitRegular: "قصة عادية (Regular)",
    fitRelaxed: "قصة مريحة (Relaxed)",
    fitOversized: "قصة واسعة (Oversized)",
    fitTailored: "قصة مفصلة (Tailored)",
    stretchNone: "بدون تمدد",
    stretchSlight: "تمدد خفيف",
    stretchMedium: "تمدد متوسط",
    stretchHigh: "تمدد عالي",
    wizardSectionTitle: "معلومات المقاسات والملاءمة",
    wizardSectionSubtitle: "قم بإعداد قياسات المنتج وجدول المقاسات وبيانات العارض لتظهر للزبون في نافذة اعثر على مقاسك المناسب.",
    wizardSkipButton: "تخطي قسم المقاسات",
    wizardPreviewButton: "معاينة نافذة المقاسات للزبون",
  },
  fr: {
    buttonLabel: "Trouvez votre taille",
    modalTitle: "Trouvez votre taille",
    modalSubtitle: "Mesures spécifiques à la catégorie et guide de coupe personnalisé",
    tabBodyMeasurements: "Mesures corporelles",
    tabSizeChart: "Tableau des tailles",
    tabFitRecommendation: "Recommandation de taille",
    tabModelDetails: "Détails du mannequin",
    unitCm: "CM",
    unitIn: "IN",
    bodyChartToggle: "Mesures du corps",
    garmentChartToggle: "Mesures du vêtement",
    selectYourSizeToInspect: "Sélectionnez une taille pour afficher ses mesures sur le schéma",
    howToMeasureTitle: "Comment mesurer avec précision",
    manualDisclaimer: "Les mesures sont fournies par le marchand. Tolérance de ±1 à 2 cm selon la mesure à plat.",
    labelSizeHeader: "Taille",
    intlDzHeader: "DZ / Local",
    intlEuHeader: "EU",
    intlUsHeader: "US",
    intlUkHeader: "UK",
    applySizeButton: "Choisir la taille",
    currentlySelectedBadge: "Sélectionné",
    fitRecTitle: "Calculateur de taille personnalisé",
    fitRecSubtitle: "Renseignez vos mensurations pour les comparer aux données réelles de cet article.",
    inputHeight: "Hauteur (cm)",
    inputWeight: "Poids (kg)",
    inputBust: "Tour de poitrine (cm)",
    inputChest: "Tour de poitrine (cm)",
    inputWaist: "Tour de taille (cm)",
    inputHips: "Tour de hanches (cm)",
    inputFootLength: "Longueur du pied (cm)",
    inputFootWidth: "Largeur du pied (cm)",
    prefCloser: "Coupe ajustée",
    prefRegular: "Coupe standard",
    prefRelaxed: "Coupe ample",
    confirmedMatchBadge: "Correspondance confirmée par mensurations",
    estimatedMatchBadge: "Taille estimée (Hauteur et Poids)",
    primaryFitLabel: "Taille idéale recommandée",
    closerFitLabel: "Alternative plus ajustée",
    relaxedFitLabel: "Alternative plus ample",
    noAlternativeAvailable: "Non disponible dans la gamme",
    modelWearingTitle: "Référence du mannequin et coupe",
    modelSizeWorn: "Le mannequin porte la taille",
    modelFitTrue: "Taille normalement",
    modelFitSmall: "Taille petit (prenez une taille au-dessus)",
    modelFitLarge: "Taille grand (prenez une taille en-dessous)",
    modelFitRelaxed: "Coupe ample et décontractée",
    fitTypeLabel: "Coupe du vêtement",
    stretchLevelLabel: "Élasticité du tissu",
    fitSlim: "Coupe ajustée (Slim)",
    fitRegular: "Coupe classique (Regular)",
    fitRelaxed: "Coupe décontractée (Relaxed)",
    fitOversized: "Coupe ample (Oversized)",
    fitTailored: "Coupe sur-mesure (Tailored)",
    stretchNone: "Non extensible",
    stretchSlight: "Légèrement extensible",
    stretchMedium: "Extensible",
    stretchHigh: "Très extensible",
    wizardSectionTitle: "Informations de taille et coupe",
    wizardSectionSubtitle: "Configurez les mensurations, le tableau des tailles et les détails du mannequin pour vos clients.",
    wizardSkipButton: "Ignorer cette étape",
    wizardPreviewButton: "Aperçu client Trouvez votre taille",
  },
} as const;

export function getFitTranslation(lang: string) {
  if (lang === "ar") return FIND_YOUR_FIT_TRANSLATIONS.ar;
  if (lang === "fr") return FIND_YOUR_FIT_TRANSLATIONS.fr;
  return FIND_YOUR_FIT_TRANSLATIONS.en;
}

// ============================================================================
// SUBCATEGORY PROFILE METADATA & DEFAULT COLUMNS
// ============================================================================

export const SIZING_PROFILE_LABELS: Record<
  SizingSubcategoryProfile,
  { en: string; ar: string; fr: string; defaultSystem: string; defaultSizes: string[] }
> = {
  womens_clothing: {
    en: "Women's Clothing",
    ar: "ملابس نسائية",
    fr: "Vêtements Femmes",
    defaultSystem: "Women's Apparel (XS - XXL)",
    defaultSizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  mens_clothing: {
    en: "Men's Clothing",
    ar: "ملابس رجالية",
    fr: "Vêtements Hommes",
    defaultSystem: "Men's Apparel (S - 3XL)",
    defaultSizes: ["S", "M", "L", "XL", "XXL", "3XL"],
  },
  childrens_clothing: {
    en: "Children's Clothing",
    ar: "ملابس الأطفال",
    fr: "Vêtements Enfants",
    defaultSystem: "Children's Age & Height (2Y - 12Y)",
    defaultSizes: ["2 Years", "4 Years", "6 Years", "8 Years", "10 Years", "12 Years"],
  },
  baby_clothing: {
    en: "Baby Clothing",
    ar: "ملابس الرضع",
    fr: "Vêtements Bébé",
    defaultSystem: "Infant Age Range (Newborn - 24M)",
    defaultSizes: ["Newborn", "0-3 Months", "3-6 Months", "6-12 Months", "12-18 Months", "18-24 Months"],
  },
  trousers_shorts: {
    en: "Trousers & Shorts",
    ar: "البناطيل والشورتات",
    fr: "Pantalons et Shorts",
    defaultSystem: "Waist & Lower Body (S - XXL / EU 38 - 46)",
    defaultSizes: ["S", "M", "L", "XL", "XXL"],
  },
  dresses_abayas: {
    en: "Dresses & Abayas",
    ar: "الفساتين والعبايات",
    fr: "Robes et Abayas",
    defaultSystem: "Full-Length & Modest Wear (S - XXL)",
    defaultSizes: ["S", "M", "L", "XL", "XXL"],
  },
  shoes: {
    en: "Shoes & Footwear",
    ar: "الأحذية",
    fr: "Chaussures",
    defaultSystem: "Footwear Sizing (EU 36 - 45)",
    defaultSizes: ["EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44"],
  },
};

export function getDefaultColumnsForProfile(profile: SizingSubcategoryProfile): SizingMeasurementColumn[] {
  switch (profile) {
    case "womens_clothing":
      return [
        {
          key: "bust",
          label: { en: "Bust", ar: "محيط الصدر", fr: "Tour de poitrine" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure horizontally around the fullest part of your bust while keeping the tape level.",
            ar: "يقاس أفقياً حول الجزء الأعرض من الصدر مع إبقاء شريط القياس مستوياً.",
            fr: "Mesurez horizontalement autour de la partie la plus forte de la poitrine.",
          },
        },
        {
          key: "waist",
          label: { en: "Waist", ar: "محيط الخصر", fr: "Tour de taille" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure around the narrowest part of your natural waistline.",
            ar: "يقاس حول أضيق جزء من خط الخصر الطبيعي.",
            fr: "Mesurez autour de la partie la plus étroite de votre taille naturelle.",
          },
        },
        {
          key: "hips",
          label: { en: "Hips", ar: "محيط الأرداف", fr: "Tour de hanches" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Stand with heels together and measure around the fullest contour of your hips.",
            ar: "قف مع ضم الكعبين وقس حول الجزء الأعرض من الأرداف.",
            fr: "Mesurez autour de la partie la plus large de vos hanches, pieds joints.",
          },
        },
        {
          key: "shoulder_width",
          label: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure straight across the back from one shoulder seam tip to the other.",
            ar: "يقاس من طرف خياطة الكتف الأول إلى طرف الكتف المقابل عبر الظهر.",
            fr: "Mesurez d'une couture d'épaule à l'autre dans le dos.",
          },
        },
        {
          key: "sleeve_length",
          label: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure from the top shoulder seam down to the cuff edge.",
            ar: "يقاس من خياطة الكتف العلوية حتى نهاية طرف الكم.",
            fr: "Mesurez de la couture de l'épaule jusqu'au bas du poignet.",
          },
        },
        {
          key: "arm_circumference",
          label: { en: "Arm Circumference", ar: "محيط الذراع", fr: "Tour de bras" },
          chartType: "garment",
          unitType: "length",
          enabled: false,
          howToMeasure: {
            en: "Measure around the fullest upper part of the sleeve/bicep.",
            ar: "يقاس حول الجزء العلوي الأعرض من الذراع.",
            fr: "Mesurez autour de la partie la plus large du haut du bras.",
          },
        },
        {
          key: "garment_length",
          label: { en: "Garment Length", ar: "طول القطعة", fr: "Longueur du vêtement" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure vertically from the highest shoulder point next to the collar down to the hem.",
            ar: "يقاس عمودياً من أعلى نقطة في الكتف بجانب الياقة حتى الحافة السفلية.",
            fr: "Mesurez verticalement du point le plus haut de l'épaule jusqu'à l'ourlet.",
          },
        },
        {
          key: "height",
          label: { en: "Height", ar: "الطول", fr: "Hauteur" },
          chartType: "body",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure your total stature barefoot from the top of your head to the floor.",
            ar: "يقاس الطول الكلي بدون حذاء من أعلى الرأس حتى الأرض.",
            fr: "Mesurez votre stature totale pieds nus du sommet de la tête au sol.",
          },
        },
      ];

    case "mens_clothing":
      return [
        {
          key: "chest",
          label: { en: "Chest", ar: "محيط الصدر", fr: "Tour de poitrine" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure under the arms around the fullest part of your chest with tape parallel to the floor.",
            ar: "يقاس تحت الذراعين حول أعرض منطقة في الصدر بشكل أفقي متوازٍ.",
            fr: "Mesurez sous les bras autour de la partie la plus large de la poitrine.",
          },
        },
        {
          key: "waist",
          label: { en: "Waist", ar: "محيط الخصر", fr: "Tour de taille" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure around your natural waistline where trousers normally sit.",
            ar: "يقاس حول خط الخصر الطبيعي.",
            fr: "Mesurez autour de votre taille naturelle.",
          },
        },
        {
          key: "hips",
          label: { en: "Hips", ar: "محيط الأرداف", fr: "Tour de hanches" },
          chartType: "body",
          unitType: "length",
          enabled: false,
          howToMeasure: {
            en: "Measure around the fullest point of your hips and seat.",
            ar: "يقاس حول أعرض منطقة في الأرداف.",
            fr: "Mesurez autour de la partie la plus large des hanches.",
          },
        },
        {
          key: "shoulder_width",
          label: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure across the upper back from shoulder seam to shoulder seam.",
            ar: "يقاس عبر أعلى الظهر من خياطة الكتف إلى الكتف الآخر.",
            fr: "Mesurez d'une couture d'épaule à l'autre dans le haut du dos.",
          },
        },
        {
          key: "sleeve_length",
          label: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure from the outer shoulder seam down to the end of the cuff.",
            ar: "يقاس من خياطة الكتف الخارجية حتى نهاية الكم.",
            fr: "Mesurez de la couture extérieure de l'épaule jusqu'au poignet.",
          },
        },
        {
          key: "neck",
          label: { en: "Neck Circumference", ar: "محيط الرقبة", fr: "Tour de cou" },
          chartType: "body",
          unitType: "length",
          enabled: false,
          howToMeasure: {
            en: "Measure around the base of the neck where a shirt collar rests.",
            ar: "يقاس حول قاعدة الرقبة في موضع ياقة القميص.",
            fr: "Mesurez à la base du cou, là où se pose le col d'une chemise.",
          },
        },
        {
          key: "garment_length",
          label: { en: "Garment Length", ar: "طول القطعة", fr: "Longueur du vêtement" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure from the highest point of the shoulder next to the collar down to the bottom hem.",
            ar: "يقاس من أعلى نقطة بالكتف بجانب الياقة حتى أسفل القطعة.",
            fr: "Mesurez du haut de l'épaule près du col jusqu'au bas du vêtement.",
          },
        },
        {
          key: "height",
          label: { en: "Height", ar: "الطول", fr: "Hauteur" },
          chartType: "body",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Total body height measured barefoot.",
            ar: "الطول الكلي للجسم بدون حذاء.",
            fr: "Stature totale mesurée pieds nus.",
          },
        },
      ];

    case "childrens_clothing":
      return [
        {
          key: "age_range",
          label: { en: "Age Range", ar: "الفئة العمرية", fr: "Tranche d'âge" },
          chartType: "body",
          unitType: "age",
          enabled: true,
        },
        {
          key: "height",
          label: { en: "Child Height", ar: "طول الطفل", fr: "Stature de l'enfant" },
          chartType: "body",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure the child standing straight against a wall from head to heel.",
            ar: "يقاس طول الطفل واقفاً باستقامة من أعلى الرأس حتى الكعب.",
            fr: "Mesurez l'enfant debout contre un mur, de la tête aux talons.",
          },
        },
        {
          key: "chest",
          label: { en: "Chest", ar: "محيط الصدر", fr: "Tour de poitrine" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure comfortably around the fullest part of the child's chest.",
            ar: "يقاس حول أعرض منطقة في صدر الطفل.",
            fr: "Mesurez autour de la partie la plus large de la poitrine de l'enfant.",
          },
        },
        {
          key: "waist",
          label: { en: "Waist", ar: "محيط الخصر", fr: "Tour de taille" },
          chartType: "both",
          unitType: "length",
          enabled: true,
        },
        {
          key: "hips",
          label: { en: "Hips", ar: "محيط الأرداف", fr: "Tour de hanches" },
          chartType: "body",
          unitType: "length",
          enabled: false,
        },
        {
          key: "shoulder_width",
          label: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
        },
        {
          key: "sleeve_length",
          label: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
        },
        {
          key: "garment_length",
          label: { en: "Garment Length", ar: "طول القطعة", fr: "Longueur du vêtement" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
        },
      ];

    case "baby_clothing":
      return [
        {
          key: "age_range",
          label: { en: "Age (Months)", ar: "العمر (بالأشهر)", fr: "Âge (Mois)" },
          chartType: "body",
          unitType: "age",
          enabled: true,
        },
        {
          key: "height",
          label: { en: "Baby Height", ar: "طول الرضيع", fr: "Taille du bébé" },
          chartType: "body",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure baby lying flat from the crown of the head to the heel.",
            ar: "يقاس طول الرضيع مستلقياً من أعلى الرأس حتى الكعب.",
            fr: "Mesurez le bébé allongé à plat, du sommet de la tête au talon.",
          },
        },
        {
          key: "weight",
          label: { en: "Baby Weight (kg)", ar: "وزن الرضيع (كغ)", fr: "Poids du bébé (kg)" },
          chartType: "body",
          unitType: "weight",
          enabled: true,
        },
        {
          key: "chest",
          label: { en: "Chest", ar: "محيط الصدر", fr: "Tour de poitrine" },
          chartType: "both",
          unitType: "length",
          enabled: true,
        },
        {
          key: "waist",
          label: { en: "Waist", ar: "محيط الخصر", fr: "Tour de taille" },
          chartType: "body",
          unitType: "length",
          enabled: false,
        },
        {
          key: "garment_length",
          label: { en: "Romper / Garment Length", ar: "طول القطعة", fr: "Longueur totale" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
        },
      ];

    case "trousers_shorts":
      return [
        {
          key: "waist",
          label: { en: "Waist", ar: "محيط الخصر", fr: "Tour de taille" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure around your natural waist or across the top waistband of the trousers.",
            ar: "يقاس حول الخصر الطبيعي أو على طول حزام البنطال العلوي.",
            fr: "Mesurez autour de la taille naturelle ou le long de la ceinture du pantalon.",
          },
        },
        {
          key: "hips",
          label: { en: "Hips", ar: "محيط الأرداف", fr: "Tour de hanches" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure around the fullest part of the hips and seat.",
            ar: "يقاس حول أعرض منطقة في الأرداف.",
            fr: "Mesurez autour de la partie la plus large des hanches.",
          },
        },
        {
          key: "inseam",
          label: { en: "Inseam Length", ar: "طول الساق الداخلي", fr: "Entrejambe" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure from the inner crotch seam straight down to the bottom ankle hem.",
            ar: "يقاس من الخياطة الداخلية لأعلى الفخذ حتى حافة الكاحل السفلية.",
            fr: "Mesurez de la couture intérieure de l'entrejambe jusqu'au bas de la jambe.",
          },
        },
        {
          key: "outseam",
          label: { en: "Outseam / Total Length", ar: "الطول الخارجي الكلي", fr: "Longueur extérieure" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure along the outer side from the top of the waistband to the bottom hem.",
            ar: "يقاس على الجانب الخارجي من أعلى الخصر حتى نهاية الساق.",
            fr: "Mesurez sur le côté extérieur, du haut de la ceinture jusqu'à l'ourlet.",
          },
        },
        {
          key: "thigh",
          label: { en: "Thigh Circumference", ar: "محيط الفخذ", fr: "Tour de cuisse" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure around the fullest part of the upper thigh just below the crotch.",
            ar: "يقاس حول أعرض جزء من أعلى الفخذ.",
            fr: "Mesurez autour de la partie la plus large du haut de la cuisse.",
          },
        },
        {
          key: "leg_opening",
          label: { en: "Leg Opening", ar: "فتحة الساق السفلية", fr: "Ouverture du bas" },
          chartType: "garment",
          unitType: "length",
          enabled: false,
          howToMeasure: {
            en: "Measure the circumference at the bottom ankle cuff opening.",
            ar: "يقاس محيط فتحة الساق السفلية عند الكاحل.",
            fr: "Mesurez la circonférence au bas de la jambe.",
          },
        },
      ];

    case "dresses_abayas":
      return [
        {
          key: "bust",
          label: { en: "Bust", ar: "محيط الصدر", fr: "Tour de poitrine" },
          chartType: "both",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure around the fullest part of the bust while keeping the tape relaxed.",
            ar: "يقاس حول أعرض منطقة في الصدر مع إبقاء الشريط مريحاً.",
            fr: "Mesurez autour de la partie la plus forte de la poitrine.",
          },
        },
        {
          key: "waist",
          label: { en: "Waist", ar: "محيط الخصر", fr: "Tour de taille" },
          chartType: "both",
          unitType: "length",
          enabled: true,
        },
        {
          key: "hips",
          label: { en: "Hips", ar: "محيط الأرداف", fr: "Tour de hanches" },
          chartType: "both",
          unitType: "length",
          enabled: true,
        },
        {
          key: "shoulder_width",
          label: { en: "Shoulder Width", ar: "عرض الكتفين", fr: "Largeur d'épaules" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
        },
        {
          key: "sleeve_length",
          label: { en: "Sleeve Length", ar: "طول الكم", fr: "Longueur de manche" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
        },
        {
          key: "garment_length",
          label: { en: "Total Dress / Abaya Length", ar: "الطول الكلي للفستان / العباية", fr: "Longueur totale (Robe / Abaya)" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure vertically from the top shoulder seam all the way down to the floor hem.",
            ar: "يقاس عمودياً من أعلى الكتف حتى الحافة السفلية الكاملة.",
            fr: "Mesurez verticalement du haut de l'épaule jusqu'au bas de la robe/abaya.",
          },
        },
        {
          key: "height",
          label: { en: "Recommended Height", ar: "طول القامة المناسب", fr: "Stature recommandée" },
          chartType: "body",
          unitType: "length",
          enabled: true,
        },
      ];

    case "shoes":
      return [
        {
          key: "foot_length",
          label: { en: "Foot Length", ar: "طول القدم", fr: "Longueur du pied" },
          chartType: "body",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Place your foot flat on a sheet of paper against a wall and measure from the back of your heel to the tip of your longest toe.",
            ar: "ضع قدمك على ورقة بمحاذاة الحائط وقس المسافة من مؤخرة الكعب إلى طرف أطول إصبع.",
            fr: "Posez votre pied à plat sur une feuille contre un mur et mesurez du talon jusqu'à l'orteil le plus long.",
          },
        },
        {
          key: "foot_width",
          label: { en: "Foot Width", ar: "عرض القدم", fr: "Largeur du pied" },
          chartType: "body",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Measure across the widest part of the ball of your foot from side to side.",
            ar: "يقاس عرض القدم عند أعرض منطقة في مقدمة القدم.",
            fr: "Mesurez la partie la plus large de l'avant-pied d'un bord à l'autre.",
          },
        },
        {
          key: "insole_length",
          label: { en: "Inner Sole Length", ar: "طول النعل الداخلي", fr: "Longueur semelle intérieure" },
          chartType: "garment",
          unitType: "length",
          enabled: true,
          howToMeasure: {
            en: "Internal footbed length inside the shoe from heel cup to toe box.",
            ar: "طول النعل الداخلي للحذاء من الكعب حتى المقدمة.",
            fr: "Longueur intérieure de la chaussure du talon à la pointe.",
          },
        },
      ];
  }
}

// ============================================================================
// CATEGORY ELIGIBILITY & PROFILE RESOLUTION
// ============================================================================

const EXCLUDED_FASHION_SUBCATEGORIES = [
  "fashion_bags",
  "fashion_jewelry",
  "fashion_watches",
  "fashion_hats_caps",
  "kids_accessories",
  "kids_toys",
  "bags",
  "jewelry",
  "watches",
  "hats",
  "caps",
  "accessories",
  "toys",
  "electronics",
  "smartphones",
  "laptops",
  "gaming",
  "home_living",
  "furniture",
  "arts_crafts",
  "crafts",
  "food_beverages",
  "food",
  "automotive_tools",
  "health_beauty",
  "beauty",
  "cosmetics",
];

/**
 * Determines whether a selected category/subcategory is eligible for the
 * "Sizing & Fit Information" step and customer-facing "Find Your Fit" button.
 */
export function isSizingFitEligibleCategory(
  category?: string,
  subcategory?: string,
  specs?: Array<{ key: string; value: string }>,
  productTitle?: string
): boolean {
  const combined = `${category || ""} ${subcategory || ""}`.trim().toLowerCase();
  if (!combined) return false;

  // Explicit exclusion check first (e.g., bags, watches, jewelry, electronics, crafts)
  for (const excl of EXCLUDED_FASHION_SUBCATEGORIES) {
    if (combined === excl || subcategory?.toLowerCase() === excl || category?.toLowerCase() === excl) {
      return false;
    }
  }

  // Direct match against supported fashion & footwear categories
  const eligibleTokens = [
    "fashion_clothing",
    "fashion_womens_clothing",
    "fashion_mens_clothing",
    "fashion_dresses",
    "fashion_abayas",
    "fashion_trousers",
    "fashion_shorts",
    "fashion_shoes",
    "kids_clothing",
    "kids_baby_clothing",
    "kids_shoes",
    "fashion_all",
    "women's clothing",
    "womens clothing",
    "men's clothing",
    "mens clothing",
    "children's clothing",
    "childrens clothing",
    "baby clothing",
    "babies' clothing",
    "dresses",
    "dress",
    "abayas",
    "abaya",
    "trousers",
    "pants",
    "jeans",
    "shorts",
    "shoes",
    "footwear",
    "sneakers",
    "boots",
    "sandals",
    "clothing",
    "apparel",
    "fashion",
    "kids",
  ];

  const hasEligibleToken = eligibleTokens.some((tok) => combined.includes(tok));
  if (!hasEligibleToken) return false;

  // Guard against bags/watches/jewelry if category is generic "Fashion"
  const fullContext = `${combined} ${productTitle || ""}`.toLowerCase();
  if (
    (combined === "fashion" || combined === "fashion_all") &&
    /\b(bag|handbag|backpack|watch|necklace|bracelet|earring|ring|sunglasses|perfume)\b/i.test(fullContext)
  ) {
    return false;
  }

  return true;
}

/**
 * Resolves the most appropriate `SizingSubcategoryProfile` from the product's
 * category, subcategory, specifications (e.g. Gender), and product title.
 */
export function resolveSizingSubcategoryProfile(
  category?: string,
  subcategory?: string,
  specs?: Array<{ key: string; value: string }>,
  productTitle?: string
): SizingSubcategoryProfile {
  const catText = `${category || ""} ${subcategory || ""}`.toLowerCase();
  const titleText = (productTitle || "").toLowerCase();
  const genderSpec = (
    specs?.find((s) => ["gender", "genre", "sexe", "جنس", "الجنس"].includes(s.key.toLowerCase().trim()))?.value || ""
  ).toLowerCase();

  // 1. Shoes
  if (
    catText.includes("shoe") ||
    catText.includes("footwear") ||
    /\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|loafer|heels|trainer|chaussure|حذاء|أحذية)\b/i.test(
      `${catText} ${titleText}`
    )
  ) {
    return "shoes";
  }

  // 2. Baby Clothing
  if (
    catText.includes("baby") ||
    catText.includes("infant") ||
    catText.includes("newborn") ||
    /\b(baby|infant|newborn|romper|onesie|bodysuit|bébé|رضيع|مواليد)\b/i.test(`${catText} ${titleText}`)
  ) {
    return "baby_clothing";
  }

  // 3. Children's Clothing
  if (
    catText.includes("kids") ||
    catText.includes("child") ||
    genderSpec === "boys" ||
    genderSpec === "girls" ||
    /\b(kids|child|children|junior|boys|girls|enfant|أطفال)\b/i.test(`${catText} ${titleText}`)
  ) {
    return "childrens_clothing";
  }

  // 4. Dresses & Abayas
  if (
    catText.includes("dress") ||
    catText.includes("abaya") ||
    /\b(dress|dresses|abaya|abayas|kaftan|caftan|djellaba|gandoura|karakou|robe|فستان|عباية|عباءة|قفطان|جلابة)\b/i.test(
      `${catText} ${titleText}`
    )
  ) {
    return "dresses_abayas";
  }

  // 5. Trousers & Shorts
  if (
    catText.includes("trouser") ||
    catText.includes("short") ||
    catText.includes("pant") ||
    /\b(trouser|trousers|pants|jeans|chinos|joggers|shorts|cargo|leggings|pantalon|سروال|بنطلون|شورت)\b/i.test(
      `${catText} ${titleText}`
    )
  ) {
    return "trousers_shorts";
  }

  // 6. Women's vs Men's Clothing
  if (
    catText.includes("women") ||
    genderSpec.includes("women") ||
    genderSpec.includes("female") ||
    genderSpec.includes("femme") ||
    /\b(women|woman|ladies|female|blouse|skirt|hijab|femme|نسائي|للنساء)\b/i.test(`${catText} ${titleText}`)
  ) {
    return "womens_clothing";
  }

  if (
    catText.includes("men") ||
    genderSpec.includes("men") ||
    genderSpec.includes("male") ||
    genderSpec.includes("homme")
  ) {
    return "mens_clothing";
  }

  // Default to men's or women's based on title cues, otherwise women's clothing
  if (/\b(men|man|mens|burnous|suit|blazer|shirt|hoodie|jacket|homme|رجالي|للرجال)\b/i.test(titleText)) {
    return "mens_clothing";
  }

  return "womens_clothing";
}

// ============================================================================
// DEFAULT TEMPLATE GENERATOR & SIZE ROW SYNCHRONIZER
// ============================================================================

const STANDARD_INTL_CONVERSIONS: Record<string, { dz: string; eu: string; us: string; uk: string }> = {
  XS: { dz: "XS", eu: "34", us: "2", uk: "6" },
  S: { dz: "S", eu: "36", us: "4", uk: "8" },
  M: { dz: "M", eu: "38", us: "6", uk: "10" },
  L: { dz: "L", eu: "40", us: "8", uk: "12" },
  XL: { dz: "XL", eu: "42", us: "10", uk: "14" },
  XXL: { dz: "XXL", eu: "44", us: "12", uk: "16" },
  "2XL": { dz: "XXL", eu: "44", us: "12", uk: "16" },
  "3XL": { dz: "3XL", eu: "46", us: "14", uk: "18" },
  "4XL": { dz: "4XL", eu: "48", us: "16", uk: "20" },
  "EU 36": { dz: "36", eu: "36", us: "5.5", uk: "3.5" },
  "EU 37": { dz: "37", eu: "37", us: "6.5", uk: "4" },
  "EU 38": { dz: "38", eu: "38", us: "7", uk: "5" },
  "EU 39": { dz: "39", eu: "39", us: "8", uk: "6" },
  "EU 40": { dz: "40", eu: "40", us: "8.5", uk: "6.5" },
  "EU 41": { dz: "41", eu: "41", us: "9.5", uk: "7.5" },
  "EU 42": { dz: "42", eu: "42", us: "10", uk: "8" },
  "EU 43": { dz: "43", eu: "43", us: "11", uk: "9" },
  "EU 44": { dz: "44", eu: "44", us: "11.5", uk: "9.5" },
  "EU 45": { dz: "45", eu: "45", us: "12.5", uk: "10.5" },
};

export function normalizeSizeShortCode(rawSize: string): string {
  if (!rawSize) return "";
  const parenMatch = rawSize.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim();
  }
  return rawSize.trim();
}

export function getSuggestedMeasurementsForSize(
  profile: SizingSubcategoryProfile,
  rawSizeLabel: string,
  rowIndex: number
): { bodyValues: Record<string, string>; garmentValues: Record<string, string> } {
  const short = normalizeSizeShortCode(rawSizeLabel).toUpperCase();
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const idx = sizeOrder.indexOf(short) >= 0 ? sizeOrder.indexOf(short) : Math.min(rowIndex, 6);

  switch (profile) {
    case "womens_clothing": {
      const bustStart = 82 + idx * 4;
      const waistStart = 64 + idx * 4;
      const hipsStart = 88 + idx * 4;
      const heightStart = 158 + Math.min(idx, 4) * 4;
      return {
        bodyValues: {
          bust: `${bustStart}-${bustStart + 4}`,
          waist: `${waistStart}-${waistStart + 4}`,
          hips: `${hipsStart}-${hipsStart + 4}`,
          height: `${heightStart}-${heightStart + 5}`,
        },
        garmentValues: {
          bust: `${bustStart + 6}`,
          waist: `${waistStart + 6}`,
          hips: `${hipsStart + 6}`,
          shoulder_width: `${37 + idx * 1.5}`,
          sleeve_length: `${57 + idx * 1}`,
          arm_circumference: `${30 + idx * 1.5}`,
          garment_length: `${62 + idx * 1.5}`,
        },
      };
    }
    case "mens_clothing": {
      const chestStart = 88 + idx * 4;
      const waistStart = 74 + idx * 4;
      const hipsStart = 90 + idx * 4;
      const heightStart = 166 + Math.min(idx, 4) * 4;
      return {
        bodyValues: {
          chest: `${chestStart}-${chestStart + 4}`,
          waist: `${waistStart}-${waistStart + 4}`,
          hips: `${hipsStart}-${hipsStart + 4}`,
          neck: `${37 + idx * 1.5}`,
          height: `${heightStart}-${heightStart + 5}`,
        },
        garmentValues: {
          chest: `${chestStart + 8}`,
          waist: `${waistStart + 8}`,
          shoulder_width: `${43 + idx * 1.5}`,
          sleeve_length: `${61 + idx * 1}`,
          garment_length: `${68 + idx * 2}`,
        },
      };
    }
    case "dresses_abayas": {
      const bustStart = 84 + idx * 4;
      const waistStart = 66 + idx * 4;
      const hipsStart = 90 + idx * 4;
      const heightStart = 158 + Math.min(idx, 4) * 4;
      return {
        bodyValues: {
          bust: `${bustStart}-${bustStart + 4}`,
          waist: `${waistStart}-${waistStart + 4}`,
          hips: `${hipsStart}-${hipsStart + 4}`,
          height: `${heightStart}-${heightStart + 5}`,
        },
        garmentValues: {
          bust: `${bustStart + 8}`,
          waist: `${waistStart + 8}`,
          hips: `${hipsStart + 8}`,
          shoulder_width: `${38 + idx * 1.5}`,
          sleeve_length: `${58 + idx * 1}`,
          garment_length: `${136 + idx * 3}`,
        },
      };
    }
    case "trousers_shorts": {
      const waistStart = 72 + idx * 4;
      const hipsStart = 90 + idx * 4;
      return {
        bodyValues: {
          waist: `${waistStart}-${waistStart + 4}`,
          hips: `${hipsStart}-${hipsStart + 4}`,
          inseam: `${76 + Math.min(idx, 3) * 2}`,
        },
        garmentValues: {
          waist: `${waistStart + 2}`,
          hips: `${hipsStart + 4}`,
          inseam: `${77 + Math.min(idx, 3) * 2}`,
          outseam: `${102 + idx * 2}`,
          thigh: `${56 + idx * 2}`,
          leg_opening: `${36 + idx * 1}`,
        },
      };
    }
    case "childrens_clothing": {
      const ageY = 2 + idx * 2;
      const hStart = 92 + idx * 12;
      const cStart = 53 + idx * 4;
      const wStart = 50 + idx * 2.5;
      return {
        bodyValues: {
          age_range: `${ageY}-${ageY + 1}Y`,
          height: `${hStart}-${hStart + 8}`,
          chest: `${Math.round(cStart)}-${Math.round(cStart + 4)}`,
          waist: `${Math.round(wStart)}-${Math.round(wStart + 3)}`,
          hips: `${Math.round(cStart + 3)}-${Math.round(cStart + 7)}`,
        },
        garmentValues: {
          chest: `${Math.round(cStart + 6)}`,
          waist: `${Math.round(wStart + 4)}`,
          shoulder_width: `${27 + idx * 2}`,
          sleeve_length: `${33 + idx * 4}`,
          garment_length: `${40 + idx * 4.5}`,
        },
      };
    }
    case "baby_clothing": {
      const ageLabels = ["0-1M", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M"];
      const hStart = 50 + idx * 6;
      const wStart = 3.5 + idx * 1.8;
      const cStart = 41 + idx * 2.5;
      return {
        bodyValues: {
          age_range: ageLabels[idx] || `${idx * 3}-${(idx + 1) * 3}M`,
          height: `${hStart}-${hStart + 6}`,
          weight: `${wStart.toFixed(1)}-${(wStart + 1.8).toFixed(1)}`,
          chest: `${Math.round(cStart)}-${Math.round(cStart + 3)}`,
          waist: `${Math.round(cStart - 1)}-${Math.round(cStart + 2)}`,
        },
        garmentValues: {
          chest: `${Math.round(cStart + 4)}`,
          garment_length: `${44 + idx * 5}`,
        },
      };
    }
    case "shoes": {
      const euMatch = rawSizeLabel.match(/(\d{2})/);
      const euNum = euMatch ? parseInt(euMatch[1], 10) : 37 + idx;
      const footLen = (23.0 + (euNum - 36) * 0.65).toFixed(1);
      const footWid = (8.8 + (euNum - 36) * 0.2).toFixed(1);
      const insoleLen = (Number(footLen) + 0.5).toFixed(1);
      return {
        bodyValues: {
          foot_length: `${footLen}`,
          foot_width: `${footWid}`,
        },
        garmentValues: {
          insole_length: `${insoleLen}`,
        },
      };
    }
  }
}

export function createDefaultSizingFitConfig(
  profile: SizingSubcategoryProfile,
  initialSizes?: string[],
  prefillMeasurements = true
): ProductSizingFitConfig {
  const meta = SIZING_PROFILE_LABELS[profile];
  const rawSizes =
    initialSizes && initialSizes.length > 0
      ? initialSizes.filter((s) => s && !s.toLowerCase().includes("custom"))
      : meta.defaultSizes;

  const effectiveSizes = rawSizes.length > 0 ? rawSizes : meta.defaultSizes;

  const rows: SizingTableRow[] = effectiveSizes.map((sz, idx) => {
    const shortLabel = normalizeSizeShortCode(sz);
    const intl = STANDARD_INTL_CONVERSIONS[shortLabel.toUpperCase()] || STANDARD_INTL_CONVERSIONS[sz.toUpperCase()] || {
      dz: shortLabel,
      eu: profile === "shoes" ? shortLabel.replace("EU ", "") : "",
      us: "",
      uk: "",
    };
    const suggested = prefillMeasurements
      ? getSuggestedMeasurementsForSize(profile, shortLabel, idx)
      : { bodyValues: {}, garmentValues: {} };

    return {
      id: `sz-row-${idx}-${shortLabel.replace(/\s+/g, "_")}`,
      sizeLabel: shortLabel,
      internationalConversions: intl,
      bodyValues: suggested.bodyValues,
      garmentValues: suggested.garmentValues,
    };
  });

  return {
    enabled: true,
    subcategoryProfile: profile,
    sizingSystemLabel: meta.defaultSystem,
    primaryUnit: "cm",
    fitType: "regular",
    stretchLevel: profile === "shoes" ? "non_stretch" : "slight_stretch",
    showInternationalConversions: true,
    columns: getDefaultColumnsForProfile(profile),
    rows,
    modelDetails: {
      enabled: false,
      sizeWorn: rows[Math.min(1, rows.length - 1)]?.sizeLabel || "M",
      fitDescription: "true_to_size",
      heightCm: profile === "mens_clothing" ? "180" : "172",
      bustOrChestCm: profile === "mens_clothing" ? "98" : "88",
      waistCm: profile === "mens_clothing" ? "82" : "68",
      hipsCm: "94",
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Synchronizes the merchant's selected sizes from Step 3 (Category & Specs)
 * with the rows in `ProductSizingFitConfig`, preserving any existing rows and measurements.
 */
export function syncSizingRowsWithProductSizes(
  currentConfig: ProductSizingFitConfig | undefined,
  step3Sizes: string[],
  profile: SizingSubcategoryProfile
): ProductSizingFitConfig {
  const cleanSizes = (step3Sizes || [])
    .map((s) => normalizeSizeShortCode(s))
    .filter((s) => s && !s.toLowerCase().includes("custom"));

  if (!currentConfig) {
    return createDefaultSizingFitConfig(profile, cleanSizes, true);
  }

  // If profile changed, update columns to match new profile unless customized
  const profileChanged = currentConfig.subcategoryProfile !== profile;
  const nextColumns = profileChanged ? getDefaultColumnsForProfile(profile) : currentConfig.columns;

  if (cleanSizes.length === 0) {
    return {
      ...currentConfig,
      subcategoryProfile: profile,
      columns: nextColumns,
    };
  }

  const existingByLabel = new Map<string, SizingTableRow>();
  currentConfig.rows.forEach((r) => {
    existingByLabel.set(r.sizeLabel.toLowerCase(), r);
  });

  const nextRows: SizingTableRow[] = cleanSizes.map((szLabel, idx) => {
    const existing = existingByLabel.get(szLabel.toLowerCase());
    if (existing && !profileChanged) {
      return existing;
    }
    const suggested = getSuggestedMeasurementsForSize(profile, szLabel, idx);
    const intl = STANDARD_INTL_CONVERSIONS[szLabel.toUpperCase()] || {
      dz: szLabel,
      eu: profile === "shoes" ? szLabel.replace("EU ", "") : "",
      us: "",
      uk: "",
    };
    return {
      id: existing?.id || `sz-row-${idx}-${szLabel.replace(/\s+/g, "_")}`,
      sizeLabel: szLabel,
      internationalConversions: existing?.internationalConversions || intl,
      bodyValues: existing && !profileChanged ? existing.bodyValues : suggested.bodyValues,
      garmentValues: existing && !profileChanged ? existing.garmentValues : suggested.garmentValues,
    };
  });

  return {
    ...currentConfig,
    subcategoryProfile: profile,
    sizingSystemLabel: profileChanged ? SIZING_PROFILE_LABELS[profile].defaultSystem : currentConfig.sizingSystemLabel,
    columns: nextColumns,
    rows: nextRows,
  };
}

// ============================================================================
// VALIDATION & VISIBILITY GATES
// ============================================================================

/**
 * Checks whether a product has valid, enabled merchant sizing data to display
 * the customer-facing "Find Your Fit" button.
 */
export function hasValidProductSizingFit(
  product: {
    category?: string;
    subcategory?: string;
    specifications?: Array<{ key: string; value: string }>;
    name?: string;
    sizingFitConfig?: ProductSizingFitConfig;
  } | null | undefined
): boolean {
  if (!product || !product.sizingFitConfig) return false;
  const cfg = product.sizingFitConfig;
  if (!cfg.enabled) return false;
  if (!Array.isArray(cfg.rows) || cfg.rows.length === 0) return false;
  if (!Array.isArray(cfg.columns) || !cfg.columns.some((c) => c.enabled)) return false;

  // Verify the product is in an eligible category
  if (!isSizingFitEligibleCategory(product.category, product.subcategory, product.specifications, product.name)) {
    return false;
  }

  // Require at least one row with at least one non-empty measurement value
  const enabledColKeys = cfg.columns.filter((c) => c.enabled).map((c) => c.key);
  return cfg.rows.some((row) =>
    enabledColKeys.some((k) => {
      const bVal = row.bodyValues?.[k]?.trim();
      const gVal = row.garmentValues?.[k]?.trim();
      return Boolean(bVal || gVal);
    })
  );
}

// ============================================================================
// UNIT CONVERSION ENGINE (CM <-> IN)
// ============================================================================

/**
 * Converts a single numeric string or hyphenated range (e.g. "92-96" or "25.5")
 * between centimeters and inches (`1 in = 2.54 cm`).
 */
export function formatMeasurementValue(
  rawValue: string | undefined,
  sourceUnit: "cm" | "in",
  targetUnit: "cm" | "in",
  unitType: SizingMeasurementColumn["unitType"]
): string {
  if (!rawValue || !rawValue.trim()) return "—";
  const trimmed = rawValue.trim();

  if (unitType !== "length" || sourceUnit === targetUnit) {
    return trimmed;
  }

  const convertNum = (n: number): string => {
    const converted = sourceUnit === "cm" && targetUnit === "in" ? n / 2.54 : n * 2.54;
    const rounded = Math.round(converted * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  // Match range like "92-96" or "92 - 96"
  const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high)) {
      return `${convertNum(low)}-${convertNum(high)}`;
    }
  }

  // Match single number like "96" or "25.5"
  const singleMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    if (!isNaN(val)) {
      return convertNum(val);
    }
  }

  return trimmed;
}

export function parseNumericRangeCm(
  rawValue: string | undefined,
  sourceUnit: "cm" | "in"
): { min: number; max: number; mid: number } | null {
  if (!rawValue || !rawValue.trim()) return null;
  const trimmed = rawValue.trim();
  const factor = sourceUnit === "in" ? 2.54 : 1;

  const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const a = parseFloat(rangeMatch[1]) * factor;
    const b = parseFloat(rangeMatch[2]) * factor;
    if (!isNaN(a) && !isNaN(b)) {
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      return { min, max, mid: (min + max) / 2 };
    }
  }

  const singleMatch = trimmed.match(/^(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const v = parseFloat(singleMatch[1]) * factor;
    if (!isNaN(v)) {
      return { min: v - 1.5, max: v + 1.5, mid: v };
    }
  }

  return null;
}

// ============================================================================
// TRANSPARENT FIT RECOMMENDATION ENGINE
// ============================================================================

export function calculateFitRecommendation(
  config: ProductSizingFitConfig,
  input: FitRecommendationInput
): FitRecommendationResult {
  const emptyResult = (
    status: FitRecommendationResult["status"],
    en: string,
    ar: string,
    fr: string
  ): FitRecommendationResult => ({
    status,
    matchBasis: "none",
    primarySize: null,
    closerFitSize: null,
    relaxedFitSize: null,
    matchedRow: null,
    explanation: { en, ar, fr },
    matchedDimensions: [],
  });

  if (!config || !config.enabled || !config.rows || config.rows.length === 0) {
    return emptyResult(
      "insufficient_product_data",
      "A reliable size recommendation cannot be provided because sizing data is unavailable for this product.",
      "لا يمكن تقديم توصية مقاس موثوقة لعدم توفر بيانات قياسات كافية لهذا المنتج.",
      "Une recommandation fiable ne peut pas être fournie car les données de taille sont insuffisantes."
    );
  }

  const profile = config.subcategoryProfile;
  const enabledCols = config.columns.filter((c) => c.enabled);

  // Determine which measurement keys exist in the merchant's table
  const hasColumnData = (key: string): boolean => {
    if (!enabledCols.some((c) => c.key === key)) return false;
    return config.rows.some((r) => {
      const raw = r.bodyValues?.[key] || r.garmentValues?.[key];
      return Boolean(parseNumericRangeCm(raw, config.primaryUnit));
    });
  };

  if (profile === "shoes") {
    if (!hasColumnData("foot_length") && !hasColumnData("insole_length")) {
      return emptyResult(
        "insufficient_product_data",
        "Shoe foot length measurements have not been entered by the merchant, so an automated recommendation cannot be calculated.",
        "لم يقم التاجر بإدخال قياسات طول القدم لهذا الحذاء، لذا لا يمكن حساب توصية تلقائية.",
        "Les mesures de longueur du pied n'ont pas été renseignées par le marchand."
      );
    }
    if (!input.footLengthCm || input.footLengthCm <= 0) {
      return emptyResult(
        "insufficient_customer_input",
        "Enter your foot length (in cm) to find your matching shoe size.",
        "يرجى إدخال طول القدم (بالسنتيمتر) لمعرفة مقاس الحذاء المناسب لك.",
        "Veuillez saisir la longueur de votre pied (en cm) pour obtenir votre pointure."
      );
    }
  } else {
    const hasPrimaryBodyCols =
      hasColumnData("bust") ||
      hasColumnData("chest") ||
      hasColumnData("waist") ||
      hasColumnData("hips") ||
      hasColumnData("height");

    if (!hasPrimaryBodyCols) {
      return emptyResult(
        "insufficient_product_data",
        "This product chart does not contain enough body or garment circumference measurements to compute a reliable recommendation.",
        "لا يحتوي جدول المقاسات على قياسات كافية لحساب توصية مقاس موثوقة.",
        "Ce tableau ne contient pas suffisamment de mensurations pour calculer une recommandation fiable."
      );
    }

    const hasAnyCustomerInput = Boolean(
      (input.bustOrChestCm && input.bustOrChestCm > 0) ||
        (input.waistCm && input.waistCm > 0) ||
        (input.hipsCm && input.hipsCm > 0) ||
        (input.heightCm && input.heightCm > 0) ||
        (input.weightKg && input.weightKg > 0)
    );

    if (!hasAnyCustomerInput) {
      return emptyResult(
        "insufficient_customer_input",
        "Enter your body measurements (or height & weight) above to calculate your fit.",
        "أدخل قياسات جسمك (أو الطول والوزن) أعلاه لحساب المقاس المناسب لك.",
        "Saisissez vos mensurations (ou votre taille et poids) ci-dessus pour calculer votre coupe."
      );
    }
  }

  // Score each row deterministically
  const directMeasurementProvided = Boolean(
    (input.bustOrChestCm && input.bustOrChestCm > 0) ||
      (input.waistCm && input.waistCm > 0) ||
      (input.hipsCm && input.hipsCm > 0) ||
      (input.footLengthCm && input.footLengthCm > 0)
  );

  // If only height + weight are provided for adult apparel, estimate chest & waist only when height column or standard range exists
  let effectiveChest = input.bustOrChestCm;
  let effectiveWaist = input.waistCm;
  let matchBasis: FitRecommendationResult["matchBasis"] = directMeasurementProvided
    ? "confirmed_measurements"
    : "estimated_height_weight";

  if (!directMeasurementProvided && input.heightCm && input.weightKg && profile !== "shoes") {
    const bmi = input.weightKg / Math.pow(input.heightCm / 100, 2);
    effectiveChest = Math.round(52 + bmi * 1.65 + (input.heightCm - 165) * 0.18);
    effectiveWaist = Math.round(38 + bmi * 1.75 + (input.heightCm - 165) * 0.15);
  }

  interface RowEvaluation {
    rowIndex: number;
    row: SizingTableRow;
    totalPenalty: number;
    matchedCount: number;
    dimensions: FitRecommendationResult["matchedDimensions"];
  }

  const evaluations: RowEvaluation[] = [];

  config.rows.forEach((row, rIdx) => {
    let penalty = 0;
    let count = 0;
    const dims: FitRecommendationResult["matchedDimensions"] = [];

    const checkDimension = (
      colKey: string,
      customerVal: number | undefined,
      weight: number
    ) => {
      if (!customerVal || customerVal <= 0) return;
      const colMeta = enabledCols.find((c) => c.key === colKey);
      if (!colMeta) return;
      const rawStr = row.bodyValues?.[colKey] || row.garmentValues?.[colKey];
      const range = parseNumericRangeCm(rawStr, config.primaryUnit);
      if (!range) return;

      count++;
      let dist = 0;
      let fitNote: "ideal" | "snug" | "relaxed" = "ideal";
      if (customerVal < range.min) {
        dist = range.min - customerVal;
        fitNote = "relaxed";
      } else if (customerVal > range.max) {
        dist = customerVal - range.max;
        fitNote = "snug";
      } else {
        // Inside range: tiny distance from midpoint
        dist = Math.abs(customerVal - range.mid) * 0.15;
        fitNote = "ideal";
      }

      penalty += dist * weight;
      dims.push({
        key: colKey,
        label: colMeta.label,
        customerValueCm: customerVal,
        chartRangeCm: rawStr || "",
        fitNote,
      });
    };

    if (profile === "shoes") {
      checkDimension("foot_length", input.footLengthCm, 3.0);
      if (!dims.length) {
        checkDimension("insole_length", input.footLengthCm ? input.footLengthCm + 0.4 : undefined, 2.5);
      }
      checkDimension("foot_width", input.footWidthCm, 1.2);
    } else {
      checkDimension("bust", effectiveChest, 2.2);
      checkDimension("chest", effectiveChest, 2.2);
      checkDimension("waist", effectiveWaist, 2.0);
      checkDimension("hips", input.hipsCm, 1.8);
      checkDimension("height", input.heightCm, 1.2);
      checkDimension("weight", input.weightKg, 1.5);
    }

    if (count > 0) {
      evaluations.push({
        rowIndex: rIdx,
        row,
        totalPenalty: penalty / count,
        matchedCount: count,
        dimensions: dims,
      });
    }
  });

  if (evaluations.length === 0) {
    return emptyResult(
      "insufficient_product_data",
      "The measurements you entered do not overlap with the columns provided in this product's size chart.",
      "القياسات المدخلة لا تتقاطع مع الأعمدة المتوفرة في جدول مقاسات هذا المنتج.",
      "Les mensurations saisies ne correspondent pas aux colonnes renseignées pour ce produit."
    );
  }

  evaluations.sort((a, b) => a.totalPenalty - b.totalPenalty);
  let best = evaluations[0];

  // Out of bounds guard: if average deviation is > 16 cm (or > 2.5 cm for shoes), warn customer
  const maxAllowedPenalty = profile === "shoes" ? 2.5 : 16;
  if (best.totalPenalty > maxAllowedPenalty) {
    return {
      status: "out_of_range",
      matchBasis,
      primarySize: best.row.sizeLabel,
      closerFitSize: null,
      relaxedFitSize: null,
      matchedRow: best.row,
      explanation: {
        en: `Your measurements fall outside the standard range of this product's chart. Closest available size is ${best.row.sizeLabel}, but please review the Size Chart carefully.`,
        ar: `قياساتك تقع خارج النطاق القياسي لجدول هذا المنتج. أقرب مقاس متاح هو ${best.row.sizeLabel}، يرجى مراجعة جدول المقاسات للتأكد.`,
        fr: `Vos mensurations dépassent la plage de ce produit. La taille la plus proche est ${best.row.sizeLabel}, veuillez vérifier le tableau.`,
      },
      matchedDimensions: best.dimensions,
    };
  }

  // Apply preference shift if user explicitly requested closer or relaxed fit
  let primaryIdx = best.rowIndex;
  if (input.fitPreference === "closer" && primaryIdx > 0) {
    const prevEval = evaluations.find((e) => e.rowIndex === primaryIdx - 1);
    if (prevEval && prevEval.totalPenalty <= 4.5) {
      best = prevEval;
      primaryIdx = prevEval.rowIndex;
    }
  } else if (input.fitPreference === "relaxed" && primaryIdx < config.rows.length - 1) {
    const nextEval = evaluations.find((e) => e.rowIndex === primaryIdx + 1);
    if (nextEval && nextEval.totalPenalty <= 4.5) {
      best = nextEval;
      primaryIdx = nextEval.rowIndex;
    }
  }

  const primarySize = config.rows[primaryIdx]?.sizeLabel || null;
  const closerFitSize = primaryIdx > 0 ? config.rows[primaryIdx - 1]?.sizeLabel || null : null;
  const relaxedFitSize =
    primaryIdx < config.rows.length - 1 ? config.rows[primaryIdx + 1]?.sizeLabel || null : null;

  const explanation =
    matchBasis === "confirmed_measurements"
      ? {
          en: `Based on your direct measurements, size ${primarySize} offers the most balanced fit across ${best.matchedCount} verified dimension(s).`,
          ar: `بناءً على قياساتك المباشرة، يوفر المقاس ${primarySize} أفضل ملاءمة عبر ${best.matchedCount} قياسات مطابقة.`,
          fr: `Selon vos mensurations exactes, la taille ${primarySize} offre la coupe la plus équilibrée.`,
        }
      : {
          en: `Estimated from your height and weight, size ${primarySize} is recommended. For a confirmed match, add your chest or waist measurement.`,
          ar: `توصية تقديرية بناءً على الطول والوزن: المقاس ${primarySize}. للحصول على تطابق مؤكد، أضف قياس الصدر أو الخصر.`,
          fr: `Estimation basée sur votre taille et poids : taille ${primarySize}. Ajoutez votre tour de poitrine ou de taille pour confirmer.`,
        };

  return {
    status: "success",
    matchBasis,
    primarySize,
    closerFitSize,
    relaxedFitSize,
    matchedRow: config.rows[primaryIdx] || null,
    explanation,
    matchedDimensions: best.dimensions,
  };
}
