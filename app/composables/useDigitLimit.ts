export function useDigitLimit(maxDigits = 3) {
  function limitDigits(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.value.length > maxDigits) {
      input.value = input.value.slice(0, maxDigits)
      input.dispatchEvent(new Event('input'))
    }
  }
  return { limitDigits }
}
