/* Copyright (c) Kuba Szczodrzyński 2024-04-05. */

#ifdef __linux__

#define LIBSERIALPORT_ATBUILD
#include "libserialport_internal.h"
#undef DEBUG

#include "serial.h"

char *serial_port_get_id(struct sp_port *port) {
	const char *name			= sp_get_port_name(port);
	enum sp_transport transport = sp_get_port_transport(port);

	int id_length = strlen(name);

	switch (transport) {
		case SP_TRANSPORT_USB: {
			int vid = 0, pid = 0;
			const char *serial = sp_get_port_usb_serial(port);
			if (sp_get_port_usb_vid_pid(port, &vid, &pid) == SP_OK)
				id_length += sizeof("#VID=xxxx#PID=xxxx") - 1;
			if (serial != NULL)
				id_length += sizeof("#SN=") - 1 + strlen(serial);

			char *id = malloc(id_length + 1);
			if (id == NULL)
				return NULL;

			if (vid != 0 && pid != 0) {
				if (serial != NULL)
					sprintf(id, "%s#VID=%04X#PID=%04X#SN=%s", name, vid, pid, serial);
				else
					sprintf(id, "%s#VID=%04X#PID=%04X", name, vid, pid);
			} else {
				if (serial != NULL)
					sprintf(id, "%s#SN=%s", name, serial);
				else
					strcpy(id, name);
			}

			return id;
		}

		case SP_TRANSPORT_BLUETOOTH: {
			const char *address = sp_get_port_bluetooth_address(port);
			if (address != NULL)
				id_length += sizeof("#ADDR=") - 1 + strlen(address);

			char *id = malloc(id_length + 1);
			if (id == NULL)
				return NULL;

			if (address != NULL)
				sprintf(id, "%s#ADDR=%s", name, address);
			else
				strcpy(id, name);

			return id;
		}

		case SP_TRANSPORT_NATIVE:
		default: {
			return strdup(port->name);
		}
	}
}

#endif
