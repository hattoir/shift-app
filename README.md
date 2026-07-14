# シフト管理アプリ

一日2枠(🌅早番・🌙遅番)のシフトを管理するWebアプリです。

## 機能

- **シフト表** (`/`) — 誰でも閲覧できる月間シフトカレンダー
- **希望日入力** (`/availability`) — メンバーが名前を選び、入れる日をタップで入力(○どちらでも / 早番のみ / 遅番のみ)
- **管理者ページ** (`/admin`) — パスワードでログインして:
  - メンバーの追加・削除
  - 固定ルール(「月曜は必ずこの人」など曜日×メンバー×早/遅)
  - 🪄 自動割当(固定ルール優先 → 希望日から回数が公平になるよう割当)
  - 手動調整(セレクトで選ぶと固定🔒され、自動割当で上書きされない)

## セットアップ手順

### 1. Supabase(データベース)

1. https://supabase.com で無料アカウントを作り「New project」
2. 左メニューの **SQL Editor** を開き、`supabase/schema.sql` の中身を貼り付けて **Run**
3. **Project Settings → API** で以下をメモ:
   - `Project URL`(例: https://xxxx.supabase.co)
   - `service_role` キー(secret の方。anon ではない)

### 2. ローカルで動かす(任意)

```bash
npm install
cp .env.local.example .env.local
# .env.local に SupabaseのURL・キー・管理者パスワードを記入
npm run dev
```

http://localhost:3000 で確認できます。

### 3. Vercel にデプロイ

1. このフォルダを GitHub リポジトリにpush
   ```bash
   git init
   git add .
   git commit -m "first commit"
   # GitHubで空のリポジトリを作ってから:
   git remote add origin https://github.com/あなたのユーザー名/shift-app.git
   git push -u origin main
   ```
2. https://vercel.com にGitHubでログイン → **Add New → Project** → リポジトリを選択
3. **Environment Variables** に以下の3つを設定:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | SupabaseのProject URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_roleキー |
   | `ADMIN_PASSWORD` | 管理者用パスワード(自分で決める) |

4. **Deploy** を押す → 発行されたURLをメンバーに共有

## 使い方の流れ

1. 管理者が `/admin` でメンバーを登録、必要なら固定ルールを設定
2. メンバーに URL を共有 → 各自 `/availability` で来月の入れる日を入力
3. 管理者が「🪄 自動割当」→ 気になる所を手動調整
4. みんなが `/` でシフトを確認

## 注意

- `service_role` キーは**絶対にGitHubにpushしない**でください(.env.localは.gitignore済み)
- 本アプリはservice_roleキーをサーバー側APIでのみ使用するため、Supabase側のRLS設定は不要です
