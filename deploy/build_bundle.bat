@echo off
echo Eles bundle epitese WSL-ben (5-15 perc)...
wsl.exe -d Ubuntu -u root -e bash -c "tr -d '\r' < /mnt/c/JORDANHAZKEZELO/jordan/deploy/build_bundle.sh | bash"
pause
