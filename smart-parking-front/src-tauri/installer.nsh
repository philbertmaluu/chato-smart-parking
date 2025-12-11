!macro customInstall
  ; Check if Visual C++ 2015-2022 Redistributable (x64) is installed
  ; Checking for vc_redist.x64 version 14.30 or later
  ReadRegStr $R0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Version"
  
  ${If} $R0 == ""
    ; Not found, try to install it (non-blocking)
    DetailPrint "Visual C++ Redistributable not found. Attempting to install..."
    SetOutPath "$TEMP"
    
    ; Try to find the VC++ redistributable in the installed app resources
    ; Tauri bundles resources in different locations depending on structure
    StrCpy $1 "$INSTDIR\resources\vcredist_x64.exe"
    ${IfNot} ${FileExists} "$1"
      StrCpy $1 "$INSTDIR\..\resources\vcredist_x64.exe"
    ${EndIf}
    ${IfNot} ${FileExists} "$1"
      ; Check in installed app directory root
      StrCpy $1 "$INSTDIR\vcredist_x64.exe"
    ${EndIf}
    
    ${If} ${FileExists} "$1"
      DetailPrint "Found VC++ Redistributable installer, installing silently..."
      ; Use silent install flags - no blocking UI
      ExecWait '"$1" /install /quiet /norestart' $0
      ${If} $0 == 0
        DetailPrint "Visual C++ Redistributable installed successfully"
      ${ElseIf} $0 == 3010
        ; 3010 = ERROR_SUCCESS_REBOOT_REQUIRED - installation succeeded but reboot needed
        DetailPrint "Visual C++ Redistributable installed (reboot may be required)"
      ${Else}
        DetailPrint "Visual C++ Redistributable installation returned code $0 - continuing anyway"
        ; Don't block installation - just log the warning
      ${EndIf}
      ${If} "$1" == "$TEMP\vcredist_x64.exe"
        Delete "$1"
      ${EndIf}
    ${Else}
      ; Don't block installation if VC++ is missing - just log a warning
      DetailPrint "Warning: VC++ Redistributable not bundled. Application may need it."
      DetailPrint "Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe"
      ; DO NOT show MessageBox - it blocks installation flow
      ; User can install manually if the app doesn't work
    ${EndIf}
  ${Else}
    DetailPrint "Visual C++ Redistributable already installed (Version: $R0)"
  ${EndIf}
!macroend

!macro customUnInstall
  ; Don't remove Visual C++ Redistributable on uninstall
  ; Other applications might need it, and it's a system component
!macroend

