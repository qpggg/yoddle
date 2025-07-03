# 🔔 Система уведомлений Yoddle

## ✨ **Обзор**

Комплексная система уведомлений для платформы Yoddle включает:
- **Badge счетчики** на кнопках
- **Центр уведомлений** с подробным списком
- **Toast уведомления** для мгновенных сообщений
- **API** для управления уведомлениями

## 🗄️ **База данных**

### Таблицы:
```sql
-- Типы уведомлений
notification_types (id, name, icon, color, description)

-- Уведомления
notifications (id, type_id, title, message, user_id, is_read, is_global, priority, link_url, expires_at)
```

### Функции:
- `get_unread_notifications()` - получить непрочитанные
- `count_unread_notifications()` - подсчет непрочитанных
- `mark_notification_read()` - отметить как прочитанное
- `create_notification()` - создать новое уведомление

## 🛠️ **API Endpoints**

### GET запросы:
- `GET /api/notifications?action=unread` - непрочитанные уведомления
- `GET /api/notifications?action=count` - счетчик непрочитанных
- `GET /api/notifications?action=recent&limit=5` - последние уведомления
- `GET /api/notifications?action=stats` - статистика
- `GET /api/notifications?action=types` - типы уведомлений

### POST запросы:
- `POST /api/notifications?action=create` - создать уведомление
- `POST /api/notifications?action=bulk-create` - массовое создание

### PUT запросы:
- `PUT /api/notifications?action=mark-read&notification_id=123` - отметить как прочитанное
- `PUT /api/notifications?action=mark-all-read` - отметить все как прочитанные

## ⚛️ **React компоненты**

### NotificationCenter
Центральный компонент для отображения списка уведомлений:
```tsx
<NotificationCenter 
  open={showNotifications} 
  onClose={() => setShowNotifications(false)} 
  userId={user?.id} 
/>
```

### NotificationBadge
Компонент-обертка для отображения счетчика:
```tsx
<NotificationBadge userId={user?.id}>
  <button onClick={openNotifications}>
    <Bell size={24} />
  </button>
</NotificationBadge>
```

### ToastNotification
Компонент для мгновенных уведомлений:
```tsx
// В App.tsx уже настроен глобально
import { useGlobalToast } from '../App';

const toast = useGlobalToast();
toast.success('Успех!', 'Операция выполнена');
toast.error('Ошибка!', 'Что-то пошло не так');
```

## 🎣 **React Hooks**

### useNotifications
Основной hook для работы с уведомлениями:
```tsx
const { 
  notifications,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
  refresh 
} = useNotifications({ userId: user?.id });
```

### useToast
Hook для Toast уведомлений:
```tsx
const { 
  success, 
  error, 
  warning, 
  info, 
  notification 
} = useToast();
```

## 🎨 **Типы уведомлений**

| Тип | Иконка | Цвет | Описание |
|-----|--------|------|----------|
| `news` | Newspaper | #750000 | Новости и обновления |
| `benefit` | Gift | #2563eb | Новые льготы |
| `achievement` | Trophy | #f59e0b | Достижения |
| `system` | Settings | #6b7280 | Системные |
| `reminder` | Clock | #8b5cf6 | Напоминания |
| `update` | Download | #10b981 | Обновления |

## ⚙️ **Примеры использования**

### Создание уведомления через API:
```javascript
fetch('/api/notifications?action=create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type_name: 'benefit',
    title: 'Новая льгота!',
    message: 'Добавлена программа массажа',
    is_global: true,
    priority: 2,
    link_url: '/my-benefits'
  })
});
```

### Toast уведомления:
```tsx
const toast = useGlobalToast();

// Успех
toast.success('Профиль обновлен!');

// Ошибка
toast.error('Ошибка сохранения', 'Проверьте подключение к интернету');

// С действием
toast.notification('Новое уведомление', 'У вас есть непрочитанные сообщения', {
  action: {
    label: 'Открыть',
    onClick: () => setShowNotifications(true)
  }
});
```

### Badge счетчик:
```tsx
<NotificationBadge userId={user?.id}>
  <motion.button onClick={openNotifications}>
    <Bell size={24} />
  </motion.button>
</NotificationBadge>
```

## 🚀 **Автоматизация**

- **Автообновление счетчика** каждые 30 секунд
- **Глобальный доступ** через `window.updateNotificationCount()`
- **RLS политики** для безопасности данных
- **Автоскрытие Toast'ов** через заданное время

## 🎯 **Интеграция в Dashboard**

Система полностью интегрирована в Dashboard:
1. Badge на кнопке уведомлений в header
2. Кнопка уведомлений в быстрых действиях
3. NotificationCenter доступен по клику
4. Toast уведомления работают глобально

---

**🎉 Система уведомлений готова к использованию!** 