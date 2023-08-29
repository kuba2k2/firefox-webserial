/* Copyright (c) Kuba Szczodrzyński 2023-08-21. */

#include "include.h"

int main(void) {
	websocket_start();

	while (true) {
		int ret = stdmsg_receive();
		if (ret == 0)
			break;
		if (ret < 0) {
			printf("ERROR %d\n", ret);
			return -ret;
		}
	}

	return 0;
}
