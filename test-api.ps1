@echo off
REM Messaging API - Test Script for Windows PowerShell
REM Before running this script:
REM 1. Make sure MongoDB is running
REM 2. Run: node scripts/seed.js
REM 3. Run: npm run dev
REM 4. Run this script in a new PowerShell window

$BASE_URL = "http://localhost:5000"

# Replace these with actual IDs from seed.js output
$USER1_ID = "REPLACE_WITH_USER1_ID"
$USER2_ID = "REPLACE_WITH_USER2_ID"
$USER3_ID = "REPLACE_WITH_USER3_ID"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Messaging API - Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: POST - Send text message
Write-Host "TEST 1: Send text message" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/messages" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = $USER1_ID
}

$body = @{
    "to" = $USER2_ID
    "contentText" = "Hello from test! This is a text message."
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/messages" `
        -Method POST `
        -Headers $headers `
        -Body $body -ErrorAction Stop
    
    Write-Host "✅ SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "Message ID: $($jsonResponse.data._id)"
    Write-Host "Type: $($jsonResponse.data.contentMessage.type)"
    Write-Host "Content: $($jsonResponse.data.contentMessage.content)"
    Write-Host ""
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 2: GET - Get conversation between user1 and user2
Write-Host "TEST 2: Get all messages with User 2" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/messages/{userID}" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "x-user-id" = $USER1_ID
}

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/messages/$USER2_ID" `
        -Method GET `
        -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "Total messages: $($jsonResponse.count)"
    Write-Host ""
    
    foreach ($msg in $jsonResponse.data) {
        $fromUser = $msg.from.username
        $toUser = $msg.to.username
        $content = if ($msg.contentMessage.type -eq 'file') { 
            "📎 File: $($msg.contentMessage.content)" 
        } else { 
            "📝 $($msg.contentMessage.content)" 
        }
        Write-Host "  $fromUser → $toUser: $content"
    }
    Write-Host ""
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 3: GET - Get last message of each conversation
Write-Host "TEST 3: Get last message of each conversation" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/messages" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "x-user-id" = $USER1_ID
}

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/messages" `
        -Method GET `
        -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "Total conversations: $($jsonResponse.count)"
    Write-Host ""
    
    foreach ($msg in $jsonResponse.data) {
        $otherUser = if ($msg.from._id -eq $USER1_ID) { 
            $msg.to.username 
        } else { 
            $msg.from.username 
        }
        $content = if ($msg.contentMessage.type -eq 'file') { 
            "📎 File" 
        } else { 
            $msg.contentMessage.content.Substring(0, [Math]::Min(40, $msg.contentMessage.content.Length)) + "..."
        }
        Write-Host "  With $otherUser`: $content"
    }
    Write-Host ""
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 4: Send message to User 3
Write-Host "TEST 4: Send message to another user" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/messages" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = $USER1_ID
}

$body = @{
    "to" = $USER3_ID
    "contentText" = "Hi User 3! Testing multiple conversations."
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/messages" `
        -Method POST `
        -Headers $headers `
        -Body $body -ErrorAction Stop
    
    Write-Host "✅ SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "Message sent to: $($jsonResponse.data.to.username)"
    Write-Host ""
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
}

# Test 5: GET - Updated last messages
Write-Host "TEST 5: Get updated last messages" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/messages" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "x-user-id" = $USER1_ID
}

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/messages" `
        -Method GET `
        -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "Total conversations: $($jsonResponse.count)"
    Write-Host ""
    
    foreach ($msg in $jsonResponse.data) {
        $otherUser = if ($msg.from._id -eq $USER1_ID) { 
            $msg.to.username 
        } else { 
            $msg.from.username 
        }
        Write-Host "  ✓ Conversation with $otherUser"
    }
    Write-Host ""
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Check MongoDB for saved messages"
Write-Host "  2. Run unit tests: npm test"
Write-Host "  3. Import Postman collection: Messaging-API.postman_collection.json"
Write-Host ""
