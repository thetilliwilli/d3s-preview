import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { ErrorLog } from "../domain/log/error-log.js";
import { ParsedLog } from "../domain/log/parsed-log.js";
import { SuccessLog } from "../domain/log/success-log.js";
import { UnionLog } from "../domain/log/union-log.js";

const tempScriptFilename = "./get-window.ps1";

function getScriptContent(): string {
  return `
# взято из статьи 
[CmdletBinding()]
Param(
)
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class UserWindows {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@
try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

  $ActiveHandle = [UserWindows]::GetForegroundWindow()

  $lpdwProcessId = 0
  $threadId = [UserWindows]::GetWindowThreadProcessId($ActiveHandle, [ref] $lpdwProcessId)

  $Process = Get-Process | ? {$_.Id -eq $lpdwProcessId}
  $Process | Select ProcessName, id, @{Name="AppTitle";Expression= {($_.MainWindowTitle)}} | ConvertTo-Json
  
} catch {
    Write-Error "Failed to get active Window details. More Info: $_"
}
`;
}

function formatToJson(stringLog: string): UnionLog {
  const time = Date.now();

  try {
    const parsedLog = JSON.parse(stringLog) as ParsedLog;

    return {
      processName: parsedLog.ProcessName,
      id: parsedLog.Id,
      appTitle: parsedLog.AppTitle,
      time,
    } as SuccessLog;
  } catch (error) {
    return {
      error: error + "",
      rawOutput: stringLog,
      time,
    } as ErrorLog;
  }
}

export class WindowInfoService {
  public static getForegroundWindowInfo() {
    const scriptContent = getScriptContent();

    if (!existsSync(tempScriptFilename)) {
      writeFileSync(tempScriptFilename, scriptContent, "utf-8");
    }

    const command = `powershell ${tempScriptFilename}`;
    const raw = execSync(command).toString("utf-8");
    const log = formatToJson(raw);

    return { raw, log };
  }
}
