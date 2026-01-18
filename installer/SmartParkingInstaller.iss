#define AppName "Smart Parking"
#define AppVersion "1.1.0"
#define AppPublisher "Smart Parking Systems"
#define AppURL "https://smartparking.local"
#define AppExeName "Smart Parking.exe"

[Setup]
AppId={{3E4A5E7F-9B2D-4C8A-B1F3-6D9E2A8C5B7F}}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}

; Installation directories
DefaultDirName={autopf}\SmartParking
DefaultGroupName={#AppName}

; Installer settings
AllowNoIcons=yes
AllowUNCPath=no
Compression=lzma2
SolidCompression=yes
SourceDir=..\..
OutputDir=.\installer\output
OutputBaseFilename=SmartParkingSetup-{#AppVersion}-Complete
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "smart-parking-front\src-tauri\target\release\Smart Parking.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "smart-parking-front\src-tauri\target\release\*.dll"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "smart-parking-api\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: ".env,.git,.gitignore"

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\bin\{#AppExeName}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\bin\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\bin\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: dirifempty; Name: "{app}"
Type: files; Name: "{app}\data\*"
Type: files; Name: "{app}\backend\storage\*"

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    CreateDir(ExpandConstant('{app}\data'));
    CreateDir(ExpandConstant('{app}\backend\storage\logs'));
    CreateDir(ExpandConstant('{app}\backend\storage\cache'));
  end;
end;
