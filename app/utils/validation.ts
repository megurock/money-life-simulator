import type { SimulationParams } from '~/types/simulation'

export interface ValidationError {
  field: string
  message: string
}

export function validateParams(params: SimulationParams): ValidationError[] {
  const errors: ValidationError[] = []
  const { basicInfo } = params

  if (basicInfo.currentAge < 18 || basicInfo.currentAge > 80) {
    errors.push({ field: 'currentAge', message: '現在の年齢は18〜80歳の範囲で入力してください' })
  }

  if (basicInfo.retirementAge <= basicInfo.currentAge) {
    errors.push({ field: 'retirementAge', message: '引退年齢は現在の年齢より大きくしてください' })
  }

  if (basicInfo.lifeExpectancy < basicInfo.retirementAge) {
    errors.push({ field: 'lifeExpectancy', message: '想定寿命は引退年齢以上にしてください' })
  }

  if (params.currentAssets.savings < 0) {
    errors.push({ field: 'savings', message: '預貯金は0以上にしてください' })
  }

  if (params.pension.startAge < 60 || params.pension.startAge > 75) {
    errors.push({ field: 'pensionStartAge', message: '年金受給開始年齢は60〜75歳の範囲です' })
  }

  if (params.inflationRate < 0 || params.inflationRate > 10) {
    errors.push({ field: 'inflationRate', message: 'インフレ率は0〜10%の範囲で入力してください' })
  }

  for (const expense of params.expensesByAge) {
    if (expense.fromAge > expense.toAge) {
      errors.push({ field: 'expensesByAge', message: '支出の開始年齢は終了年齢以下にしてください' })
      break
    }
  }

  return errors
}
