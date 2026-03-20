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
}

/**
 * 口座の初期状態を構築（現在の残高を反映）
 */
function initAccountStates(accounts: Account[]): AccountState[] {
  return accounts.map(account => ({
    id: account.id,
    type: account.type,
    existingBalance: account.currentBalance,
    existingContribution: account.currentContribution,
    existingReturnRate: account.existingReturnRate / 100,
    newBalance: 0,
    newContribution: 0
  }))
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
 * 該当年齢のローン返済額合計を取得
 */
function getLoanPayment(params: SimulationParams, age: number): number {
  return params.loans
    .filter(l => age >= l.startAge && age <= l.endAge)
    .reduce((sum, l) => sum + l.monthlyPayment * 12, 0)
}

/**
 * 口座の合計残高
 */
function getAccountBalance(state: AccountState): number {
  return state.existingBalance + state.newBalance
}

/**
 * 口座の合計元本
 */
function getAccountContribution(state: AccountState): number {
  return state.existingContribution + state.newContribution
}

/**
 * 口座から取り崩す（優先順: NISA → 特定 → iDeCo）
 * 新規積立分から先に取り崩し、足りなければ既存資産から
 */
function withdrawFromAccounts(
  accountStates: AccountState[],
  amount: number,
  idecoYears: number
): { withdrawn: number, tax: number } {
  if (amount <= 0) return { withdrawn: 0, tax: 0 }

  let remaining = amount
  let totalTax = 0

  const order: Account['type'][] = ['nisa', 'tokutei', 'ideco']

  for (const type of order) {
    if (remaining <= 0) break

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
  let nisaLifetimeContribution = accounts
    .filter(a => a.type === 'nisa')
    .reduce((sum, a) => sum + a.currentContribution, 0)

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const yearsFromStart = age - currentAge
    const year = currentYear + yearsFromStart

    let investmentIncome = 0

    // === 口座の運用と積立 ===
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]!
      const state = accountStates[i]!

      // 既存資産の運用益
      if (state.existingBalance > 0) {
        const existingGain = state.existingBalance * state.existingReturnRate
        state.existingBalance += existingGain
        investmentIncome += existingGain
      }

      // 新規積立分の運用益
      if (state.newBalance > 0) {
        const newReturnRate = calcWeightedReturn(account) / 100
        const newGain = state.newBalance * newReturnRate
        state.newBalance += newGain
        investmentIncome += newGain
      }

      // 該当年齢でアクティブなファンドの積立
      let contribution = calcAnnualContribution(account, age, retirementAge)

      // NISA の生涯投資枠チェック
      if (account.type === 'nisa' && contribution > 0) {
        const remaining = Math.max(0, NISA_LIMITS.lifetime - nisaLifetimeContribution)
        contribution = Math.min(contribution, remaining)
        nisaLifetimeContribution += contribution
      }

      if (contribution > 0) {
        state.newBalance += contribution
        state.newContribution += contribution
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

    let deficit = totalExpenseBeforeTax - netIncome
    let withdrawalTax = 0

    if (deficit > 0) {
      const result = withdrawFromAccounts(accountStates, deficit, idecoYears)
      withdrawalTax += result.tax
      deficit -= result.withdrawn

      if (deficit > 0) {
        cashBalance -= deficit
      }
    } else {
      cashBalance += (netIncome - totalExpenseBeforeTax)
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
      taxAmount: Math.round(totalTax),
      totalExpense: Math.round(totalExpenseBeforeTax + totalTax),
      accountBalances,
      totalBalance: Math.max(0, totalBalance),
      isDepleted
    })
  }

  return { yearlyResults, depletionAge }
}
