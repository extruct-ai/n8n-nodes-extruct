Вот короткая инструкция по запуску:

## �� Быстрый старт

### 1. Сборка проекта
```bash
npm run build
```

### 2. Запуск n8n с кастомной нодой
```bash
export N8N_CUSTOM_EXTENSIONS="/Users/zodack/Documents/extruct/n8n-node-2/n8n-nodes-extruct"
n8n
```

### 3. Проверка
- Откройте http://localhost:5678
- Создайте workflow
- Найдите ноду "Extruct" в поиске

---

**Для постоянного использования** добавьте в `~/.zshrc`:
```bash
export N8N_CUSTOM_EXTENSIONS="/Users/zodack/Documents/extruct/n8n-node-2/n8n-nodes-extruct"
```

Тогда n8n будет автоматически видеть вашу ноду при каждом запуске!