# DevScope Complete API Test Script
Write-Host "`n🚀 Testing DevScope API Endpoints" -ForegroundColor Cyan
Write-Host "=================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080"

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
    Write-Host "   Cache: $($health.cache_enabled), Size: $($health.cache_size)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Home Endpoint
Write-Host "2️⃣ Testing Home Endpoint..." -ForegroundColor Yellow
try {
    $home = Invoke-RestMethod -Uri "$baseUrl/" -Method GET
    Write-Host "✅ API: $($home.message)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Home endpoint failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Cache Stats
Write-Host "3️⃣ Testing Cache Stats..." -ForegroundColor Yellow
try {
    $cache = Invoke-RestMethod -Uri "$baseUrl/api/cache/stats" -Method GET
    Write-Host "✅ Cache Stats:" -ForegroundColor Green
    Write-Host "   Size: $($cache.size), Hits: $($cache.hits), Misses: $($cache.misses)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Cache stats failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Rankings
Write-Host "4️⃣ Testing Rankings Endpoint..." -ForegroundColor Yellow
try {
    $rankings = Invoke-RestMethod -Uri "$baseUrl/api/rankings?page=1&page_size=5" -Method GET
    Write-Host "✅ Rankings: Total users = $($rankings.total)" -ForegroundColor Green
    if ($rankings.total -gt 0) {
        Write-Host "   Top user: $($rankings.rankings[0].username) (Score: $($rankings.rankings[0].score))" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Rankings failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 5: User Lookup
Write-Host "5️⃣ Testing User Lookup (adds to rankings)..." -ForegroundColor Yellow
Write-Host "   Note: If 401 error, update GITHUB_TOKEN in backend\.env`n" -ForegroundColor Gray
try {
    $user = Invoke-RestMethod -Uri "$baseUrl/api/status/torvalds" -Method GET
    Write-Host "✅ User Lookup: $($user.user.login)" -ForegroundColor Green
    Write-Host "   Name: $($user.user.name)" -ForegroundColor Gray
    Write-Host "   Followers: $($user.user.followers), Repos: $($user.user.public_repos)" -ForegroundColor Gray
    if ($user.tech_stack) {
        Write-Host "   Tech Stack: $($user.tech_stack.languages -join ', ')" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ User lookup failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*401*") {
        Write-Host "   💡 GitHub token invalid/expired!" -ForegroundColor Yellow
        Write-Host "   📝 Generate new token at: https://github.com/settings/tokens" -ForegroundColor Yellow
        Write-Host "   🔑 Update GITHUB_TOKEN in backend\.env and restart`n" -ForegroundColor Yellow
    }
}

# Wait for ranking to update
Start-Sleep -Seconds 2

# Test 6: Check Rankings After User Lookup
Write-Host "6️⃣ Checking Rankings After User Lookup..." -ForegroundColor Yellow
try {
    $rankings2 = Invoke-RestMethod -Uri "$baseUrl/api/rankings?page=1&page_size=5" -Method GET
    Write-Host "✅ Rankings Updated: Total users = $($rankings2.total)" -ForegroundColor Green
    if ($rankings2.total -gt 0) {
        Write-Host "   Top ranked users:" -ForegroundColor Gray
        foreach ($rank in $rankings2.rankings[0..([Math]::Min(4, $rankings2.rankings.Length - 1))]) {
            Write-Host "   #$($rank.rank_position) - $($rank.username) (Score: $($rank.score))" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "❌ Rankings check failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 7: Batch Lookup
Write-Host "7️⃣ Testing Batch Lookup..." -ForegroundColor Yellow
try {
    $body = @{
        usernames = @("gaearon", "tj", "sindresorhus")
    } | ConvertTo-Json
    
    $batch = Invoke-RestMethod -Uri "$baseUrl/api/batch" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Batch Lookup: Processed $($batch.results.Count) users" -ForegroundColor Green
    foreach ($username in $batch.results.PSObject.Properties.Name) {
        $result = $batch.results.$username
        if (-not $result.error) {
            Write-Host "   - $username : $($result.data.name)" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "❌ Batch lookup failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 8: Extended User Info
Write-Host "8️⃣ Testing Extended User Info..." -ForegroundColor Yellow
try {
    $extended = Invoke-RestMethod -Uri "$baseUrl/api/user/extended/octocat" -Method GET
    Write-Host "✅ Extended Info for: $($extended.user.login)" -ForegroundColor Green
    if ($extended.tech_stack) {
        Write-Host "   Languages: $($extended.tech_stack.languages -join ', ')" -ForegroundColor Gray
    }
    if ($extended.streak) {
        Write-Host "   Current Streak: $($extended.streak.current_streak) days" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Extended user info failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 9: Cache Clear
Write-Host "9️⃣ Testing Cache Clear..." -ForegroundColor Yellow
try {
    $clear = Invoke-RestMethod -Uri "$baseUrl/api/cache/clear" -Method POST
    Write-Host "✅ Cache Cleared: $($clear.message)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Cache clear failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Testing Complete!`n" -ForegroundColor Green
