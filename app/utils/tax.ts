import {
  INCOME_TAX_BRACKETS,
  RECONSTRUCTION_TAX_RATE,
  RESIDENT_TAX_RATE,
  CAPITAL_GAINS_TAX_RATE,
  BASIC_DEDUCTION,
  PENSION_BASE_AGE,
  PENSION_EARLY_REDUCTION_RATE,
  PENSION_LATE_INCREASE_RATE,
  PENSION_DEDUCTION_OVER_65,
  PENSION_DEDUCTION_UNDER_65
} from './constants'

/**
 * 所得税を累進課税テーブルで計算
 */
export function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket.limit) {
      const incomeTax = taxableIncome * bracket.rate - bracket.deduction
      const reconstructionTax = incomeTax * RECONSTRUCTION_TAX_RATE
      return Math.max(0, incomeTax + reconstructionTax)
    }
  }
  return 0
}

/**
 * 特定口座の売却時の税額
 * @param sellAmount 売却額
 * @param gainRatio 含み益の割合（含み益 / 残高）
 */
export function calcCapitalGainsTax(sellAmount: number, gainRatio: number): number {
  if (sellAmount <= 0 || gainRatio <= 0) return 0
  const gain = sellAmount * gainRatio
  return gain * CAPITAL_GAINS_TAX_RATE
}

/**
 * iDeCo 一時金受取時の退職所得控除
 * @param years 加入年数
 */
export function calcRetirementDeduction(years: number): number {
  if (years <= 0) return 0
  if (years <= 20) {
    return Math.max(400_000 * years, 800_000)
  }
  return 8_000_000 + 700_000 * (years - 20)
}

/**
 * iDeCo 一時金受取時の税額
 * @param amount 受取額
 * @param years 加入年数
 */
export function calcIDeCoLumpSumTax(amount: number, years: number): number {
  const deduction = calcRetirementDeduction(years)
  const retirementIncome = Math.max(0, (amount - deduction) * 0.5)
  if (retirementIncome <= 0) return 0

  const incomeTax = calcIncomeTax(retirementIncome)
  const residentTax = retirementIncome * RESIDENT_TAX_RATE
  return incomeTax + residentTax
}

/**
 * 年金の繰上げ/繰下げ調整率を計算
 * @param startAge 受給開始年齢
 */
export function calcPensionAdjustmentRate(startAge: number): number {
  const diffMonths = (startAge - PENSION_BASE_AGE) * 12
  if (diffMonths < 0) {
    // 繰上げ: 減額
    return 1 + diffMonths * PENSION_EARLY_REDUCTION_RATE
  } else if (diffMonths > 0) {
    // 繰下げ: 増額
    return 1 + diffMonths * PENSION_LATE_INCREASE_RATE
  }
  return 1.0
}

/**
 * 年間の年金受給額を計算（繰上げ/繰下げ調整済み）
 */
export function calcAnnualPension(
  monthlyAmount: number,
  startAge: number,
  currentAge: number,
  adjustmentRate?: number
): number {
  if (currentAge < startAge) return 0
  const rate = adjustmentRate ?? calcPensionAdjustmentRate(startAge)
  return monthlyAmount * rate * 12
}

/**
 * 年金に対する税額
 * @param annualPension 年間年金額
 * @param age 年齢
 */
export function calcPensionTax(annualPension: number, age: number): number {
  if (annualPension <= 0) return 0

  // 公的年金等控除
  const pensionDeduction = age >= 65
    ? PENSION_DEDUCTION_OVER_65
    : PENSION_DEDUCTION_UNDER_65

  const taxableIncome = Math.max(0, annualPension - pensionDeduction - BASIC_DEDUCTION)
  if (taxableIncome <= 0) return 0

  const incomeTax = calcIncomeTax(taxableIncome)
  const residentTax = taxableIncome * RESIDENT_TAX_RATE
  return incomeTax + residentTax
}
