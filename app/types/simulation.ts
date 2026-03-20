export type AccountType = 'nisa' | 'ideco' | 'tokutei'

export type NisaSlot = 'tsumitate' | 'growth'

export interface Fund {
  id: string
  name: string
  monthlyContribution: number
  expectedReturn: number // 年率 %
  nisaSlot?: NisaSlot // NISA 口座の場合のみ
}

export interface Account {
  id: string
  type: AccountType
  label: string
  funds: Fund[]
  startYear?: number
  endYear?: number
}

export interface CurrentAssets {
  savings: number                        // 預貯金
  nisaTsumitateContribution: number      // NISA つみたて枠 累計投資額（元本）
  nisaTsumitateBalance: number           // NISA つみたて枠 評価額（時価）
  nisaTsumitateExpectedReturn: number    // NISA つみたて枠 期待利回り（年率 %）
  nisaGrowthContribution: number         // NISA 成長枠 累計投資額（元本）
  nisaGrowthBalance: number              // NISA 成長枠 評価額（時価）
  nisaGrowthExpectedReturn: number       // NISA 成長枠 期待利回り（年率 %）
  idecoContribution: number                // iDeCo 累計掛金（元本）
  idecoBalance: number                   // iDeCo 残高（時価）
  idecoExpectedReturn: number            // iDeCo 期待利回り（年率 %）
  tokuteiBalance: number                 // 特定口座 残高（時価）
  tokuteiCost: number                    // 特定口座 取得原価（税金計算用）
  tokuteiExpectedReturn: number          // 特定口座 期待利回り（年率 %）
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
  name: string              // ローン名（住宅ローン、車など）
  remainingBalance: number  // 現在の残債
  annualRate: number        // 年利（%）
  monthlyPayment: number    // 月額返済額
  startAge: number          // 返済開始年齢
  endAge: number            // 返済終了年齢
}

export interface SimulationParams {
  basicInfo: {
    currentAge: number
    retirementAge: number
    lifeExpectancy: number
  }
  currentAssets: CurrentAssets
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
