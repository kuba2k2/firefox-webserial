/* Copyright (c) Kuba Szczodrzyński 2023-08-24. */

#ifdef WINNT

#include "serial.h"

#define LIBSERIALPORT_MSBUILD
#undef DEBUG
#include "libserialport_internal.h"

char *serial_port_get_id(struct sp_port *port) {
	char *instance_id = NULL;

	SP_DEVINFO_DATA device_info_data = {.cbSize = sizeof(device_info_data)};
	HDEVINFO device_info;

	device_info = SetupDiGetClassDevs(NULL, 0, 0, DIGCF_PRESENT | DIGCF_ALLCLASSES);
	if (device_info == INVALID_HANDLE_VALUE)
		return NULL;

	for (int i = 0; SetupDiEnumDeviceInfo(device_info, i, &device_info_data); i++) {
		HKEY device_key;
		DEVINST dev_inst;
		char value[8], class[16];
		DWORD size, type;

		/* Check if this is the device we are looking for. */
		device_key =
			SetupDiOpenDevRegKey(device_info, &device_info_data, DICS_FLAG_GLOBAL, 0, DIREG_DEV, KEY_QUERY_VALUE);
		if (device_key == INVALID_HANDLE_VALUE)
			continue;
		size = sizeof(value);
		if (RegQueryValueExA(device_key, "PortName", NULL, &type, (LPBYTE)value, &size) != ERROR_SUCCESS ||
			type != REG_SZ) {
			RegCloseKey(device_key);
			continue;
		}
		RegCloseKey(device_key);
		value[sizeof(value) - 1] = 0;
		if (strcmp(value, port->name))
			continue;

		size = 0;
		SetupDiGetDeviceInstanceId(device_info, &device_info_data, NULL, 0, &size);
		if (size == 0)
			continue;

		instance_id = malloc(size + 1);
		if (SetupDiGetDeviceInstanceId(device_info, &device_info_data, instance_id, size, NULL) != TRUE) {
			free(instance_id);
			continue;
		}

		break;
	}

	SetupDiDestroyDeviceInfoList(device_info);

	return instance_id;
}

void serial_port_fix_details(struct sp_port *port, const char *id) {
	if (port->transport != SP_TRANSPORT_USB)
		return;

	if (strlen(id) <= sizeof("USB\\VID_xxxx&PID_xxxx\\") - 1)
		return;

	if (port->usb_vid < 0 || port->usb_pid < 0) {
		sscanf(id, "USB\\VID_%04X&PID_%04X\\", &port->usb_vid, &port->usb_pid);
	}

	if (port->usb_serial == NULL) {
		port->usb_serial = strdup(id + sizeof("USB\\VID_xxxx&PID_xxxx\\") - 1);
	}
}

#endif
