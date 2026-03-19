// 所得税率テーブル（累進課税）
export const INCOME_TAX_BRACKETS = [
  { limit: 1_950_000, rate: 0.05, deduction: 0 },
  { limit: 3_300_000, rate: 0.10, deduction: 97_500 },
  { limit: 6_950_000, rate: 0.20, deduction: 427_500 },
  { limit: 9_000_000, rate: 0.23, deduction: 636_000 },
  { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
  { limit: Infinity, rate: 0.45, deduction: 4_796_000 }
] as const

// 復興特別所得税率
export const RECONSTRUCTION_TAX_RATE = 0.021

// 住民税率
export const RESIDENT_TAX_RATE = 0.10

// 特定口座の譲渡益課税率（所得税15% + 住民税5% + 復興税0.315%）
export const CAPITAL_GAINS_TAX_RATE = 0.20315

// 基礎控除
export const BASIC_DEDUCTION = 480_000

// NISA 上限
export const NISA_LIMITS = {
  tsumitate: 1_200_000, // つみたて投資枠: 年120万
  growth: 2_400_000, // 成長投資枠: 年240万
  lifetime: 18_000_000 // 生涯投資枠: 1800万
} as const

// iDeCo 拠出上限（会社員・第2号被保険者、企業型DC等なし）
export const IDECO_MONTHLY_LIMIT = 23_000

// 年金繰上げ/繰下げの基準年齢
export const PENSION_BASE_AGE = 65

// 年金繰上げ減額率（1月あたり）
export const PENSION_EARLY_REDUCTION_RATE = 0.004

// 年金繰下げ増額率（1月あたり）
export const PENSION_LATE_INCREASE_RATE = 0.007

// 公的年金等控除（65歳以上、年金収入330万以下の場合）
export const PENSION_DEDUCTION_OVER_65 = 1_100_000

// 公的年金等控除（65歳未満、年金収入130万以下の場合）
export const PENSION_DEDUCTION_UNDER_65 = 600_000

// デフォルトのインフレ率
export const DEFAULT_INFLATION_RATE = 2.0

// デフォルトのシミュレーションパラメータ
export const DEFAULT_PARAMS = {
  basicInfo: {
    currentAge: 30,
    retirementAge: 65,
    lifeExpectancy: 90
  },
  currentSavings: 5_000_000,
  inflationRate: DEFAULT_INFLATION_RATE,
  pension: {
    startAge: 65,
    monthlyAmount: 150_000
  }
} as const
