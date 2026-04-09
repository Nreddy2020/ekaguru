@echo off
echo ===========================================
echo Ekaguru Universal Engine: Stack Setup
echo ===========================================

cd /d "%~dp0"

set NPM_CMD="C:\Program Files\nodejs\npm.cmd"
set NPX_CMD="C:\Program Files\nodejs\npx.cmd"

echo [1/3] Initializing NestJS Backend...
%NPM_CMD% install -g @nestjs/cli
call %NPX_CMD% @nestjs/cli new backend --package-manager npm --skip-git
if %errorlevel% neq 0 (
    echo [ERROR] Backend setup failed.
    pause
    exit /b %errorlevel%
)

echo [2/3] Initializing Next.js Frontend...
call %NPX_CMD% create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --no-git
if %errorlevel% neq 0 (
    echo [ERROR] Frontend setup failed.
    pause
    exit /b %errorlevel%
)

echo [3/3] Setting up Database Model...
move backend\prisma\schema.prisma backend\prisma\schema.prisma.bak 2>nul
mkdir backend\prisma 2>nul
copy ..\backend\prisma\schema.prisma backend\prisma\schema.prisma
cd backend
call %NPM_CMD% install prisma --save-dev
call %NPX_CMD% prisma generate

echo ===========================================
echo SETUP COMPLETE!
echo You can now ask the agent to continue.
echo ===========================================
