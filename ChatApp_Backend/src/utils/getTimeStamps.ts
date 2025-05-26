export function getTimestampForSQL() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset()
  const adjustedDate = new Date(now.getTime() - timezoneOffset * 60 * 1000)
  const isoString = adjustedDate.toISOString()
  return isoString
}
