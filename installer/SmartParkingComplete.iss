; Smart Parking System - Complete Installer
; Includes Frontend + Backend + PHP Runtime
; Built with Inno Setup

#define MyAppName "Smart Parking System"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "Smart Parking"
#define MyAppURL "https://smartparking.com"
#define MyAppExeName "StartSmartParking.bat"
#define MyAppIcon "frontend\icon.ico"

[Setup]
; Application Info
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Installation Settings
DefaultDirName={autopf}\SmartParking
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; Output Settings
OutputDir=output
OutputBaseFilename=SmartParkingSetup-{#MyAppVersion}-Complete
SetupIconFile=..\smart-parking-front\src-tauri\icons\icon.ico
UninstallDisplayIcon={app}\frontend\Smart Parking System.exe

; Compression (LZMA2 for best ratio)
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; Visual Settings
WizardStyle=modern
WizardSizePercent=120
DisableWelcomePage=no

; Architecture
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
WelcomeLabel1=Welcome to {#MyAppName} Setup
WelcomeLabel2=This will install {#MyAppName} {#MyAppVersion} on your computer.%n%nThis package includes:%n- Smart Parking Desktop Application%n- Backend Server%n- PHP Runtime%n- SQLite Database%n%nClick Next to continue.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startupicon"; Description: "Start automatically with Windows"; GroupDescription: "Startup Options:"

[Files]
; Frontend Application
Source: "build\frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs

; Backend Application (Laravel)
Source: "build\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.log,storage\logs\*,storage\framework\cache\*,storage\framework\sessions\*,storage\framework\views\*,.git\*,node_modules\*,tests\*"

; PHP Runtime
Source: "build\php\*"; DestDir: "{app}\php"; Flags: ignoreversion recursesubdirs createallsubdirs

; Startup Scripts
Source: "build\StartSmartParking.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\start-backend.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\start-scheduler.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\setup-first-run.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\RepairSetup.bat"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
; Create data directories
Name: "{commonappdata}\SmartParking"; Permissions: users-full
Name: "{commonappdata}\SmartParking\logs"; Permissions: users-full
Name: "{commonappdata}\SmartParking\sessions"; Permissions: users-full
Name: "{commonappdata}\SmartParking\temp"; Permissions: users-full

; Create backend storage directories
Name: "{app}\backend\storage\app"; Permissions: users-full
Name: "{app}\backend\storage\framework\cache"; Permissions: users-full
Name: "{app}\backend\storage\framework\sessions"; Permissions: users-full
Name: "{app}\backend\storage\framework\views"; Permissions: users-full
Name: "{app}\backend\storage\logs"; Permissions: users-full
Name: "{app}\backend\bootstrap\cache"; Permissions: users-full

[Icons]
; Start Menu
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\frontend\Smart Parking System.exe"
Name: "{group}\Start Backend Server"; Filename: "{app}\start-backend.bat"; WorkingDir: "{app}"
Name: "{group}\Repair Setup"; Filename: "{app}\RepairSetup.bat"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

; Desktop
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\frontend\Smart Parking System.exe"; Tasks: desktopicon

; Startup
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: startupicon

[Run]
; Run first-time setup after installation
Filename: "{app}\setup-first-run.bat"; Description: "Initialize database and settings"; Flags: runhidden waituntilterminated
; Launch application after install
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Stop any running instances before uninstall
Filename: "taskkill"; Parameters: "/F /IM ""Smart Parking System.exe"""; Flags: runhidden
Filename: "taskkill"; Parameters: "/F /IM php.exe"; Flags: runhidden

[UninstallDelete]
; Clean up data files (optional - uncomment to remove all data on uninstall)
; Type: filesandordirs; Name: "{commonappdata}\SmartParking"

[Code]
// Check for .NET Framework or other requirements if needed
function InitializeSetup(): Boolean;
begin
  Result := True;
  // Add any pre-installation checks here
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Create empty database file if it doesn't exist
    if not FileExists(ExpandConstant('{commonappdata}\SmartParking\database.sqlite')) then
    begin
      SaveStringToFile(ExpandConstant('{commonappdata}\SmartParking\database.sqlite'), '', False);
    end;
  end;
end;

