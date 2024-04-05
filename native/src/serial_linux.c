/* Copyright (c) Kuba Szczodrzyński 2024-04-05. */

#ifdef __linux__

#define LIBSERIALPORT_ATBUILD
#include "libserialport_internal.h"
#undef DEBUG

#include "serial.h"

char *serial_port_get_id(struct sp_port *port) {
	return port->name;
}

#endif
