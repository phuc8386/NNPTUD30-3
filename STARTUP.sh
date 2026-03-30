#!/bin/bash
# 🎯 MESSAGING API - STARTUP GUIDE
# Hướng dẫn khởi chạy (Windows PowerShell)

# ============================================================================
# STEP 1: Mở 4 TERMINAL (PowerShell)
# ============================================================================

# TERMINAL 1: Khởi chạy MongoDB
# ─────────────────────────────
# mongod


# TERMINAL 2: Tạo Test Data
# ──────────────────────────
# cd "d:\NNPTUDM\PhatTrienUngDungMoi8"
# node scripts/seed.js
# 
# Output:
# ✓ Users created:
#   - User 1: 65b1c2d3e4f5g6h7i8j9k0l1 (user1)
#   - User 2: 65b1c2d3e4f5g6h7i8j9k0l2 (user2)
#   - User 3: 65b1c2d3e4f5g6h7i8j9k0l3 (user3)
# 
# ✓ Messages created: 5 messages


# TERMINAL 3: Khởi chạy Server
# ────────────────────────────
# cd "d:\NNPTUDM\PhatTrienUngDungMoi8"
# npm run dev
#
# Output:
# Server running on port 5000
# MongoDB connected


# TERMINAL 4: Test API
# ───────────────────
# Copy the 3 user IDs từ TERMINAL 2 output
# 
# Sau đó run các command trong QUICK_COMMANDS.md


# ============================================================================
# QUICK TEST (Copy-Paste vào Terminal 4)
# ============================================================================

# Gán User IDs
$user1 = "COPY_USER1_ID_HERE"
$user2 = "COPY_USER2_ID_HERE"
$user3 = "COPY_USER3_ID_HERE"

# Test 1: Send Message
$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = $user1
}
$body = @{ to = $user2; contentText = "Hello from test!" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/messages" `
    -Method POST -Headers $headers -Body $body

# Test 2: Get Conversation
Invoke-WebRequest -Uri "http://localhost:5000/api/messages/$user2" `
    -Method GET -Headers @{"x-user-id"=$user1}

# Test 3: Get Last Messages
Invoke-WebRequest -Uri "http://localhost:5000/api/messages" `
    -Method GET -Headers @{"x-user-id"=$user1}


# ============================================================================
# RUN UNIT TESTS
# ============================================================================
# Terminal mới:
# npm test


# ============================================================================
# USEFUL LINKS
# ============================================================================
# API Server:        http://localhost:5000
# API Health:        http://localhost:5000/health
# 
# Documentation:
#   - START_HERE.md
#   - README.md
#   - COMPLETE_GUIDE.md
#   - QUICK_COMMANDS.md
#   - API_DOCUMENTATION.md
#   - TESTING_GUIDE.md
#   - ARCHITECTURE.md


# ============================================================================
# PROJECT FILES
# ============================================================================
# 
# Core:
#   - server.js
#   - routes/messages.js (3 ROUTERS)
#   - models/Message.js
#   - models/User.js
# 
# Testing:
#   - tests/messages.test.js
#   - scripts/seed.js
#   - Messaging-API.postman_collection.json
#   - test-api.ps1
# 
# Documentation:
#   - START_HERE.md
#   - README.md
#   - COMPLETE_GUIDE.md
#   - API_DOCUMENTATION.md
#   - TESTING_GUIDE.md
#   - ARCHITECTURE.md
#   - QUICK_COMMANDS.md


# ============================================================================
# TROUBLESHOOTING
# ============================================================================
# 
# MongoDB not running?
#   mongod
# 
# Port 5000 in use?
#   - Change PORT in .env
#   - Or: Get-NetTCPConnection -LocalPort 5000 | Stop-Process -Force
# 
# File upload fails?
#   mkdir uploads
# 
# Tests failing?
#   - Make sure MongoDB is running
#   - Make sure seed.js has been run


# ============================================================================
# 3 ROUTERS SUMMARY
# ============================================================================
# 
# 1. POST /api/messages
#    - Send text or file message
#    - Header: x-user-id
#    - Body: {to: user_id, contentText: "..."}
# 
# 2. GET /api/messages/:userID
#    - Get ALL messages with specific user
#    - Header: x-user-id
#    - Returns: sorted by date (oldest first)
# 
# 3. GET /api/messages
#    - Get LAST message of each conversation
#    - Header: x-user-id
#    - Perfect for chat list


# Ready to go! 🚀
