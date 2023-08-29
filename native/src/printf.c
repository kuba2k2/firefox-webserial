/* Copyright (c) Kuba Szczodrzyński 2023-08-22. */

#include "include.h"

int __wrap___mingw_vprintf(const char *format, va_list argv) {
	uint32_t len = vsnprintf(NULL, 0, format, argv);

	char *buf = malloc(len + 1);
	int ret	  = vsprintf(buf, format, argv);

	stdmsg_send_log(buf);
	free(buf);

	return ret;
}
