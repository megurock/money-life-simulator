export type AccountType = 'nisa' | 'ideco' | 'tokutei'

export type NisaSlot = 'tsumitate' | 'growth'

export interface Fund {
  id: string
  name: string
  monthlyContribution: number
  expectedReturn: number // 年率 %
  nisaSlot?: NisaSlot // NISA 口座の場合のみ
  startAge?: number // 積立開始年齢
  endAge?: number   // 積立終了年齢
}

export interface Account {
  id: string
  type: AccountType
  label: string
  funds: Fund[]
  currentBalance: number      // 現在の評価額（時価）
  currentContribution: number // 累計投資額（元本）— NISA: 生涯枠消費量、iDeCo: 累計掛金、特定: 取得原価
}

export interface PensionConfig {
  startAge: number
  monthlyAmount: number
  adjustmentRate?: number // 繰上げ/繰下げ率（未指定時はデフォルト計算）
}

export interface IncomeByAge {
  fromAge: number
  toAge: number
  annualIncome: number // 年収（手取り）
}

export interface ExpenseByAge {
  fromAge: number
  toAge: number
  monthlyExpense: number
}

export interface SpecialExpense {
  id: string
  age: number
  amount: number
  description: string
}

export interface SpecialIncome {
  id: string
  age: number
  amount: number
  description: string
}

export interface Loan {
  id: string
  name: string
  remainingBalance: number
  annualRate: number
  monthlyPayment: number
  startAge: number
  endAge: number
}

export interface SimulationParams {
  basicInfo: {
    currentAge: number
    retirementAge: number
    lifeExpectancy: number
  }
  savings: number // 預貯金
  incomesByAge: IncomeByAge[]
  accounts: Account[]
  pension: PensionConfig
  expensesByAge: ExpenseByAge[]
  specialExpenses: SpecialExpense[]
  specialIncomes: SpecialIncome[]
  loans: Loan[]
  inflationRate: number
}

export interface YearlyResult {
  age: number
  year: number
  salaryIncome: number
  investmentIncome: number
  pensionIncome: number
  specialIncome: number
  totalIncome: number
  livingExpense: number
  specialExpense: number
  loanPayment: number
  taxAmount: number
  totalExpense: number
  accountBalances: Record<string, number>
  totalBalance: number
  isDepleted: boolean
}

export interface SimulationResult {
  yearlyResults: YearlyResult[]
  depletionAge: number | null
}
