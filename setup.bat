@echo off
echo 🚀 Setting up Mirrorship Authentication...
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo 📝 Creating .env.local from template...
    copy .env.example .env.local >nul
    echo ✅ .env.local created!
    echo.
    echo ⚠️  IMPORTANT: Please update the following in .env.local:
    echo    - BETTER_AUTH_SECRET ^(generate a secure 32+ character string^)
    echo    - GOOGLE_CLIENT_ID ^(from Google Cloud Console^)
    echo    - GOOGLE_CLIENT_SECRET ^(from Google Cloud Console^)
    echo    - MONGODB_URI ^(if using a different MongoDB instance^)
    echo.
) else (
    echo ✅ .env.local already exists
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Update .env.local with your credentials
echo 2. Run: pnpm dev
echo 3. Visit: http://localhost:3000
echo.
echo 📚 For detailed setup instructions, see README.md
pause