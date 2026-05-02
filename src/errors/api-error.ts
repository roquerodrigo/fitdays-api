export class FitDaysApiError extends Error {
  constructor(
    public code: number,
    public response: unknown,
    message?: string,
  ) {
    super(message ?? `FitDays API error ${code}`)
    this.name = 'FitDaysApiError'
  }
}
