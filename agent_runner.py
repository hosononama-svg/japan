"""
agent_runner.py
===============
Claude API でウェブサイトを自動更新するスクリプト。

使い方:
    python agent_runner.py

必要なもの:
    pip install anthropic
    環境変数 ANTHROPIC_API_KEY を設定
"""

import os
import json
import subprocess
from pathlib import Path
from datetime import datetime
import anthropic

# =============================
# 設定
# =============================
SITE_DIR = Path(r"C:\Users\priva\OneDrive\ドキュメント\Claude\Projects\ウェブサイト作成\japan")
TARGET_FILE = SITE_DIR / "index.html"
LOG_FILE = SITE_DIR / "agent_log.json"

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
MODEL = "claude-opus-4-6"

# =============================
# ユーティリティ
# =============================
def read_html() -> str:
    """現在のHTMLを読み込む"""
    return TARGET_FILE.read_text(encoding="utf-8")

def write_html(content: str):
    """HTMLを上書き保存（バックアップも作成）"""
    # バックアップ
    backup_dir = SITE_DIR / "backups"
    backup_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"index_{timestamp}.html"
    TARGET_FILE.rename(backup_path)  # 元ファイルをバックアップへ移動

    # 新しいHTMLを書き込み
    TARGET_FILE.write_text(content, encoding="utf-8")
    print(f"✅ 保存完了 (バックアップ: {backup_path.name})")

def log_result(agent: str, summary: str):
    """ログをJSONに追記"""
    logs = []
    if LOG_FILE.exists():
        logs = json.loads(LOG_FILE.read_text(encoding="utf-8"))
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "agent": agent,
        "summary": summary
    })
    LOG_FILE.write_text(json.dumps(logs, ensure_ascii=False, indent=2), encoding="utf-8")

def extract_json(text: str) -> dict:
    """レスポンステキストからJSONを抽出してパース"""
    # ```json ... ``` ブロックを除去
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    return json.loads(text.strip())

# =============================
# エージェント①: 情報チェック
# =============================
def run_info_checker(html: str) -> dict:
    """
    情報チェックエージェント
    - リンク切れの疑いがあるURLを検出
    - 古い情報・誤りと思われる箇所を指摘
    - 修正済みHTMLを返す
    """
    print("🔍 情報チェック中...")

    with client.messages.stream(
        model=MODEL,
        max_tokens=8096,
        thinking={"type": "adaptive"},
        system="""あなたはWebサイトの情報品質チェックの専門家です。
HTMLを受け取り、以下を確認してください：
1. 古い・不正確と思われる情報（日付、統計、固有名詞など）
2. リンク先URLが壊れていそうな箇所（相対パス、存在しないファイル名など）
3. 文章の誤字・脱字・不自然な日本語

出力形式: JSON のみ（```json ブロック不要）
{
  "issues": [{"type": "情報の誤り|リンク切れ|誤字", "location": "...", "detail": "..."}],
  "fixed_html": "修正済みHTMLの全文",
  "summary": "変更内容の要約（日本語1〜3文）"
}
修正が不要な場合は fixed_html に元のHTMLをそのまま入れてください。""",
        messages=[{"role": "user", "content": f"以下のHTMLをチェックしてください：\n\n{html}"}]
    ) as stream:
        response = stream.get_final_message()

    text = next(b.text for b in response.content if b.type == "text")
    return extract_json(text)

# =============================
# エージェント②: デザイン更新
# =============================
def run_design_updater(html: str) -> dict:
    """
    デザイン更新エージェント
    - モダンなCSS改善を提案・適用
    - レスポンシブ対応強化
    - アクセシビリティ向上
    """
    print("🎨 デザイン更新中...")

    with client.messages.stream(
        model=MODEL,
        max_tokens=8096,
        thinking={"type": "adaptive"},
        system="""あなたはモダンなWebデザインの専門家です。
HTMLを受け取り、デザインを改善してください。

改善の方針:
- 既存のコンテンツ・構造は変えない（テキスト・リンクはそのまま）
- CSSのみ改善（インラインスタイルまたは<style>タグ内）
- モダンなフォント・カラー・スペーシングを適用
- スマートフォン対応（レスポンシブ）を強化
- ホバーエフェクト・トランジションなど細かいUXを向上

出力形式: JSON のみ（```json ブロック不要）
{
  "changes": ["変更点1", "変更点2", ...],
  "fixed_html": "更新済みHTMLの全文",
  "summary": "デザイン変更内容の要約（日本語1〜3文）"
}""",
        messages=[{"role": "user", "content": f"以下のHTMLのデザインを改善してください：\n\n{html}"}]
    ) as stream:
        response = stream.get_final_message()

    text = next(b.text for b in response.content if b.type == "text")
    return extract_json(text)

# =============================
# メイン処理
# =============================
def run():
    print(f"\n{'='*50}")
    print(f"🚀 エージェント起動: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")

    # HTMLを読み込み
    html = read_html()
    print(f"📄 読み込み完了: {TARGET_FILE.name} ({len(html)} 文字)\n")

    # ① 情報チェック
    try:
        info_result = run_info_checker(html)
        issues = info_result.get("issues", [])
        print(f"  検出した問題: {len(issues)} 件")
        for issue in issues:
            print(f"  - [{issue['type']}] {issue['detail']}")
        html = info_result["fixed_html"]
        log_result("info_checker", info_result.get("summary", ""))
        print(f"  📝 {info_result.get('summary', '')}\n")
    except Exception as e:
        print(f"  ⚠️ 情報チェックでエラー: {e}\n")

    # ② デザイン更新
    try:
        design_result = run_design_updater(html)
        changes = design_result.get("changes", [])
        print(f"  適用したデザイン変更: {len(changes)} 件")
        for change in changes:
            print(f"  - {change}")
        html = design_result["fixed_html"]
        log_result("design_updater", design_result.get("summary", ""))
        print(f"  🎨 {design_result.get('summary', '')}\n")
    except Exception as e:
        print(f"  ⚠️ デザイン更新でエラー: {e}\n")

    # 保存
    write_html(html)
    print(f"\n✨ 完了！ブラウザでリロードして確認してください。")
    print(f"📋 ログ: {LOG_FILE}")

if __name__ == "__main__":
    run()
