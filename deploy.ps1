# Este script atualiza todas as branches mantendo exatamente a estrutura exigida pelo Easypanel.
# Ele garante que a branch "front-end" contenha apenas a pasta "front-end/...", e assim por diante.

Write-Host "Enviando atualizações para a branch main..." -ForegroundColor Green
git push origin main

Write-Host "Atualizando branch front-end..." -ForegroundColor Blue
git checkout -B front-end main
git rm -rf back-end website docs --ignore-unmatch
git commit -m "deploy front-end"
git push origin front-end --force

Write-Host "Atualizando branch website..." -ForegroundColor Blue
git checkout -B website main
git rm -rf back-end front-end docs --ignore-unmatch
git commit -m "deploy website"
git push origin website --force

Write-Host "Atualizando branch back-end..." -ForegroundColor Blue
git checkout -B back-end main
git rm -rf front-end website docs --ignore-unmatch
git commit -m "deploy back-end"
git push origin back-end --force

Write-Host "Limpando e voltando para a branch main..." -ForegroundColor Green
git checkout main
Write-Host "Pronto! Todas as branches foram enviadas com a estrutura correta!" -ForegroundColor Green
