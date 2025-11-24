#!/bin/bash
# ============================================
# SECURITY AUDIT SCRIPT FOR DEFIPOLY
# Run this from your project root
# ============================================

echo "🔒 Starting Security Audit..."
echo ""

# ============================================
# FRONTEND AUDIT
# ============================================
echo "📦 Auditing Frontend (defipoly-frontend)..."
cd defipoly-frontend

echo "Running npm audit..."
npm audit

echo ""
echo "Attempting automatic fixes..."
npm audit fix

echo ""
echo "Checking for breaking changes that need manual review..."
npm audit fix --dry-run --force

cd ..

# ============================================
# BACKEND AUDIT
# ============================================
echo ""
echo "📦 Auditing Backend (defipoly-backend)..."
cd defipoly-backend

echo "Running npm audit..."
npm audit

echo ""
echo "Attempting automatic fixes..."
npm audit fix

echo ""
echo "Checking for breaking changes that need manual review..."
npm audit fix --dry-run --force

cd ..

# ============================================
# SUMMARY
# ============================================
echo ""
echo "============================================"
echo "🔒 AUDIT COMPLETE"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Review any HIGH or CRITICAL vulnerabilities above"
echo "2. If 'npm audit fix' didn't resolve everything, run:"
echo "   npm audit fix --force (may introduce breaking changes)"
echo "3. Update packages manually if needed:"
echo "   npm update <package-name>"
echo "4. Lock versions in package.json (remove ^ and ~)"
echo ""