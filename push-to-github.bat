@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%LOCALAPPDATA%\Programs\Git\mingw64\bin;%PATH:"=%"
echo ==============================================
echo Pushing FSDNEWPRO to GitHub...
echo ==============================================
git push -u origin main
pause
