# Run in an elevated PowerShell window (Run as administrator).
# Enables TCP/IP for SQLEXPRESS so Node/Prisma can connect (SSMS can use shared memory without this).

$ErrorActionPreference = 'Stop'
$instanceKey = 'MSSQL17.SQLEXPRESS'
$tcpRoot = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$instanceKey\MSSQLServer\SuperSocketNetLib\Tcp"

if (-not (Test-Path $tcpRoot)) {
  throw "Could not find SQL Server instance registry key for $instanceKey."
}

Set-ItemProperty -Path $tcpRoot -Name Enabled -Value 1
Set-ItemProperty -Path "$tcpRoot\IPAll" -Name TcpPort -Value '1433'
Set-ItemProperty -Path "$tcpRoot\IPAll" -Name TcpDynamicPorts -Value ''

Restart-Service 'MSSQL$SQLEXPRESS' -Force

try {
  Set-Service SQLBrowser -StartupType Manual
  Start-Service SQLBrowser
} catch {
  Write-Warning "SQL Server Browser could not be started. Prisma can still use sqlserver://localhost:1433."
}

Write-Host 'TCP/IP enabled on port 1433. BookNest DATABASE_URL can use: sqlserver://localhost:1433;database=BookNest;integratedSecurity=true;encrypt=true;trustServerCertificate=true'
