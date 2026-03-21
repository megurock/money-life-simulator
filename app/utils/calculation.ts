import type { SimulationParams, YearlyResult, SimulationResult, Account } from '~/types/simulation'
import { calcAnnualPension, calcPensionTax, calcCapitalGainsTax, calcIDeCoLumpSumTax } from './tax'
import { NISA_LIMITS } from './constants'

interface AccountState {
  id: string
  type: Account['type']
  existingBalance: number       // 既存資産の残高
  existingContribution: number  // 既存資産の元本
  existingReturnRate: number    // 既存資産の利回り
  newBalance: number            // 新規積立の残高
  newContribution: number       // 新規積立の元本
  // 旧つみたて NISA
  legacyBalance: number
  legacyContribution: number
  legacyReturnRate: number
  legacyEndYear: number         // 非課税期限（年）、0 = なし
  // 旧つみたて NISA 非課税期限切れ後（課税対象）
  taxableBalance: number
  taxableContribution: number   // 移管時の時価が取得原価になる
}

/**
 * 口座の初期状態を構築（現在の残高を反映）
 */
function initAccountStates(accounts: Account[]): AccountState[] {
  return accounts.map((account) => {
    let existingBalance: number
    let existingContribution: number
    let existingReturnRate: number

    if (account.type === 'nisa') {
      // NISA: つみたて枠 + 成長枠を合算
      const tb = account.nisaTsumitateBalance ?? 0
      const tc = account.nisaTsumitateContribution ?? 0
      const tr = account.nisaTsumitateReturnRate ?? 0
      const gb = account.nisaGrowthBalance ?? 0
      const gc = account.nisaGrowthContribution ?? 0
      const gr = account.nisaGrowthReturnRate ?? 0
      existingBalance = tb + gb
      existingContribution = tc + gc
      // 加重平均利回り（残高ベース）
      existingReturnRate = existingBalance > 0
        ? ((tb * tr + gb * gr) / existingBalance) / 100
        : (account.existingReturnRate ?? 5) / 100
    } else {
      existingBalance = account.currentBalance
      existingContribution = account.currentContribution
      existingReturnRate = account.existingReturnRate / 100
    }

    return {
      id: account.id,
      type: account.type,
      existingBalance,
      existingContribution,
      existingReturnRate,
      newBalance: 0,
      newContribution: 0,
      legacyBalance: account.legacyTsumitateBalance ?? 0,
      legacyContribution: account.legacyTsumitateContribution ?? 0,
      legacyReturnRate: (account.legacyTsumitateReturnRate ?? 0) / 100,
      legacyEndYear: account.legacyTsumitateEndYear ?? 0,
      taxableBalance: 0,
      taxableContribution: 0
    }
  })
}

/**
 * 年間の積立額を計算（該当年齢でアクティブなファンドのみ）
 */
function calcAnnualContribution(account: Account, age: number, retirementAge: number): number {
  return account.funds
    .filter((fund) => {
      const start = fund.startAge ?? 0
      const end = fund.endAge ?? retirementAge
      return age >= start && age <= end
    })
    .reduce((sum, fund) => sum + fund.monthlyContribution * 12, 0)
}

/**
 * 加重平均利回りを計算
 */
function calcWeightedReturn(account: Account): number {
  const totalMonthly = account.funds.reduce((sum, f) => sum + f.monthlyContribution, 0)
  if (totalMonthly === 0) return 0
  return account.funds.reduce(
    (sum, f) => sum + (f.monthlyContribution / totalMonthly) * f.expectedReturn,
    0
  )
}

/**
 * 該当年齢の年間生活費を取得（インフレ補正付き）
 */
function getLivingExpense(
  params: SimulationParams,
  age: number,
  yearsFromStart: number
): number {
  const entry = params.expensesByAge.find(e => age >= e.fromAge && age <= e.toAge)
  const monthlyExpense = entry?.monthlyExpense ?? 0
  const inflationMultiplier = Math.pow(1 + params.inflationRate / 100, yearsFromStart)
  return monthlyExpense * 12 * inflationMultiplier
}

/**
 * 該当年齢の収入を取得（手取り）
 */
function getIncomeByAge(params: SimulationParams, age: number): number {
  const entry = params.incomesByAge.find(e => age >= e.fromAge && age <= e.toAge)
  return entry?.annualIncome ?? 0
}

/**
 * 該当年齢の特別収入合計を取得
 */
function getSpecialIncome(params: SimulationParams, age: number): number {
  return params.specialIncomes
    .filter(e => e.age === age)
    .reduce((sum, e) => sum + e.amount, 0)
}

/**
 * 該当年齢の特別支出合計を取得
 */
function getSpecialExpense(params: SimulationParams, age: number): number {
  return params.specialExpenses
    .filter(e => e.age === age)
    .reduce((sum, e) => sum + e.amount, 0)
}

/**
 * タイムバケットのイベントによる該当年齢の支出合計を取得
 */
function getBucketExpense(params: SimulationParams, age: number): number {
  let total = 0
  for (const bucket of params.timeBuckets ?? []) {
    for (const event of bucket.events) {
      if (event.recurrence === 'once') {
        if (event.age === age) total += event.amount
      } else if (event.recurrence === 'yearly') {
        if (age >= event.age && age <= bucket.toAge) total += event.amount
      } else if (event.recurrence === 'biennial') {
        if (age >= event.age && age <= bucket.toAge && (age - event.age) % 2 === 0) {
          total += event.amount
        }
      }
    }
  }
  return total
}

/**
 * 該当年齢のローン返済額合計を取得
 */
function getLoanPayment(params: SimulationParams, age: number): number {
  return params.loans
    .filter(l => age >= params.basicInfo.currentAge && age <= l.endAge)
    .reduce((sum, l) => sum + l.annualPayment, 0)
}

/**
 * 口座の合計残高
 */
function getAccountBalance(state: AccountState): number {
  return state.existingBalance + state.newBalance + state.legacyBalance + state.taxableBalance
}

/**
 * 口座の合計元本
 */
function getAccountContribution(state: AccountState): number {
  return state.existingContribution + state.newContribution + state.legacyContribution + state.taxableContribution
}

/**
 * 口座から取り崩す
 * 戦略に応じて取り崩し順を変更
 * iDeCo は60歳未満では取り崩し不可
 */
function withdrawFromAccounts(
  accountStates: AccountState[],
  amount: number,
  idecoYears: number,
  age: number,
  strategy: SimulationParams['withdrawalStrategy']
): { withdrawn: number, tax: number } {
  if (amount <= 0) return { withdrawn: 0, tax: 0 }

  let remaining = amount
  let totalTax = 0

  // 戦略に応じた取り崩し順
  // nisa-first: NISA → 特定 → iDeCo（非課税資産から先に使う）
  // savings-first: 特定 → NISA → iDeCo（預貯金を先に使い、投資は長く運用）
  // tax-efficient: 特定 → iDeCo → NISA（課税口座から先に崩し、非課税のNISAを最後まで残す）
  const orders: Record<SimulationParams['withdrawalStrategy'], Account['type'][]> = {
    'nisa-first': ['nisa', 'tokutei', 'ideco'],
    'savings-first': ['tokutei', 'nisa', 'ideco'],
    'tax-efficient': ['tokutei', 'ideco', 'nisa']
  }
  const order = orders[strategy]

  for (const type of order) {
    if (remaining <= 0) break
    if (type === 'ideco' && age < 60) continue

    const states = accountStates.filter(s => s.type === type && getAccountBalance(s) > 0)
    for (const state of states) {
      if (remaining <= 0) break

      const totalBalance = getAccountBalance(state)
      const totalContribution = getAccountContribution(state)
      const withdrawAmount = Math.min(remaining, totalBalance)
      let tax = 0

      if (type === 'tokutei') {
        const gainRatio = totalContribution > 0
          ? Math.max(0, (totalBalance - totalContribution) / totalBalance)
          : 0
        tax = calcCapitalGainsTax(withdrawAmount, gainRatio)
      } else if (type === 'ideco') {
        tax = calcIDeCoLumpSumTax(withdrawAmount, idecoYears)
      }

      // 新規積立分から先に取り崩し
      let toWithdraw = withdrawAmount
      if (state.newBalance > 0) {
        const fromNew = Math.min(toWithdraw, state.newBalance)
        state.newBalance -= fromNew
        if (state.newBalance > 0 && state.newContribution > 0) {
          state.newContribution *= state.newBalance / (state.newBalance + fromNew)
        } else {
          state.newContribution = 0
        }
        toWithdraw -= fromNew
      }
      if (toWithdraw > 0 && state.existingBalance > 0) {
        const fromExisting = Math.min(toWithdraw, state.existingBalance)
        state.existingBalance -= fromExisting
        if (state.existingBalance > 0 && state.existingContribution > 0) {
          state.existingContribution *= state.existingBalance / (state.existingBalance + fromExisting)
        } else {
          state.existingContribution = 0
        }
        toWithdraw -= fromExisting
      }
      // 旧つみたて NISA から取り崩し（非課税）
      if (toWithdraw > 0 && state.legacyBalance > 0) {
        const fromLegacy = Math.min(toWithdraw, state.legacyBalance)
        state.legacyBalance -= fromLegacy
        if (state.legacyBalance > 0 && state.legacyContribution > 0) {
          state.legacyContribution *= state.legacyBalance / (state.legacyBalance + fromLegacy)
        } else {
          state.legacyContribution = 0
        }
        toWithdraw -= fromLegacy
      }
      // 課税対象残高から取り崩し（旧つみたて NISA 期限切れ分、譲渡益に20.315%課税）
      if (toWithdraw > 0 && state.taxableBalance > 0) {
        const fromTaxable = Math.min(toWithdraw, state.taxableBalance)
        const gainRatio = state.taxableContribution > 0
          ? Math.max(0, (state.taxableBalance - state.taxableContribution) / state.taxableBalance)
          : 0
        tax += calcCapitalGainsTax(fromTaxable, gainRatio)
        state.taxableBalance -= fromTaxable
        if (state.taxableBalance > 0 && state.taxableContribution > 0) {
          state.taxableContribution *= state.taxableBalance / (state.taxableBalance + fromTaxable)
        } else {
          state.taxableContribution = 0
        }
      }

      totalTax += tax
      remaining -= withdrawAmount
    }
  }

  return { withdrawn: amount - remaining, tax: totalTax }
}

/**
 * シミュレーションを実行
 */
export function runSimulation(params: SimulationParams): SimulationResult {
  const { basicInfo, savings, accounts, pension } = params
  const { currentAge, retirementAge, lifeExpectancy } = basicInfo

  const accountStates = initAccountStates(accounts)
  const yearlyResults: YearlyResult[] = []
  let depletionAge: number | null = null

  let cashBalance = savings
  const currentYear = new Date().getFullYear()

  let idecoYears = 0

  // NISA の生涯投資枠の累計拠出額を追跡
  // NISA 生涯投資枠: 新 NISA つみたて + 成長の元本合計（旧 NISA は含まない）
  let nisaLifetimeContribution = accounts
    .filter(a => a.type === 'nisa')
    .reduce((sum, a) => sum + (a.nisaTsumitateContribution ?? 0) + (a.nisaGrowthContribution ?? 0), 0)

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const yearsFromStart = age - currentAge
    const year = currentYear + yearsFromStart

    let investmentIncome = 0

    // === 口座の運用益（積立前） ===
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]!
      const state = accountStates[i]!

      // 既存資産の運用益
      if (state.existingBalance > 0) {
        const existingGain = state.existingBalance * state.existingReturnRate
        state.existingBalance += existingGain
        investmentIncome += existingGain
      }

      // 旧つみたて NISA の運用益
      if (state.legacyBalance > 0) {
        if (state.legacyEndYear > 0 && year >= state.legacyEndYear) {
          state.taxableBalance += state.legacyBalance
          state.taxableContribution += state.legacyBalance
          state.legacyBalance = 0
          state.legacyContribution = 0
        } else {
          const legacyGain = state.legacyBalance * state.legacyReturnRate
          state.legacyBalance += legacyGain
          investmentIncome += legacyGain
        }
      }

      // 課税対象残高の運用益
      if (state.taxableBalance > 0) {
        const taxableGain = state.taxableBalance * state.existingReturnRate
        state.taxableBalance += taxableGain
        investmentIncome += taxableGain
      }

      // 新規積立分の運用益
      if (state.newBalance > 0) {
        const newReturnRate = calcWeightedReturn(account) / 100
        const newGain = state.newBalance * newReturnRate
        state.newBalance += newGain
        investmentIncome += newGain
      }
    }

    // === 収入 ===
    const salaryIncome = getIncomeByAge(params, age)
    const specialIncome = getSpecialIncome(params, age)
    const pensionIncome = calcAnnualPension(
      pension.annualAmount,
      pension.startAge,
      age,
      pension.adjustmentRate
    )

    // === 支出 ===
    const livingExpense = getLivingExpense(params, age, yearsFromStart)
    const specialExpense = getSpecialExpense(params, age) + getBucketExpense(params, age)
    const loanPayment = getLoanPayment(params, age)

    // === 年金の税金 ===
    const pensionTax = calcPensionTax(pensionIncome, age)

    // === 収支計算 ===
    const totalIncome = salaryIncome + pensionIncome + specialIncome
    const netIncome = salaryIncome + pensionIncome + specialIncome - pensionTax
    const totalExpenseBeforeTax = livingExpense + specialExpense + loanPayment

    // 収入を預貯金に加算
    cashBalance += netIncome
    // 生活費等を預貯金から支出
    cashBalance -= totalExpenseBeforeTax

    // === 積立（預貯金の範囲内で実行） ===
    let totalContribution = 0
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]!
      const state = accountStates[i]!

      let contribution = calcAnnualContribution(account, age, retirementAge)

      // NISA の生涯投資枠チェック
      if (account.type === 'nisa' && contribution > 0) {
        const remaining = Math.max(0, NISA_LIMITS.lifetime - nisaLifetimeContribution)
        contribution = Math.min(contribution, remaining)
      }

      // 預貯金が足りない場合は積立額を制限
      if (contribution > 0) {
        contribution = Math.min(contribution, Math.max(0, cashBalance))
      }

      if (contribution > 0) {
        if (account.type === 'nisa') {
          nisaLifetimeContribution += contribution
        }
        state.newBalance += contribution
        state.newContribution += contribution
        cashBalance -= contribution
        totalContribution += contribution

        if (account.type === 'ideco') {
          idecoYears++
        }
      }
    }

    // === 赤字の場合、取り崩し ===
    let withdrawalTax = 0

    if (cashBalance < 0) {
      const deficit = Math.abs(cashBalance)
      cashBalance = 0
      const strategy = params.withdrawalStrategy
      const result = withdrawFromAccounts(accountStates, deficit, idecoYears, age, strategy)
      withdrawalTax += result.tax
      const unresolved = deficit - result.withdrawn
      if (unresolved > 0) {
        cashBalance -= unresolved
      }
    }

    const totalTax = pensionTax + withdrawalTax

    const accountBalances: Record<string, number> = {}
    for (const state of accountStates) {
      accountBalances[state.id] = Math.max(0, Math.round(getAccountBalance(state)))
    }

    const investmentTotal = accountStates.reduce((sum, s) => sum + Math.max(0, getAccountBalance(s)), 0)
    const totalBalance = Math.round(cashBalance + investmentTotal)

    const isDepleted = totalBalance <= 0
    if (isDepleted && depletionAge === null) {
      depletionAge = age
    }

    yearlyResults.push({
      age,
      year,
      salaryIncome: Math.round(salaryIncome),
      investmentIncome: Math.round(investmentIncome),
      pensionIncome: Math.round(pensionIncome),
      specialIncome: Math.round(specialIncome),
      totalIncome: Math.round(totalIncome + investmentIncome),
      livingExpense: Math.round(livingExpense),
      specialExpense: Math.round(specialExpense),
      loanPayment: Math.round(loanPayment),
      investmentContribution: Math.round(totalContribution),
      taxAmount: Math.round(totalTax),
      totalExpense: Math.round(totalExpenseBeforeTax + totalTax),
      accountBalances,
      totalBalance: Math.max(0, totalBalance),
      isDepleted
    })
  }

  return { yearlyResults, depletionAge }
}
