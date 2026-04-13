!macro customInstall
  ; Kill any running instance of MultiChat before installing
  nsExec::ExecToLog 'taskkill /F /IM "MultiChat.exe" /T'
  Sleep 1000
!macroend

!macro customUnInstall
  ; Kill any running instance before uninstalling
  nsExec::ExecToLog 'taskkill /F /IM "MultiChat.exe" /T'
  Sleep 500

  ; Ask user if they want to delete saved settings
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to delete your MultiChat settings?$\n$\nThis includes your stream links, Discord token and appearance preferences.$\n$\nClick No to keep your settings for future reinstalls." IDNO done
  RMDir /r "$APPDATA\MultiChat"
  done:
!macroend
