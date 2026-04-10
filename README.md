# Редактор Smart Route List

Админка для редактирования `smart-route-list.txt` прямо в том же GitHub-репозитории, который использует основной сервер.

## Что лежит в репозитории

- `routes.json` - вспомогательный исходник
- `smart-route-list.txt` - основной итоговый файл
- `backups/` - автоматические резервные копии `smart-route-list.txt` перед сохранением
- `app/`, `components/`, `lib/` - Next.js приложение для Vercel

## Как это работает

1. Vercel поднимает Next.js приложение из этого репозитория.
2. Вы входите в админку по логину и паролю из переменных окружения.
3. Приложение читает текущий `smart-route-list.txt` из GitHub.
4. Перед каждым сохранением создаётся резервная копия текущего `smart-route-list.txt` в папке `backups/`.
5. После этого админка обновляет:
   - `routes.json`
   - `smart-route-list.txt`

## Переменные окружения

Смотрите `.env.example`.

Нужные значения:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- `GITHUB_TOKEN`
- `GITHUB_OWNER=zmin511`
- `GITHUB_REPO=smart-route-list`
- `GITHUB_BRANCH=main`
- `ROUTES_JSON_PATH=routes.json`
- `ROUTES_TXT_PATH=smart-route-list.txt`
- `BACKUP_DIR=backups`

## Локальный запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Деплой

Подключите этот репозиторий к Vercel и добавьте переменные окружения из `.env.example`.
