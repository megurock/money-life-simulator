import type { SimulationParams, YearlyResult, SimulationResult, Account } from '~/types/simulation'
import { calcAnnualPension, calcPensionTax, calcCapitalGainsTax, calcIDeCoLumpSumTax } from './tax'
import { NISA_LIMITS } from './constants'

interface AccountState {
  id: string
  type: Account['type']
  balance: number // 現在の残高
  totalContribution: number // 累計拠出額（元本）
  isActive: boolean
}

/**
 * 口座の初期状態を構築
 */
function initAccountStates(accounts: Account[]): AccountState[] {
  return accounts.map(account => ({
    id: account.id,
    type: account.type,
    balance: 0,
    totalContribution: 0,
    isActive: true
  }))
}

/**
 * 年間の積立額を計算（全ファンドの合計）
 */
function calcAnnualContribution(account: Account): number {
  return account.funds.reduce((sum, fund) => sum + fund.monthlyContribution * 12, 0)
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
 * 該当年齢のローン返済額合計を取得
 */
function getLoanPayment(params: SimulationParams, age: number): number {
  return params.loans
    .filter(l => age >= l.startAge && age <= l.endAge)
    .reduce((sum, l) => sum + l.monthlyPayment * 12, 0)
}

/**
 * 口座から取り崩す（優先順: NISA → 特定 → iDeCo）
 * @returns 実際に取り崩せた額と発生した税金
 */
function withdrawFromAccounts(
  accountStates: AccountState[],
  accounts: Account[],
  amount: number,
  idecoYears: number
): { withdrawn: number, tax: number } {
  if (amount <= 0) return { withdrawn: 0, tax: 0 }

  let remaining = amount
  let totalTax = 0

  // 取り崩し優先順序: NISA → 特定 → iDeCo
  const order: Account['type'][] = ['nisa', 'tokutei', 'ideco']

  for (const type of order) {
    if (remaining <= 0) break

    const states = accountStates.filter(s => s.type === type && s.balance > 0)
    for (const state of states) {
      if (remaining <= 0) break

      const withdrawAmount = Math.min(remaining, state.balance)
      let tax = 0

      if (type === 'tokutei') {
        // 特定口座: 含み益に課税
        const gainRatio = state.totalContribution > 0
          ? Math.max(0, (state.balance - state.totalContribution) / state.balance)
          : 0
        tax = calcCapitalGainsTax(withdrawAmount, gainRatio)
      } else if (type === 'ideco') {
        // iDeCo: 一時金として受取（退職所得控除適用）
        tax = calcIDeCoLumpSumTax(withdrawAmount, idecoYears)
      }
      // NISA: 非課税

      state.balance -= withdrawAmount
      // 元本も按分で減らす
      if (state.balance > 0 && state.totalContribution > 0) {
        const ratio = state.balance / (state.balance + withdrawAmount)
        state.totalContribution *= ratio
      } else {
        state.totalContribution = 0
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
  const { basicInfo, currentAssets, accounts, pension } = params
  const { currentAge, retirementAge, lifeExpectancy } = basicInfo

  const accountStates = initAccountStates(accounts)
  const yearlyResults: YearlyResult[] = []
  let depletionAge: number | null = null

  // 現金残高を追跡
  let cashBalance = currentAssets.savings
  const currentYear = new Date().getFullYear()

  // 既存資産を独立で追跡（口座セクションとは別に運用）
  const existingAssets = {
    nisaTsumitate: { balance: currentAssets.nisaTsumitateBalance, contribution: currentAssets.nisaTsumitateContribution, returnRate: currentAssets.nisaTsumitateExpectedReturn / 100 },
    nisaGrowth: { balance: currentAssets.nisaGrowthBalance, contribution: currentAssets.nisaGrowthContribution, returnRate: currentAssets.nisaGrowthExpectedReturn / 100 },
    ideco: { balance: currentAssets.idecoBalance, contribution: currentAssets.idecoContribution, returnRate: currentAssets.idecoExpectedReturn / 100 },
    tokutei: { balance: currentAssets.tokuteiBalance, contribution: currentAssets.tokuteiCost, returnRate: currentAssets.tokuteiExpectedReturn / 100 }
  }

  // iDeCo の加入年数を追跡
  let idecoYears = 0

  // NISA の生涯投資枠の累計拠出額を追跡
  let nisaLifetimeContribution = currentAssets.nisaTsumitateContribution + currentAssets.nisaGrowthContribution

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const yearsFromStart = age - currentAge
    const year = currentYear + yearsFromStart
    const isRetired = age >= retirementAge

    let investmentIncome = 0

    // === 既存資産の運用益 ===
    for (const asset of Object.values(existingAssets)) {
      if (asset.balance > 0) {
        const gain = asset.balance * asset.returnRate
        asset.balance += gain
        investmentIncome += gain
      }
    }

    // === 口座の運用と積立（新規積立分） ===
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]!
      const state = accountStates[i]!

      // 口座の有効期間チェック
      if (account.startYear && year < account.startYear) continue
      if (account.endYear && year > account.endYear) continue

      // 運用益（既存残高に対して）
      const returnRate = calcWeightedReturn(account) / 100
      const gain = state.balance * returnRate
      state.balance += gain
      investmentIncome += gain

      // 引退前は積立を継続
      if (!isRetired) {
        let contribution = calcAnnualContribution(account)

        // NISA の生涯投資枠チェック
        if (account.type === 'nisa') {
          const remaining = Math.max(0, NISA_LIMITS.lifetime - nisaLifetimeContribution)
          contribution = Math.min(contribution, remaining)
          nisaLifetimeContribution += contribution
        }

        state.balance += contribution
        state.totalContribution += contribution
        cashBalance -= contribution

        if (account.type === 'ideco') {
          idecoYears++
        }
      }
    }

    // === 収入（手取り） ===
    const salaryIncome = getIncomeByAge(params, age)

    // === 特別収入 ===
    const specialIncome = getSpecialIncome(params, age)

    // === 年金収入 ===
    const pensionIncome = calcAnnualPension(
      pension.monthlyAmount,
      pension.startAge,
      age,
      pension.adjustmentRate
    )

    // === 支出 ===
    const livingExpense = getLivingExpense(params, age, yearsFromStart)
    const specialExpense = getSpecialExpense(params, age)
    const loanPayment = getLoanPayment(params, age)

    // === 年金の税金 ===
    const pensionTax = calcPensionTax(pensionIncome, age)

    // === 収支計算 ===
    const totalIncome = salaryIncome + pensionIncome + specialIncome
    const netIncome = salaryIncome + pensionIncome + specialIncome - pensionTax
    const totalExpenseBeforeTax = livingExpense + specialExpense + loanPayment

    // 不足分を計算
    let deficit = totalExpenseBeforeTax - netIncome
    let withdrawalTax = 0

    if (deficit > 0) {
      // 新規積立口座から取り崩し
      const result = withdrawFromAccounts(accountStates, accounts, deficit, idecoYears)
      withdrawalTax += result.tax
      deficit -= result.withdrawn

      // 既存資産から取り崩し（NISA → 特定 → iDeCo の順）
      if (deficit > 0) {
        const existingOrder: { key: string, type: 'nisa' | 'tokutei' | 'ideco' }[] = [
          { key: 'nisaTsumitate', type: 'nisa' },
          { key: 'nisaGrowth', type: 'nisa' },
          { key: 'tokutei', type: 'tokutei' },
          { key: 'ideco', type: 'ideco' }
        ]
        for (const { key, type } of existingOrder) {
          if (deficit <= 0) break
          const asset = existingAssets[key as keyof typeof existingAssets]
          if (asset.balance <= 0) continue

          const withdrawAmount = Math.min(deficit, asset.balance)
          let tax = 0

          if (type === 'tokutei') {
            const gainRatio = asset.contribution > 0
              ? Math.max(0, (asset.balance - asset.contribution) / asset.balance)
              : 0
            tax = calcCapitalGainsTax(withdrawAmount, gainRatio)
          } else if (type === 'ideco') {
            tax = calcIDeCoLumpSumTax(withdrawAmount, idecoYears)
          }

          asset.balance -= withdrawAmount
          if (asset.balance > 0 && asset.contribution > 0) {
            asset.contribution *= asset.balance / (asset.balance + withdrawAmount)
          } else {
            asset.contribution = 0
          }

          withdrawalTax += tax
          deficit -= withdrawAmount
        }
      }

      // それでも足りない分は現金から
      if (deficit > 0) {
        cashBalance -= deficit
      }
    } else {
      // 余剰がある場合は現金に追加
      cashBalance += (netIncome - totalExpenseBeforeTax)
    }

    const totalTax = pensionTax + withdrawalTax

    // 口座別残高
    const accountBalances: Record<string, number> = {}
    for (const state of accountStates) {
      accountBalances[state.id] = Math.max(0, Math.round(state.balance))
    }

    const newInvestmentTotal = accountStates.reduce((sum, s) => sum + Math.max(0, s.balance), 0)
    const existingInvestmentTotal = Object.values(existingAssets).reduce((sum, a) => sum + Math.max(0, a.balance), 0)
    const totalBalance = Math.round(cashBalance + newInvestmentTotal + existingInvestmentTotal)

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
      taxAmount: Math.round(totalTax),
      totalExpense: Math.round(totalExpenseBeforeTax + totalTax),
      accountBalances,
      totalBalance: Math.max(0, totalBalance),
      isDepleted
    })
  }

  return { yearlyResults, depletionAge }
}
