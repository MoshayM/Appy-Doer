Dim shell, desktop, shortcut

Set shell   = CreateObject("WScript.Shell")
desktop     = shell.SpecialFolders("Desktop")

' ── Desktop shortcut ──────────────────────────────────────────
Set shortcut             = shell.CreateShortcut(desktop & "\AI WorkBuddy.lnk")
shortcut.TargetPath      = "D:\Software\start-server.bat"
shortcut.WorkingDirectory = "D:\Software"
shortcut.WindowStyle     = 1
shortcut.Description     = "Start AI WorkBuddy dev server at localhost:3000"
' Use the Next.js / Node icon if available, else fall back to cmd icon
If CreateObject("Scripting.FileSystemObject").FileExists("D:\Software\public\favicon.ico") Then
    shortcut.IconLocation = "D:\Software\public\favicon.ico"
Else
    shortcut.IconLocation = "%SystemRoot%\System32\SHELL32.dll, 13"
End If
shortcut.Save

' ── Taskbar / Start-Menu pinnable shortcut (Start Menu Programs) ──
Dim startMenu
startMenu = shell.SpecialFolders("Programs")

Set shortcut             = shell.CreateShortcut(startMenu & "\AI WorkBuddy.lnk")
shortcut.TargetPath      = "D:\Software\start-server.bat"
shortcut.WorkingDirectory = "D:\Software"
shortcut.WindowStyle     = 1
shortcut.Description     = "Start AI WorkBuddy dev server at localhost:3000"
If CreateObject("Scripting.FileSystemObject").FileExists("D:\Software\public\favicon.ico") Then
    shortcut.IconLocation = "D:\Software\public\favicon.ico"
Else
    shortcut.IconLocation = "%SystemRoot%\System32\SHELL32.dll, 13"
End If
shortcut.Save

MsgBox "Shortcuts created!" & vbCrLf & vbCrLf & _
       "  Desktop       : AI WorkBuddy.lnk" & vbCrLf & _
       "  Start Menu    : AI WorkBuddy.lnk" & vbCrLf & vbCrLf & _
       "Double-click either one to start the server at http://localhost:3000", _
       vbInformation, "AI WorkBuddy"
