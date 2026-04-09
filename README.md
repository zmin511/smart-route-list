# Smart Route List Admin

Админка для редактирования `smart-route-list.txt` прямо в том же GitHub-репозитории, который уже использует primary node.

## Что лежит в корне

- `routes.json` — удобный исходник для редактирования
- `smart-route-list.txt` — итоговый файл для primary node
- `app/`, `components/`, `lib/` — Next.js приложение для Vercel

## Как это работает

1. Vercel поднимает Next.js приложение из этого же репозитория.
2. Ты логинишься через GitHub.
3. Админка читает `routes.json`.
4. После редактирования админка обновляет:
   - `routes.json`
   - `smart-route-list.txt`
5. Primary node продолжает забирать `smart-route-list.txt` из корня репозитория.

## Переменные окружения

Смотри `.env.example`.

Главные значения:

- `GITHUB_OWNER=zmin511`
- `GITHUB_REPO=smart-route-list`
- `GITHUB_BRANCH=main`
- `ALLOWED_GITHUB_USER=zmin511`
- `ROUTES_JSON_PATH=routes.json`
- `ROUTES_TXT_PATH=smart-route-list.txt`

## Локальный запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Деплой

Подключи этот репозиторий к Vercel и добавь environment variables из `.env.example`.
