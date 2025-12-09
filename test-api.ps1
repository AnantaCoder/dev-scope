# DevScope API Test Script
# Run this to test all endpoints quickly

Write-Host "🚀 Testing DevScope API Endpoints" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080"

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
    Write-Host "   Cache: $($health.cache_enabled), Size: $($health.cache_size)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Home Endpoint
Write-Host "2️⃣ Testing Home Endpoint..." -ForegroundColor Yellow
try {
    $home = Invoke-RestMethod -Uri "$baseUrl/" -Method GET
    Write-Host "✅ API: $($home.message)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Home endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Cache Stats
Write-Host "3️⃣ Testing Cache Stats..." -ForegroundColor Yellow
try {
    $cache = Invoke-RestMethod -Uri "$baseUrl/api/cache/stats" -Method GET
    Write-Host "✅ Cache Stats:" -ForegroundColor Green
    Write-Host "   Size: $($cache.size), Hits: $($cache.hits), Misses: $($cache.misses)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Cache stats failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Rankings (should be empty initially)
Write-Host "4️⃣ Testing Rankings Endpoint..." -ForegroundColor Yellow
try {
    $rankings = Invoke-RestMethod -Uri "$baseUrl/api/rankings?page=1&page_size=5" -Method GET
    Write-Host "✅ Rankings: Total users = $($rankings.total)" -ForegroundColor Green
    if ($rankings.total -gt 0) {
        Write-Host "   Top user: $($rankings.rankings[0].username) (Score: $($rankings.rankings[0].score))" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Rankings failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 5: User Lookup (this will populate rankings)
Write-Host "5️⃣ Testing User Lookup (this adds to rankings)..." -ForegroundColor Yellow
Write-Host "   Note: If this fails with 401, update GITHUB_TOKEN in .env file" -ForegroundColor Gray
try {
    $user = Invoke-RestMethod -Uri "$baseUrl/api/status/torvalds" -Method GET -ErrorAction Stop
    Write-Host "✅ User Lookup: $($user.user.login)" -ForegroundColor Green
    Write-Host "   Name: $($user.user.name)" -ForegroundColor Gray
    Write-Host "   Followers: $($user.user.followers), Repos: $($user.user.public_repos)" -ForegroundColor Gray
    Write-Host "   ⏳ Ranking update running in background..." -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ User lookup failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*401*") {
        Write-Host "   💡 Your GitHub token is invalid/expired!" -ForegroundColor Yellow
        Write-Host "   📝 Generate new token at: https://github.com/settings/tokens" -ForegroundColor Yellow
        Write-Host "   🔑 Update GITHUB_TOKEN in backend/.env and restart" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Wait for ranking to update
Start-Sleep -Seconds 3

# Test 6: Check Rankings Again
Write-Host "6️⃣ Checking Rankings After User Lookup..." -ForegroundColor Yellow
try {
    $rankings2 = Invoke-RestMethod -Uri "$baseUrl/api/rankings?page=1&page_size=5" -Method GET
    Write-Host "✅ Rankings Updated: Total users = $($rankings2.total)" -ForegroundColor Green
    if ($rankings2.total -gt 0) {
        Write-Host "   Top ranked users:" -ForegroundColor Gray
        foreach ($rank in $rankings2.rankings) {
            Write-Host "   #$($rank.rank_position) - $($rank.username) (Score: $($rank.score))" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "❌ Rankings check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 7: Batch Lookup
Write-Host "7️⃣ Testing Batch Lookup..." -ForegroundColor Yellow
try {
    $body = @{
        usernames = @("gaearon", "tj", "sindresorhus")
    } | ConvertTo-Json
    
    $batch = Invoke-RestMethod -Uri "$baseUrl/api/batch" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Batch Lookup: Processed $($batch.results.Count) users" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Batch lookup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Import DevScope-API.postman_collection.json into Postman" -ForegroundColor White
Write-Host "2. Read POSTMAN_GUIDE.md for detailed testing instructions" -ForegroundColor White
Write-Host "3. If you got 401 errors, update GITHUB_TOKEN in backend/.env" -ForegroundColor White
Write-Host ""
