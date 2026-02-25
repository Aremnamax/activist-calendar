export const EVENT_LABELS = [
  'развлекательное',
  'образовательное',
  'мастер-класс',
  'хоррор',
  'квест',
  'настольные игры',
  'спорт',
  'культурное',
  'праздник',
  'другое',
] as const

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  pending: 'На рассмотрении',
  needsWork: 'Требует доработки',
  rejected: 'Отклонено',
  approved: 'Одобрено',
}
