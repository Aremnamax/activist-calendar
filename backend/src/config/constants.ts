/**
 * Константы системы
 */

// Цвета подразделений
export const DEPARTMENT_COLORS: Record<string, string> = {
  'ПРОФ.event': '#ffe719',
  'ПРОФ.life': '#188184',
  'ПРОФ.ГИ': '#ec9a36',
  'ПРОФ.ИБСиБ': '#f7bffc',
  'ПРОФ.ИКНК': '#9489bd',
  'ПРОФ.ИММиТ': '#27262a',
  'ПРОФ.ИПМЭиТ': '#6378ba',
  'ПРОФ.ИСИ': '#1faebd',
  'ПРОФ.ИСПО': '#a6c90a',
  'ПРОФ.ИЭ': '#eb5620',
  'ПРОФ.ИЭиТ': '#70a4d6',
  'ПРОФ.ФизМех': '#1b3663',
  'ПРОФ': '#11734b',
  'Супер Культорги': '#00157d',
  'ОИ Адаптеры': '#013425',
  'Остальные': '#bababa',
};

// Роли пользователей
export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  ACTIVIST = 'activist',
}

// Статусы заявок на мероприятия
export enum EventRequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  NEEDS_WORK = 'needsWork',
  REJECTED = 'rejected',
  APPROVED = 'approved',
}

// Статусы мероприятий
export enum EventStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

// Форматы мероприятий
export enum EventFormat {
  OPEN = 'open',
  CLOSED = 'closed',
}

// Типы уведомлений
export enum NotificationType {
  REMINDER = 'reminder',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  COMMENT = 'comment',
  EVENT_CHANGED = 'eventChanged',
}

// Метки мероприятий
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
] as const;

// Интервалы повторения
export enum RepeatInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}
