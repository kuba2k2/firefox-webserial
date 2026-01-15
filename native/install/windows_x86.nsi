!define NAME "WebSerial for Firefox"
!define VERSION "0.5.0"
!define NATIVEID "io.github.kuba2k2.webserial"
!define REGUNINST "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\firefox-webserial"

Name "${NAME}"
OutFile "firefox-webserial-v${VERSION}.exe"
RequestExecutionLevel admin
XPStyle on
ShowInstDetails show
ShowUninstDetails show
SilentUnInstall silent

InstallDir "$PROGRAMFILES32\kuba2k2\firefox-webserial"

Page directory
Page instfiles

UninstPage uninstConfirm
UninstPage instfiles

Section
	SetOutPath "$INSTDIR"
	File "firefox-webserial.exe"
	File "/oname=manifest.json" "windows_x86.json"

	!include x64.nsh
	${If} ${RunningX64}
		SetRegView 64
	${Else}
		SetRegView 32
	${EndIf}
	WriteRegStr HKLM "SOFTWARE\Mozilla\NativeMessagingHosts\${NATIVEID}" "" "$INSTDIR\manifest.json"
	SetRegView default

	WriteRegStr HKLM "${REGUNINST}" "DisplayName" "${NAME}"
	WriteRegStr HKLM "${REGUNINST}" "UninstallString" '"$INSTDIR\uninst.exe"'
	WriteRegStr HKLM "${REGUNINST}" "InstallLocation" '"$INSTDIR"'
	WriteRegStr HKLM "${REGUNINST}" "Publisher" "kuba2k2"
	WriteRegStr HKLM "${REGUNINST}" "ProductID" "${NATIVEID}"
	WriteRegStr HKLM "${REGUNINST}" "DisplayVersion" "${VERSION}"
	WriteRegStr HKLM "${REGUNINST}" "NoModify" "1"
	WriteRegStr HKLM "${REGUNINST}" "NoRepair" "1"

	WriteUninstaller "uninst.exe"
SectionEnd

Section "Uninstall"
	SetOutPath "$INSTDIR"
	Delete "firefox-webserial.exe"
	Delete "manifest.json"

	!include x64.nsh
	${If} ${RunningX64}
		SetRegView 64
	${Else}
		SetRegView 32
	${EndIf}
	DeleteRegKey HKLM "SOFTWARE\Mozilla\NativeMessagingHosts\${NATIVEID}"
	SetRegView default

	DeleteRegKey HKLM "${REGUNINST}"

	Delete "uninst.exe"

	SetOutPath "$TEMP"
	RMDir "$INSTDIR"
SectionEnd
