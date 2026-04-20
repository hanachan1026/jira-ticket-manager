/**
 * タイトルをブランチ名に使える安全な slug に変換する
 * 例: "Fix Login Bug!" → "fix-login-bug"
 */
export function slugify(text: string, maxLength = 50): string {
  return text
    .toLowerCase()
    .normalize("NFD") // アクセント記号を分解
    .replace(/[\u0300-\u036f]/g, "") // アクセント記号を除去
    .replace(/[^a-z0-9\s-]/g, " ") // 英数字・スペース・ハイフン以外を除去
    .trim()
    .replace(/\s+/g, "-") // スペースをハイフンに
    .replace(/-+/g, "-") // 連続ハイフンを1つに
    .slice(0, maxLength)
    .replace(/-$/, ""); // 末尾のハイフンを除去
}
