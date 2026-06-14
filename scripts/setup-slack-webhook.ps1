# GitHub Secrets에 Slack Webhook 등록
# 사용법: .\scripts\setup-slack-webhook.ps1
# 또는:   .\scripts\setup-slack-webhook.ps1 -WebhookUrl "https://hooks.slack.com/services/..."

param(
    [string]$WebhookUrl
)

$ErrorActionPreference = "Stop"
$repo = "jinfeelm/todosom"

if (-not $WebhookUrl) {
    Write-Host ""
    Write-Host "Slack Incoming Webhook URL이 필요합니다." -ForegroundColor Yellow
    Write-Host "1) https://todosom.slack.com/apps/A0F7XDUAZ-incoming-webhooks 에서 앱 추가"
    Write-Host "2) #todosom-전체 채널 선택 후 Webhook URL 복사"
    Write-Host ""
    $WebhookUrl = Read-Host "Webhook URL 붙여넣기"
}

if ($WebhookUrl -notmatch "^https://hooks\.slack\.com/services/") {
    throw "올바른 Slack Incoming Webhook URL이 아닙니다."
}

gh secret set SLACK_WEBHOOK_URL --repo $repo --body $WebhookUrl
Write-Host ""
Write-Host "SLACK_WEBHOOK_URL 등록 완료 → $repo" -ForegroundColor Green
Write-Host "CI 재실행: gh workflow run CI --repo $repo"
